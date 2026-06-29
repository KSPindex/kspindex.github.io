// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — CHOICE EVENTS
//  서울 2033식 짧은 텍스트 선택 이벤트. 현실 기반, 과장 없이.
//  Load AFTER storyData.js.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const ChoiceEventDB = [
  {
    id:'illegal_dump_truck', maps:['map1','map4'], weight:1.1,
    title:'새벽의 덤프트럭 자국',
    subtitle:'불법 투기 흔적',
    body:'정화 구역 가장자리에서 새 타이어 자국이 발견됐다. 누군가 밤 사이 폐기물을 내려놓고 떠난 듯하다. 아직 내용물은 확인되지 않았다.',
    image:'🚚',
    choices:[
      { label:'즉시 봉쇄하고 표본을 채취한다', hint:'에너지 소모 / 안정화 증가', effect:{energy:-16, clean:5, coins:4, flag:'dump_sampled'}, result:'비닐 아래에서 폐유가 묻은 흙이 나왔다. 늦었지만 더 번지기 전에 막았다.' },
      { label:'주변 주민 기록을 먼저 찾는다', hint:'시간 소모 / 기록 확보', effect:{energy:-7, clean:2, coins:2, log:'village'}, result:'버려진 우편함에서 오래된 민원 사본을 발견했다. 같은 차량 번호가 반복되어 있었다.' },
      { label:'지나친다', hint:'피해 없음 / 오염 확산', effect:{hp:-5, clean:-2}, result:'몇 시간 뒤 냄새가 퍼졌다. 늦게 확인한 흙은 이미 검게 젖어 있었다.' },
    ]
  },
  {
    id:'rain_gutter', maps:['map1','map2'], weight:1,
    title:'막힌 빗물받이',
    subtitle:'비가 오면 오염이 이동한다',
    body:'낙엽과 비닐, 작은 플라스틱 조각이 빗물받이를 막고 있다. 지금은 말라 있지만 비가 오면 오염수가 한꺼번에 흘러나갈 수 있다.',
    image:'🌧️',
    choices:[
      { label:'손으로 걷어내고 물길을 연다', hint:'HP 소모 / 정화 진행', effect:{hp:-4, clean:6, water:4}, result:'장갑 사이로 검은 물이 스며들었다. 그래도 물길은 열렸고, 주변 흙의 악취가 조금 줄었다.' },
      { label:'우회 배수로를 만든다', hint:'에너지 소모 / 큰 안정화', effect:{energy:-20, clean:8}, result:'임시 배수로가 완성됐다. 완벽하지는 않지만 다음 비를 버틸 가능성이 생겼다.' },
      { label:'표식만 세운다', hint:'적은 소모 / 적은 효과', effect:{energy:-3, clean:1}, result:'위험 표식을 세웠다. 누군가 다시 확인하지 않으면 문제는 그대로 남는다.' },
    ]
  },
  {
    id:'dust_school', maps:['map2'], weight:1.2,
    title:'닫힌 학교 창문',
    subtitle:'보이지 않는 오염',
    body:'협곡 아래 오래된 학교 건물. 창문 틈마다 회색 먼지가 쌓여 있다. 칠판에는 “야외 활동 중지”라는 문구가 남아 있다.',
    image:'🏫',
    choices:[
      { label:'필터를 회수해 분석한다', hint:'에너지 소모 / 기록과 안정화', effect:{energy:-12, clean:5, coins:3, log:'air'}, result:'필터는 예상보다 무거웠다. 먼지는 공중에만 머물지 않고, 생활 공간 안으로 들어와 있었다.' },
      { label:'교실 내부를 환기하지 않고 봉인한다', hint:'안전 / 중간 효과', effect:{clean:3}, result:'문을 닫고 틈을 막았다. 안쪽 공기를 건드리지 않는 편이 더 안전했다.' },
      { label:'창문을 열어 빠르게 확인한다', hint:'위험 / 보상 가능', effect:{hp:-10, energy:-4, clean:4}, result:'먼지가 한꺼번에 일어났다. 필요한 기록은 얻었지만 목이 따갑다.' },
    ]
  },
  {
    id:'microplastic_fish', maps:['map3'], weight:1.2,
    title:'해변의 작은 물고기',
    subtitle:'먹이와 쓰레기의 경계',
    body:'파도에 밀려온 작은 물고기 배 속에서 반짝이는 조각이 보인다. 모래 위에는 같은 색의 플라스틱 알갱이가 흩어져 있다.',
    image:'🐟',
    choices:[
      { label:'주변 모래를 체로 거른다', hint:'에너지 소모 / 큰 안정화', effect:{energy:-18, clean:8, coins:4}, result:'한 줌의 모래에서 생각보다 많은 조각이 나왔다. 보이지 않을 만큼 작아졌을 뿐, 사라진 것은 아니었다.' },
      { label:'표본만 보관하고 이동한다', hint:'기록 / 적은 효과', effect:{clean:3, log:'ocean'}, result:'표본병 안에서 조각들이 빛났다. 아름다워 보이는 것이 안전하다는 뜻은 아니다.' },
      { label:'물고기를 바다로 돌려보낸다', hint:'선의 / 불확실', effect:{water:-4, clean:1}, result:'물고기는 파도 속으로 사라졌다. 하지만 그 안의 플라스틱도 함께 돌아갔다.' },
    ]
  },
  {
    id:'recycling_label', maps:['map1','map3'], weight:.9,
    title:'재활용 표시가 있는 쓰레기',
    subtitle:'분리배출의 한계',
    body:'깨진 용기에는 재활용 표시가 선명하다. 하지만 기름과 흙이 묻어 있고, 다른 재질이 단단히 붙어 있다.',
    image:'♻️',
    choices:[
      { label:'오염 부위를 제거하고 분류한다', hint:'시간과 에너지 소모 / 안정화', effect:{energy:-10, clean:5, coins:2}, result:'표시가 있다고 모두 재활용되는 것은 아니었다. 그래도 분리한 만큼 매립될 양은 줄었다.' },
      { label:'그대로 수거한다', hint:'빠름 / 낮은 효과', effect:{clean:2, coins:1}, result:'수거는 했지만 처리 과정에서 다시 걸러질 가능성이 높다.' },
      { label:'가연성 폐기물로 처리한다', hint:'빠름 / 대기 피해', effect:{clean:1, hp:-6}, result:'태우는 선택은 쉬웠다. 하지만 냄새가 오래 남았다.' },
    ]
  },
  {
    id:'old_resident_note', maps:['map1','map2','map3'], weight:.8,
    title:'남겨진 주민 메모',
    subtitle:'통계 이전의 사람',
    body:'젖은 공책 한 장이 벽 틈에 끼어 있다. 날짜와 함께 기침, 피부 발진, 물 냄새에 대한 기록이 적혀 있다.',
    image:'📝',
    choices:[
      { label:'기록을 말려 보관한다', hint:'기록 확보 / 안정화', effect:{energy:-5, clean:4, coins:2}, result:'공책은 일부만 읽을 수 있었다. 그래도 누군가 이곳에서 버텼다는 사실은 남았다.' },
      { label:'사진만 찍고 둔다', hint:'소모 적음 / 적은 효과', effect:{clean:2}, result:'기록은 남겼지만 종이는 계속 젖어간다.' },
      { label:'개인 기록이라 두고 간다', hint:'윤리적 선택 / 효과 없음', effect:{}, result:'그 선택도 틀렸다고 말할 수 없다. 모든 기록이 공개되어야 하는 것은 아니다.' },
    ]
  },
  {
    id:'toxic_spring', maps:['map4'], weight:1.2,
    title:'거품이 이는 샘',
    subtitle:'복합 오염원',
    body:'샘 가장자리에 무지갯빛 막이 떠 있다. 물처럼 보이지만 표면은 기름처럼 갈라진다.',
    image:'☠️',
    choices:[
      { label:'흡착재를 뿌리고 접근을 막는다', hint:'에너지 소모 / 큰 안정화', effect:{energy:-22, clean:10}, result:'흡착재가 검게 변했다. 물은 아직 마실 수 없지만, 확산은 늦췄다.' },
      { label:'표본만 채취한다', hint:'위험 / 기록', effect:{hp:-8, clean:4, log:'final'}, result:'표본병을 닫자마자 장갑 표면이 미끈해졌다. 이곳의 오염은 한 종류가 아니다.' },
      { label:'지금은 후퇴한다', hint:'안전 / 진행 없음', effect:{}, result:'무리하지 않는 것도 판단이다. 다만 샘은 계속 거품을 내고 있다.' },
    ]
  },
  {
    id:'stray_bird', maps:['map2','map3'], weight:.7,
    title:'날지 못하는 새',
    subtitle:'생태계의 조용한 신호',
    body:'작은 새가 낮게 뛰어다닌다. 날개에 끈적한 먼지와 비닐 조각이 엉겨 있다.',
    image:'🐦',
    choices:[
      { label:'조심스럽게 떼어낸다', hint:'시간 소모 / 회복', effect:{energy:-8, clean:3, seeds:1}, result:'새는 곧장 날아가지 못했다. 하지만 더 이상 비닐을 끌고 다니지는 않았다.' },
      { label:'물을 조금 사용해 닦는다', hint:'물 소모 / 더 안전', effect:{water:-8, clean:4}, result:'물은 귀하지만, 지금은 생명을 살리는 데 쓰였다.' },
      { label:'건드리지 않는다', hint:'소모 없음 / 찝찝함', effect:{}, result:'새는 덤불 쪽으로 사라졌다. 그 뒤를 따라 작은 비닐 조각이 끌려갔다.' },
    ]
  },
];

function getChoiceEventsForMap(mapId) {
  return ChoiceEventDB.filter(e => !e.maps || e.maps.includes(mapId));
}

function pickChoiceEvent(mapId) {
  const list = getChoiceEventsForMap(mapId);
  const total = list.reduce((a,e)=>a+(e.weight||1),0) || 1;
  let r = Math.random()*total;
  for (const e of list) { r -= (e.weight||1); if (r <= 0) return e; }
  return list[0] || null;
}

function applyChoiceEffect(game, effect={}) {
  if (!game || !effect) return;
  if (typeof effect.hp === 'number') game.plHP = Math.max(1, Math.min(game.plMaxHP || 100, game.plHP + effect.hp));
  if (typeof effect.energy === 'number') game.plEnergy = Math.max(0, Math.min(game.plMaxEn || 100, game.plEnergy + effect.energy));
  if (typeof effect.water === 'number') game.plWater = Math.max(0, Math.min(game.plMaxWater || 100, game.plWater + effect.water));
  if (typeof effect.seeds === 'number') game.plSeeds = Math.max(0, Math.min(game.plMaxSeeds || 30, game.plSeeds + effect.seeds));
  if (typeof effect.coins === 'number' && effect.coins > 0) game.earnCoins ? game.earnCoins(effect.coins) : Save.addCoins(effect.coins);
  if (typeof effect.clean === 'number') {
    if (effect.clean > 0 && typeof MapProgress !== 'undefined') MapProgress.addClean(effect.clean);
    // Negative clean means a small local setback: corrupt a few nearby clean tiles.
    if (effect.clean < 0 && game.tiles) {
      let n = Math.abs(effect.clean);
      const pc = game.pCol ? game.pCol() : Math.floor(game.plx/20), pr = game.pRow ? game.pRow() : Math.floor(game.ply/20);
      for (let dr=-2; dr<=2 && n>0; dr++) for (let dc=-2; dc<=2 && n>0; dc++) {
        const c=pc+dc,r=pr+dr;
        if (game.tileAt && game.setTile && game.tileAt(c,r) === T.CLN) { game.setTile(c,r,T.POL); n--; }
      }
    }
  }
  if (effect.item && typeof Inventory !== 'undefined') Inventory.add(effect.item, effect.qty || 1);
  if (effect.flag && typeof Save !== 'undefined') Save.setFlag('choice_' + effect.flag, true);
  if (effect.log && typeof pickFieldLog === 'function' && game.ftext) {
    setTimeout(()=>game.ftext.add(game.plx, game.ply - 34, pickFieldLog('poi', effect.log), '#ffb45c', .85), 350);
  }
  if (game.parts) game.parts.emit(game.plx, game.ply, 8, {xa:-2,xb:2,ya:-2,yb:1,la:10,lb:24,sa:1,sb:2,cs:['#8ff','#fff','#fa8'],g:.01});
}

if (typeof window !== 'undefined') {
  window.ChoiceEventDB = ChoiceEventDB;
  window.pickChoiceEvent = pickChoiceEvent;
  window.applyChoiceEffect = applyChoiceEffect;
}

console.log('[EVENTS] Choice events loaded:', ChoiceEventDB.length);
