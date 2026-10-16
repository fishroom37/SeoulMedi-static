import os
import json
import requests
import gspread
from google.oauth2.service_account import Credentials

# 1. 환경변수 및 키 로드
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
GCP_SA_KEY_STR = os.environ.get("GCP_SA_KEY")
SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID")

if not all([OPENROUTER_API_KEY, GCP_SA_KEY_STR, SPREADSHEET_ID]):
    print("❌ 환경변수 설정이 누락되었습니다.")
    exit(1)

# 2. 구글 시트 연결
scope = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]
creds_dict = json.loads(GCP_SA_KEY_STR)
creds = Credentials.from_service_account_info(creds_dict, scopes=scope)
client = gspread.authorize(creds)
doc = client.open_by_key(SPREADSHEET_ID)

# 작업 탭 연결
sheet_work = doc.worksheet("작업")
rows = sheet_work.get_all_values()

if len(rows) <= 1:
    print("확인할 작업 행이 없습니다.")
    exit(0)

# 3. '대기' 상태인 작업 찾기 (A열: 상태, B: AI 질문, C: 요청 및 대답, D: 첨부자료, E: 결과 요약)
target_row_idx = None
target_request = ""
target_attachment = ""

for idx, r in enumerate(rows[1:], start=2):
    status = r[0].strip() if len(r) > 0 else ""
    if status == "대기":
        target_row_idx = idx
        target_request = r[2].strip() if len(r) > 2 else ""
        target_attachment = r[3].strip() if len(r) > 3 else ""
        break

if not target_row_idx or not target_request:
    print("처리 대기 중인 작업이 없습니다.")
    exit(0)

print(f"[{target_row_idx}행] 작업 착수: {target_request}")
sheet_work.update_cell(target_row_idx, 1, "작업중")

# 4. 현재 홈페이지 데이터(site-core.js) 읽기
core_js_path = "js/site/site-core.js"
with open(core_js_path, "r", encoding="utf-8") as f:
    current_core_js = f.read()

# 5. OpenRouter AI에게 수정 지시 (Qwen / Claude 3.5 Sonnet 연동)
system_prompt = """
당신은 한의원 홈페이지의 소스코드를 유지보수하는 전문 AI 웹 엔지니어입니다.
사용자의 요청과 첨부자료 설명을 분석하여, 기존 `site-core.js` 파일의 `window.CLINIC_DATA` 객체 내용을 적절히 수정하거나 보강해야 합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 텍스트나 마크다운 서식을 일절 포함하지 마세요.

응답 형식:
{
  "updated_file_content": "수정된 site-core.js 파일 전체 내용 문자열",
  "ai_question": "사용자에게 추가로 물어봐야 할 필수 정보가 있다면 적고, 없으면 빈 문자열",
  "summary": "작업한 내용을 일반인이 이해하기 쉽게 요약한 한국어 설명"
}
"""

user_prompt = f"""
[사용자 요청 내용]
{target_request}

[첨부자료/사진 설명]
{target_attachment}

[현재 site-core.js 소스코드]
{current_core_js}
"""

try:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "anthropic/claude-3.5-sonnet", # 전 세계 1위 코딩 AI 모델
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
    res_data = response.json()
    ai_raw = res_data["choices"][0]["message"]["content"]
    
    # JSON 파싱
    clean_json = ai_raw.strip()
    if clean_json.startswith("```json"):
        clean_json = clean_json[7:]
    if clean_json.startswith("```"):
        clean_json = clean_json[3:]
    if clean_json.endswith("```"):
        clean_json = clean_json[:-3]
    
    result = json.loads(clean_json.strip())

    # 6. 소스코드 파일 덮어쓰기
    with open(core_js_path, "w", encoding="utf-8") as f:
        f.write(result["updated_file_content"])

    # 7. 구글 시트 상태 갱신
    new_status = "자료대기" if result.get("ai_question") else "완료"
    sheet_work.update_cell(target_row_idx, 1, new_status) # A열: 상태
    sheet_work.update_cell(target_row_idx, 2, result.get("ai_question", "")) # B열: AI 질문
    sheet_work.update_cell(target_row_idx, 5, result.get("summary", "")) # E열: 요약

    print(f"✅ 작업 완료: 상태={new_status}, 요약={result.get('summary', '')}")

except Exception as e:
    sheet_work.update_cell(target_row_idx, 1, "대기")
    sheet_work.update_cell(target_row_idx, 5, f"오류 발생: {str(e)}")
    print(f"❌ 오류: {str(e)}")
    exit(1)
