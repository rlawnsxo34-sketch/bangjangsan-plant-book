ㅇㄱㅁㅇ v19: LOGO_AND_START_UPDATE.txt를 먼저 읽으세요.
가로형 로고와 시작 안내를 추가했습니다. 기존 현장 자료·사진·설정·.git을 유지하고 적용하세요.

ㅇㄱㅁㅇ v18: EASY_WORDS_UPDATE.txt를 먼저 읽으세요.
기존 현장 자료(src/experience-data.js), 사진, public-config.json, .git을 유지하고 적용하세요.

ㅇㄱㅁㅇ v17: 현재 적용 절차는 VISITOR_EXPERIENCE_UPDATE.txt를 먼저 읽으세요.
사진 없이 시작하는 방문객 관찰 체험과 기관별 진입 링크를 추가했습니다.

ㅇㄱㅁㅇ v16: 현재 적용 절차는 DRAFT_RECOVERY_UPDATE.txt를 먼저 읽으세요.

ㅇㄱㅁㅇ v15: HOME_SCREEN_UPDATE.txt가 현재 적용 절차입니다.
이전 버전 문서는 참고용입니다.

ㅇㄱㅁㅇ v14: 현재 적용 절차는 DISCOVERY_BOOK_UPDATE.txt가 우선입니다.
이전 버전 문서와 검증 기록은 참고용입니다.

ㅇㄱㅁㅇ v13: 현재 적용 절차는 CENTER_SELECTION_UPDATE.txt가 우선입니다.
아래 이전 버전 설명은 참고용입니다.

ㅇㄱㅁㅇ v12: 현재 적용 절차는 REFERENCE_PHOTOS_UPDATE.txt가 우선입니다.
이전 문서/검증 기록은 해당 버전 참고입니다.

ㅇㄱㅁㅇ v11: 현재 적용 절차는 KOREAN_NAMES_UPDATE.txt가 우선입니다.
아래 v10/v9 내용은 이전 단계 참고입니다.

ㅇㄱㅁㅇ v10 모바일 UI 업데이트
현재 적용 순서는 START_HERE.txt와 MOBILE_UPDATE.txt를 따르세요.
아래 내용은 기존 v9 기능과 설정 참고입니다.

전국 숲체원 식물 도감 v9 — AI 후보 선택 및 기관별 공개 공유 개발용

먼저 START_HERE.txt와 AI_SETUP.txt를 읽으세요. 공유/기관 권한은 CENTER_AND_REVIEWER_SETUP.txt를 참고합니다.
기존 계정 설정은 SETUP.txt를 참고합니다.

완료된 코드
- 이메일/비밀번호 회원가입·로그인·로그아웃·비밀번호 재설정 메일 요청
- 계정별 비공개 사진·메모·기관 이름·선택 좌표 저장
- 다른 기기/주소에서 같은 계정으로 기록 조회(새로고침 버튼 방식)
- 이름·메모·기관 이름 수정, 사진과 기록의 원자적 삭제
- 원본 기기 도감 IndexedDB 및 v1 JSON 백업 보존
- 계정 전환/언마운트 후 늦은 응답 무시, 초안·사진·리스트 초기화
- 안정된 ID 저장 재시도, revision 기반 기기 간 수정 충돌 방지

이번 단계의 범위
개인 원본은 본인만 조회하며, 공유 승인 후 별도 공개 사본을 생성합니다.
공유 사본의 신청·승인·반려·공개 조회·철회 기능이 추가되었습니다.
기관 공식 목록 자동 연동, 지도 클릭, 식물 종별 묶음·달성률은 후속 단계입니다.
기존 기기 기록을 계정으로 옮기는 일괄 이전 및 계정 백업은 아직 없습니다.
기기 도감과 계정 도감은 화면과 저장소가 구분되어 있습니다.
화면 전환 시 작성 중인 내용을 잃을 수 있으므로 저장 후 전환하세요.

Spark 개발용 사진 저장 구조
정식 설계의 객체 저장소 대신 이번 시연은 별도 Firestore photos 문서를 임시 사용합니다.
경로: forestDevUsers/{uid}/observations/{id} = 작은 메타데이터
경로: forestDevUsers/{uid}/photos/{id} = 최대 120KB JPEG의 Base64 사본
두 문서는 같은 트랜잭션으로 생성/삭제합니다. 사진 문자열은 인덱스에서 제외합니다.
사진은 최대 긴 변 800px이며 화질과 크기를 단계적으로 줄입니다.
목록에서 메타데이터를 읽고 상세 화면을 열 때만 해당 사진 문서를 읽습니다.
클라이언트에서 JPEG를 디코딩·검증합니다. 보안 규칙은 타입·접두사·문자·용량을 검사합니다.
규칙만으로 실제 식물 사진 여부, JPEG 디코딩 가능성 또는 정확한 관찰 위치를 보증하지 않습니다.
현재 UI의 50개 생성 제한은 악의적 직접 API 요청을 차단하는 서버별 사용자 용량 한도가 아닙니다.
프로젝트 총 사용량, 사용자 가입 제한, 비용/할당량 정책은 운영 전 별도 강화해야 합니다.
사진 문서는 Firestore 저장·읽기 사용량에 포함됩니다. 전국 서비스의 운영 방식으로 권하지 않습니다.
사진 저장 어댑터로 이동할 때도 관찰 ID와 소유자 관계를 유지하여 이관합니다.

권한
새 경로는 이메일/비밀번호 인증 사용자의 본인 경로만 허용합니다.
개인 원본은 anonymous 사용자와 타 사용자에게 허용하지 않습니다. 담당 권한을 일반 사용자가 변경할 수 없습니다.
관찰 생성은 사진 동시 생성, 삭제는 사진 동시 삭제를 규칙으로 강제합니다.
사진 교체와 관찰 위치 수정은 현재 미구현이며 새 기록으로 다시 저장할 수 있습니다.
개인 원본의 shareStatus는 private로 유지하며 공개는 별도 검토 요청/공개 문서로 관리합니다.
일반 사용자가 공개 사본이나 담당 권한을 임의 작성할 수 없습니다.
기존 전달 v5의 owner-only 경로 규칙도 포함하여 호환합니다.
사용자가 별도로 수정한 현재 프로젝트 규칙은 콘솔에서 백업·병합 확인이 필요합니다.

개발과 배포
npm ci
npm test
npm run build
npm run preview
설정 public-config.json은 번들에 포함되므로 변경 후 다시 빌드합니다.
배포는 SETUP.txt의 Firestore 규칙 → Hosting 순서입니다.
실제 Firebase 프로젝트와 요금제는 이번 작업에서 변경/배포하지 않았습니다.

에뮬레이터 권한 시험(개발자용, 선택)
Java와 Firebase CLI가 준비된 환경에서:
firebase emulators:exec --only firestore --project demo-forest-book --config firebase.emulators.json "node --test tests/security-rules.test.mjs && node --test tests/sharing-rules.test.mjs"
기본 npm test는 Java/Firebase 프로젝트 없이 실행 가능합니다.
전체 브라우저 통합 검증 결과는 verification 폴더에 있습니다.
브라우저 검증은 테스트 Firebase Auth/Firestore 에뮬레이터를 사용했습니다.
실제 Firebase 규칙 배포와 휴대전화 카메라/GPS는 사용 환경에서 확인해야 합니다.

관련 파일
src/cloud-runtime.js: 인증 및 Firestore 저장 어댑터
src/cloud-model.js: 입력·사진 제한과 오류 메시지, 계정 응답 버전
src/CloudApp.jsx: 계정 화면, 작성, 상세·수정·삭제
src/App.jsx와 local-store.js: 기존 기기 도감
firestore.rules: 서버 권한 규칙
firestore.indexes.json: 사진·메모·위치 대형 필드 인덱스 제외
build.mjs: 번들·글꼴·Firebase 연결 범위를 제한하는 CSP·Hosting 설정
firebase.emulators.json: demo 프로젝트 시험 설정

사진의 실제 관찰 날짜는 코드가 추측하지 않으며 observedAt=null입니다.
createdAt/updatedAt은 기록 작성·수정 시각이고 위치 정보와 같이 본인 계정에 저장됩니다.
공식 기관 목록 연결 전에는 centerName이 사용자 직접 입력값입니다. 기관 방문 인증이 아닙니다.
speciesId는 아직 null이며 사용자가 입력한 이름을 확정 종으로 간주하지 않습니다.

출품 준비
공개 공유·담당자 검토가 구현되었습니다. AI 키와 서버 연결 후 실제 사진으로 해커톤의 두 필수 흐름을 시연합니다.
GitHub 소스와 별도로 제출용 공공 GitLab, 안내서, 5분 이내 영상, 발표, AI 활용 내역을 준비합니다.

공유 구현 추가 사항
forestCenters: 관리자가 등록한 활성 기관. 공개용 정보만 입력.
forestReviewerGrants/{uid}/centers/{centerId}: 관리자가 콘솔에서 부여하는 기관 권한.
forestShareRequests: 신청자 동의 후 이름·사진·공개 메모·등록기관을 저장한 사본.
forestShareRequests/{id}/reviews: 승인/반려 검토 이력. 수정·삭제 불가.
forestPublicObservations: 승인된 공개 사본만 저장하며 별도 개인 정보 필드는 포함하지 않음.
공개 문서는 사진 Base64를 포함하며 한 번에 5개씩 조회합니다. 사진 필드는 인덱스에서 제외합니다.
검토 대기 목록은 기관별 최신 10개. 내 신청 목록은 최신 50개. 전체 전국 관리 대시보드는 아닙니다.
철회·원본 수정·원본 삭제는 공개 사본 제거와 요청 상태 변경을 같은 트랜잭션으로 실행합니다.
기존 v7 화면은 공유된 원본 수정/삭제 시 새 규칙에 거부될 수 있으므로 v8 화면으로 새로고침합니다.
실시간 자동 갱신 대신 새로고침 버튼을 사용합니다. 이미 열람/다운로드한 사본 회수는 보장하지 않습니다.
기관 비활성화는 새 공개 조회와 새 승인도 차단합니다. 이전 공유 문서의 자동 정리 작업은 미구현입니다.
공유 승인/반려는 식물 종의 전문가 확정이나 실제 기관 방문 인증이 아닙니다.
초기 설계 docs/forest-design은 보관용 참고 문서이며 현재 구현 상태는 이 README를 기준으로 합니다.
공개/검토를 포함한 권한 시험: tests/security-rules.test.mjs와 tests/sharing-rules.test.mjs를 순서대로 실행합니다.

v9 식별 추가
backend/worker.mjs는 Firebase ID 토큰을 Google의 계정 조회 API로 확인한 뒤 사진만 Pl@ntNet으로 보냅니다.
API 비밀 키는 Cloudflare Secret으로 보관. 사진/인증 토큰/이메일을 로그나 저장소에 기록하지 않습니다.
UID·요청 ID·사진 해시·후보·일일 한도는 SQLite Durable Object의 KV 트랜잭션으로 관리합니다.
분석 실패/불확실 상태는 재시도로 외부 호출을 추가하지 않으며 새 사진/수동 이름 입력을 안내합니다.
aiSelection은 클라이언트가 선택한 후보 정보입니다. 서버 검증된 식물명/성능 증빙이 아닙니다.
원본을 수동 수정하면 aiSelection을 제거하고 기존 공유를 철회합니다.
공개 사본에는 AI 점수/확정 상태를 추가하지 않습니다. 담당자 검토는 여전히 공개 적합성 확인입니다.
공식 Pl@ntNet attribution 로고와 링크를 식별 영역에 표시합니다.
실제 Google/Pl@ntNet 응답은 로컬 Worker 시험에서 모의 응답으로 대체했습니다.
기관 배포와 실제 API 키 연결은 아직 수행하지 않았습니다.
