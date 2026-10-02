/* Version 1: dependencies are injected so account preservation can be tested offline. */
(function (global) {
  function authFlowError(code, message) {
    return Object.assign(new Error(message), { code });
  }

  function credentialsFor(id, password, strict = false) {
    const normalizedId = id.trim();
    if (!normalizedId || normalizedId.length > 64 || /[@\s]/.test(normalizedId)
      || (strict && !/^[A-Za-z0-9._-]{1,64}$/.test(normalizedId))) {
      throw authFlowError('app/invalid-id', '아이디는 영문·숫자·점·밑줄·하이픈으로 입력해주세요.');
    }
    if (password.length < 6) {
      throw authFlowError('app/invalid-password', '비밀번호는 6자리 이상 입력해주세요.');
    }
    return { email: `${normalizedId}@plant.local`, password };
  }

  function describeAuthError(err) {
    const messages = {
      'app/invalid-id': '아이디는 영문·숫자·점·밑줄·하이픈으로 입력해주세요.',
      'app/invalid-password': '비밀번호는 6자리 이상 입력해주세요.',
      'app/guest-not-ready': '체험 계정을 준비하고 있습니다. 잠시 후 다시 시도해주세요.',
      'app/account-changed': '다른 탭에서 계정이 변경되었습니다. 현재 계정을 확인하고 다시 시도해주세요.',
      'app/already-member': '이미 가입한 계정입니다. 로그아웃 후 다른 계정으로 로그인해주세요.',
      'auth/email-already-in-use': '이미 사용 중인 아이디입니다. 기존 계정 로그인으로 기록을 이어갈 수 있습니다.',
      'auth/credential-already-in-use': '이미 사용 중인 아이디입니다. 기존 계정 로그인 버튼을 이용해주세요.',
      'auth/invalid-credential': '아이디 또는 비밀번호가 맞지 않습니다.',
      'auth/invalid-login-credentials': '아이디 또는 비밀번호가 맞지 않습니다.',
      'auth/user-not-found': '아이디 또는 비밀번호가 맞지 않습니다.',
      'auth/wrong-password': '아이디 또는 비밀번호가 맞지 않습니다.',
      'auth/weak-password': '비밀번호가 보안 정책을 충족하지 않습니다. 더 길고 복잡하게 설정해주세요.',
      'auth/operation-not-allowed': 'Firebase에서 익명 인증과 이메일/비밀번호 인증을 활성화해주세요.',
      'auth/network-request-failed': '연결을 확인하고 다시 시도해주세요. 기존 체험 기록은 유지됩니다.',
      'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      'permission-denied': '기록 접근 권한이 없습니다. Firestore 규칙을 확인해주세요.',
      'unavailable': '기록 서버에 연결할 수 없습니다. 연결을 확인해주세요.'
    };
    if (err?.code?.startsWith('storage/') || err?.code === 'app/storage-copy-required' || err?.code === 'app/invalid-photo' || err?.code === 'app/invalid-image-path') return global.plantStorageFlow?.describeError(err) || err.message;
    return messages[err?.code] || '계정 처리에 실패했습니다. 연결과 Firebase 설정을 확인해주세요.';
  }

  function createPlantAuthFlow({ sdk, auth, db, config, appId, copyImage }) {
    const plantsAt = (database, uid) => sdk.collection(database, 'artifacts', appId, 'users', uid, 'plants');

    async function signUp(id, password) {
      const credentials = credentialsFor(id, password, true);
      const guest = auth.currentUser;
      if (!guest) throw authFlowError('app/guest-not-ready');
      if (!guest.isAnonymous) throw authFlowError('app/already-member');
      // Linking keeps the UID and all records at the existing Firestore path.
      const credential = sdk.EmailAuthProvider.credential(credentials.email, credentials.password);
      return sdk.linkWithCredential(guest, credential);
    }

    async function signInPreservingGuest(id, password, onProgress = () => {}) {
      const credentials = credentialsFor(id, password);
      const guest = auth.currentUser;
      if (!guest) throw authFlowError('app/guest-not-ready');
      if (!guest.isAnonymous) throw authFlowError('app/already-member');
      // A separate in-memory Auth session verifies the destination account.
      // The main session stays anonymous until every record has been copied.
      const temporaryApp = sdk.initializeApp(config, `plant-login-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const destinationAuth = sdk.initializeAuth(temporaryApp, { persistence: sdk.inMemoryPersistence });
      const destinationDb = sdk.getFirestore(temporaryApp);
      let copied = 0;
      let skipped = 0;
      const assertGuest = () => {
        if (auth.currentUser?.uid !== guest.uid || !auth.currentUser?.isAnonymous) {
          throw authFlowError('app/account-changed');
        }
      };
      try {
        onProgress('기존 계정을 확인하고 있습니다…');
        const destination = await sdk.signInWithEmailAndPassword(destinationAuth, credentials.email, credentials.password);
        assertGuest();
        // Never rely on the currently rendered list or an offline cached snapshot.
        const source = await sdk.getDocsFromServer(plantsAt(db, guest.uid));
        const total = source.docs.length;
        for (let index = 0; index < total; index++) {
          assertGuest();
          const record = source.docs[index];
          const destinationId = `guest_${guest.uid}_${record.id}`;
          const destinationRef = sdk.doc(destinationDb, 'artifacts', appId, 'users', destination.user.uid, 'plants', destinationId);
          onProgress(`체험 기록을 이어 붙이고 있습니다… ${index + 1}/${total}`);
          // Deterministic IDs and a transaction make partial retries safe.
          // Existing copies (including records edited in the member account) are never overwritten.
          // Check first so retry never overwrites a member's edited copy or its photo.
          const existingCopy = await sdk.runTransaction(destinationDb, transaction => transaction.get(destinationRef));
          if (existingCopy.exists()) { skipped++; continue; }
          const sourceData = record.data();
          if (sourceData.imagePath && !copyImage) throw authFlowError('app/storage-copy-required', '사진 파일 복사 설정이 필요합니다. 체험 기록은 유지됩니다.');
          const copiedData = copyImage ? await copyImage(sourceData, {
            sourceUid: guest.uid, sourceId: record.id, destinationUid: destination.user.uid,
            destinationId, destinationApp: temporaryApp, assertCurrent: assertGuest
          }) : sourceData;
          assertGuest();
          const created = await sdk.runTransaction(destinationDb, async transaction => {
            const existing = await transaction.get(destinationRef);
            if (existing.exists()) return false;
            transaction.set(destinationRef, copiedData);
            return true;
          });
          if (created) copied++; else skipped++;
        }
        assertGuest();
        onProgress('기록 보존을 확인했습니다. 로그인하고 있습니다…');
        const result = await sdk.signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        // The source documents are deliberately retained as a safety copy.
        return { user: result.user, copied, skipped, total };
      } catch (err) {
        if (auth.currentUser?.uid === guest.uid && auth.currentUser?.isAnonymous) {
          err.guestPreserved = true;
          err.copiedCount = copied;
        }
        throw err;
      } finally {
        // Cleanup failures must not hide a successful login or the original failure.
        try { await sdk.signOut(destinationAuth); } catch (_) {}
        try { await sdk.terminate(destinationDb); } catch (_) {}
        try { await sdk.deleteApp(temporaryApp); } catch (_) {}
      }
    }

    return { signUp, signInPreservingGuest, describeAuthError };
  }

  global.createPlantAuthFlow = createPlantAuthFlow;
  global.describePlantAuthError = describeAuthError;
})(typeof window !== 'undefined' ? window : globalThis);
