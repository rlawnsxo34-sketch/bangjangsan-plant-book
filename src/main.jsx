import React from 'react';
import {createRoot} from 'react-dom/client';
import './auth-flow.js';
import './photo-flow.js';
import './view-flow.js';
import './storage-flow.js';
import './identify-flow.js';
import App from './App.jsx';
import {initializeRuntime} from './runtime.js';
try{
  initializeRuntime(window.plantConfig);
  createRoot(document.getElementById('root')).render(<App/>);
}catch(_){
  const root=document.getElementById('root');
  root.replaceChildren();const heading=document.createElement('h1');heading.textContent='방장산 식물 도감';
  const message=document.createElement('p');message.setAttribute('role','alert');message.textContent='도감을 시작하지 못했습니다. 연결을 확인한 뒤 새로고침해주세요.';
  root.append(heading,message);
}
