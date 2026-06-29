// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — HIGHER DETAIL TILE TEXTURE PASS
//  엔진 교체 없이 캔버스 타일에 균열, 얼룩, 잔해, 물결, 부식 질감을 덧입힌다.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

(function(){
  if(typeof Draw==='undefined'||!Draw.tile)return;
  const baseTile=Draw.tile.bind(Draw);
  function hash(x,y,s=0){
    let n=(x*374761393+y*668265263+s*1442695041)>>>0;
    n=(n^(n>>13))*1274126177;
    return ((n^(n>>16))>>>0)/4294967295;
  }
  function rr(cx,x,y,w,h,c,a=1){cx.globalAlpha=a;cx.fillStyle=c;cx.fillRect(x,y,w,h);cx.globalAlpha=1;}
  Draw.tile=function(cx,x,y,t,pal,frame){
    baseTile(cx,x,y,t,pal,frame);
    const c=(x/20)|0,r=(y/20)|0;
    const h=hash(c,r,3);
    cx.save();
    // universal micro grain
    for(let i=0;i<3;i++){
      const px=x+Math.floor(hash(c,r,i)*18)+1;
      const py=y+Math.floor(hash(c,r,i+9)*18)+1;
      rr(cx,px,py,1,1,'#000',0.08);
    }
    if(t===T.POL){
      rr(cx,x+2+h*4,y+3,Math.max(4,10*h),1,'#1b1510',0.28);
      rr(cx,x+3,y+14-h*5,12,1,'#5b4a25',0.18);
      if(h>.55){rr(cx,x+12,y+5,3,2,'#6f7330',0.35);rr(cx,x+14,y+7,1,1,'#9a8',0.3)}
      cx.strokeStyle='rgba(0,0,0,.28)';cx.lineWidth=1;cx.beginPath();cx.moveTo(x+2,y+2+12*h);cx.lineTo(x+8+6*h,y+7);cx.lineTo(x+17,y+12+4*h);cx.stroke();
    } else if(t===T.CLN){
      rr(cx,x+1,y+1,18,1,'#fff',0.035);rr(cx,x+2,y+16,14,1,'#000',0.07);
      if(h>.62)rr(cx,x+5,y+8,2,1,'#4f6a3c',0.18);
    } else if(t===T.GRS||t===T.T1||t===T.T2||t===T.T3||t===T.FLR){
      for(let i=0;i<5;i++){
        const gx=x+2+Math.floor(hash(c,r,i+20)*16), gy=y+9+Math.floor(hash(c,r,i+30)*8);
        rr(cx,gx,gy,1,3,'#74b45d',0.22);
      }
      rr(cx,x,y+19,20,1,'#143a1c',0.18);
    } else if(t===T.TRS){
      rr(cx,x+2,y+4,15,1,'#ddd',0.12);rr(cx,x+5,y+12,10,1,'#111',0.25);
      rr(cx,x+13,y+3,2,5,'#9ab',0.18);rr(cx,x+4,y+15,5,2,'#a65',0.2);
    } else if(t===T.WAT){
      const off=Math.sin(frame*.08+c)*2;
      rr(cx,x+2,y+7+off,16,1,'#9fd7ff',0.18);rr(cx,x+4,y+13-off,12,1,'#071e34',0.18);
    } else if(t===T.ROK){
      cx.strokeStyle='rgba(0,0,0,.32)';cx.beginPath();cx.moveTo(x+4,y+5);cx.lineTo(x+9,y+10);cx.lineTo(x+16,y+8);cx.stroke();
      rr(cx,x+3,y+3,5,1,'#aaa',0.1);
    } else if(t===T.SND){
      for(let i=0;i<5;i++)rr(cx,x+Math.floor(hash(c,r,i+40)*18),y+Math.floor(hash(c,r,i+50)*18),1,1,'#705a2d',0.18);
    } else if(t===T.LAV){
      const a=.18+.12*Math.sin(frame*.12+h*6);
      rr(cx,x+3,y+3,14,14,'#ffb347',a);rr(cx,x+7,y+2,6,16,'#2b0804',0.13);
    } else if(t===T.ICE){
      rr(cx,x+2,y+2,16,1,'#fff',0.23);rr(cx,x+5,y+5,1,10,'#e6f7ff',0.2);
    }
    cx.restore();
  };
  console.log('[TEXTURE] High detail tile pass enabled.');
})();
