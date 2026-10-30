export class IdentificationError extends Error{
 constructor(code){super(code);this.name='IdentificationError';this.code=code;}
}
const problems={
 connection:{title:'사진 검색에 연결하지 못했어요',text:'인터넷 연결을 확인하고 다시 눌러주세요. 사진은 그대로 남아 있어요.',retry:true},
 timeout:{title:'결과를 기다리는 시간이 길어지고 있어요',text:'같은 사진으로 다시 확인하거나 이름을 직접 적어도 괜찮아요.',retry:true},
 auth:{title:'로그인 상태를 확인하지 못했어요',text:'연결 상태를 확인한 뒤 다시 눌러주세요. 계속 실패하면 작성 중인 사진과 글의 보관 상태를 확인한 뒤 다시 로그인해주세요.',retry:true},
 limit:{title:'지금은 사진 검색 이용량을 모두 썼어요',text:'다른 사진을 올려도 한도가 바로 늘어나지는 않아요. 이름을 직접 적거나 이름 모름으로 기록할 수 있어요.',retry:false},
 wait:{title:'잠시 기다린 뒤 다시 눌러주세요',text:'사진 검색 사이에 잠깐의 간격이 필요해요. 10초 이상 기다린 뒤 다시 시도해주세요.',retry:true},
 notFound:{title:'비슷한 식물을 찾지 못했어요',text:'잎이나 꽃이 선명한 다른 사진을 대표사진으로 골라보세요. 이름을 몰라도 사진을 기록할 수 있어요.',retry:false},
 photo:{title:'이 사진으로는 검색하기 어려워요',text:'선명한 식물 사진을 다른 대표사진으로 고른 뒤 다시 눌러주세요.',retry:true},
 pending:{title:'이전 사진 검색을 아직 확인 중이에요',text:'잠시 기다린 뒤 같은 사진으로 다시 확인해주세요. 같은 요청의 결과를 확인해요.',retry:true},
 failed:{title:'이 사진의 검색을 마치지 못했어요',text:'다른 사진을 대표사진으로 고르거나 이름 모름으로 기록해주세요.',retry:false},
 setup:{title:'사진 검색은 준비 중이에요',text:'지금은 이름을 직접 적거나 이름 모름으로 사진을 기록할 수 있어요.',retry:false},
 service:{title:'사진 검색을 잠시 이용하기 어려워요',text:'잠시 후 다시 눌러주세요. 사진과 글은 그대로 두고 이름을 직접 적어 기록해도 괜찮아요.',retry:true},
 cancelled:{title:'결과 기다리기를 멈췄어요',text:'사진은 그대로 남아 있어요. 이미 전송된 요청은 이용량에 포함될 수 있어요.',retry:true}
};
export function identifyProblem(error){
 const code=Object.hasOwn(problems,error?.code)?error.code:'service';
 return {code,...problems[code]};
}
export function responseProblem(status,message){
 if(status===401)return 'auth';
 if(status===429)return typeof message==='string'&&/10초|간격|기다려/.test(message)?'wait':'limit';
 if(status===502&&typeof message==='string'&&/한도/.test(message))return 'limit';
 if(status===409)return typeof message==='string'&&/진행 중/.test(message)?'pending':'failed';
 if(status===422)return 'notFound';
 if(status===400||status===413)return 'photo';
 return 'service';
}
