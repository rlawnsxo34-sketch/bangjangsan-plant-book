(function (global) {
  const MAX_BYTES = 2 * 1024 * 1024;
  const fail = (code, message) => Object.assign(new Error(message), { code });
  function imagePath(uid, id, appId = 'plant-book-84803') {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid || '') || !/^[A-Za-z0-9_-]{1,240}$/.test(id || '')) {
      throw fail('app/invalid-image-path', '사진 저장 경로가 올바르지 않습니다.');
    }
    return `artifacts/${appId}/users/${uid}/plants/${id}/photo.jpg`;
  }
  function assertImage(record, uid, id, appId) {
    if (record.schemaVersion !== 2 || record.imagePath !== imagePath(uid, id, appId)
      || record.imageType !== 'image/jpeg' || !Number.isInteger(record.imageBytes)
      || record.imageBytes < 1 || record.imageBytes > MAX_BYTES) {
      throw fail('app/invalid-image-path', '사진 기록 형식 또는 소유 경로를 확인해주세요.');
    }
  }
  function jpegBytes(dataUrl) {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl || '')) throw fail('app/invalid-photo', '변환된 JPG 사진이 필요합니다.');
    const binary = global.atob(dataUrl.split(',')[1]);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    if (!bytes.length || bytes.length > MAX_BYTES) throw fail('app/invalid-photo', '변환된 사진은 2MB 이하여야 합니다.');
    return bytes;
  }
  function describeError(error) {
    const code = error?.code;
    if (code === 'storage/unauthorized' || code === 'permission-denied') return '사진 또는 도감 접근 권한을 확인해주세요. Storage와 Firestore 규칙 적용이 필요합니다.';
    if (code === 'storage/object-not-found') return '사진 파일을 찾지 못했습니다. 연결 또는 삭제 상태를 확인해주세요.';
    if (code === 'storage/bucket-not-found' || code === 'storage/project-not-found' || code === 'storage/quota-exceeded') return 'Firebase Storage 버킷·Blaze 요금제·사용량 설정을 확인해주세요.';
    if (code?.startsWith('app/')) return error.message;
    return '사진 저장소에 연결하지 못했습니다. 연결·Storage 설정·CORS 설정을 확인해주세요.';
  }
  function createStorageFlow({ sdk, db, storage, appId, isCurrent }) {
    const at = (uid, id) => sdk.doc(db, 'artifacts', appId, 'users', uid, 'plants', id);
    function prepareSave(uid, dataUrl, fields) {
      const ref = sdk.doc(sdk.collection(db, 'artifacts', appId, 'users', uid, 'plants'));
      const bytes = jpegBytes(dataUrl);
      const path = imagePath(uid, ref.id, appId);
      return { uid, ref, bytes, uploaded: false, record: { ...fields, schemaVersion: 2,
        imagePath: path, imageType: 'image/jpeg', imageBytes: bytes.length } };
    }
    async function save(request, token) {
      const assertCurrent = () => { if (!isCurrent(token)) throw fail('app/account-changed', '계정이 변경되었습니다.'); };
      assertCurrent();
      if (request.uploaded) {
        const metadata = await sdk.getMetadata(sdk.storageRef(storage, request.record.imagePath));
        assertCurrent();
        if (metadata.generation !== request.record.imageGeneration) throw fail('app/image-conflict', '사진 파일이 변경되었습니다. 기존 기록 상태를 확인해주세요.');
      }
      if (!request.uploaded) {
        const uploaded = await sdk.uploadBytes(sdk.storageRef(storage, request.record.imagePath), request.bytes,
          { contentType: 'image/jpeg', cacheControl: 'private,max-age=3600' });
        request.record.imageGeneration = uploaded.metadata.generation;
        request.uploaded = true;
      }
      assertCurrent();
      // Retain the file on an uncertain commit. Retry uses the SAME document ID.
      await sdk.runTransaction(db, async transaction => {
        assertCurrent();
        const existing = await transaction.get(request.ref);
        if (existing.exists()) {
          if (existing.data().imagePath !== request.record.imagePath) throw fail('app/image-conflict', '저장된 기록의 사진 경로가 다릅니다.');
          return;
        }
        transaction.set(request.ref, request.record);
      });
      return request.ref.id;
    }
    async function remove(uid, record, token) {
      if (!isCurrent(token)) throw fail('app/account-changed', '계정이 변경되었습니다.');
      if (record.imagePath) assertImage(record, uid, record.id, appId);
      await sdk.deleteDoc(at(uid, record.id));
      // Storage SDK deleteObject has no generation precondition. Let the server
      // delete only the generation from this record, even after logout or retry.
      return { cleanupPending: Boolean(record.imagePath) };
    }
    async function copyImage(record, { sourceUid, sourceId, destinationUid, destinationId, destinationApp, assertCurrent }) {
      if (!record.imagePath) return record; // Keep old Base64 records intact.
      assertImage(record, sourceUid, sourceId, appId);
      assertCurrent();
      const bytes = await sdk.getBytes(sdk.storageRef(storage, record.imagePath), MAX_BYTES);
      assertCurrent();
      if (bytes.byteLength !== record.imageBytes) throw fail('app/invalid-photo', '원본 사진 크기를 확인하지 못했습니다. 체험 기록은 유지됩니다.');
      const path = imagePath(destinationUid, destinationId, appId);
      const uploaded = await sdk.uploadBytes(sdk.storageRef(sdk.getStorage(destinationApp), path), bytes,
        { contentType: 'image/jpeg', cacheControl: 'private,max-age=3600' });
      assertCurrent();
      return { ...record, imagePath: path, imageBytes: bytes.byteLength, imageGeneration: uploaded.metadata.generation };
    }
    return { prepareSave, save, remove, copyImage };
  }
  global.plantStorageFlow = { createStorageFlow, imagePath, assertImage, jpegBytes, describeError, MAX_BYTES };
})(typeof window !== 'undefined' ? window : globalThis);
