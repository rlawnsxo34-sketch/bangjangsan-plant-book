ㅇㄱㅁㅇ v32 — 나무 지도·담당자 위치 등록

처음에는 START_HERE.txt를 읽으세요. 현재 기능과 새 가로형 로고를 포함한 정리본입니다.

파일 안내
- src/: 앱 화면과 기능. 직접 작성한 현장 자료는 src/experience-data.js입니다.
- public/: 로고·아이콘·사진 등 배포용 자료.
- assets-source/: 로고 원본과 아이콘 제작 자료. 수정에 필요하므로 보관합니다.
- backend/: Pl@ntNet 연결 서버. 일반 화면 수정에는 재배포할 필요가 없습니다.
- tests/: 기능·권한 검사. 실행에 쓰이지 않더라도 유지합니다.
- dist/: npm run build로 만든 Firebase Hosting 배포 결과. 직접 편집하지 마세요.
- package.json, package-lock.json: 실행 명령과 라이브러리 버전. 둘 다 필요합니다.
- public-config.json: Firebase 및 식물 분석 서버 연결 설정. 본인 설정을 유지하세요.
- firebase.json: 빌드에서 보안 헤더와 배포 경로를 생성합니다. 별도 설정을 추가했다면 적용 전 비교하세요.
- firestore.rules, firestore.indexes.json: 데이터 접근 규칙과 검색 설정.
- firebase.emulators.json: 개발용 권한 검사 설정.

추가 안내
- Firebase 계정·데이터 설정: SETUP.txt
- 식물 분석 서버: AI_SETUP.txt
- 기관 등록과 담당자 권한: CENTER_AND_REVIEWER_SETUP.txt
- 브랜드와 출처: BRAND_ASSETS.txt, PLANTNET_ATTRIBUTION.txt
- 기록 카드 사용 방법: docs/RECORD_CARD.txt
- 정리 대상 전체 목록: CLEANUP.txt
- 이번 확인 결과: verification/current-checks.txt

기능
기관 선택, 숲 둘러보기, 여러 사진으로 식물 찾기와 기록, 계정별 내 도감, 공유 신청·담당자 검토, 방문객 메모와 PNG 기록 카드를 제공합니다. 이전 기기 기록의 조회·백업·복원도 유지합니다.
로그인 없이 작성한 방문객 메모는 새로고침·종료·기관/계정 전환 때 지워질 수 있으므로 먼저 파일로 받으세요.
사진 기록의 임시 보관과 로그인 없는 방문객 메모는 서로 다른 기능입니다.
기관별 모든 식물의 완성률은 표시하지 않습니다.

로고
public/brand/egmy-horizontal-v19.png를 상단과 기록 카드가 함께 사용합니다. 파일명은 기존 연결을 유지하려고 그대로 두었습니다.
새 가로형 로고 원본(1600×529)을 비율과 배경을 그대로 유지해 적용했습니다.
기록 카드 예시는 docs/card-example-v21.png입니다. 실제 방문 기록이 아닌 예시입니다.

새 기능: 사진 분석 후 편백나무·갈참나무·단풍나무 후보를 선택하면 같은 화면에서 살펴보는 방법을 읽고 메모할 수 있습니다. docs/OBSERVATION.txt를 참고하세요.

여러 사진: 한 새 기록에 최대 3장. 대표사진은 AI 분석에 쓰고, 공유할 사진은 함께 보기에서 직접 고릅니다. 선택하지 않은 사진은 나만 봅니다. 자세한 사용법과 제한은 docs/MULTI_PHOTOS.txt를 읽으세요.
기본 메뉴: 숲 둘러보기 / 식물 찾기 / 내 도감 / 함께 보기. 이전 기록·백업은 내 도감의 안내 또는 기관 선택 화면에서 엽니다.

저장한 사진 수정: 내 도감 → 기록 열기 → 사진 추가·바꾸기. 변경 저장 후에만 반영합니다. 대표사진 교체 시 AI 정보 정리, 사진 수정 시 공유 철회, 기기 간 충돌과 같은 요청 재시도를 지원합니다. docs/PHOTO_EDIT.txt를 읽으세요.

공유: 함께 보기 → 내 기록 선택 → 공개할 사진 1~3장 선택 → 공개 글 작성 → 공개 전 확인하기 → 동의 → 공유 신청하기. 담당자는 선택된 사진을 모두 확인하고, 승인한 사진만 함께 보기에 표시합니다. docs/SHARE_PHOTOS.txt를 읽으세요.

화면 간소화 안내: docs/SIMPLE_UI.txt

공유 신청 화면 안내: docs/SHARE_UI.txt

첫 화면·나무 관찰 안내: docs/VISITOR_UI.txt

기기별 화면·점검 방법: docs/RESPONSIVE_UI.txt

사진 6장 적용·교체: TREE_PHOTO_SETUP.txt

나무 관찰 장소·기관 ID 연결: TREE_PLACE_SETUP.txt

공개 좌표 확인·지도 링크 활성화: PLACE_MAP_SETUP.txt

지도에서 위치 등록·카카오 설정·새 규칙 배포: TREE_MAP_SETUP.txt
