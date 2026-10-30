// Personal reactions, never an identification or a confirmed visit.
export const VISIT_REACTIONS=[
 {id:'leaf-shape',label:'잎 모양이 신기해요'},
 {id:'color',label:'색이 눈에 띄어요'},
 {id:'unsure',label:'구별하기 어려워요'}
];
export function visitReactions(value){
 return Array.isArray(value)?VISIT_REACTIONS.filter(item=>value.includes(item.id)).map(item=>item.id):[];
}
export function reactionLabels(entry){
 const ids=visitReactions(entry?.reactions);
 return VISIT_REACTIONS.filter(item=>ids.includes(item.id)).map(item=>item.label);
}
