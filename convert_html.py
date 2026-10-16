import glob
import re

html_files = glob.glob("*.html")

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. <header> 내부 중복 메뉴 제거 (빈 태그로 만들어 site-core.js가 채우게 함)
    content = re.sub(
        r'(<header[^>]*class="[^"]*clinic-header[^"]*"[^>]*>).*?(</header>)',
        r'\1\2',
        content,
        flags=re.DOTALL
    )

    # 2. <aside class="page-sidebar"> 내부 중복 사이드바 제거
    content = re.sub(
        r'(<aside[^>]*class="[^"]*page-sidebar[^"]*"[^>]*>).*?(</aside>)',
        r'\1\2',
        content,
        flags=re.DOTALL
    )

    # 3. <footer class="site-footer"> 내부 중복 푸터 제거
    content = re.sub(
        r'(<footer[^>]*class="[^"]*site-footer[^"]*"[^>]*>).*?(</footer>)',
        r'\1\2',
        content,
        flags=re.DOTALL
    )

    # 4. <div class="quick-slot ..."> 내부 중복 버튼 제거
    content = re.sub(
        r'(<div[^>]*class="[^"]*quick-channel-slot[^"]*"[^>]*>).*?(</div>)',
        r'\1\2',
        content,
        flags=re.DOTALL
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[변환 완료] {file_path}")

print("\n총", len(html_files), "개의 HTML 파일에서 중복 코드가 제거되었습니다!")
