방장산 식물 도감 — Spark 개발용 Version 6
2026-10-08

이 ZIP의 내용물이 하나의 완전한 프로젝트입니다.
이전 ZIP의 step5 폴더와 함께 섞어서 실행하지 마세요.

이번 버전에서 가능한 일
- 카메라·앨범 사진 선택, JPEG 압축, 현재 위치 선택 기록
- 이름·메모·사진을 이 브라우저의 IndexedDB에 저장
- 새로고침 후 조회, 이름·메모 수정, 확인 후 삭제
- 사진·메모·위치를 포함한 JSON 백업 다운로드와 복원
- 검색, 키보드 조작, 확대, 모바일 화면과 접근성 개선

Spark 개발용의 저장 정책
Firebase 로그인·Firestore·Storage·Functions·App Check·Pl@ntNet을 호출하지 않습니다.
Firebase 요금제는 바꾸지 않았으며 기존 서버 기록을 읽거나 수정하지 않습니다.
로그인·회원가입·기기 간 자동 동기화·사진 자동 식별은 이번 개발용에서 사용하지 않습니다.
사진 식별은 '준비 중'으로 표시하고 이름을 직접 입력합니다.
이름을 모르겠으면 '이름 모름'으로 저장할 수 있습니다.

사진과 기록은 현재 브라우저의 현재 사이트 출처에만 저장됩니다.
같은 기기라도 Chrome과 Edge, 다른 브라우저 프로필은 서로 다른 기록을 가집니다.
localhost와 127.0.0.1, GitHub Pages와 Firebase 주소도 서로 다른 저장소입니다.
HTTPS의 같은 호스트에서는 페이지 경로가 달라도 같은 앱 저장소를 사용할 수 있습니다.
다른 기기·브라우저·사이트로 이동하려면 기존 사이트에서 백업한 뒤 새 사이트에서 복원하세요.
기존 Firebase에 저장했던 기록을 자동으로 이전하지 않습니다.
시크릿 모드, 브라우저 데이터 삭제, 저장 공간 정리 등으로 기록이 사라질 수 있습니다.
이 버전은 사용자 단위 접근 통제가 없습니다. 같은 브라우저 프로필을 함께 사용하는 사람은
같은 도감을 볼 수 있습니다. 개발·개인 시험용으로 사용하세요.

개발용 한도
- 최대 200개 기록, JPEG 사진 합계 32MiB
- 원본 사진은 20MiB 이하·5천만 화소 이하
- 긴 변 1,000px, JPEG 변환 후 한 장 최대 675,000바이트
- 백업은 최대 50MiB
브라우저 자체 저장 공간이 더 작거나 부족하면 위 한도 전에 저장이 실패할 수 있습니다.
실패 시 입력을 유지하고 오류를 표시합니다. 저장 재시도는 같은 ID를 사용합니다.
이름·메모·위치는 최초 저장 시도 값으로 고정됩니다. 바꾸려면 작성 초기화 후 새로 작성하세요.

백업 사용 방법
1. 아래 메뉴 [백업·복원] → [백업 파일 다운로드]
2. 다운로드 폴더에 bangjangsan-backup-날짜.json이 있는지 확인하고 별도 보관
3. 다른 기기나 새 주소에서 [백업 파일 복원] → 해당 JSON 선택
4. 확인 화면에서 [기록 복원] 선택
같은 ID가 있으면 현재 기록을 유지하고 건너뜁니다. 백업을 다시 넣어도 덮어쓰지 않습니다.
백업 전체의 형식·사진을 검사한 뒤 하나의 트랜잭션으로 추가합니다.
한도 초과·손상된 사진·저장 실패 시 일부만 복원하는 방식으로 처리하지 않습니다.
백업에는 사진과 선택 위치가 들어 있습니다. GitHub에는 올리지 마세요.
이 개발용에서 내보낸 format='bangjangsan-local-backup', version=1 파일을 지원합니다.
이전 Firebase 도감의 다른 JSON 형식은 자동 변환하지 않습니다.

컴퓨터에서 시험하기 — Windows
Node.js 22.x를 권장합니다.
1. 새 폴더에 ZIP을 압축 해제합니다.
2. package.json과 firebase.json이 바로 보이는 폴더를 파일 탐색기로 엽니다.
3. 주소창에 cmd 입력 → Enter
4. 한 줄씩 실행합니다:
   npm ci
   npm run build
   npm run preview
5. 표시된 http://127.0.0.1:4173 주소를 브라우저로 엽니다.
6. 미리보기 서버 종료는 명령 창에서 Ctrl+C
HTML 파일을 더블클릭하는 file:// 방식은 사용하지 마세요.
현재 위치는 HTTPS 또는 브라우저가 신뢰하는 localhost 주소에서 사용할 수 있습니다.
앨범은 자동 위치 요청을 하지 않습니다. 카메라는 사진 선택 후 현재 위치를 별도로 요청합니다.
위치 확인 중에는 저장을 기다리고 [위치 없이 기록]으로 대기를 취소할 수 있습니다.

GitHub 저장소에 적용하기
1. 현재 bangjangsan-plant-book 폴더는 먼저 다른 위치에 복사해 이전 버전을 보관합니다.
2. 이번 ZIP의 내용물을 프로젝트 루트에 복사합니다. 루트에서 package.json, firebase.json,
   build.mjs, src, dist가 바로 보여야 합니다. 새 폴더로 따로 운영해도 됩니다.
3. 같은 이름의 파일은 개발용 파일로 교체합니다. 이전 src의 인증·서버 파일이 남더라도
   새 main.jsx에서는 불러오지 않습니다. 기존 functions 파일은 이번 배포에서 사용하지 않습니다.
4. npm ci → npm run build 실행 후 GitHub Desktop에서 Commit → Push origin
5. node_modules, .firebase, 비밀 파일, 개인 백업 JSON은 GitHub에 올리지 않습니다.
6. 기존 GitHub 자동 배포의 작업 폴더가 step5라면 새 루트 기준으로 수정해야 합니다.
   이 ZIP의 package.json이 있는 프로젝트 루트에서 npm ci && npm run build를 실행합니다.
   기존 Hosting 자동 배포가 루트에서 빌드하도록 구성되어 있다면 그대로 사용할 수 있습니다.
   이전 자동화에 Functions/Storage 배포 명령이 있다면 제거하고 Hosting만 배포하세요.

Firebase Hosting에 배포 — Spark 가능
이번 firebase.json은 hosting만 포함합니다. Functions·Storage·Firestore 규칙이 없습니다.
앞서 Pl@ntNet 키·App Check·Storage CORS·서버 배포·TTL 설정 단계는 이번 버전에 필요 없습니다.
이미 사용하던 Firebase 프로젝트와 로그인은 Hosting 배포에만 사용합니다.
프로젝트 폴더 명령 창에서:
   npm install -g firebase-tools
   firebase login --no-localhost
   firebase projects:list
   npm run build
   firebase deploy --only hosting --project plant-book-84803
마지막에 표시되는 Hosting URL을 휴대폰에서 엽니다.
프로젝트 ID가 다르다면 --project 뒤의 값만 본인 Hosting 프로젝트 ID로 바꿀 수 있습니다.
이번 앱은 Firebase 연결 정보가 없으므로 새 Hosting 프로젝트를 사용해도 앱 코드 연결은 필요 없습니다.
제공된 firebase.json을 유지하세요. firebase init hosting으로 기존 설정을 덮어쓰지 마세요.
기관의 Node.js 인증서 문제를 해결할 때 사용했던 설정은 명령 창을 닫으면 사라질 수 있습니다.
Node.js 22.19.0 이후 22.x에서 Windows 신뢰 인증서를 사용할 경우 같은 cmd 창에서
   set "NODE_USE_SYSTEM_CA=1"
을 실행한 뒤 Firebase 명령을 실행하세요. 기관 공식 인증서 등록은 별도 확인해야 합니다.
Hosting 무료 한도 안에서 Spark로 배포할 수 있습니다. 저장은 사용자의 브라우저에서 합니다.
이 파일을 적용하는 것으로 기존 Blaze 프로젝트가 Spark로 자동 변경되지는 않습니다.
실제 계정 요금제·기존 서비스는 변경하지 않았습니다.

GitHub Pages로 배포 — Firebase 없이도 가능
1. npm run build로 생성된 dist 안의 내용물을 저장소 /docs에 복사합니다.
2. docs/index.html, docs/.nojekyll, 라이선스 파일들이 있어야 합니다.
3. GitHub 저장소 Settings → Pages → Deploy from a branch → main /docs → Save
4. 표시된 HTTPS 주소를 엽니다.
GitHub Pages는 firebase.json의 응답 헤더를 적용하지 않습니다.
이 코드 자체는 외부 API·스크립트·폰트 요청을 하지 않지만 제공 CSP 헤더는 Firebase Hosting에만 적용됩니다.
사이트를 옮기면 백업·복원으로 기록을 옮겨주세요.

수정할 파일
src/App.jsx: 화면
src/local-store.js: 저장·수정·삭제·백업·복원
src/photo-flow.js: 사진·위치 비동기 처리
src/dialog.jsx: 다이얼로그 접근성
src/styles.css: 스타일
build.mjs: 빌드와 Hosting 설정 생성
수정 후 npm run build를 실행합니다. dist/index.html과 code_artifact.html은 같은 실행 결과입니다.
폰트·React·SVG 아이콘·CSS가 HTML에 포함되어 인터넷 CDN 실행이 필요 없습니다.
단일 HTML은 약 2.7MiB입니다. 글꼴 라이선스는 dist/FONT-LICENSE.txt,
JS 고지는 dist/LICENSES.txt에 포함합니다.

검증
npm test로 단위 테스트 33개를 재실행할 수 있습니다.
실제 IndexedDB와 빌드된 HTML을 브라우저에 연결해 저장·새로고침·수정·삭제·백업·복원,
기존 ID 보존, 손상된 백업의 원자적 거부, 저장 공간 한도, 저장 오류 재시도,
다른 탭의 오래된 수정 충돌과 출처별 기록 분리를 확인합니다.
위치 응답과 저장 공간 부족 오류는 모의 처리합니다. 실제 이미지 변환과 IndexedDB는 실행합니다.
브라우저 통합 검증 16개 항목과 키보드 포커스 이동·복귀 확인이 통과했습니다.
320px 화면을 실제로 확인했으며, 자동 접근성 검사는 확인한 화면 범위에서만 검증합니다. 모든 휴대폰·스크린리더 인증은 아닙니다.
실제 Firebase Hosting·GitHub Pages에는 이번 작업 중 배포하지 않았습니다.
PWA 설치·완전한 오프라인 실행 기능은 추가하지 않았습니다.
브라우저 검증 실행 파일과 환경은 ZIP에 포함하지 않습니다.

기존 운영형 Version 5로 돌아갈 때
이전 plant_book_v5.zip에 운영형 소스와 규칙·서버가 보관되어 있습니다.
이번 개발용 DB와 기존 Firebase 기록은 독립적입니다.
향후 운영형에 개발용 JSON 가져오기 기능을 추가하면 기록 이전을 구현할 수 있습니다.
현재 운영형 v5가 이번 백업을 직접 가져오는 기능은 없습니다.
