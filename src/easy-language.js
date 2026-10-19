// Exact editorial substitutions only. User-written field descriptions and
// photo/location/review metadata are retained without guessing new facts.
const explanations=new Map([
 ['코르크층이 발달한 껍질','두껍고 갈라진 나무껍질'],
 ['작은 비늘 모양의 잎이 모여 가지를 덮고 있어요. 잎 뒷면에는 흰색 기공선이 Y자 모양으로 나타나요. 가까이에서 보이는 작은 잎의 모양을 살펴보세요.','작은 비늘처럼 생긴 잎이 가지를 덮고 있어요. 잎 뒷면에는 숨구멍이 모여 만든 흰 선이 Y자 모양으로 보여요. 눈높이에서 보이는 잎을 자세히 살펴보세요.'],
 ['나무껍질에 코르크층이 발달하는 나무예요. 잎 뒷면에는 흰 털이 빽빽하게 나 있어요. 잎뿐 아니라 줄기의 모습도 나무를 알아보는 단서가 돼요.','껍질이 두껍게 발달하는 나무예요. 잎 뒷면에는 흰 털이 빽빽하게 나 있어요. 잎과 줄기를 함께 살펴보면 나무를 알아보는 데 도움이 돼요.'],
 ['잎이 손바닥처럼 보통 5~7갈래로 갈라져요. 한 나무에서도 잎마다 크기와 색이 어떻게 다른지 살펴보세요. 여기서는 단풍나무(Acer palmatum)를 다루며, 당단풍나무 등 다른 종류는 별도로 확인해야 해요.','잎이 손바닥처럼 보통 5~7갈래로 갈라져요. 같은 나무에서도 잎의 크기와 색이 다른지 살펴보세요. 비슷하게 생긴 당단풍나무도 있으니, 잎 모양 하나만 보고 이름을 정하지는 마세요.'],
 ['껍질 모양 하나만으로 굴참나무라고 확정하지 않아요.','껍질이 비슷한 다른 나무일 수도 있어요. 잎도 함께 살펴보세요.']
]);
export function readableTree(tree){return {...tree,feature:explanations.get(tree.feature)||tree.feature,description:explanations.get(tree.description)||tree.description,hints:tree.hints.map(text=>explanations.get(text)||text)};}
