import { widgetDocument } from "../shared/widget.mjs";
import { petArt } from "./art";
import type { Species } from "./art";
import type { State } from "./model";

export function widgetPortrait(species: Species, sleeping = false, accessory = "", stage = 0) {
  const source = petArt(species, sleeping ? "sleep" : "happy", 0, accessory, stage, true);
  const pixels = source.getContext("2d")!.getImageData(0,0,source.width,source.height).data;
  let left=source.width, top=source.height, right=0, bottom=0;
  for (let y=0;y<source.height;y++) for(let x=0;x<source.width;x++) {
    if(pixels[(y*source.width+x)*4+3]>32) {left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(left>right) return source;
  const result=document.createElement("canvas");
  result.width=right-left+5; result.height=bottom-top+5;
  const ctx=result.getContext("2d")!;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(source,left,top,right-left+1,bottom-top+1,2,2,right-left+1,bottom-top+1);
  const retina=document.createElement("canvas");
  retina.width=result.width*3;retina.height=result.height*3;
  const high=retina.getContext("2d")!;high.imageSmoothingEnabled=false;
  high.drawImage(result,0,0,retina.width,retina.height);
  return retina;
}
export function exportWidgetState(state: State) {
  return {
    ...widgetDocument(state),
    portraits: {
      awake: widgetPortrait(state.species, false, state.accessory, state.stageIndex).toDataURL("image/png").split(",")[1],
      asleep: widgetPortrait(state.species, true, state.accessory, state.stageIndex).toDataURL("image/png").split(",")[1],
    },
  };
}
