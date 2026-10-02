const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { validCleanupPath } = require('./cleanup-policy');
initializeApp();
// Select a region close to your Firestore database BEFORE first deployment.
exports.cleanupPlantPhoto = onDocumentDeleted({
  document: 'artifacts/plant-book-84803/users/{uid}/plants/{plantId}',
  region: 'asia-northeast3', retry: true
}, async event => {
  const data = event.data?.data();
  const path = validCleanupPath(data, event.params.uid, event.params.plantId);
  if (!path) return;
  // Do not delete a photo if the record was recreated before retry delivery.
  if ((await getFirestore().doc(event.data.ref.path).get()).exists) return;
  const file = getStorage().bucket('plant-book-84803.firebasestorage.app').file(path);
  try {
    const [metadata] = await file.getMetadata();
    if (metadata.generation !== data.imageGeneration) return;
    // Only delete the exact generation stored in the deleted record.
    await file.delete({ ifGenerationMatch: data.imageGeneration });
  } catch (error) {
    if ([404, 412].includes(Number(error.code))) return; // Client may have already cleaned it.
    throw error; // Retry delivery handles transient failures and precondition races.
  }
});

const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { createIdentifyService } = require('./identify-service');
const plantNetKey = defineSecret('PLANTNET_API_KEY');
exports.identifyPlant = onCall({
  region: 'asia-northeast3', secrets: [plantNetKey], timeoutSeconds: 45,
  memory: '256MiB', maxInstances: 2, concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true'
}, createIdentifyService({db:getFirestore(),getKey:()=>plantNetKey.value()}));
