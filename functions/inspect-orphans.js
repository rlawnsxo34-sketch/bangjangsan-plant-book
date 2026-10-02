// Explicit administrator tool: defaults to DRY RUN. No user tokens/public URLs.
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
initializeApp({ projectId: 'plant-book-84803' });
(async () => {
  const apply = process.argv.includes('--delete');
  const bucket = getStorage().bucket('plant-book-84803.firebasestorage.app');
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let query = { prefix: 'artifacts/plant-book-84803/users/', autoPaginate: false, maxResults: 500 };
  let count = 0;
  do {
    const [files, next] = await bucket.getFiles(query);
    for (const file of files) {
      const match = /^artifacts\/plant-book-84803\/users\/([A-Za-z0-9_-]{1,128})\/plants\/([A-Za-z0-9_-]{1,240})\/photo\.jpg$/.exec(file.name);
      // Updated uploads are excluded even if originally created over seven days ago.
      if (!match || !file.metadata.updated || Date.parse(file.metadata.updated) >= cutoff) continue;
      const ref = getFirestore().doc(`artifacts/plant-book-84803/users/${match[1]}/plants/${match[2]}`);
      if ((await ref.get()).exists) continue;
      count++;
      console.log(apply ? 'DELETE' : 'DRY RUN', file.name);
      if (apply) await file.delete({ifGenerationMatch:file.metadata.generation});
    }
    query = next;
  } while (query);
  console.log(`${count} orphan candidates; ${apply ? 'deletion mode' : 'no files deleted'}`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
