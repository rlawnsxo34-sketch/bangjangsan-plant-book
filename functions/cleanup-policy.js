function validCleanupPath(record, uid, id) {
  if (!record || record.schemaVersion !== 2 || !/^[0-9]{1,30}$/.test(record.imageGeneration || '') || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)
    || !/^[A-Za-z0-9_-]{1,240}$/.test(id)) return null;
  const expected = `artifacts/plant-book-84803/users/${uid}/plants/${id}/photo.jpg`;
  return record.imagePath === expected ? expected : null;
}
module.exports = { validCleanupPath };
