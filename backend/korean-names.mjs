// Initial source-checked name pairs, not a complete national taxonomy.
// NIBR, 한반도 알레르기 유발 꽃가루 가이드북 (2015). Names only; no prose/images copied.
export const NAME_SOURCE_URL='https://www.nibr.go.kr/aiibook/catImage/103/Allergenic%20pollen%20in%20Korea.pdf';
export const KOREAN_NAMES=Object.freeze({
  "Ginkgo biloba": {
    "name": "은행나무",
    "page": 16
  },
  "Cedrus deodara": {
    "name": "개잎갈나무",
    "page": 18
  },
  "Picea abies": {
    "name": "독일가문비나무",
    "page": 20
  },
  "Pinus densiflora": {
    "name": "소나무",
    "page": 23
  },
  "Pinus koraiensis": {
    "name": "잣나무",
    "page": 26
  },
  "Pinus rigida": {
    "name": "리기다소나무",
    "page": 29
  },
  "Cryptomeria japonica": {
    "name": "삼나무",
    "page": 32
  },
  "Metasequoia glyptostroboides": {
    "name": "메타세쿼이아",
    "page": 35
  },
  "Taxodium distichum": {
    "name": "낙우송",
    "page": 38
  },
  "Juniperus chinensis": {
    "name": "향나무",
    "page": 41
  },
  "Platycladus orientalis": {
    "name": "측백나무",
    "page": 44
  },
  "Taxus cuspidata": {
    "name": "주목",
    "page": 47
  },
  "Juglans mandshurica": {
    "name": "가래나무",
    "page": 50
  },
  "Quercus acutissima": {
    "name": "상수리나무",
    "page": 90
  },
  "Quercus aliena": {
    "name": "갈참나무",
    "page": 93
  },
  "Quercus dentata": {
    "name": "떡갈나무",
    "page": 96
  },
  "Quercus mongolica": {
    "name": "신갈나무",
    "page": 99
  },
  "Quercus serrata": {
    "name": "졸참나무",
    "page": 101
  },
  "Quercus variabilis": {
    "name": "굴참나무",
    "page": 103
  },
  "Celtis sinensis": {
    "name": "팽나무",
    "page": 105
  }
});
export function localizeCandidate(candidate){
 const scientificName=typeof candidate.scientificName==='string'?candidate.scientificName.trim().replace(/\s+/g,' '):'';
 const commonName=typeof candidate.commonName==='string'?candidate.commonName.trim():'';
 const known=Object.hasOwn(KOREAN_NAMES,scientificName)?KOREAN_NAMES[scientificName]:null;
 const provided=/[가-힣]/u.test(commonName)&&commonName.length<=200?commonName:'';
 return {...candidate,scientificName,commonName,koreanName:known?.name||provided,
  koreanNameSource:known?'nibr-2015':provided?'plantnet':'none',
  koreanNameSourceUrl:known?NAME_SOURCE_URL+'#page='+known.page:'',
  displayName:known?.name||provided||'한글 이름 미등록'};
}
