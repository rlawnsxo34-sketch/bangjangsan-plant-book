import React,{useEffect,useRef} from 'react';
const stack=[];
let originalOverflow='';
export default function Dialog({label,onClose,busy=false,className,children,onKeyDown,returnFocus}){
  const ref=useRef(null),close=useRef(onClose),locked=useRef(busy);
  close.current=onClose;locked.current=busy;
  useEffect(()=>{
    const previous=returnFocus?.current||document.activeElement;
    if(!stack.length)originalOverflow=document.body.style.overflow;
    stack.push(ref);
    const isTop=()=>stack.at(-1)===ref;
    document.body.style.overflow='hidden';
    const focusables=()=>[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],iframe,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
    const first=()=>{const list=focusables();(list[0]||ref.current).focus();};
    first();
    const keydown=event=>{
      if(!isTop())return;
      if(event.key==='Escape'){event.preventDefault();if(!locked.current)close.current();}
      if(event.key==='Tab'){
        const list=focusables(),firstItem=list[0],lastItem=list.at(-1);
        if(!list.length){event.preventDefault();ref.current.focus();return;}
        if(event.shiftKey&&(document.activeElement===firstItem||document.activeElement===ref.current)){event.preventDefault();lastItem.focus();}
        else if(!event.shiftKey&&(document.activeElement===lastItem||document.activeElement===ref.current)){event.preventDefault();firstItem.focus();}
      }
    };
    const focusin=event=>{if(isTop()&&ref.current&&!ref.current.contains(event.target))first();};
    document.addEventListener('keydown',keydown);document.addEventListener('focusin',focusin);
    return()=>{const index=stack.indexOf(ref);if(index>=0)stack.splice(index,1);if(!stack.length)document.body.style.overflow=originalOverflow;document.removeEventListener('keydown',keydown);document.removeEventListener('focusin',focusin);queueMicrotask(()=>{const top=stack.at(-1);if(previous?.isConnected&&!previous.closest('[inert]')&&(!top||top.current?.contains(previous)))previous.focus();});};
  },[]);
  return <div onClick={e=>e.stopPropagation()} onKeyDown={onKeyDown} ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={className}>{children}</div>;
}
