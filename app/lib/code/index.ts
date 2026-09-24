import type { ConversionResult } from '../ascii/types'
import type { MotionSettings } from '../motion'
import type { RenderStyle } from '../render'

type CodeScene = {
  motion: MotionSettings
  result: ConversionResult
  style: RenderStyle
}

// Escape embedded scene data so it cannot terminate its script element.
function serializeScene(scene: CodeScene) {
  return JSON.stringify(scene).replaceAll('<', '\\u003c')
}

// Generate a dependency-free HTML canvas animation from the current result.
export function createMotionCode(result: ConversionResult, style: RenderStyle, motion: MotionSettings) {
  const scene = serializeScene({ motion, result, style })

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Motion ascii</title>
<style>
html,body{min-height:100%;margin:0}body{display:grid;place-items:center;background:#171717;overflow:auto}canvas{display:block;max-width:100%;height:auto}
</style>
</head>
<body>
<canvas id="motion-art"></canvas>
<script id="motion-scene" type="application/json">${scene}</script>
<script>
const scene=JSON.parse(document.querySelector('#motion-scene').textContent);
const canvas=document.querySelector('#motion-art');
const context=canvas.getContext('2d');
const layer=document.createElement('canvas');
const layerContext=layer.getContext('2d');
const tau=Math.PI*2;
const pixelRatio=Math.min(3,Math.max(2,window.devicePixelRatio||1));

// Keep a value inside two inclusive bounds.
function clamp(value,min=0,max=1){return Math.min(max,Math.max(min,value))}

// Smooth a normalized value without abrupt velocity changes.
function smooth(value){const amount=clamp(value);return amount*amount*(3-2*amount)}

// Produce deterministic noise from one slice and frame.
function noise(slice,frame){const value=Math.sin(slice*12.9898+frame*78.233)*43758.5453;return value-Math.floor(value)}

// Resolve directional progress through the exported clip.
function progress(time,motion){const base=clamp(time/Math.max(.1,motion.duration));if(motion.direction==='reverse')return 1-base;if(motion.direction==='alternate')return base<=.5?base*2:(1-base)*2;return base}

// Rasterize every glyph once into a reusable bitmap layer.
function paintLayer(){const {result,style}=scene,characterWidth=style.characterWidth,lineHeight=style.characterHeight,glyphWidth=Math.max(.1,characterWidth-style.letterSpacing),probe=style.mode==='braille'?'⣿':'0',lines=result.text.split('\\n');layerContext.setTransform(1,0,0,1,0,0);layerContext.clearRect(0,0,layer.width,layer.height);layerContext.setTransform(pixelRatio,0,0,pixelRatio,0,0);layerContext.font=style.fontSize+'px '+style.fontFamily;const measured=layerContext.measureText(probe).width,fontSize=style.fontSize*glyphWidth/Math.max(1,measured);layerContext.font=fontSize+'px '+style.fontFamily;layerContext.textBaseline='top';for(let row=0;row<result.height;row++){const characters=Array.from(lines[row]||'');for(let column=0;column<result.width;column++){const index=row*result.width+column,color=result.colors?.[index],x=style.paddingLeft+column*characterWidth,y=style.paddingTop+row*lineHeight;if(color&&style.colorTarget==='background'){layerContext.globalAlpha=style.backgroundOpacity/100;layerContext.fillStyle=color;layerContext.fillRect(x,y,characterWidth,lineHeight)}layerContext.globalAlpha=style.foregroundOpacity/100;layerContext.fillStyle=color&&style.colorTarget==='foreground'?color:style.foreground;layerContext.fillText(characters[column]||' ',x,y)}}layerContext.globalAlpha=1}

// Draw the cached layer around the output center.
function drawCentered(scale,opacity){context.save();context.translate(canvas.width/2,canvas.height/2);context.scale(scale,scale);context.globalAlpha=opacity;context.drawImage(layer,-canvas.width/2,-canvas.height/2);context.restore()}

// Composite one lightweight motion frame from the cached layer.
function draw(time){const {motion,style}=scene,width=canvas.width,height=canvas.height,intensity=motion.intensity/100,spread=motion.spread/100,p=progress(time,motion),phase=p*tau*motion.speed;context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.filter='none';context.clearRect(0,0,width,height);context.globalAlpha=style.backgroundOpacity/100;context.fillStyle=style.background;context.fillRect(0,0,width,height);context.globalAlpha=1;if(!motion.enabled){context.drawImage(layer,0,0);return}if(motion.effect==='pulse'){const wave=Math.sin(phase);context.filter='brightness('+(1+Math.max(0,wave)*intensity*.35)+')';drawCentered(1+wave*intensity*.045,.78+(wave+1)*.11);return}if(motion.effect==='reveal'){const visible=smooth(p*motion.speed),diagonal=width*spread*.3,edge=visible*(width+diagonal*2)-diagonal;context.save();context.beginPath();context.moveTo(0,0);context.lineTo(edge+diagonal,0);context.lineTo(edge-diagonal,height);context.lineTo(0,height);context.closePath();context.clip();context.globalAlpha=.4+visible*.6;context.drawImage(layer,0,(1-visible)*intensity*8*pixelRatio);context.restore();return}if(motion.effect==='glitch'){const slices=8+Math.round(spread*16),sliceHeight=Math.ceil(height/slices),frame=Math.floor(time*motion.speed*14);for(let slice=0;slice<slices;slice++){const y=slice*sliceHeight,sourceHeight=Math.min(sliceHeight,height-y),value=noise(slice,frame),active=value>1-intensity*.45,offset=active?(noise(frame,slice)-.5)*intensity*28*pixelRatio:0;context.globalAlpha=active&&value>.94?.35:1;context.drawImage(layer,0,y,width,sourceHeight,offset,y,width,sourceHeight)}context.globalAlpha=1;return}if(motion.effect==='scan'){const bandHeight=height*(.05+spread*.28),head=p*(height+bandHeight)-bandHeight;context.globalAlpha=.76;context.filter='brightness(.68)';context.drawImage(layer,0,0);context.save();context.beginPath();context.rect(0,head,width,bandHeight);context.clip();context.globalAlpha=1;context.filter='brightness('+(1.05+intensity*.9)+')';context.drawImage(layer,0,0);context.restore();return}const slices=12+Math.round(spread*24),sliceWidth=Math.ceil(width/slices);for(let slice=0;slice<slices;slice++){const x=slice*sliceWidth,sourceWidth=Math.min(sliceWidth,width-x),wave=Math.sin(phase+slice/slices*spread*Math.PI*5),offset=wave*intensity*8*pixelRatio;context.globalAlpha=.86+(wave+1)*.07;context.drawImage(layer,x,0,sourceWidth,height,x,offset,sourceWidth,height)}context.globalAlpha=1}

// Size the output and cached glyph layer once.
function size(){const logicalWidth=Math.ceil(scene.result.width*scene.style.characterWidth+scene.style.paddingLeft+scene.style.paddingRight),logicalHeight=Math.ceil(scene.result.height*scene.style.characterHeight+scene.style.paddingTop+scene.style.paddingBottom);canvas.style.width=logicalWidth+'px';canvas.style.height=logicalHeight+'px';canvas.width=Math.ceil(logicalWidth*pixelRatio);canvas.height=Math.ceil(logicalHeight*pixelRatio);layer.width=canvas.width;layer.height=canvas.height;paintLayer()}

// Run the exported clip with its configured loop behavior.
function frame(now){const seconds=now/1000,time=scene.motion.loop?seconds%scene.motion.duration:Math.min(seconds,scene.motion.duration);draw(time);if(scene.motion.loop||time<scene.motion.duration)requestAnimationFrame(frame)}

size();requestAnimationFrame(frame);
</script>
</body>
</html>`
}
