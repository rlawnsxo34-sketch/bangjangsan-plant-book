import React,{useState,useRef,useEffect} from 'react';
import Dialog from './dialog.jsx';
import {ArrowsClockwise,BookOpen,CalendarBlank,Camera,CheckCircle,FloppyDisk,Images,Leaf,MapPin,PencilSimple,Scan,SignIn,SignOut,Spinner,Trash,X} from '@phosphor-icons/react';
const icons={"ph-arrows-clockwise":ArrowsClockwise,"ph-book-open":BookOpen,"ph-calendar-blank":CalendarBlank,"ph-camera":Camera,"ph-check-circle":CheckCircle,"ph-floppy-disk":FloppyDisk,"ph-images":Images,"ph-leaf":Leaf,"ph-map-pin":MapPin,"ph-pencil-simple":PencilSimple,"ph-scan":Scan,"ph-sign-in":SignIn,"ph-sign-out":SignOut,"ph-spinner":Spinner,"ph-trash":Trash,"ph-x":X,"ph-map-pin-line":MapPin,"ph-map-pin-fill":MapPin};
function Icon({className=''}){const Component=icons[className.match(/\bph-[a-z-]+/)?.[0]]||Leaf;return <Component size="1em" aria-hidden="true" focusable="false" className={className}/>;}
function OptionalImage({src,alt,className,style}){const [missing,setMissing]=useState(false);return missing?<span role="img" aria-label={alt} className={className+' inline-flex items-center justify-center text-emerald-800'}><Leaf aria-hidden="true" className={alt==='국립장성숲체원'?'w-6 h-6 mr-2':'w-3/4 h-3/4'}/>{alt==='국립장성숲체원'?<span className="text-xs font-bold whitespace-nowrap">국립장성<br/>숲체원</span>:<span className="sr-only">{alt}</span>}</span>:<img src={src} alt={alt} className={className} style={style} onError={()=>setMissing(true)}/>;}



    function PlantImage({ plant, ownerUid, className }) {
      const [view, setView] = useState({ url: null, error: false });
      const [attempt, setAttempt] = useState(0);
      useEffect(() => {
        let active = true, url = null;
        setView({ url: null, error: false });
        if (!ownerUid || window.firebaseAuth.currentUser?.uid !== ownerUid) return;
        if (!plant.imagePath) {
          if (/^data:image\/(jpeg|png);base64,/.test(plant.imageData || '')) setView({ url: plant.imageData, error: false });
          else setView({ url: null, error: true });
          return;
        }
        const timer = setTimeout(() => { if (active) setView({url:null,error:true}); }, 15000);
        (async () => {
          try {
            window.plantStorageFlow.assertImage(plant, ownerUid, plant.id, 'plant-book-84803');
            const blob = await window.firebaseMethods.getBlob(window.firebaseMethods.storageRef(window.firebaseStorage, plant.imagePath), window.plantStorageFlow.MAX_BYTES);
            if (!active || window.firebaseAuth.currentUser?.uid !== ownerUid) return;
            clearTimeout(timer);
            url = URL.createObjectURL(blob); setView({ url, error: false });
          } catch (_) { if (active) { clearTimeout(timer); setView({ url:null, error:true }); } }
        })();
        return () => { active = false; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
      }, [ownerUid, plant.id, plant.imagePath, plant.imageData, attempt]);
      if (view.url) return <img src={view.url} alt={plant.name} className={className} onError={() => setView({url:null,error:true})} />;
      return <div className={className + ' pointer-events-none relative z-[2] flex flex-col items-center justify-center gap-2 p-4 text-slate-600'} role="status">
        <span>{view.error ? '사진을 불러오지 못했습니다.' : '사진을 불러오는 중…'}</span>
        {view.error && <button className="pointer-events-auto relative z-20 bg-white border rounded-xl px-3 py-2 text-sm" onClick={e => {e.stopPropagation();setAttempt(n=>n+1);}}>사진 다시 불러오기</button>}
      </div>;
    }

    export default function App() {
      const auth = window.firebaseAuth;
      const db = window.firebaseDb;
      const sdk = window.firebaseMethods;
      const { signInAnonymously, onAuthStateChanged, signOut, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } = sdk;
      const appId = "plant-book-84803";

      const [user, setUser] = useState(null);
      const [currentTab, setCurrentTab] = useState('camera');
      
      const [selectedImage, setSelectedImage] = useState(null);
      const [compressedImageUrl, setCompressedImageUrl] = useState(null);
      
      const [location, setLocation] = useState(null);
      const [isLocating, setIsLocating] = useState(false);
      const [isProcessing, setIsProcessing] = useState(false);
      const [photoSource, setPhotoSource] = useState(null);
      const [locationStatus, setLocationStatus] = useState('idle');
      const [locationError, setLocationError] = useState('');
      const photoTaskRef = useRef(null);
      const locationTaskRef = useRef(null);
      const activePhotoRef = useRef(null);
      const photoReadyRef = useRef(null);
      const locationReadyRef = useRef(null);
      const locationPendingRef = useRef(false);
      const savingRef = useRef(false);
      const storageSaveRef = useRef(null);
      const [saveAttempted, setSaveAttempted] = useState(false);
      if (!photoTaskRef.current) photoTaskRef.current = window.plantPhotoFlow.createLatestTask();
      if (!locationTaskRef.current) locationTaskRef.current = window.plantPhotoFlow.createLatestTask();

      const [plantName, setPlantName] = useState('');
      const [plantDesc, setPlantDesc] = useState('');

      const cameraInputRef = useRef(null);
      const albumInputRef = useRef(null);

      const [dictionaryState, setDictionaryState] = useState({ ownerUid: null, phase: 'idle', items: [], fromCache: false, issue: null });
      const plants = dictionaryState.ownerUid === user?.uid ? dictionaryState.items : [];
      const dictionaryPhase = dictionaryState.ownerUid === user?.uid ? dictionaryState.phase : 'loading';
      const dictionaryControllerRef = useRef(null);
      const accountScopeRef = useRef(null);
      const mutationRef = useRef(null);
      const [pendingRecordAction, setPendingRecordAction] = useState(null);
      const [retryAction, setRetryAction] = useState(null);
      const [isOffline, setIsOffline] = useState(navigator.onLine === false);
      const [writeWaitMessage, setWriteWaitMessage] = useState('');
      if (!accountScopeRef.current) accountScopeRef.current = window.plantViewFlow.createAccountScope();
      const isCurrentAccount = token => token.isCurrent() && auth.currentUser?.uid === token.ownerUid;
      if (!dictionaryControllerRef.current) dictionaryControllerRef.current = window.plantViewFlow.createDictionaryController({
        sdk, db, appId, isOwnerCurrent: uid => auth.currentUser?.uid === uid && accountScopeRef.current.capture().ownerUid === uid,
        publish: setDictionaryState
      });
      const [isSaving, setIsSaving] = useState(false);
      const [saveSuccess, setSaveSuccess] = useState(false);
      const [error, setError] = useState(null);

      // 🌟 크게 보기(프리젠테이션 모달) 상태 추가
      const [selectedPlant, setSelectedPlant] = useState(null);

      // 수정 기능 상태
      const [editingPlantId, setEditingPlantId] = useState(null);
      const [editName, setEditName] = useState('');
      const [editDesc, setEditDesc] = useState('');
      const [isUpdating, setIsUpdating] = useState(false);

      const [showLoginModal, setShowLoginModal] = useState(false);
      const [loginId, setLoginId] = useState('');
      const [loginPassword, setLoginPassword] = useState('');
      const [authError, setAuthError] = useState('');
      const [isAuthBusy, setIsAuthBusy] = useState(false);
      const [isAuthInitializing, setIsAuthInitializing] = useState(true);
      const [authProgress, setAuthProgress] = useState('');
      const [authSystemError, setAuthSystemError] = useState('');
      const [authNotice, setAuthNotice] = useState('');
      const authLockRef = useRef(false);
      const anonymousPromiseRef = useRef(null);
      const activeWritesRef = useRef(0);
      const lastUidRef = useRef(null);
      const storageFlow = window.plantStorageFlow.createStorageFlow({sdk, db, storage: window.firebaseStorage, appId, isCurrent: isCurrentAccount});
      const authFlow = window.createPlantAuthFlow({ sdk, auth, db, config: window.firebaseConfig, appId, copyImage: storageFlow.copyImage });
      const [showImageSourceModal, setShowImageSourceModal] = useState(false);
      const [identifyState,setIdentifyState]=useState({phase:'idle',candidates:[],issue:null});
      const [organ,setOrgan]=useState('auto');
      const [chosenIdentification,setChosenIdentification]=useState(null);
      const identifyRef=useRef(null);
      const [deleteTarget,setDeleteTarget]=useState(null);
      const [mapVisible,setMapVisible]=useState(false);
      const pageShellRef=useRef(null);
      if(!identifyRef.current)identifyRef.current=window.plantIdentifyFlow.createIdentificationController({
        invoke:payload=>window.identifyPlant(payload),publish:setIdentifyState,
        isCurrent:token=>isCurrentAccount(token.owner)&&token.photo?.isCurrent()
      });
      const resetIdentification=()=>{identifyRef.current.cancel();setIdentifyState({phase:'idle',candidates:[],issue:null});setChosenIdentification(null);};
      const identifyPhoto=(fresh=false)=>{
        if(savingRef.current||authLockRef.current||saveAttempted||!photoReadyRef.current||navigator.onLine===false||!window.identificationAvailable)return;
        const token={owner:accountScopeRef.current.capture(),photo:activePhotoRef.current};
        setChosenIdentification(null);
        identifyRef.current.start({imageData:photoReadyRef.current,organ,token,fresh});
      };
      const selectCandidate=candidate=>{
        if(savingRef.current||saveAttempted||!activePhotoRef.current?.isCurrent())return;
        identifyRef.current.cancel(false);
        setPlantName(candidate.scientificName);
        setChosenIdentification({provider:'plantnet',scientificName:candidate.scientificName,commonName:candidate.commonName||'',score:candidate.score,organ,identifiedAt:Date.now()});
        clearCommonError();
      };
      useEffect(()=>{setMapVisible(false);},[selectedPlant?.id]);

      const isInAppBrowser = /KAKAOTALK|NAVER|Instagram|Line|Daum/i.test(navigator.userAgent);

      // Only this function initiates anonymous sessions; logout only signs out.
      const ensureGuestSession = async () => {
        if (auth.currentUser) return auth.currentUser;
        if (!anonymousPromiseRef.current) {
          anonymousPromiseRef.current = signInAnonymously(auth).finally(() => {
            anonymousPromiseRef.current = null;
          });
        }
        return anonymousPromiseRef.current;
      };

      const cancelDraft = () => {
        resetIdentification();setOrgan('auto');
        photoTaskRef.current.cancel(); locationTaskRef.current.cancel();
        activePhotoRef.current = null; photoReadyRef.current = null;
        storageSaveRef.current = null; setSaveAttempted(false);
        locationReadyRef.current = null; locationPendingRef.current = false;
        setSelectedImage(null); setCompressedImageUrl(null); setIsProcessing(false);
        setPhotoSource(null); setLocation(null); setIsLocating(false);
        setLocationStatus('idle'); setLocationError(''); setSaveSuccess(false);
        setPlantName(''); setPlantDesc(''); setError(null); setRetryAction(null); setShowImageSourceModal(false);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (albumInputRef.current) albumInputRef.current.value = '';
      };
      useEffect(() => () => {
        photoTaskRef.current.cancel(); locationTaskRef.current.cancel();
        dictionaryControllerRef.current.stop();identifyRef.current.cancel();
      }, []);
      useEffect(() => {
        const offline = () => setIsOffline(true);
        const online = () => {
          setIsOffline(false);
          const uid = auth.currentUser?.uid;
          if (uid && accountScopeRef.current.capture().ownerUid === uid) dictionaryControllerRef.current.subscribe(uid);
        };
        window.addEventListener('offline', offline); window.addEventListener('online', online);
        return () => { window.removeEventListener('offline', offline); window.removeEventListener('online', online); };
      }, []);
      useEffect(() => {
        setWriteWaitMessage('');
        if (!isSaving && !pendingRecordAction) return;
        const timer = setTimeout(() => setWriteWaitMessage('서버의 처리 확인을 기다리고 있습니다. 중복 실행을 피하고 연결이 돌아올 때까지 기다려주세요.'), 15000);
        return () => clearTimeout(timer);
      }, [isSaving, pendingRecordAction]);

      const syncUser = (currentUser) => {
        const nextUid = currentUser?.uid || null;
        if (lastUidRef.current !== nextUid) {
          dictionaryControllerRef.current.stop();
          accountScopeRef.current.change(nextUid);
          cancelDraft();
          setDictionaryState({ ownerUid: nextUid, phase: nextUid ? 'loading' : 'idle', items: [], fromCache: false, issue: null });
          setDeleteTarget(null);setMapVisible(false);
          setSelectedPlant(null); setEditingPlantId(null); setEditName(''); setEditDesc('');
          mutationRef.current = null; savingRef.current = false; activeWritesRef.current = 0;
          setPendingRecordAction(null); setIsUpdating(false); setIsSaving(false); setWriteWaitMessage('');
          setAuthNotice(''); setAuthSystemError(''); setAuthError(''); setAuthProgress('');
          setShowLoginModal(false); setLoginId(''); setLoginPassword('');
          lastUidRef.current = nextUid;
        }
        // Firebase may mutate its User object during linking; use a fresh view snapshot.
        setUser(currentUser ? {
          uid: currentUser.uid, email: currentUser.email, isAnonymous: currentUser.isAnonymous
        } : null);
      };

      useEffect(() => {
        let active = true;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!active) return;
          syncUser(currentUser);
          if (currentUser) {
            setIsAuthInitializing(false);
            setAuthSystemError('');
            return;
          }
          setIsAuthInitializing(true);
          try {
            await ensureGuestSession();
          } catch (err) {
            if (active && !auth.currentUser) setAuthSystemError(window.describePlantAuthError(err));
          } finally {
            if (active) setIsAuthInitializing(false);
          }
        });
        return () => { active = false; unsubscribe(); };
      }, []);

      useEffect(() => {
        if (!user?.uid) return;
        return dictionaryControllerRef.current.subscribe(user.uid);
      }, [user?.uid]);
      useEffect(() => {
        if (dictionaryState.ownerUid !== user?.uid || !['ready', 'cached'].includes(dictionaryState.phase)) {
          setSelectedPlant(null);
          return;
        }
        setSelectedPlant(previous => previous ? dictionaryState.items.find(item => item.id === previous.id) || null : null);
        if (editingPlantId && !dictionaryState.items.some(item => item.id === editingPlantId)) {
          setEditingPlantId(null); setEditName(''); setEditDesc('');
        }
      }, [dictionaryState, user?.uid]);
      const reloadDictionary = () => {
        const uid = auth.currentUser?.uid;
        if (uid && uid === user?.uid) dictionaryControllerRef.current.subscribe(uid);
      };
      const clearCommonError = () => { setError(null); setRetryAction(null); };
      const retryFailedAction = () => {
        if (!retryAction || retryAction.uid !== auth.currentUser?.uid) return;
        if (retryAction.kind === 'save') saveToDictionary();
        if (retryAction.kind === 'delete') deletePlant(retryAction.id);
        if (retryAction.kind === 'update' && editingPlantId === retryAction.id) saveEditPlant(retryAction.id);
      };

      const beginAuthAction = () => {
        if (authLockRef.current || isAuthInitializing) return false;
        if (activeWritesRef.current > 0) {
          setAuthError('진행 중인 기록 저장·수정·삭제가 끝난 뒤 다시 시도해주세요.');
          setAuthSystemError('진행 중인 기록 저장·수정·삭제가 끝난 뒤 계정을 변경해주세요.');
          return false;
        }
        authLockRef.current = true;
        clearCommonError();
        setIsAuthBusy(true); setAuthError(''); setAuthNotice(''); setAuthSystemError('');
        return true;
      };
      const endAuthAction = () => {
        authLockRef.current = false;
        setIsAuthBusy(false); setAuthProgress('');
      };
      const closeAuthModal = () => {
        if (authLockRef.current) return;
        setShowLoginModal(false); setLoginPassword(''); setAuthError('');
      };

      const handleSignUp = async () => {
        if (!beginAuthAction()) return;
        const ownerToken = accountScopeRef.current.capture();
        setAuthProgress('현재 기록을 보존하며 가입하고 있습니다…');
        try {
          await authFlow.signUp(loginId, loginPassword);
          if (!isCurrentAccount(ownerToken)) return;
          syncUser(auth.currentUser);
          setAuthNotice('가입이 완료되었습니다. 체험 중 만든 도감 기록이 그대로 연결되었습니다.');
          setShowLoginModal(false); setLoginId(''); setLoginPassword('');
        } catch (err) {
          if (isCurrentAccount(ownerToken)) setAuthError(window.describePlantAuthError(err));
        } finally { endAuthAction(); }
      };

      const handleLogin = async () => {
        if (!beginAuthAction()) return;
        const sourceUid = auth.currentUser?.uid;
        const sourceToken = accountScopeRef.current.capture();
        try {
          const result = await authFlow.signInPreservingGuest(loginId, loginPassword, message => {
            if (isCurrentAccount(sourceToken)) setAuthProgress(message);
          });
          if (auth.currentUser?.uid !== result.user.uid) return;
          syncUser(auth.currentUser);
          setAuthNotice(result.total > 0
            ? `로그인했습니다. 체험 기록 ${result.total}개를 기존 계정으로 이어 붙였습니다.`
            : '로그인했습니다. 기존 도감을 불러옵니다.');
          setShowLoginModal(false); setLoginId(''); setLoginPassword('');
        } catch (err) {
          const preserved = err.guestPreserved ? ' 현재 체험 계정과 원본 기록은 유지됩니다. 일부 복사된 기록은 재시도해도 중복되지 않습니다.' : '';
          if (isCurrentAccount(sourceToken)) setAuthError(window.describePlantAuthError(err) + preserved);
        } finally { endAuthAction(); }
      };

      const handleLogout = async () => {
        if (!beginAuthAction()) return;
        const ownerToken = accountScopeRef.current.capture();
        try {
          await signOut(auth);
          if (!auth.currentUser || auth.currentUser.isAnonymous) setAuthNotice('로그아웃했습니다. 회원 도감은 계정에 보관되며 다시 로그인하면 확인할 수 있습니다.');
        } catch (err) {
          if (isCurrentAccount(ownerToken)) setAuthSystemError(window.describePlantAuthError(err));
        } finally { endAuthAction(); }
      };

      const retryGuestSession = async () => {
        if (isAuthInitializing || authLockRef.current) return;
        setIsAuthInitializing(true); setAuthSystemError('');
        try { const result = await ensureGuestSession(); syncUser(auth.currentUser || result.user); }
        catch (err) { if (!auth.currentUser) setAuthSystemError(window.describePlantAuthError(err)); }
        finally { setIsAuthInitializing(false); }
      };

      const fetchLocation = async (photoRequest = activePhotoRef.current) => {
        if (savingRef.current || authLockRef.current || !photoReadyRef.current || !photoRequest?.isCurrent()) return;
        const request = locationTaskRef.current.begin();
        locationReadyRef.current = null; locationPendingRef.current = true;
        setLocation(null); setIsLocating(true); setLocationStatus('pending'); setLocationError('');
        try {
          const result = await window.plantPhotoFlow.readCurrentLocation({ signal: request.signal });
          if (!request.isCurrent() || !photoRequest.isCurrent()) return;
          locationReadyRef.current = result;
          setLocation(result); setLocationStatus('ready');
        } catch (err) {
          if (!request.isCurrent() || !photoRequest.isCurrent() || err.name === 'AbortError') return;
          setLocationStatus('error'); setLocationError(err.message || '위치 정보를 확인하지 못했습니다.');
        } finally {
          if (request.isCurrent() && photoRequest.isCurrent()) {
            locationPendingRef.current = false; setIsLocating(false);
          }
        }
      };
      const omitLocation = () => {
        if (savingRef.current || authLockRef.current) return;
        locationTaskRef.current.cancel(); locationPendingRef.current = false;
        locationReadyRef.current = null;
        setLocation(null); setIsLocating(false); setLocationStatus('omitted'); setLocationError('');
      };

      const handleImageChange = async (e, source) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // Selecting the same file again must trigger change.
        if (!file || savingRef.current || authLockRef.current) return;
        resetIdentification();
        const request = photoTaskRef.current.begin();
        activePhotoRef.current = request;
        locationTaskRef.current.cancel();
        photoReadyRef.current = null; locationReadyRef.current = null; locationPendingRef.current = false;
        setSelectedImage(null); setCompressedImageUrl(null); setIsProcessing(true);
        setPhotoSource(source); setSaveSuccess(false); storageSaveRef.current = null; setSaveAttempted(false); setPlantName(''); setPlantDesc(''); clearCommonError();
        setLocation(null); setIsLocating(false); setLocationStatus('idle'); setLocationError('');
        try {
          const result = await window.plantPhotoFlow.preparePhoto(file, { signal: request.signal });
          if (!request.isCurrent()) return;
          photoReadyRef.current = result.dataUrl;
          setSelectedImage(result.dataUrl); setCompressedImageUrl(result.dataUrl);
          if (source === 'camera') fetchLocation(request);
        } catch (err) {
          if (!request.isCurrent() || err.name === 'AbortError') return;
          photoReadyRef.current = null;
          setError(err.message || '사진 처리에 실패했습니다. 다시 선택해주세요.');
        } finally {
          if (request.isCurrent()) setIsProcessing(false);
        }
      };

      const saveToDictionary = async () => {
        if (authLockRef.current || isAuthInitializing || savingRef.current) return;
        clearCommonError(); setAuthNotice('');
        if (navigator.onLine === false) { setError('인터넷 연결을 확인한 뒤 다시 저장해주세요. 입력한 기록은 유지됩니다.'); setRetryAction({kind:'save',uid:user?.uid}); return; }
        if (isProcessing || !photoReadyRef.current) { setError('사진 처리가 완료된 뒤 저장해주세요.'); return; }
        if (locationPendingRef.current) { setError('위치 확인을 기다리거나 [위치 없이 저장]을 선택해주세요.'); return; }
        if (plantName.trim().length > 200 || plantDesc.trim().length > 10000) {
          setError('식물 이름은 200자, 메모는 10,000자 이내로 입력해주세요.'); return;
        }
        if (!user) {
          setError("도감에 저장하려면 먼저 우측 상단의 [로그인]을 진행해주세요!");
          setShowLoginModal(true);
          return;
        }
        if (!plantName.trim()) {
          setError("식물 이름을 꼭 적어주세요!");
          return;
        }
        const readyPhoto = photoReadyRef.current;
        const readyLocation = locationReadyRef.current;
        const ownerUid = auth.currentUser?.uid;
        const photoRequest = activePhotoRef.current;
        if (!ownerUid || ownerUid !== user.uid || !photoRequest?.isCurrent()) return;
        const ownerToken = accountScopeRef.current.capture();
        identifyRef.current.cancel(false);
        if(identifyState.phase==='pending')setIdentifyState({phase:'idle',candidates:[],issue:null});
        savingRef.current = true;
        activeWritesRef.current++;
        setIsSaving(true);
        setError(null);

        try {
          if (!storageSaveRef.current) {
            const fields = { name: plantName.trim(), description: plantDesc.trim() || '직접 관찰한 식물입니다.', createdAt: Date.now() };
            if (readyLocation) fields.location = readyLocation;
            if(chosenIdentification)fields.identification=chosenIdentification;
            storageSaveRef.current = storageFlow.prepareSave(ownerUid, readyPhoto, fields);
            setSaveAttempted(true);
          }
          await storageFlow.save(storageSaveRef.current, ownerToken);
          if (isCurrentAccount(ownerToken) && photoRequest.isCurrent()) {
            setSaveSuccess(true); setAuthNotice('도감에 저장했습니다.');
          }
        } catch (err) {
          if (isCurrentAccount(ownerToken) && photoRequest.isCurrent()) {
            setError(window.plantStorageFlow.describeError(err) + ' 입력한 기록은 유지됩니다. 재시도는 같은 기록 ID로 처음 입력한 내용을 확인합니다.');
            setRetryAction({kind:'save',uid:ownerUid});
          }
        } finally {
          if (isCurrentAccount(ownerToken)) {
            savingRef.current = false;
            activeWritesRef.current--;
            setIsSaving(false);
          }
        }
      };

      const deletePlant = async (id) => {
        if (!user || authLockRef.current || mutationRef.current || dictionaryPhase !== 'ready') return;
        clearCommonError(); setAuthNotice('');
        if (navigator.onLine === false) { setError('연결을 확인한 뒤 삭제해주세요. 기록은 삭제하지 않았습니다.'); setRetryAction({kind:'delete',id,uid:user.uid}); return; }
        const ownerToken = accountScopeRef.current.capture();
        if (!isCurrentAccount(ownerToken)) return;
        const operation = {kind:'delete',id,uid:ownerToken.ownerUid};
        mutationRef.current = operation; setPendingRecordAction(operation);
        activeWritesRef.current++;
        try {
          const record = plants.find(item => item.id === id);
          if (!record) return;
          const result = await storageFlow.remove(ownerToken.ownerUid, record, ownerToken);
          if (!isCurrentAccount(ownerToken)) return;
          setSelectedPlant(previous => previous?.id === id ? null : previous);
          setAuthNotice(result.cleanupPending ? '기록을 삭제했습니다. 사진 파일은 서버에서 정리합니다.' : '기록과 사진을 삭제했습니다.');
        } catch (err) {
          if (isCurrentAccount(ownerToken)) {
            setError('삭제하지 못했습니다. 기록은 유지됩니다. 연결과 접근 권한을 확인한 뒤 다시 시도해주세요.');
            setRetryAction(operation);
          }
        } finally {
          if (isCurrentAccount(ownerToken) && mutationRef.current === operation) {
            activeWritesRef.current--; mutationRef.current = null; setPendingRecordAction(null);
          }
        }
      };

      const startEditPlant = (plant, e) => {
        e.stopPropagation();
        if (authLockRef.current || mutationRef.current || dictionaryPhase !== 'ready' || isOffline) return;
        clearCommonError(); setAuthNotice('');
        setEditingPlantId(plant.id); setEditName(plant.name); setEditDesc(plant.description || '');
      };
      const cancelEdit = () => {
        if (mutationRef.current) return;
        setEditingPlantId(null); setEditName(''); setEditDesc(''); clearCommonError();
      };
      const saveEditPlant = async (id) => {
        if (!user || !editName.trim() || authLockRef.current || mutationRef.current || dictionaryPhase !== 'ready') return;
        clearCommonError(); setAuthNotice('');
        if (editName.trim().length > 200 || editDesc.trim().length > 10000) {
          setError('식물 이름은 200자, 메모는 10,000자 이내로 입력해주세요.'); return;
        }
        if (navigator.onLine === false) { setError('연결을 확인한 뒤 수정 내용을 저장해주세요. 입력 내용은 유지됩니다.'); setRetryAction({kind:'update',id,uid:user.uid}); return; }
        const ownerToken = accountScopeRef.current.capture();
        if (!isCurrentAccount(ownerToken)) return;
        const operation = {kind:'update',id,uid:ownerToken.ownerUid};
        mutationRef.current = operation; setPendingRecordAction(operation);
        activeWritesRef.current++; setIsUpdating(true);
        const changes = {name:editName.trim(),description:editDesc.trim()};
        const original=plants.find(item=>item.id===id);
        if(original?.identification&&original.name!==changes.name)changes.identification=sdk.deleteField();
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', ownerToken.ownerUid, 'plants', id), changes);
          if (!isCurrentAccount(ownerToken)) return;
          setEditingPlantId(null); setEditName(''); setEditDesc(''); setAuthNotice('수정 내용을 저장했습니다.');
        } catch (err) {
          if (isCurrentAccount(ownerToken)) {
            setError('수정에 실패했습니다. 입력 내용은 유지됩니다. 연결과 접근 권한을 확인한 뒤 다시 시도해주세요.');
            setRetryAction(operation);
          }
        } finally {
          if (isCurrentAccount(ownerToken) && mutationRef.current === operation) {
            activeWritesRef.current--; mutationRef.current = null; setPendingRecordAction(null); setIsUpdating(false);
          }
        }
      };

      const resetApp = () => {
        if (savingRef.current || authLockRef.current) return;
        cancelDraft(); cancelEdit(); setSelectedPlant(null);
      };

      // 💡 누락되었던 모달 배경 클릭 감지 함수 복구
      const handleModalBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
          setShowImageSourceModal(false);
        }
      };

      return (
        <div className="min-h-screen bg-[#F4F8F5] text-slate-800 font-sans selection:bg-emerald-200 pb-28">
          
          {isInAppBrowser && (
            <div className="bg-amber-100 text-amber-800 px-4 py-2.5 text-xs font-bold text-center leading-relaxed border-b border-amber-200 animate-in slide-in-from-top-2 z-50 relative">
              💡 카카오톡 등에서는 카메라가 원활하지 않을 수 있습니다.<br/>메뉴(⋮)에서 <span className="text-amber-900 underline">다른 브라우저로 열기</span>를 선택해주세요!
            </div>
          )}

          <div ref={pageShellRef} inert={showLoginModal||showImageSourceModal||selectedPlant||deleteTarget?'':undefined} aria-hidden={showLoginModal||showImageSourceModal||selectedPlant||deleteTarget?true:undefined}>
          <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
          <h1 className="sr-only">방장산 식물 도감</h1>
          <header className="bg-white/80 backdrop-blur-md shadow-sm px-5 py-3 sticky top-0 z-40 border-b border-slate-100">
            <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center">
                <OptionalImage src="국립장성숲체원-_국문좌우_이미지형 (1).png" alt="국립장성숲체원" className="h-10 object-contain drop-shadow-sm" />
              </div>
              
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    {user.email?.split('@')[0]}님
                  </span>
                  <button onClick={handleLogout} disabled={isAuthBusy || isAuthInitializing} className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full font-semibold transition-colors border border-slate-200 shadow-sm">
                    <Icon className="ph ph-sign-out text-sm"/> 로그아웃
                  </button>
                </div>
              ) : (
                <button disabled={isAuthBusy || isAuthInitializing || isSaving || isUpdating} onClick={() => { setShowLoginModal(true); setAuthError(''); }} className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full font-semibold transition-all shadow-md shadow-emerald-600/20">
                  <Icon className="ph ph-sign-in text-sm"/> {isAuthInitializing ? '계정 준비 중' : isAuthBusy ? '계정 처리 중' : '로그인 / 가입'}
                </button>
              )}
            </div>
          </header>

          <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-5 pt-4 space-y-2">
            {user?.isAnonymous && (
              <p className="text-xs leading-relaxed text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                체험 중에도 저장할 수 있어요. 가입하면 현재 도감이 그대로 연결됩니다.<br/>
                다른 기기에서도 보관하려면 가입해주세요. 가입 전 브라우저 데이터를 지우면 체험 도감에 다시 접근하지 못할 수 있습니다.
              </p>
            )}
            {isOffline && <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">인터넷 연결이 끊겼습니다. 사진과 메모는 작성할 수 있으며, 저장·수정·삭제는 연결 후 진행해주세요.</p>}
            {authNotice && <div role="status" className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3"><p className="flex-1">{authNotice}</p><button aria-label="완료 안내 닫기" onClick={() => setAuthNotice('')}>닫기</button></div>}
            {error && <div role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p>{error}</p>
              <div className="flex gap-4">
                {retryAction && retryAction.uid === user?.uid && <button disabled={isSaving || isUpdating || !!pendingRecordAction || isAuthBusy || isOffline} onClick={retryFailedAction} className="underline font-bold">{retryAction.kind === 'save' ? '저장 다시 시도' : retryAction.kind === 'delete' ? '삭제 다시 시도' : '수정 다시 시도'}</button>}
                <button aria-label="오류 안내 닫기" onClick={clearCommonError} className="underline">닫기</button>
              </div>
            </div>}
            {writeWaitMessage && <p role="status" className="text-sm text-slate-700 bg-slate-100 rounded-xl p-3">{writeWaitMessage}</p>}
            {dictionaryState.ownerUid === user?.uid && dictionaryState.issue && <div role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p>{dictionaryState.issue}</p>
              <button disabled={isAuthBusy || isAuthInitializing || isOffline} onClick={reloadDictionary} className="underline font-bold">도감 다시 불러오기</button>
            </div>}
            {authSystemError && (
              <div role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p>{authSystemError}</p>
                {!user && <button onClick={retryGuestSession} disabled={isAuthInitializing} className="underline font-bold mt-2">체험 계정 연결 다시 시도</button>}
              </div>
            )}
          </div>
          <main id="main-content" tabIndex={-1} className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto p-5 mt-2">
            {currentTab === 'camera' && (
              <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-500">
                {!selectedImage && !isProcessing && (
                  <div className="text-center space-y-4 py-6 relative">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-emerald-300 blur-3xl opacity-20 rounded-full transform scale-150"></div>
                      <OptionalImage src="01.관찰포이_봄.png" alt="관찰포이" className="w-40 h-40 mx-auto relative z-10 drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">식물을 발견했나요?</h2>
                      <p className="text-slate-600 mt-1.5 text-sm font-medium">사진을 찍고 이름을 기록해보세요!</p>
                    </div>
                  </div>
                )}

                <div className="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  {!selectedImage && !isProcessing ? (
                    <button type="button" aria-label="카메라 켜기 / 앨범 선택" onClick={() => setShowImageSourceModal(true)} className="w-full border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-[1.5rem] h-80 flex flex-col items-center justify-center gap-5 cursor-pointer hover:bg-emerald-50 active:scale-[0.98] transition-all group">
                      <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Icon className="ph ph-camera text-3xl"/>
                      </span>
                      <span className="text-center">
                        <span className="block text-lg font-bold text-emerald-900 mb-1">카메라 켜기 / 앨범 선택</span>
                        <span className="text-sm text-emerald-800 font-medium">여기를 가볍게 터치하세요</span>
                      </span>
                    </button>
                  ) : (
                    <div className="relative rounded-[1.5rem] overflow-hidden shadow-inner">
                      {isProcessing ? (
                        <div role="status" aria-live="polite" className="h-80 flex flex-col items-center justify-center gap-3 bg-emerald-50 text-emerald-800">
                          <Icon className="ph ph-spinner animate-spin text-3xl"/>
                          <p className="font-bold">사진을 최적화하고 있습니다…</p>
                        </div>
                      ) : <img src={selectedImage} alt="기록할 식물 사진" className="w-full h-80 object-cover" />}
                      <button disabled={isSaving || isAuthBusy} onClick={() => setShowImageSourceModal(true)} className="absolute bottom-4 right-4 bg-white/95 text-slate-800 font-bold text-xs rounded-full px-4 py-2 shadow-sm">사진 바꾸기</button>
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        {isLocating ? (
                          <><Icon className="ph ph-spinner animate-spin text-white"/><span className="text-white text-xs font-bold">위치 찾는 중...</span></>
                        ) : location ? (
                          <><Icon className="ph ph-map-pin text-emerald-400"/><span className="text-white text-xs font-bold">현재 위치 기록 완료</span></>
                        ) : (
                          <><Icon className="ph ph-map-pin-line text-slate-600"/><span className="text-slate-300 text-xs font-bold">위치 정보 없음</span></>
                        )}
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageChange(e, 'camera')} disabled={isSaving || isAuthBusy} ref={cameraInputRef} className="hidden" />
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'album')} disabled={isSaving || isAuthBusy} ref={albumInputRef} className="hidden" />
                </div>

                {selectedImage && (
                  <div className="animate-in slide-in-from-bottom-4 space-y-6">
                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-3">
                      <p className="text-sm font-bold text-slate-800">위치 기록 (선택)</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {photoSource === 'album' ? '앨범 사진의 촬영 위치는 자동으로 알 수 없습니다. 아래 버튼은 지금 있는 위치를 기록합니다.' : '카메라 선택 시 현재 위치를 확인합니다. 실제 촬영 위치와 다르면 위치 없이 저장해주세요.'}
                      </p>
                      {locationStatus === 'pending' && <p role="status" className="text-xs text-emerald-700">현재 위치를 확인하고 있습니다…</p>}
                      {locationStatus === 'ready' && <p role="status" className="text-xs text-emerald-700">현재 위치를 기록했습니다.</p>}
                      {locationStatus === 'omitted' && <p role="status" className="text-xs text-slate-600">위치 없이 저장합니다.</p>}
                      {locationError && <p role="alert" className="text-xs text-amber-800 leading-relaxed">{locationError}</p>}
                      <div className="flex gap-2">
                        <button disabled={isSaving || isAuthBusy || saveSuccess || saveAttempted} onClick={() => fetchLocation()} className="flex-1 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-xl p-3">{locationStatus === 'error' || locationStatus === 'ready' || locationStatus === 'pending' ? '현재 위치 다시 확인' : '현재 위치 기록'}</button>
                        <button disabled={isSaving || isAuthBusy || saveSuccess || saveAttempted} onClick={omitLocation} className="flex-1 text-xs font-bold bg-slate-50 text-slate-700 rounded-xl p-3">위치 없이 저장</button>
                      </div>
                    </div>
                    <section aria-labelledby="identify-title" className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3 shadow-inner">
                      <h3 id="identify-title" className="flex items-center gap-2 text-slate-800 font-black text-lg"><Icon className="ph ph-scan text-2xl"/>사진으로 식물 찾기</h3>
                      <p className="text-sm text-slate-700">버튼을 누르면 변환한 사진 한 장을 Pl@ntNet에 전송합니다. 위치와 메모는 보내지 않습니다. 식별 후보를 확인한 뒤 선택하거나 이름을 직접 적어주세요.</p>
                      <label htmlFor="plant-organ" className="text-sm font-bold block">사진에 보이는 부분</label>
                      <select id="plant-organ" value={organ} disabled={isSaving||saveAttempted||identifyState.phase==='pending'} onChange={e=>{setOrgan(e.target.value);resetIdentification();}} className="w-full border rounded-xl p-3 bg-white">
                        <option value="auto">자동 판별</option><option value="leaf">잎</option><option value="flower">꽃</option><option value="fruit">열매</option><option value="bark">나무껍질</option>
                      </select>
                      {!window.identificationAvailable&&<p role="status" className="text-sm text-amber-800">사진 식별 서비스를 준비 중입니다. 아래에 이름을 직접 기록할 수 있습니다.</p>}
                      <div className="flex gap-2">
                        <button onClick={()=>identifyPhoto(identifyState.phase==='ready'||identifyState.phase==='empty')} disabled={!window.identificationAvailable||isOffline||isSaving||isAuthBusy||isAuthInitializing||saveAttempted||identifyState.phase==='pending'} className="flex-1 p-3 bg-emerald-700 text-white font-bold rounded-xl">{identifyState.phase==='pending'?'식별 중…':identifyState.phase==='error'?'결과 다시 확인':'사진으로 식물 찾기'}</button>
                        {identifyState.phase==='pending'&&<button onClick={()=>{identifyRef.current.cancel(false);setIdentifyState({phase:'idle',candidates:[],issue:null});}} className="p-3 bg-white border rounded-xl">식별 취소</button>}
                        {identifyState.phase==='error'&&<button disabled={isSaving||saveAttempted||isOffline} onClick={()=>identifyPhoto(true)} className="p-3 bg-white border rounded-xl">새로 식별</button>}
                      </div>
                      {identifyState.phase==='pending'&&<p role="status">사진에서 식물 후보를 찾고 있습니다…</p>}
                      {identifyState.issue&&<p role="alert" className="text-sm text-amber-800">{identifyState.issue}</p>}
                      {identifyState.phase==='empty'&&<p role="status">식물 후보를 찾지 못했습니다. 잎이나 꽃이 선명한 사진으로 다시 시도하거나 이름을 직접 기록해주세요.</p>}
                      {identifyState.phase==='ready'&&<div aria-live="polite" className="space-y-2">
                        <p className="text-sm">식별 점수는 정답을 보장하지 않습니다. 학명과 일반명을 확인해주세요. 일반명은 영문으로 표시될 수 있습니다.</p>
                        {identifyState.candidates[0]?.score<0.15&&<p className="text-sm text-amber-800">가장 높은 후보도 점수가 낮습니다. 다른 각도로 다시 촬영해 확인해주세요.</p>}
                        <ul className="space-y-2">{identifyState.candidates.map(candidate=><li key={candidate.scientificName} className="bg-white border rounded-xl p-3">
                          <p className="font-bold">{candidate.scientificName}</p>{candidate.commonName&&<p className="text-sm text-slate-700">일반명: {candidate.commonName}</p>}
                          <p className="text-sm">식별 점수 {Math.round(candidate.score*100)}%</p>
                          <button disabled={isSaving||saveAttempted} aria-pressed={chosenIdentification?.scientificName===candidate.scientificName} onClick={()=>selectCandidate(candidate)} className="mt-2 border border-emerald-700 text-emerald-900 font-bold rounded-xl px-3 py-2">{candidate.scientificName} 선택</button>
                        </li>)}</ul>
                      </div>}
                      {chosenIdentification&&<p role="status" className="text-sm text-emerald-800">선택한 후보: {chosenIdentification.scientificName}. 이름을 바꾸면 후보 선택 정보는 해제됩니다.</p>}
                      <a href="https://my.plantnet.org/" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-emerald-800 underline">식별 제공: Pl@ntNet (새 창)</a>
                    </section>

                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-200 space-y-4 relative">
                      <div className="inline-block px-3.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full mb-1 tracking-wide">
                        기록하기 ✍️
                      </div>
                      {saveAttempted && !saveSuccess && <p role="status" className="text-sm text-amber-800">처음 입력한 내용으로 저장을 확인합니다. 재시도해도 같은 기록을 사용합니다. 새 기록을 작성하려면 [다시]를 누르세요.</p>}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="plant-name" className="text-xs font-bold text-slate-600 pl-1 block mb-1">식물 이름 (필수)</label>
                          <input id="plant-name" maxLength={200} required type="text" placeholder="찾아낸 식물 이름을 적어주세요" value={plantName} disabled={isSaving || saveAttempted} onChange={(e) => { setPlantName(e.target.value);setChosenIdentification(null); clearCommonError(); }} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                        </div>
                        <div>
                          <label htmlFor="plant-desc" className="text-xs font-bold text-slate-600 pl-1 block mb-1">특징 메모 (선택)</label>
                          <textarea id="plant-desc" maxLength={10000} placeholder="이 식물의 특징이나 느낀 점을 적어보세요" value={plantDesc} disabled={isSaving || saveAttempted} onChange={(e) => setPlantDesc(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none h-24" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={resetApp} disabled={isSaving || isAuthBusy} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all">
                        <Icon className="ph ph-arrows-clockwise text-xl"/> 다시
                      </button>
                      {saveSuccess ? (
                        <button disabled className="flex-[2] py-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                          <Icon className="ph ph-check-circle text-xl"/> 저장 완료!
                        </button>
                      ) : (
                        <button onClick={saveToDictionary} disabled={isSaving || isAuthBusy || isAuthInitializing || isProcessing || isLocating || isOffline || !compressedImageUrl || !plantName.trim()} className="flex-[2] py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 active:bg-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                          {isSaving ? <Icon className="ph ph-spinner animate-spin text-xl"/> : <Icon className="ph ph-floppy-disk text-xl"/>}
                          내 도감에 저장
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentTab === 'dictionary' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
                    <Icon className="ph ph-book-open text-3xl text-emerald-700"/> 나의 식물 기록
                  </h2>
                  <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold shadow-sm">
                    {['ready', 'cached'].includes(dictionaryPhase) ? `총 ${plants.length}개` : '확인 중'}
                  </span>
                </div>

                {dictionaryPhase === 'loading' || dictionaryPhase === 'idle' ? (
                  <div role="status" className="text-center py-20 bg-white rounded-[2rem] border border-emerald-200 text-emerald-800">
                    <Icon className="ph ph-spinner animate-spin text-3xl"/>
                    <p className="font-bold mt-4">{isAuthInitializing ? '계정을 준비하고 있습니다…' : !user ? '체험 계정을 연결한 뒤 도감을 확인할 수 있습니다.' : '도감을 불러오는 중입니다…'}</p>
                  </div>
                ) : dictionaryPhase === 'error' ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-amber-200">
                    <p className="font-bold text-slate-800">도감을 표시할 수 없습니다.</p>
                    <p className="text-sm text-slate-600 mt-2">위의 안내를 확인한 뒤 다시 불러와주세요.</p>
                  </div>
                ) : plants.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-emerald-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-50/30"></div>
                    <OptionalImage src="01.관찰포이_봄.png" alt="관찰하는 포이" className="w-32 h-32 mx-auto relative z-10 drop-shadow-md opacity-80 mb-4" />
                    <p className="text-slate-700 font-bold text-lg relative z-10">아직 수집한 식물이 없어요.</p>
                    <p className="text-slate-600 text-sm mt-1.5 font-medium relative z-10">카메라로 식물을 찍고 도감을 채워보세요!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {plants.map((plant) => (
                      <div key={plant.id} aria-busy={pendingRecordAction?.id === plant.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group transition-all h-48 md:h-64 relative">
                        {editingPlantId === plant.id ? (
                          // 카드 내부에서 수정 폼 렌더링
                          <div className="p-4 flex flex-col h-full bg-emerald-50/50 absolute inset-0 z-10 animate-in fade-in">
                            <input aria-label={`${plant.name} 이름 수정`} maxLength={200} type="text" disabled={isUpdating} value={editName} onChange={(e) => { setEditName(e.target.value); clearCommonError(); }} className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-bold text-slate-800 outline-none focus:border-emerald-500 mb-2 text-sm" placeholder="식물 이름"/>
                            <textarea aria-label={`${plant.name} 메모 수정`} maxLength={10000} disabled={isUpdating} value={editDesc} onChange={(e) => { setEditDesc(e.target.value); clearCommonError(); }} className="w-full flex-1 px-3 py-2 rounded-xl border border-emerald-200 bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none text-xs" placeholder="특징 메모"/>
                            <div className="flex gap-2 mt-2">
                              <button disabled={isUpdating} onClick={cancelEdit} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs">취소</button>
                              <button onClick={() => saveEditPlant(plant.id)} disabled={isUpdating || isAuthBusy || !!pendingRecordAction || dictionaryPhase !== 'ready' || isOffline || !editName.trim()} className="flex-1 py-2 bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 text-xs">{isUpdating ? '저장중' : '저장'}</button>
                            </div>
                          </div>
                        ) : (
                          // 일반 도감 카드 상태 (클릭 시 확대 모달 열림)
                          <div className="relative h-full w-full overflow-hidden">
                            <button aria-label={`${plant.name} 자세히 보기`} onClick={()=>setSelectedPlant(plant)} className="absolute inset-0 z-[1] w-full h-full"/>
                            <PlantImage key={`${user.uid}:${plant.id}`} plant={plant} ownerUid={user.uid} className="w-full h-full object-cover bg-slate-100 group-hover:scale-105 transition-transform duration-500" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 text-white">
                              <h4 className="font-extrabold text-lg flex items-center justify-between truncate pr-2">
                                {plant.name}
                              </h4>
                              <p className="text-[11px] md:text-xs font-medium text-white/80 mt-1 flex items-center gap-1.5 truncate">
                                <Icon className="ph ph-calendar-blank"/> {new Date(plant.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            {pendingRecordAction?.id === plant.id && <p role="status" className="absolute top-14 right-3 text-xs bg-black/60 text-white rounded-full px-3 py-1">{pendingRecordAction.kind === 'delete' ? '삭제 중…' : '수정 중…'}</p>}
                            {/* 우측 상단 수정/삭제 버튼 */}
                            <div className="absolute top-3 right-3 flex gap-2">
                              <button aria-label={`${plant.name} 수정`} disabled={isAuthBusy || !!pendingRecordAction || dictionaryPhase !== 'ready' || isOffline} onClick={(e) => startEditPlant(plant, e)} className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-emerald-500 transition-colors shadow-sm z-10">
                                <Icon className="ph ph-pencil-simple text-sm"/>
                              </button>
                              <button aria-label={`${plant.name} 삭제`} disabled={isAuthBusy || !!pendingRecordAction || dictionaryPhase !== 'ready' || isOffline} onClick={(e) => { e.stopPropagation();setDeleteTarget(plant); }} className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors shadow-sm z-10">
                                <Icon className="ph ph-trash text-sm"/>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* 하단 네비게이션 바 */}
          <nav aria-label="주요 메뉴" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe z-30">
            <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto flex">
              <button disabled={isSaving || isAuthBusy} aria-current={currentTab==='camera'?'page':undefined} onClick={() => setCurrentTab('camera')} className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-colors relative ${currentTab === 'camera' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-600'}`}>
                {currentTab === 'camera' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-b-full"></div>}
                <i className={`ph ph-camera text-2xl ${currentTab === 'camera' ? 'fill-emerald-50' : ''}`}></i>
                <span className="text-[11px] font-bold tracking-wide">사진 찍기</span>
              </button>
              <button disabled={isSaving || isAuthBusy} aria-current={currentTab==='dictionary'?'page':undefined} onClick={() => { setCurrentTab('dictionary'); resetApp(); }} className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-colors relative ${currentTab === 'dictionary' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-600'}`}>
                {currentTab === 'dictionary' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-b-full"></div>}
                <i className={`ph ph-book-open text-2xl ${currentTab === 'dictionary' ? 'fill-emerald-50' : ''}`}></i>
                <span className="text-[11px] font-bold tracking-wide">내 도감</span>
              </button>
            </div>
          </nav>

          </div>

          {/* 🌟 1. 사진 선택 방식 모달 */}
          {showImageSourceModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={handleModalBackgroundClick}>
              <Dialog label="사진 가져오기" onClose={()=>setShowImageSourceModal(false)} busy={isSaving||isAuthBusy} className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] max-h-[90dvh] overflow-y-auto w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 pb-safe">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-black text-slate-800">사진 가져오기</h3>
                  <p className="text-sm text-slate-600 font-medium mt-1">어떤 방법으로 식물 사진을 올릴까요?</p>
                </div>
                <button disabled={isSaving || isAuthBusy} onClick={() => { cameraInputRef.current?.click(); setShowImageSourceModal(false); }} className="w-full py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-100 border border-emerald-100">
                  <Icon className="ph ph-camera text-2xl"/> 카메라로 직접 찍기
                </button>
                <button disabled={isSaving || isAuthBusy} onClick={() => { albumInputRef.current?.click(); setShowImageSourceModal(false); }} className="w-full py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 border border-slate-200">
                  <Icon className="ph ph-images text-2xl"/> 휴대폰 앨범에서 선택
                </button>
                <button onClick={() => setShowImageSourceModal(false)} className="w-full py-4 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 mt-2">취소</button>
              </Dialog>
            </div>
          )}

          {deleteTarget&&<div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5">
            <Dialog label="식물 기록 삭제 확인" onClose={()=>setDeleteTarget(null)} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4">
              <h2 className="font-bold text-xl">기록을 삭제할까요?</h2><p>{deleteTarget.name} 기록과 사진이 삭제됩니다.</p>
              <div className="flex gap-3"><button onClick={()=>setDeleteTarget(null)} className="flex-1 border rounded-xl p-3">취소</button><button onClick={()=>{const id=deleteTarget.id;setDeleteTarget(null);deletePlant(id);}} className="flex-1 rounded-xl p-3 bg-red-700 text-white font-bold">기록 삭제</button></div>
            </Dialog>
          </div>}

          {/* 🌟 2. 로그인 모달 */}
          {showLoginModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-5">
              <Dialog label="도감 시작하기" onClose={closeAuthModal} busy={isAuthBusy} onKeyDown={e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();handleLogin();}}} className="bg-white rounded-[2.5rem] max-h-[90dvh] overflow-y-auto w-full max-w-sm p-7 space-y-6 shadow-2xl animate-in zoom-in-95">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Icon className="ph ph-leaf text-3xl"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">도감 시작하기</h3>
                  <p className="text-sm text-slate-600 mt-2 font-medium break-keep">가입하면 현재 체험 도감이 그대로 연결됩니다. 기존 계정으로 로그인하면 체험 기록을 먼저 복사한 뒤 로그인합니다.</p>
                </div>
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="login-id" className="text-xs font-bold text-slate-600 pl-1">아이디</label>
                    <input id="login-id" maxLength={64} type="text" autoComplete="username" disabled={isAuthBusy || isAuthInitializing} placeholder="영문·숫자·점·밑줄·하이픈" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="text-xs font-bold text-slate-600 pl-1">비밀번호</label>
                    <input id="login-password" type="password" autoComplete="current-password" disabled={isAuthBusy || isAuthInitializing} placeholder="6자리 이상 입력" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-emerald-500" />
                  </div>
                  {authError && <p role="alert" className="text-red-500 text-xs px-2 font-bold leading-relaxed">{authError}</p>}
                  {authProgress && <p role="status" aria-live="polite" className="text-emerald-700 text-xs px-2 font-bold">{authProgress}</p>}
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex gap-2.5">
                    <button onClick={handleSignUp} disabled={isAuthBusy || isAuthInitializing} className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 font-black rounded-2xl hover:bg-emerald-100">새로 가입</button>
                    <button onClick={handleLogin} disabled={isAuthBusy || isAuthInitializing} className="flex-1 py-3.5 bg-emerald-700 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-lg">기존 계정 로그인</button>
                  </div>
                  <button onClick={closeAuthModal} disabled={isAuthBusy} className="w-full py-3.5 bg-white text-slate-600 font-bold rounded-2xl hover:bg-slate-50">닫기</button>
                </div>
              </Dialog>
            </div>
          )}

          {/* 🌟 3. 식물 자세히 보기 프리젠테이션 모달 (핵심 추가 영역) */}
          {selectedPlant && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 lg:p-10" onClick={() => setSelectedPlant(null)}>
              <Dialog label="식물 기록 자세히 보기" onClose={()=>setSelectedPlant(null)} busy={false} 
                className="bg-white rounded-[2rem] w-full max-w-lg md:max-w-4xl lg:max-w-5xl h-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200"
                
              >
                {/* 왼쪽 (모바일은 위쪽): 크게 확대된 사진 */}
                <div className="w-full md:w-1/2 h-[40%] md:h-full bg-black relative flex items-center justify-center flex-shrink-0">
                  <PlantImage key={`${user.uid}:${selectedPlant.id}`} plant={selectedPlant} ownerUid={user.uid} 
                    className="w-full h-full object-contain" 
                  />
                  {/* 모바일 환경용 닫기 버튼 */}
                  <button aria-label="상세 보기 닫기" onClick={() => setSelectedPlant(null)} className="absolute top-4 right-4 md:hidden w-10 h-10 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="ph ph-x text-xl"/>
                  </button>
                </div>

                {/* 오른쪽 (모바일은 아래쪽): 상세 설명 및 지도 */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white overflow-y-auto hide-scrollbar">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full mb-3">
                        나의 도감 기록
                      </div>
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 break-keep leading-tight">
                        {selectedPlant.name}
                      </h3>
                      <p className="text-sm font-semibold text-slate-600 mt-3 flex items-center gap-1.5">
                        <Icon className="ph ph-calendar-blank text-emerald-700 text-lg"/> {new Date(selectedPlant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* PC 환경용 닫기 버튼 */}
                    <button aria-label="상세 보기 닫기" onClick={() => setSelectedPlant(null)} className="hidden md:flex w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full items-center justify-center transition-colors">
                      <Icon className="ph ph-x text-2xl"/>
                    </button>
                  </div>

                  <div className="text-slate-700 font-medium text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-8 flex-1">
                    {selectedPlant.description}
                  </div>

                  {/* 지도 영역 (프리젠테이션 모드에 맞게 큼직하게 배치) */}
                  {selectedPlant.identification&&<p className="text-sm text-slate-700">사진에서 선택한 후보: {selectedPlant.identification.scientificName} · Pl@ntNet 식별 점수 {Math.round(selectedPlant.identification.score*100)}%</p>}
                  {selectedPlant.location && (
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-800 font-bold mb-3">
                        <Icon className="ph ph-map-pin-fill text-emerald-500 text-xl"/> 기록한 현재 위치
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 h-48 md:h-64 relative shadow-sm">
                        {!mapVisible?<button onClick={()=>setMapVisible(true)} className="w-full h-full min-h-32 p-4 text-emerald-900 font-bold bg-emerald-50">Google 지도 보기 (기록한 좌표 전송)</button>:<iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          title={`${selectedPlant.name} 기록 위치 지도`} loading="lazy" referrerPolicy="no-referrer" src={`https://maps.google.com/maps?q=${selectedPlant.location.lat},${selectedPlant.location.lng}&z=16&output=embed`}
                          allowFullScreen
                        ></iframe>}
                        <div className="absolute inset-0 bg-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog>
            </div>
          )}
        </div>
      );
    }

