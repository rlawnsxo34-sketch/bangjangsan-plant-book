방장산 식물 도감 — Version 5 (2026-10-02)
사진 식별 후보 선택 · 접근성 · 빌드와 배포

최신 파일: step5/code_artifact.html
Version 1~5 변경을 모두 포함합니다. 이전 버전은 이력 확인용입니다.
운영 Firebase 설정·사용자 기록을 변경하거나 서버를 실제 배포하지 않았습니다.
실제 Pl@ntNet 호출은 아직 실행하지 않았습니다. API 키와 App Check 설정 후 배포해야 활성화됩니다.

달라진 사용 흐름
1. 카메라 또는 앨범에서 사진을 선택합니다. 사진 변환과 위치 처리는 별도로 진행됩니다.
2. [사진으로 식물 찾기]를 누르면 압축한 사진 한 장만 Pl@ntNet으로 전송합니다.
   메모와 위치 좌표는 보내지 않습니다. 사진 부위도 선택할 수 있습니다.
3. 최대 5개 후보 중 직접 선택하면 이름과 식별 정보가 입력됩니다.
   학명과 영어 일반명이 제공되며 한국어 이름을 보장하지 않습니다.
   표시 점수는 확정 판정이 아닙니다. 낮은 점수에는 확인 안내를 표시합니다.
   기존에 작성한 이름을 자동으로 덮어쓰지 않습니다.
4. 이름을 직접 바꾸면 식별 메타데이터를 제거합니다. 수동 기록도 계속 가능합니다.
5. 사진·계정 변경, 취소 뒤 도착한 결과는 화면에 반영하지 않습니다.
   취소는 화면 대기를 중단합니다. 이미 시작한 서버 요청까지 취소하지는 않습니다.
   동일 요청 재시도는 같은 ID를 사용하며 [새로 식별]은 별도 요청입니다.

익명 기록·사진 보존과 접근 규칙
Version 1~4 정책을 유지합니다. 상세 내용은 이전 README를 참고하세요.
- 익명 가입은 UID를 유지합니다. 기존 회원 로그인은 원본을 보존하고 회원 경로로 복사합니다.
- 계정 전환 시 이전 사진·도감·입력·비동기 상태를 초기화합니다.
- 본인 UID 문서와 사진만 접근합니다. 새 사진은 Storage JPEG, 문서는 경로와 메타데이터입니다.
- 기존 Base64 기록은 호환합니다. 임시 Blob URL로 사진을 표시하고 해제합니다.
- 기록 삭제 후 서버 정리 함수가 파일 버전을 확인해 사진을 정리합니다.
- 지도는 [Google 지도 보기]를 누른 뒤에만 해당 좌표를 Google에 전달합니다.
- v5 규칙은 선택적인 identification 필드도 검증합니다.
  클라이언트 후보 정보는 사용자 기록용이며 서버가 발급한 신뢰 증명은 아닙니다.

실행 및 수정 — ZIP을 압축 해제한 폴더에서
Node.js 22를 권장합니다. 프런트엔드와 서버 의존성은 별도로 설치합니다.
  cd step5
  npm ci
  npm ci --prefix functions
  npm run build
  npm run preview
브라우저에서 출력된 http://127.0.0.1:4173 주소를 엽니다.
본인 Firebase 프로젝트의 인증·규칙·Storage CORS 설정은 로컬 미리보기에도 필요합니다.
file://로 HTML을 여는 방식은 사용하지 마세요.

수정 대상은 src/*.jsx, src/*-flow.js, src/runtime.js, src/styles.css입니다.
설정은 public-config.json, 규칙은 firestore.rules와 storage.rules,
서버는 functions/index.js와 functions/identify-service.js입니다.
빌드는 code_artifact.html과 dist/index.html, 라이선스 파일과 firebase.json을 만듭니다.
HTML에는 React·Firebase·SVG 아이콘·CSS·한글 글꼴이 들어 있습니다. 약 3.3MiB입니다.
브라우저 Babel 및 Tailwind CDN 실행을 제거했습니다.
CSP는 인라인 스크립트 해시를 사용합니다. 소스나 설정을 바꾸면 다시 빌드하세요.
빌드된 HTML을 직접 수정하면 배포 CSP 해시와 일치하지 않게 됩니다.
기존 PNG를 보유한 경우 public/README.txt에 적힌 이름으로 public 폴더에 넣으세요.
PNG가 없으면 텍스트 로고와 SVG 대체 이미지를 표시합니다.
글꼴 라이선스는 dist/FONT-LICENSE.txt, JS 고지는 dist/LICENSES.txt입니다.

배포 순서 — 설정을 완료한 운영자가 실행
1. Firebase 프로젝트 plant-book-84803의 익명·이메일 인증, 허용 도메인,
   실제 Storage 버킷과 요금제, Firestore 위치를 확인합니다.
   Version 4 README의 버킷·CORS·정리 함수 설정도 적용해야 합니다.
   다른 서비스와 공유하는 프로젝트라면 기존 규칙을 보관하고 필요한 경로를 합칩니다.
   제공 규칙의 나머지 경로는 기본 거부합니다.
2. https://my.plantnet.org/ 에서 사용할 API 키를 준비합니다.
   step5 폴더에서 Firebase CLI의 Secret Manager 입력으로 등록합니다:
     firebase functions:secrets:set PLANTNET_API_KEY --project plant-book-84803
   API 키를 public-config.json, HTML, 소스에 넣지 마세요.
   Firebase CLI가 설치되어 있지 않으면 설치 후 로그인해야 합니다.
3. Firebase App Check에서 기존 웹 앱에 reCAPTCHA Enterprise를 등록합니다.
   사용할 사이트 도메인을 등록하고 공개 사이트 키를 public-config.json의
   appCheckSiteKey에 입력합니다. 식별 함수는 운영 환경에서 App Check를 검증합니다.
   공개 사이트 키와 Firebase 공개 구성은 서버 API 비밀 키와 다릅니다.
   appCheckSiteKey가 비어 있으면 사진 식별 버튼이 준비 중 상태가 됩니다.
4. public-config.json의 Firebase 구성과 region, functions/index.js의 region을 확인합니다.
   기본 region은 asia-northeast3이며 Firestore 위치에 맞게 설정하세요.
   Storage 버킷 변경 시 서버 정리·고아 파일 조회 코드도 같은 버킷으로 맞춥니다.
   운영에서는 emulators.enabled를 false로 유지합니다.
   에뮬레이터 연결은 localhost와 demo-* 프로젝트에서만 허용합니다.
5. cors.json의 YOUR-SITE-DOMAIN을 실제 배포 출처로 바꾸고 필요한 기존 출처도 유지합니다.
     gcloud storage buckets update gs://plant-book-84803.firebasestorage.app --cors-file=cors.json
   브라우저의 인증 사진 조회·회원 경로 복사에 필요합니다.
6. 다시 빌드하고 규칙·함수를 먼저 배포합니다:
     npm run build
     firebase deploy --only firestore:rules,storage,functions:cleanupPlantPhoto,functions:identifyPlant --project plant-book-84803
   Secret Manager 접근과 버킷 조회·삭제, Firestore 접근 권한을 실행 로그에서 확인합니다.
   그다음 프런트엔드를 배포합니다:
     firebase deploy --only hosting --project plant-book-84803
   HTTPS에서 실행합니다. Hosting은 dist와 생성된 보안 헤더를 사용합니다.
7. Firestore의 두 컬렉션 그룹 plantIdentificationAttempts와 plantIdentificationUsage에
   expiresAt 필드를 기준으로 TTL 정책을 설정합니다. 기본 만료 시각은 생성 후 2일입니다.
   TTL을 켜지 않으면 오래된 내부 요청·사용량 문서가 자동 삭제되지 않습니다.
8. 배포 후 실제 휴대폰 카메라·위치 권한, App Check, 실제 사진 후보 반환,
   저장·새로고침·익명 가입·기존 회원 복사·파일 삭제·CORS를 확인합니다.

식별 서버의 사용량 제한
- Firebase 인증과 App Check를 확인합니다. 익명 사용자도 요청할 수 있습니다.
- 서버 Secret Manager 키로 고정된 Pl@ntNet 주소에 사진을 전송합니다.
- JPEG Base64 형식·크기와 입력 필드를 제한합니다. 외부 이미지 URL은 받지 않습니다.
  JPEG의 실제 디코딩은 브라우저에서 수행합니다. 서버의 형식 검사만으로 악성 파일의
  모든 내용을 검증한다고 보장하지 않습니다.
- UTC 날짜 기준 UID당 10회, 전체 100회, UID당 최소 10초 간격입니다.
  한국 시간 오전 9시에 날짜가 바뀝니다. 제공사의 요금제 제한과는 별도입니다.
- 실패한 요청도 예약 사용량에 포함됩니다. 동일 ID 완료 결과는 캐시로 반환합니다.
  실패·응답 유실 요청을 자동으로 다시 유료 호출하지 않습니다.
  사용자가 [새로 식별]을 누르면 새 사용량이 발생할 수 있습니다.
- 내부 문서에는 원본 사진 대신 해시·상태·후보·만료 시각을 저장합니다.
- 서버 시간 제한, 최대 인스턴스와 내부 사용량 제한을 두었습니다.
  제공사 API·Firebase 실행·저장 비용은 실제 계약과 사용량에 따라 발생합니다.

접근성
확대 제한 제거, 44px 버튼, 대비 개선, 키보드 포커스, 본문 건너뛰기,
입력 라벨, 다이얼로그 포커스 이동·가두기·복귀·Escape, 삭제 확인을 추가했습니다.
동작 감소 설정과 모바일 안전 영역을 반영하고 320px 가로 넘침을 확인했습니다.
자동 접근성 검사는 확인한 화면 범위에서 통과했습니다. 전 화면의 접근성 인증이나
실제 스크린리더·모든 휴대폰 기종 검증을 완료한 것은 아닙니다.
PWA 설치 또는 완전한 오프라인 쓰기 기능은 추가하지 않았습니다.

검증
- 단위 테스트 69개, Firebase 로컬 에뮬레이터 테스트 30개: 총 99개 통과.
- 모의 식별 API의 후보 선택·취소·사진 변경·계정 전환·동일 ID 재시도 확인.
- 키보드, 포커스 복귀, 후보·인증·상세·삭제 화면의 axe 검사와 320px 화면 확인.
- 빌드된 HTML과 실제 Firebase SDK를 로컬 에뮬레이터에 연결해
  사진 업로드·조회, 가입 UID 유지, 새로고침 보존, 삭제 확인을 검증했습니다.
- 최종 HTML과 배포 HTML 일치, 인라인 스크립트 CSP 해시 일치를 확인했습니다.
- 실제 Pl@ntNet API, 운영 App Check, Cloud Functions 이벤트 전달과 운영 배포는 미실행입니다.

자동 테스트 재실행 — ZIP 최상위 폴더에서
  npm install
  npm ci --prefix step5/functions
  npm test
  npm run test:firebase
에뮬레이터에는 Java 17 이상도 필요합니다. demo-plant-book만 사용합니다.
SDK 회귀 테스트 일부는 같은 동작의 이전 버전 도우미를 함께 확인합니다.
브라우저 검증 환경·브라우저 실행 파일은 ZIP에 포함하지 않습니다.

공식 문서
https://my.plantnet.org/doc/api/identify
https://firebase.google.com/docs/functions/callable
https://firebase.google.com/docs/functions/config-env
https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
https://firebase.google.com/docs/hosting/full-config
https://firebase.google.com/docs/firestore/ttl
