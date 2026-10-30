v49: 식물 찾기·내 도감에서 나무 지도 연결, 불필요한 설명·체험 주소 영역 제거, 모바일·PC 화면 스타일 정돈.
적용 방법: START_HERE.txt

v48: AI 후보의 비교 사진도 앱 안에서 크게 보고 뒤로가기로 사진만 닫습니다. 출처와 이용 조건도 함께 표시합니다.
적용 방법: START_HERE.txt

v47: 내 도감·함께 보기에서도 사진을 크게 보고 이전·다음 사진으로 비교합니다. 뒤로가기는 큰 사진만 닫습니다.
적용 방법: START_HERE.txt

v46: 나무·장소 사진을 앱 안에서 크게 보고, 뒤로가기로 사진만 닫습니다. 이전·다음 사진도 지원합니다.
최신 적용 방법: START_HERE.txt

v45: 상단 로고를 새로 첨부한 이전 이미지로 교체했습니다. 적용 방법은 START_HERE.txt를 참고하세요.

ㅇㄱㅁㅇ — 숲에서 만나는 식물 기록 (v44)

방문한 숲체원을 고르고 나무를 살펴보거나, 사진으로 식물 이름을 찾아 내 도감에 남깁니다.

먼저 읽을 파일
- START_HERE.txt: 기존 프로젝트에 적용하고 배포하기
- USER_GUIDE.txt: 방문객 이용 방법, 나무 지도, 사진·장소 추가 방법
- CLEANUP.txt: 이전 파일을 백업하고 정리하기

처음 설정할 때 필요한 파일
- SETUP.txt: Firebase 로그인·데이터베이스·배포
- AI_SETUP.txt: 식물 찾기 서버 설정
- CENTER_AND_REVIEWER_SETUP.txt: 숲체원 등록과 담당자 권한
- TREE_MAP_SETUP.txt: 지도와 나무 위치 등록의 자세한 설정

주요 폴더
- src: 화면과 기능
- public: 현재 로고, 식물 사진, 설치 정보
- backend: 식물 찾기 서버
- tests: 기능 검사
- docs: 기능 설명과 변경 내역
- dist: 빌드로 다시 만드는 배포 파일

개발 명령
npm ci
npm test
npm run build
npm run preview

배포
firebase deploy --only hosting --project plant-book-84803

public-config.json은 사용자가 지정한 Firebase·식물 찾기 주소·카카오 JavaScript 키를 유지합니다.
이후 수정본에서도 별도 요청이 없으면 그대로 적용합니다.
Firebase Spark 구조를 유지합니다. 실제 서비스 설정이나 배포를 자동으로 변경하지 않습니다.
