// Default supplied reference photos. Field locations and review status stay separate.
const names={'hinoki':'편백나무','galcham-oak':'갈참나무','japanese-maple':'단풍나무'};
export function experiencePhotos(tree){
 const valid=photo=>photo&&typeof photo.src==='string'&&photo.src.trim();
 // An explicit array (including []) overrides the defaults; keep legacy custom photos.
 if(Array.isArray(tree.photos))return tree.photos.filter(valid).map((photo,i)=>({...photo,label:photo.label||`참고 사진 ${i+1}`}));
 if(valid(tree.photo))return [{...tree.photo,label:tree.photo.label||'참고 사진'}];
 if(!names[tree.id])return [];
 return [['leaf','잎'],['whole','전체 모습']].map(([part,label])=>({src:`/experience/${tree.id}-${part}-v29.jpg`,label,alt:`${names[tree.id]} ${label} 참고 사진`,credit:'제공 사진'}));
}
