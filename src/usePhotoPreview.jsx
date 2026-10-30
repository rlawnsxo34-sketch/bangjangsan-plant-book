import React,{useEffect,useRef,useState} from 'react';
import PhotoViewer from './PhotoViewer.jsx';
export default function usePhotoPreview(sources,name,label){
 const[view,setView]=useState(null),opener=useRef(null);
 const matches=view&&view.sources.length===sources.length&&view.sources.every((src,i)=>src===sources[i]);
 useEffect(()=>{if(view&&!matches)setView(null);},[view,matches]);
 function open(index,event){opener.current=event.currentTarget;setView({index,sources:[...sources]});}
 const viewer=matches?<PhotoViewer title={name} photos={sources.map((src,i)=>({src,label:label(i),alt:`${name} ${label(i)}`}))} index={view.index} onIndex={index=>setView(value=>value?{...value,index}:null)} onClose={()=>setView(null)} returnFocus={opener}/>:null;
 return {open,viewer};
}
