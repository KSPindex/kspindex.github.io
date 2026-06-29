// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — DLC-LIKE SIDE OPERATION: BLACK RAIN
//  별도 메뉴가 아니라 게임 진행 중 자연스럽게 열리는 추가 작전.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const DlcOps = {
  update(game){
    if(!game||game.state!=='playing')return;
    const unlocked=Save.g('unlockedLevels')||1;
    if(unlocked<3)return; // 해안 진입 이후부터 검은 비 작전 개방
    if(!Save.flag('dlc_black_rain_enabled')) Save.setFlag('dlc_black_rain_enabled',true);
    if(game._blackRainFrames>0){
      game._blackRainFrames--;
      document.body.classList.add('zone-storm');
      if(game.frame%75===0&&game.ftext)game.ftext.add(game.plx,game.ply-26,'검은 비: 낙하 폐기물 증가','#ffad76',.95);
      if(game.frame%140===0){
        // force one extra falling waste during black rain
        const tp=TRASH[CoreUtil.randInt(0,TRASH.length-1)];
        const x=CoreUtil.rand(10,390);
        game.trash.push({x,y:-tp.h,w:tp.w,h:tp.h,s:tp.s*CoreUtil.rand(1.05,1.45),d:tp.d+3,c:tp.c,n:tp.n,wb:CoreUtil.rand(0,6.28)});
        game.trWarns.push({x,t:32});
      }
      if(game._blackRainFrames<=0){
        document.body.classList.remove('zone-storm');
        if(game.ftext)game.ftext.add(game.plx,game.ply-24,'검은 비 약화. 수거 상태를 확인하라.','#bfe8ff',.95);
      }
      return;
    }
    document.body.classList.remove('zone-storm');
    if(game.gameT>1200 && game.gameT%2600===0 && Math.random()<0.75){
      game._blackRainFrames=900+CoreUtil.randInt(0,500);
      if(game.ftext)game.ftext.add(game.plx,game.ply-30,'검은 비 작전 시작: 하늘 폐기물 밀도 상승','#ff8a5c',1.1);
      if(typeof StoryDialogues!=='undefined' && StoryDialogues.dlc_black_rain_intro && !Save.flag('dlc_black_rain_first_seen')){
        Save.setFlag('dlc_black_rain_first_seen',true);
        setTimeout(()=>{ if(game.state==='playing')game.startVN('dlc_black_rain_intro'); },250);
      }
    }
  }
};

if(typeof window!=='undefined')window.DlcOps=DlcOps;
console.log('[OPS] Black Rain operation loaded.');
