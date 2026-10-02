(function(global){
  function describeError(error){
    const code=String(error?.code||'').replace(/^functions\//,'');
    const messages={
      'unauthenticated':'계정을 다시 연결한 뒤 식별해주세요.',
      'failed-precondition':'사진 식별 서비스를 준비 중입니다. 이름을 직접 기록할 수 있습니다.',
      'not-found':'사진 식별 서비스를 준비 중입니다. 이름을 직접 기록할 수 있습니다.',
      'resource-exhausted':'식별 요청 간격 또는 사용 한도에 도달했습니다. 잠시 후 다시 시도하거나 이름을 직접 기록해주세요.',
      'aborted':'이전 요청을 처리 중입니다. 잠시 후 결과를 다시 확인해주세요.',
      'deadline-exceeded':'식별 확인 시간이 초과되었습니다. 결과를 다시 확인하거나 이름을 직접 기록해주세요.',
      'invalid-argument':'사진 형식 또는 요청 정보를 확인해주세요. 다른 사진으로 시도할 수 있습니다.'
    };
    return messages[code]||'사진을 식별하지 못했습니다. 연결을 확인하고 다시 시도해주세요.';
  }
  function createIdentificationController({invoke,publish,isCurrent,timeoutMs=60000,newId=()=>global.crypto.randomUUID().replace(/-/g,'')}){
    let revision=0,working=false,timer=null,cached=null;
    function cancel(reset=true){revision++;working=false;clearTimeout(timer);if(reset)cached=null;}
    function start({imageData,organ='auto',token,fresh=false}){
      if(working||!isCurrent(token))return false;
      if(fresh||!cached||cached.imageData!==imageData||cached.organ!==organ)cached={imageData,organ,requestId:newId()};
      const payload={imageData,organ,requestId:cached.requestId},epoch=++revision;
      working=true;
      const current=()=>epoch===revision&&isCurrent(token);
      publish({phase:'pending',candidates:[],issue:null});
      timer=setTimeout(()=>{if(current()){revision++;working=false;publish({phase:'error',candidates:[],issue:describeError({code:'deadline-exceeded'})});}},timeoutMs);
      Promise.resolve().then(()=>{if(!current())return null;return invoke(payload);}).then(result=>{
        if(!current())return;if(!result)throw new Error('invalid response');
        const data=result.data||result;
        if(!Array.isArray(data.candidates))throw new Error('invalid response');
        const candidates=data.candidates.filter(c=>typeof c.scientificName==='string'&&c.scientificName&&Number.isFinite(c.score)&&c.score>=0&&c.score<=1).slice(0,5).map(c=>({scientificName:c.scientificName.slice(0,200),commonName:typeof c.commonName==='string'?c.commonName.slice(0,200):'',score:c.score}));
        publish({phase:candidates.length?'ready':'empty',candidates,issue:null});
      }).catch(error=>{if(current())publish({phase:'error',candidates:[],issue:describeError(error)});})
      .finally(()=>{if(current()){clearTimeout(timer);working=false;}});
      return true;
    }
    return {start,cancel};
  }
  global.plantIdentifyFlow={createIdentificationController,describeError};
})(typeof window!=='undefined'?window:globalThis);
