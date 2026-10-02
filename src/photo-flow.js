(function (global) {
  const abortError = () => Object.assign(new Error('취소된 요청입니다.'), { name: 'AbortError' });
  const failure = message => new Error(message);

  function createLatestTask() {
    let revision = 0;
    let controller = null;
    function cancel() {
      revision++;
      controller?.abort();
      controller = null;
    }
    function begin() {
      cancel();
      controller = new AbortController();
      const current = revision;
      const signal = controller.signal;
      return { signal, isCurrent: () => current === revision && !signal.aborted };
    }
    return { begin, cancel };
  }

  function validatePhoto(file) {
    if (!file || !file.size) throw failure('비어 있는 사진 파일입니다. 다른 사진을 선택해주세요.');
    if (file.size > 20 * 1024 * 1024) throw failure('사진은 20MB 이하로 선택해주세요.');
    const supported = /^(image\/(jpeg|png|webp|gif|bmp))$/i.test(file.type);
    const extension = /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '');
    if (!supported && !(file.type === '' && extension)) {
      throw failure('JPG·PNG·WebP·GIF·BMP 사진을 선택해주세요. HEIC 사진은 JPG로 변환해주세요.');
    }
  }

  // All handlers are registered before reading/loading; every exit cleans up.
  function preparePhoto(file, { signal, timeoutMs = 20000, env = global } = {}) {
    return new Promise((resolve, reject) => {
      let reader, img, timer;
      let finished = false;
      const stop = () => finish(abortError());
      function finish(error, result) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', stop);
        if (reader) {
          reader.onload = reader.onerror = reader.onabort = null;
          if (reader.readyState === 1) reader.abort();
        }
        if (img) { img.onload = img.onerror = null; img.src = ''; }
        if (error) reject(error); else resolve(result);
      }
      try {
        validatePhoto(file);
        if (signal?.aborted) return stop();
        signal?.addEventListener('abort', stop, { once: true });
        timer = setTimeout(() => finish(failure('사진 처리가 오래 걸립니다. 다른 사진을 선택하거나 다시 시도해주세요.')), timeoutMs);
        reader = new env.FileReader();
        reader.onerror = () => finish(failure('사진 파일을 읽지 못했습니다. 다시 선택해주세요.'));
        reader.onabort = stop;
        reader.onload = () => {
          try {
            img = new env.Image();
            img.onerror = () => finish(failure('사진을 열지 못했습니다. 손상된 파일인지 확인하거나 JPG로 변환해주세요.'));
            img.onload = () => {
              try {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                if (!width || !height || width * height > 50000000) {
                  throw failure('사진 해상도를 확인해주세요. 5천만 화소 이하의 사진을 사용해주세요.');
                }
                const scale = Math.min(1, 1000 / Math.max(width, height));
                const canvas = env.document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(width * scale));
                canvas.height = Math.max(1, Math.round(height * scale));
                const ctx = canvas.getContext('2d');
                if (!ctx) throw failure('이 브라우저에서는 사진 변환을 사용할 수 없습니다. 다른 브라우저로 열어주세요.');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                let dataUrl;
                // Leave room for text/metadata until Version 4 moves images to Storage.
                for (const quality of [0.8, 0.65, 0.5, 0.35]) {
                  dataUrl = canvas.toDataURL('image/jpeg', quality);
                  if (dataUrl.length <= 900000) break;
                }
                if (!dataUrl?.startsWith('data:image/jpeg;base64,') || dataUrl.length > 900000) {
                  throw failure('사진을 저장 가능한 크기로 줄이지 못했습니다. 더 작은 사진을 선택해주세요.');
                }
                finish(null, { dataUrl, width: canvas.width, height: canvas.height });
              } catch (err) { finish(err); }
            };
            img.src = reader.result;
          } catch (err) { finish(err); }
        };
        reader.readAsDataURL(file);
      } catch (err) { finish(err); }
    });
  }

  function readCurrentLocation({ signal, timeoutMs = 12000, env = global } = {}) {
    return new Promise((resolve, reject) => {
      let finished = false;
      let timer;
      const stop = () => finish(abortError());
      function finish(error, result) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', stop);
        if (error) reject(error); else resolve(result);
      }
      try {
        if (signal?.aborted) return stop();
        if (env.isSecureContext === false) throw failure('현재 위치는 HTTPS 연결에서 사용할 수 있습니다.');
        if (!env.navigator?.geolocation) throw failure('이 브라우저는 위치 기록을 지원하지 않습니다. 위치 없이 저장할 수 있습니다.');
        signal?.addEventListener('abort', stop, { once: true });
        timer = setTimeout(() => finish(failure('위치를 찾는 시간이 초과되었습니다. 다시 시도하거나 위치 없이 저장해주세요.')), timeoutMs);
        env.navigator.geolocation.getCurrentPosition(position => {
          const { latitude: lat, longitude: lng } = position.coords;
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return finish(failure('유효한 위치를 받지 못했습니다. 다시 시도해주세요.'));
          }
          finish(null, { lat, lng });
        }, err => {
          const messages = {
            1: '위치 권한이 허용되지 않았습니다. 브라우저 설정에서 허용하거나 위치 없이 저장해주세요.',
            2: '현재 위치를 확인할 수 없습니다. 다시 시도하거나 위치 없이 저장해주세요.',
            3: '위치를 찾는 시간이 초과되었습니다. 다시 시도하거나 위치 없이 저장해주세요.'
          };
          finish(failure(messages[err.code] || '위치를 확인하지 못했습니다. 위치 없이 저장할 수 있습니다.'));
        }, { enableHighAccuracy: true, timeout: Math.min(10000, timeoutMs), maximumAge: 0 });
      } catch (err) { finish(err); }
    });
  }

  global.plantPhotoFlow = { createLatestTask, validatePhoto, preparePhoto, readCurrentLocation };
})(typeof window !== 'undefined' ? window : globalThis);
