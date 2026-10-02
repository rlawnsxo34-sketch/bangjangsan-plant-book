import * as apps from 'firebase/app';
import * as auth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as storage from 'firebase/storage';
import {getFunctions,httpsCallable,connectFunctionsEmulator} from 'firebase/functions';
import {initializeAppCheck,ReCaptchaEnterpriseProvider} from 'firebase/app-check';
export function initializeRuntime(config){
  const app=apps.initializeApp(config.firebase);
  const authInstance=auth.getAuth(app),db=firestore.getFirestore(app),files=storage.getStorage(app);
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const demo=local&&config.emulators?.enabled===true&&config.firebase.projectId.startsWith('demo-');
  if(config.emulators?.enabled&&!demo)throw new Error('에뮬레이터는 localhost의 demo 프로젝트에서만 사용할 수 있습니다.');
  const functions=getFunctions(app,config.functionsRegion||'asia-northeast3');
  const wiredDatabases=new WeakSet(),wiredStorage=new WeakSet();
  if(demo){
    auth.connectAuthEmulator(authInstance,'http://127.0.0.1:9099',{disableWarnings:true});
    firestore.connectFirestoreEmulator(db,'127.0.0.1',8080);storage.connectStorageEmulator(files,'127.0.0.1',9199);
    wiredDatabases.add(db);wiredStorage.add(files);
    connectFunctionsEmulator(functions,'127.0.0.1',5001);
  }else if(config.appCheckSiteKey){
    initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
  }
  window.firebaseConfig=config.firebase;window.firebaseAuth=authInstance;window.firebaseDb=db;window.firebaseStorage=files;
  window.firebaseMethods={...apps,...auth,...firestore,...storage,storageRef:storage.ref,
    // An independently authenticated destination app also needs local emulator wiring.
    initializeAuth:(app,options)=>{const session=auth.initializeAuth(app,options);if(demo)auth.connectAuthEmulator(session,'http://127.0.0.1:9099',{disableWarnings:true});return session;},
    getFirestore:app=>{const database=firestore.getFirestore(app);if(demo&&!wiredDatabases.has(database)){firestore.connectFirestoreEmulator(database,'127.0.0.1',8080);wiredDatabases.add(database);}return database;},
    getStorage:app=>{const instance=storage.getStorage(app);if(demo&&!wiredStorage.has(instance)){storage.connectStorageEmulator(instance,'127.0.0.1',9199);wiredStorage.add(instance);}return instance;}
  };
  window.identificationAvailable=config.identificationEnabled!==false&&(demo||Boolean(config.appCheckSiteKey));
  window.identifyPlant=httpsCallable(functions,'identifyPlant',{timeout:60000});
}
