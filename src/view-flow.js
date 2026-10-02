(function (global) {
  function createAccountScope() {
    let uid = null;
    let revision = 0;
    function change(nextUid) {
      if (uid !== nextUid) { uid = nextUid; revision++; }
    }
    function capture() {
      const ownerUid = uid;
      const epoch = revision;
      return { ownerUid, isCurrent: () => ownerUid === uid && epoch === revision };
    }
    return { change, capture };
  }

  function dictionaryError(err) {
    if (err?.code === 'permission-denied') return '도감을 읽을 권한이 없습니다. 로그인 상태와 Firestore 접근 규칙을 확인해주세요.';
    if (err?.code === 'unauthenticated') return '인증이 만료되었거나 확인되지 않았습니다. 로그인 상태를 확인해주세요.';
    return '도감을 불러오지 못했습니다. 연결을 확인하고 다시 시도해주세요.';
  }

  function createDictionaryController({ sdk, db, appId, isOwnerCurrent, publish, timeoutMs = 12000 }) {
    let revision = 0;
    let unsubscribe = null;
    let timer = null;
    function stop() {
      revision++;
      clearTimeout(timer);
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    }
    function subscribe(ownerUid) {
      stop();
      const version = revision;
      let items = [];
      let gotServer = false;
      const current = () => version === revision && isOwnerCurrent(ownerUid);
      const send = state => { if (current()) publish({ ownerUid, items, ...state }); };
      send({ phase: 'loading', fromCache: false, issue: null });
      timer = setTimeout(() => {
        if (gotServer || !current()) return;
        send({ phase: items.length ? 'cached' : 'error', fromCache: true,
          issue: '서버 응답이 지연되고 있습니다. 연결을 확인하고 도감을 다시 불러와주세요.' });
      }, timeoutMs);
      try {
        unsubscribe = sdk.onSnapshot(sdk.collection(db, 'artifacts', appId, 'users', ownerUid, 'plants'),
          { includeMetadataChanges: true }, snapshot => {
            if (!current()) return;
            items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            items.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
            const fromCache = snapshot.metadata?.fromCache === true;
            if (!fromCache) { gotServer = true; clearTimeout(timer); }
            // An empty cache does not prove that the server collection is empty.
            send({ phase: fromCache ? (items.length ? 'cached' : 'loading') : 'ready', fromCache,
              issue: fromCache ? (items.length ? '기기에 남아 있는 기록을 표시하고 있습니다. 서버 연결이 확인되면 편집할 수 있습니다.' : null) : null });
          }, err => {
            if (!current()) return;
            clearTimeout(timer);
            items = []; // Hide even previously visible data on terminal permission errors.
            send({ phase: 'error', fromCache: false, issue: dictionaryError(err) });
          });
      } catch (err) {
        clearTimeout(timer);
        items = [];
        send({ phase: 'error', fromCache: false, issue: dictionaryError(err) });
      }
      return stop;
    }
    return { subscribe, stop };
  }

  global.plantViewFlow = { createAccountScope, createDictionaryController, dictionaryError };
})(typeof window !== 'undefined' ? window : globalThis);
