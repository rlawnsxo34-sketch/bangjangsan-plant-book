import {EXPERIENCE} from './experience-data.js';
// Match only the selected scientific name, never a Korean substring or genus.
export function experienceForSelection(selection){
 if(selection?.provider!=='plantnet'||typeof selection.scientificName!=='string')return null;
 const name=selection.scientificName.trim().replace(/\s+/g,' ');
 return EXPERIENCE.trees.find(tree=>tree.scientificName===name)||null;
}
