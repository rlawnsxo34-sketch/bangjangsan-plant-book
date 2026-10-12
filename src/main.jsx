import React from 'react';
import {createRoot} from 'react-dom/client';
import './photo-flow.js';
import App from './App.jsx';
class Boundary extends React.Component{
 constructor(props){super(props);this.state={error:false};}
 static getDerivedStateFromError(){return {error:true};}
 render(){return this.state.error?<main className="p-6"><h1 className="text-xl font-bold">도감을 열지 못했습니다.</h1><p className="mt-3">기존 브라우저 데이터를 지우지 말고 새로고침해주세요.</p><button className="mt-4 rounded-xl bg-emerald-800 px-4 py-3 text-white" onClick={()=>location.reload()}>다시 열기</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')).render(<Boundary><App/></Boundary>);
