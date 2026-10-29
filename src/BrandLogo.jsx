import React,{useState} from 'react';
export default function BrandLogo(){
 const[failed,setFailed]=useState(false);
 return failed?<span className="brand-logo-fallback">ㅇㄱㅁㅇ<span>이건뭐야</span></span>:<img className="brand-horizontal-logo" src="/brand/egmy-horizontal-v19.png" width="1600" height="529" alt="ㅇㄱㅁㅇ · 이건뭐야" decoding="async" onError={()=>setFailed(true)}/>;
}
