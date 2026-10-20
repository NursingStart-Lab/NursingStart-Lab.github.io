(()=>{
"use strict";
const $=id=>document.getElementById(id);
const KEY="nursestart-lab-ward-v6";
const ITEMS=[
 ["gAssess","217｜血糖相關評估"],["gAction","217｜血糖處置與追蹤安排"],["gReport","217｜向陳醫師通報血糖"],
 ["aAssess","217｜Aspirin 出血風險評估"],["aReport","217｜向陳醫師通報疑似出血"],["med217","217｜用藥安全核對"],
 ["interrupt","跨床中斷與任務安排"],["ivAssess","219｜主動留置針檢查"],["ivDecision","219｜留置針異常處置"],["ivRate","219｜輸液醫囑與滴速核對"],
 ["shoulderAssess","220｜疼痛評估"],["shoulderCare","220｜患側支托與衛教"],["shoulderReport","220｜向林醫師通報"],
 ["culture","新抗生素醫囑查證"],["sterile","無菌備藥流程"],["return","跨床追蹤與再評估"]
];
const INIT=()=>({
 version:6,place:"start",minute:0,firstPlace:"",log:[],score:{},feedback:"",bell:false,bellHandled:false,handoff:false,
 b217:{intro:false,line:"",symptom:false,onset:false,meal:false,objective:false,swallow:false,bg:false,bgMinute:0,
  food:false,glucoseReported:false,glucosePrompted:false,gPriorUnsafe:false,recheck:false,recheckValue:null,
  stool:false,stoolDetail:false,bruise:false,vital:false,aspReview:false,aspirReport:false,aspirPrompted:false,
  aspirinPlan:false,metforminChecked:false,famotidineChecked:false,otherOpen:false},
 b219:{visited:false,line:"",site:false,asked:false,red:false,painPrompted:false,ratePrompted:false,
  decision:"",injury:false,injuryMinute:null,injuryFollow:false,rate:false,lineRemoved:false,aftercare:false},
 b220:{visited:false,line:"",onset:false,score:false,triggers:false,arm:false,exam:false,positioned:false,
  acetViewed:false,report:false,prompted:false,firstPremature:false,follow:false},
 abx:{order:false,culture:false,allergy:false,renal:false,decision:"",step:0,wrong:[],finished:false},
 lastDoctor:"",gameEnded:false
});
let s=INIT(),modal="";
function save(){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function restore(){try{const d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&d.version===6&&d.b217&&d.b219&&d.b220&&d.abx&&Array.isArray(d.log)){s=d;return true}}catch(e){}return false}
function time(){const m=s.minute;return String(9+Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function tick(m=1){s.minute+=m;if(s.b219.decision==="ignore"&&!s.b219.injury&&s.minute>=(s.b219.injuryMinute||0)+6)s.b219.injury=true}
function note(label,value){s.log.push({time:time(),place:s.place,label,value});save()}
function point(key,v,reason){if(!Object.prototype.hasOwnProperty.call(s.score,key)){s.score[key]=v;note("首次決策／"+key,String(v)+" 分："+reason)}else note("補充／"+key,reason)}
function btn(label,code,kind="choice"){return '<button type="button" class="'+kind+'" data-act="'+code+'">'+label+"</button>"}
function pbtn(label,code){return '<button type="button" class="panel-btn" data-pa="'+code+'">'+label+"</button>"}
function box(label,value){return '<div class="dialogue"><small>'+label+"</small>"+value+"</div>"}
function noteBox(value){return '<div class="note">'+value+"</div>"}
function choices(...a){return '<div class="choices">'+a.join("")+"</div>"}
function move(place){
 if(!["bed217","bed219","bed220","desk","med"].includes(place))return;
 closeModal();if(s.place!=="start"&&s.place!==place)note("離開床位","前往 "+place+"；保留原床資料");
 if(!s.firstPlace)s.firstPlace=place;
 if(place==="bed219"&&s.bell&&!s.bellHandled){
  const g=s.b217;
  const grade=!g.food?0:(s.handoff?2:1);
  point("interrupt",grade,grade===2?"先安排 217 床追蹤再前往":grade===1?"直接前往 219 床，尚未安排明確追蹤":"離開時 217 床仍有重要未處置問題");
  s.bellHandled=true;note("跨床呼叫","到 219 床處理呼叫鈴");
 }
 if(s.place==="bed219"&&place!=="bed219"){
  const v=s.b219;
  if(!v.site&&!v.painPrompted){v.painPrompted=true;note("219病人提醒","未檢查留置針，病人說左手有點痛")}
  if(!v.rate&&!v.ratePrompted){v.ratePrompted=true;note("219病人提醒","病人詢問滴速是否比昨天快")}
 }
 if(s.place==="bed217"&&s.b217.bg&&!s.b217.food&&!s.b217.gPriorUnsafe)note("待追蹤","217 床低血糖尚未完成處置");
 s.place=place;tick(2);render();
}
function coords(){
 const p={start:[49,66],bed217:[19,27],bed219:[80,27],bed220:[19,61],desk:[24,89],med:[76,89]}[s.place]||[49,66];
 $("nurse").style.left=p[0]+"%";$("nurse").style.top=p[1]+"%";
 $("cart").style.left=(p[0]+9)+"%";$("cart").style.top=(p[1]+2)+"%";
}
function header(title,sub){$("ctitle").textContent=title;$("csub").textContent=sub}
function status(){
 let items=[];
 if(s.b217.bg&&!s.b217.recheck)items.push("217 床：血糖待追蹤");
 if(s.bell&&!s.bellHandled)items.push("219 床：呼叫鈴響起");
 if(s.b217.stool&&!s.b217.aspirReport)items.push("217 床：Aspirin 風險待確認");
 if(s.b219.injury&&!s.b219.injuryFollow)items.push("219 床：輸液部位需再評估");
 if(s.b220.onset&&!s.b220.report)items.push("220 床：肩痛尚待評估／通報");
 if(s.abx.order&&!s.abx.finished)items.push("新醫囑：待完成核對");
 return items.length?'<div class="note"><b>待續工作</b><div class="task-chips">'+items.map(x=>'<span>'+x+"</span>").join("")+"</div></div>":"";
}
function renderStart(){
 header("09:00｜接班開始","由你選擇先去哪一床。可自由往返，已完成的評估不會重置。");
 return box("交班護理師","217 床尚有給藥需要確認；219 床正在接受輸液；220 床是中風後復健病人。")+
 choices(btn("前往 217 床｜了解病況","go:bed217"),btn("前往 219 床｜檢查輸液","go:bed219"),btn("前往 220 床｜復健照護","go:bed220"),btn("先到護理站看紀錄","go:desk"));
}
function render217(){
 const v=s.b217;
 header("217 床｜臨床評估與給藥","腦中風住院｜進度會依實際詢問、測量及處置保存");
 let h=box("217 床病人",v.line||"護理師，我覺得不太舒服，昨天沒有這樣。");
 if(s.bell&&!s.bellHandled){h+=box("🔔 219 床按鈴","219 床正在呼叫護理師。你要如何安排 217 床的後續追蹤？");h+=choices(btn("先確認 217 床複測與追蹤已安排，再去 219 床","217:handoff"),btn("直接前往 219 床","go:bed219"));}
 const q=[];
 if(!v.symptom)q.push(btn("「可以再描述清楚一點嗎？哪裡不舒服、什麼感覺，之前有發生過嗎？」","217:clarify"));
 if(v.symptom&&!v.onset)q.push(btn("「手抖、心悸是什麼時候開始？還有沒有其他不舒服？」","217:onset"));
 if(!v.objective)q.push(btn("執行意識、瞳孔與吞嚥安全評估","217:objective"));
 if(v.symptom&&!v.meal)q.push(btn("「今天早上吃了什麼？從昨天到現在吃了多少？」","217:meal"));
 if(v.symptom&&!v.bg)q.push(btn("執行床邊 OneTouch 血糖測量","217:bg"));
 if(v.bg&&!v.food)q.push(btn("針對血糖 68 mg/dL 採取處置","217:glucoseMenu"));
 if(v.bg&&!v.glucoseReported)q.push(btn("電話通報陳醫師｜血糖與症狀","doc:glucose"));
 if(v.bg&&v.food&&!v.recheck)q.push(btn(s.minute>=v.bgMinute+15?"複測床邊血糖並評估症狀":"安排血糖複測及返回追蹤（需至少 15 分鐘）","217:recheck"));
 if(v.symptom&&!v.stool)q.push(btn("「除了手抖，還有沒有其他不舒服，最近排便情形如何？」","217:stool"));
 if(v.stool&&!v.stoolDetail)q.push(btn("「便色是深褐色還是偏黑？形狀、次數與大約的量呢？」","217:stoolDetail"));
 if(v.stool&&!v.bruise)q.push(btn("詢問其他出血徵象並檢查皮膚瘀青","217:bruise"));
 if(v.stool&&!v.vital)q.push(btn("測量生命徵象，評估是否有血流動力學異常","217:vital"));
 if(v.stool&&!v.aspReview)q.push(btn("檢視 Aspirin 近期給藥紀錄與醫囑","217:aspReview"));
 if(v.stool&&!v.aspirReport)q.push(btn("電話通報陳醫師｜深色便與 Aspirin","doc:aspirin"));
 if(v.stool&&!v.aspirinPlan)q.push(btn("記錄 Aspirin 給藥前安全判斷","217:aspirinMenu"));
 if(!v.metforminChecked||!v.famotidineChecked)q.push(btn("核對 Metformin／Famotidine 用藥條件","217:medMenu"));
 q.push(btn("打開手推護理工作車（217 床 MAR）","modal:cart"),btn("返回護理站查閱資料","go:desk"));
 h+=choices(...q);
 if(v.bg&&v.recheck)h+=noteBox("最新追蹤：複測血糖 "+v.recheckValue+" mg/dL，已重新確認當下症狀；需持續依醫囑追蹤。");
 return h;
}
function render219(){
 const v=s.b219;v.visited=true;
 header("219 床｜周邊靜脈輸液","一般重力滴注；護理師推工作車，無輸液幫浦及特殊雙人核對關卡");
 let h=box("219 床病人",v.line||(s.bellHandled?"護理師，早安，可以幫我看看點滴嗎？":"護理師，早安。"));
 if(v.injury&&!v.injuryFollow){
  h+=box("稍後的病況變化","原穿刺處周圍紅斑擴大、局部溫度升高並出現壓痛，病人表示手越來越痛。疑似靜脈炎進展。");
  h+=choices(btn("停止使用原通路，移除留置針，評估、照護及通報","219:injuryFollow"),btn("依舊覺得還可以滴，繼續使用","219:ignoreAgain"));return h;
 }
 let q=[];
 if(v.painPrompted&&!v.site)h+=box("病人補充","護理師，我的手有點痛，可以幫我看一下嗎？");
 if(!v.site)q.push(btn("觀察留置針周圍皮膚與敷料，評估局部溫度及壓痛","219:site"));
 if(!v.asked)q.push(btn("「點滴打的地方會刺痛、灼熱或不舒服嗎？」","219:ask"));
 if(v.site&&!v.decision){
  h+=noteBox('<b>護理師內心 OS</b>「入針處周邊紅紅的，雖然病人沒有喊痛，會不會是靜脈炎的早期徵象？」');
  q.push(btn("停止使用異常通路，評估後依規範移除留置針並安排後續輸液","219:replace"));
  q.push(btn("沒有喊痛，點滴還在滴，暫時繼續使用","219:ignore"));
 }
 if(v.painPrompted&&!v.decision&&!v.site)q.push(btn("點滴還能滴，晚點再處理","219:ignore"));
 if(v.ratePrompted&&!v.rate)h+=box("病人問","護理師，現在點滴滴得好像比昨天快，這樣正常嗎？");
 if(!v.rate)q.push(btn("打開工作車，核對 219 床輸液醫囑與實際滴速","modal:cart"));
 if(v.decision==="replace"&&!v.aftercare)q.push(btn("安排適當穿刺處照護及必要時重新建立輸液通路","219:aftercare"));
 if(v.injuryFollow)h+=noteBox("已補救疑似靜脈炎，首次選擇仍保留 0 分；後續仍需追蹤局部狀況。");
 if(v.decision==="replace"&&v.aftercare)h+=noteBox("原異常通路已停止並移除，後續輸液依照安排進行。");
 q.push(btn("先去其他床位（可稍後返回）","go:bed217"));
 h+=choices(...q);return h;
}
function render220(){
 const v=s.b220;v.visited=true;
 header("220 床｜中風後左肩疼痛","左側偏癱復健病人｜先評估疼痛與患側保護，再進行通報");
 let h=box("220 床病人",v.line||"護理師，我左邊肩膀有點痛。");
 let q=[];
 if(!v.onset)q.push(btn("「肩膀什麼時候開始痛？以前有發生過嗎？」","220:onset"));
 if(!v.score)q.push(btn("「現在大概痛幾分？是痠、悶還是刺痛？」","220:score"));
 if(!v.triggers)q.push(btn("「什麼時候會更痛？休息或靠著枕頭會好一點嗎？」","220:triggers"));
 if(!v.arm)q.push(btn("「中風後左手平常有力氣嗎？坐起來或移位時怎麼放？」","220:arm"));
 if(v.arm&&v.triggers&&!v.exam)q.push(btn("觀察患側上肢支托、肩部姿勢與相關徵象","220:exam"));
 if(v.arm&&v.triggers)h+=noteBox('<b>護理師內心 OS</b>「左上肢無力，沒有適當支托，可能因牽拉增加肩部疼痛或半脫位風險；需要檢查，不應直接確診。」');
 if(v.exam&&!v.positioned)q.push(btn("協助患側上肢適當支托與擺位，並向病人衛教","220:position"));
 if(!v.acetViewed)q.push(btn("查閱 220 床 Acetaminophen 醫囑與用藥紀錄","220:acet"));
 if(!v.report)q.push(btn("打電話向林醫師報告左肩疼痛","doc:shoulder"));
 if(v.report&&!v.follow)q.push(btn("返回評估疼痛與患側姿勢、完成追蹤紀錄","220:follow"));
 q.push(btn("手推工作車｜220 床 MAR","modal:cart"));
 h+=choices(...q);return h;
}
function renderDesk(){
 header("護理站｜查閱資料與工作待辦","資料需要由學員主動打開，不會把病人的隱藏線索直接放在主畫面");
 let h=box("護理站","選擇想查閱的紀錄；新抗生素醫囑會隨工作時間開啟。")+status();
 h+=choices(btn("217 床｜電子病歷、血糖紀錄、醫囑","modal:ehr217"),
 btn("219 床｜一般輸液醫囑","modal:ehr219"),
 btn("220 床｜復健與用藥紀錄","modal:ehr220"),
 btn("新醫囑｜Clindamycin → Cefepime","modal:abx"),
 btn("整理工作／觀看目前學習紀錄","end:review"));
 return h;
}
function renderMed(){
 const a=s.abx;
 header("治療室｜新醫囑無菌配藥","先完成醫囑與病人安全查證；污染時須更換器材重新準備");
 const prompts=[
 ["準備前核對","核對病人、Cefepime 醫囑、藥名、溶劑與配製要求"],
 ["無菌準備","完成手部衛生、工作區清潔與穿刺部位消毒"],
 ["抽藥污染情境","抽藥時碰觸到須保持無菌的關鍵部位，應如何處理？"]
 ];
 if(a.finished)return box("治療室","你已完成本次模擬無菌準備與污染應變。")+choices(btn("回護理站","go:desk"));
 if(a.decision!=="safe")return box("待處理","尚未完成新抗生素醫囑、藥敏、過敏與腎功能評估，不應直接開始配藥。")+choices(btn("去護理站查核","go:desk"));
 const p=prompts[a.step];
 return box(p[0],p[1])+choices(btn(a.step===2?"停止使用污染器材，更換後依規範重新準備":"按程序完成這一步","aseptic:safe"),
 btn(a.step===2?"看起來乾淨，繼續使用":"略過核對與無菌技術","aseptic:unsafe"))+(a.wrong.includes(a.step)?noteBox("首次選擇已記錄。必須採取適當補救措施，才能繼續。"):"");
}
function scoreSummary(){
 const rows=ITEMS.map(([key,label])=>'<div class="result-row"><span>'+label+'</span><b class="'+(s.score[key]===2?"good":"needs")+'">'+(s.score[key]===undefined?"未評估":s.score[key]+"/2")+"</b></div>").join("");
 const assessed=ITEMS.filter(([key])=>Object.prototype.hasOwnProperty.call(s.score,key)).length;
 const points=ITEMS.reduce((z,[key])=>z+(s.score[key]||0),0);
 return '<p class="kicker">DEBRIEF · 已評 '+assessed+"/"+ITEMS.length+" 項</p>"+
 '<div class="resultbig">'+points+'<small style="font-size:19px"> / '+(ITEMS.length*2)+"</small></div>"+
 '<div class="results">'+rows+"</div>"+
 noteBox("同一評分項目只計首次決策；病人提示、再次評估、修正與補救則完整保留操作歷程。沒有接觸的項目顯示「未評估」，不等同於做錯。這是教學模擬，不是 EPA 信賴等級。");
}
function renderEnd(){
 header("任務回顧｜臨床決策紀錄","可隨時查看進度；返回病房後續做，不用重新開始");
 let h=scoreSummary()+choices(btn("回到病房繼續值班","end:continue"),btn("複製學習紀錄","end:copy"),btn("從頭重新試玩","end:reset"));
 const l=s.log.slice(-16).map(o=>'<div class="result-row"><span>'+o.time+"　"+o.label+"</span><span>"+o.value+"</span></div>").join("");
 return h+'<div class="note"><b>最近操作紀錄</b>'+l+"</div>";
}
function render(){
 if(!$("game"))return;
 $("clock").textContent=time();coords();
 $("bell").classList.toggle("hidden",!((s.bell&&!s.bellHandled)||(s.b219.injury&&!s.b219.injuryFollow)));
 let html="";
 switch(s.place){
 case "start":html=renderStart();break;case "bed217":html=render217();break;
 case "bed219":html=render219();break;case "bed220":html=render220();break;
 case "desk":html=renderDesk();break;case "med":html=renderMed();break;
 case "end":html=renderEnd();break;default:html=renderStart();
 }
 if(s.place!=="start"&&s.place!=="end")html+=status();
 $("scene").innerHTML=html;save();
}
function openModal(kind){
 modal=kind;$("overlay").classList.remove("hidden");
 drawModal();
}
function closeModal(){modal="";$("overlay").classList.add("hidden")}
function doctorReport(kind){
 const g=s.b217,v=s.b220;
 if(kind==="glucose"){
  let missing=[];
  if(!g.symptom)missing.push("主訴與伴隨症狀");
  if(!g.meal)missing.push("進食間隔與早餐量");
  if(!g.objective)missing.push("意識、瞳孔與吞嚥評估");
  if(!g.bg)missing.push("實測血糖");
  if(!g.food)missing.push("已採取的立即處置");
  const lines=[
  "陳醫師您好，我是病房護理師，跟您報告 217 床病人。",
  g.symptom?"病人因腦中風入院，剛剛主訴手抖、心悸，昨天沒有這種情形。":"病人因腦中風入院，目前病況仍需進一步評估。",
  g.meal?"昨晚睡前到現在約九小時沒有正常進食，今天早上只喝幾口豆漿。":"",
  g.objective?"目前 GCS E4V5M6，Pupil size 2.0 mm (+) OU，已評估意識及安全吞嚥。":"",
  g.bg?"使用 OneTouch 測得血糖 68 mg/dL。":"",
  g.food?"已先請病人進食早餐，並同步向您報告。":"",
  "目前輸液醫囑為 0.9% N/S 500 mL IVD BID。",
  "請問您有要再開立什麼處置嗎？"].filter(Boolean);
  return {title:"217 床｜向陳醫師通報血糖",doctor:"陳醫師",
    missing,lines,reply:missing.length?"病人現在意識怎麼樣？血糖是多少？上一次進食和現在的處置呢？這些資料先幫我確認。":"好，持續追蹤血糖和症狀，有變化再跟我報告。"};
 }
 if(kind==="aspirin"){
  let missing=[];
  if(!g.stoolDetail)missing.push("便色、性質與次數");
  if(!g.bruise)missing.push("瘀青及其他出血徵象");
  if(!g.vital)missing.push("當下生命徵象");
  if(!g.aspReview)missing.push("Aspirin 醫囑及用藥紀錄");
  const lines=[
  "陳醫師您好，另外跟您報告 217 床。",
  "病人昨晚排便一次，主訴顏色偏深。"+(g.stoolDetail?"進一步詢問表示偏黑、較黏，便量不確定。":""),
  g.bruise?"觀察手臂有瘀青，尚需持續追蹤其他出血徵象。":"",
  g.vital?"目前血壓 126/78 mmHg、脈搏 82 次／分，無法僅憑當下生命徵象排除出血。":"",
  g.aspReview?"目前有 Aspirin 醫囑，給藥前正在釐清疑似出血風險。":"",
  "請問 Aspirin 本次給藥及後續檢查，有要再開立什麼處置嗎？"].filter(Boolean);
  return {title:"217 床｜Aspirin 疑似出血風險通報",doctor:"陳醫師",missing,lines,
   reply:missing.length?"目前血壓、脈搏如何？便色與次數確認了嗎？Aspirin 的給藥紀錄呢？請先把評估補齊。":"了解，先不要自行判定是出血；我會評估本次 Aspirin 給藥及是否需要安排檢查，請持續觀察並依新醫囑執行。"};
 }
 if(kind==="shoulder"){
  const missing=[];
  if(!v.onset)missing.push("疼痛起始與病史");
  if(!v.score)missing.push("疼痛程度及性質");
  if(!v.triggers)missing.push("加劇與緩解因素");
  if(!v.arm||!v.exam)missing.push("患側無力、姿勢及支托評估");
  if(!v.acetViewed)missing.push("現行止痛醫囑");
  const lines=[
  "林醫師您好，跟您報告 220 床病人。",
  "病人因腦中風住院接受復健治療，主訴左肩疼痛"+(v.score?"約 2 分":"")+"。",
  v.onset?"中風後開始出現類似疼痛。":"",
  v.triggers?"復健治療及移位後較明顯，適當支托患側上肢後可以緩解。":"",
  v.arm&&v.exam?"評估左上肢無力、坐姿支托不足，懷疑疼痛與肩部牽拉有關；尚未確認肩關節半脫位。":"",
  v.acetViewed?"目前醫囑為 Acetaminophen 1 tab PO BID。":"",
  "病人願意考慮外用痠痛藥膏，請問是否可以開立？"].filter(Boolean);
  return {title:"220 床｜向林醫師通報左肩疼痛",doctor:"林醫師",missing,lines,
   reply:missing.length?"肩膀什麼時候開始痛？復健或移位會加重嗎？目前止痛藥和患側支托評估如何？":"了解，我會評估是否適合開立外用藥膏；先加強患側上肢支托與疼痛追蹤。"};
 }
 return null;
}
function drawModal(){
 let html="",title="";
 const p=s.place,g=s.b217,i=s.b219,w=s.b220,a=s.abx;
 if(modal==="cart"){
  title="手推護理工作車｜MAR";
  if(p==="bed219"){
   html='<div class="record-head">219 床｜一般重力滴注輸液（教學模擬）</div><table class="record">'+
    '<tr><th>種類</th><td>0.9% N/S 500 mL</td></tr><tr><th>醫囑</th><td>60 mL/hr，請核對滴係數與實際滴速</td></tr><tr><th>輸液狀態</th><td>'+(i.lineRemoved?"原有疑慮的留置針已停止使用":"須到床旁核對管路及滴速")+"</td></tr></table>"+
    pbtn("完成有效醫囑與實際滴速核對","219:rate");
  }else if(p==="bed220"){
   html='<div class="record-head">220 床｜給藥紀錄</div><table class="record"><tr><th>Acetaminophen</th><td>1 tab PO BID（劑量與最近給藥時間另須核對）</td></tr></table>'+
    pbtn("完成醫囑核對","220:acet");
  }else{
   html='<div class="record-head">217 床｜用藥清單</div><table class="record"><tr><th>Aspirin</th><td>給藥前確認疑似出血風險</td></tr><tr><th>Metformin</th><td>評估進食、血糖、腎功能及醫囑</td></tr><tr><th>Famotidine</th><td>確認適應症及病人疑慮</td></tr></table>'+
   pbtn("檢查 Aspirin 醫囑與給藥紀錄","217:aspReview")+
   pbtn("核對 Metformin 給藥條件","217:metformin")+
   pbtn("核對 Famotidine 適應症與給藥條件","217:famotidine");
  }
 }else if(modal==="ehr217"){
  title="217 床｜電子病歷";html='<div class="record-head">模擬既往血糖紀錄</div><table class="record">'+
  '<tr><th>昨日 06:30</th><td>108 mg/dL</td></tr><tr><th>昨日 21:00</th><td>126 mg/dL</td></tr>'+
  (g.bg?'<tr><th>今日床邊測量</th><td>68 mg/dL</td></tr>':"")+
  (g.recheck?'<tr><th>處置後複測</th><td>'+g.recheckValue+" mg/dL</td></tr>":"")+'</table>'+
  '<div class="record-head">醫囑摘要</div><table class="record"><tr><th>輸液</th><td>0.9% N/S 500 mL IVD BID</td></tr><tr><th>口服藥</th><td>Aspirin / Metformin / Famotidine</td></tr></table>';
 }else if(modal==="ehr219"){
  title="219 床｜一般輸液醫囑";html='<p>0.9% N/S 500 mL（教學模擬）；目前醫囑流速 60 mL/hr。留置針部位與實際滴速仍須床旁評估。</p>';
 }else if(modal==="ehr220"){
  title="220 床｜復健及用藥紀錄";html='<table class="record"><tr><th>診斷背景</th><td>腦中風後左側偏癱，住院接受復健</td></tr><tr><th>用藥</th><td>Acetaminophen 1 tab PO BID</td></tr></table>';
 }else if(modal==="abx"){
  title="217 床｜抗生素醫囑變更";a.order=true;
  html=box("新醫囑","Clindamycin 停用，新增 Cefepime。須核對臨床狀況、培養、過敏、腎功能與配製要求。")+
  pbtn("查閱血液培養及藥敏","abx:culture")+
  pbtn("查看藥物過敏史","abx:allergy")+
  pbtn("查看腎功能是否已有資料","abx:renal")+
  pbtn("完成醫囑查核並決定下一步","abx:decide");
  if(a.culture)html+='<div class="panel-answer">Blood culture（模擬）：GNB，Acinetobacter spp.，Cefepime S。須結合臨床情境與醫囑解讀。</div>';
  if(a.allergy)html+='<div class="panel-answer">曾記錄 Vancomycin HCl：skin rash；仍需核對新藥之過敏風險。</div>';
  if(a.renal)html+='<div class="panel-answer">未提供可用的近期腎功能數值，需依實際醫囑進一步查核，不能自行假設正常。</div>';
  if(a.decision)html+='<div class="panel-answer">目前判斷：'+(a.decision==="safe"?"完成可取得資訊之查證；實際給藥前仍須確認處方及缺漏資料。":"資訊不足或不安全的給藥決策")+"</div>";
 }else if(modal.startsWith("doc:")){
  const kind=modal.slice(4),r=doctorReport(kind);if(!r)return;
  title=r.title;
  html='<div class="record-head">撥號給 '+r.doctor+"</div>";
  html+='<div class="phone-report">'+r.lines.map(t=>"<p>"+t+"</p>").join("")+"</div>";
  if(r.missing.length)html+=noteBox("尚未取得的評估資料："+r.missing.join("、")+". 醫師將追問；不能將尚未評估的資料當作已取得。");
  html+=pbtn("確認通報，聽取醫師回覆","report:"+kind);
 }else if(modal.startsWith("reply:")){
  const kind=modal.slice(6),r=doctorReport(kind);
  title=r.doctor+"｜電話回覆";html=box(r.doctor,r.reply);
  html+=pbtn("結束通話，返回病房","close");
 }else if(modal==="glucose"){
  title="217 床｜血糖 68 mg/dL";
  html='<div class="panel-answer"><b>當下資料：</b> '+(g.objective?"GCS E4V5M6，Pupil size 2.0 mm (+) OU，已評估吞嚥安全。":"尚未完成意識與吞嚥安全評估。")+' 手抖、心悸。</div>'+
  pbtn("評估意識及吞嚥安全，先請病人進食早餐，立即向醫師通報並追蹤","glucose:meal")+
  pbtn("依院內低血糖標準採取適當口服醣類處置、通報及複測","glucose:protocol")+
  pbtn("不評估就讓家屬餵食，不需通報與複測","glucose:unsafe")+
  pbtn("照常給 Metformin，下次測量再說","glucose:unsafeMed");
 }else if(modal==="med217"){
  title="217 床｜給藥條件";html=pbtn("Metformin：核對病況、進食、腎功能及醫囑","217:metformin")+
   pbtn("Famotidine：核對適應症並回應用藥疑慮","217:famotidine")+
   pbtn("Aspirin：先評估出血風險並通報確認給藥","217:aspirinMenu");
 }else if(modal==="aspirinMenu"){
  title="217 床｜Aspirin 給藥安全";html=box("用藥決策","病人已有便色偏深線索。你會如何處理 Aspirin？")+
  pbtn("先完成出血評估與醫師通報，待確認後依醫囑處理","aspirin:safe")+
  pbtn("既然是原醫囑，就不評估直接給藥","aspirin:unsafe")+
  pbtn("未評估、未通報，永久停藥","aspirin:stop");
 }else if(modal==="abxDecision"){
  title="Cefepime｜醫囑安全查核";
  html=pbtn("核對培養、藥敏、過敏、腎功能及有效醫囑，釐清缺漏後準備","abx:safe")+
  pbtn("看到 Cefepime S 就立即配製施打","abx:unsafe")+
  pbtn("忽略新醫囑，繼續 Clindamycin","abx:ignore");
 }
 $("panelTitle").textContent=title;$("panelBody").innerHTML=html;save();
}
function do217(k){
 const v=s.b217;tick();
 if(k==="clarify"){v.symptom=true;v.line="我手有點抖，心臟跳得有點快，昨天沒有這樣。";note("217主訴","主動釐清手抖與心悸")}
 if(k==="onset"){v.onset=true;v.line="剛才開始，現在還有一點抖，也覺得虛虛的。";note("217症狀","詢問發作時間與伴隨症狀")}
 if(k==="objective"){v.objective=true;v.swallow=true;v.line="客觀評估：GCS E4V5M6，Pupil size 2.0 mm (+) OU；意識清楚、可正常對答，完成吞嚥安全評估。";note("217客觀評估","意識、瞳孔及安全吞嚥")}
 if(k==="meal"){v.meal=true;v.line="昨晚睡前到現在大概九個小時都沒正常吃東西，早上只喝幾口豆漿。";note("217進食詢問","約九小時未正常進食")}
 if(k==="bg"){v.bg=true;v.bgMinute=s.minute;v.line="床邊 OneTouch 血糖數值：68 mg/dL。";note("217血糖","實際測得 68 mg/dL")}
 if(k==="handoff"){s.handoff=true;note("217追蹤交接","確認血糖複測與症狀追蹤、安排必要協助");render();return}
 if(k==="glucoseMenu"){openModal("glucose");return}
 if(k==="recheck"){
  if(s.minute<v.bgMinute+15){v.line="血糖處置後仍需等到安排的複測時點；期間請持續觀察症狀。";note("血糖追蹤","複測時點尚未到");}
  else {v.recheck=true;v.recheckValue=96;v.line="這次複測血糖 96 mg/dL；病人表示手抖與心悸已較先前減輕。";note("217複測","96 mg/dL，症狀減輕（模擬數值）");}
 }
 if(k==="stool"){v.stool=true;v.line="昨天晚上大便顏色看起來比平常深，我也不確定是怎麼回事。";note("217排便主訴","昨晚便色偏深")}
 if(k==="stoolDetail"){v.stoolDetail=true;v.line="昨晚只有一次，比平常黑、比較黏，量我沒注意。";note("217排便追問","偏黑較黏，一次，量未注意")}
 if(k==="bruise"){v.bruise=true;v.line="手臂有幾塊瘀青，我不確定什麼時候有的。";note("217出血評估","手臂瘀青；尚未證實消化道出血")}
 if(k==="vital"){v.vital=true;v.line="生命徵象：BP 126/78 mmHg，HR 82/min（教學模擬）；無法排除仍有出血風險。";note("217生命徵象","BP126/78，HR82")}
 if(k==="aspReview"){v.aspReview=true;v.line="你已查閱 Aspirin 醫囑與使用紀錄；尚須依當下病況決定是否適合給藥。";note("217醫囑","核對 Aspirin");closeModal()}
 if(k==="aspirinMenu"){openModal("aspirinMenu");return}
 if(k==="metformin"){v.metforminChecked=true;point("med217",v.bg&&v.food?2:1,"核對 Metformin、病況與低血糖後給藥條件");v.line="已核對 Metformin 的給藥條件；不可把低血糖直接歸因於 Metformin 單用。";closeModal()}
 if(k==="famotidine"){v.famotidineChecked=true;v.line="已核對 Famotidine 適應症，不能因病人沒有胃痛就自行停藥。";note("217用藥","核對 Famotidine 與病人疑慮");closeModal()}
 render();
}
function do219(k){
 const v=s.b219;tick();
 if(k==="site"){v.site=true;v.red=true;v.line="觀察：入針處局部泛紅，敷料完整。病人尚未主訴明顯壓痛。";note("219穿刺評估",v.painPrompted?"病人提醒後觀察到泛紅":"自主發現局部泛紅");point("ivAssess",v.painPrompted?1:2,"已查看留置針周圍")}
 if(k==="ask"){v.asked=true;v.line="目前不會很痛，但那附近有點怪怪的。";note("219訪談","詢問輸液部位不適")}
 if(k==="replace"){v.decision="replace";v.lineRemoved=true;v.line="已停止使用原有疑慮的周邊靜脈留置針並依規範移除，需安排後續輸液通路。";note("219處置","移除有疑慮的通路");point("ivDecision",2,"主動安全處置")}
 if(k==="ignore"||k==="ignoreAgain"){v.decision="ignore";v.injuryMinute=s.minute;v.line="點滴還能滴，暫時不處理。";note("219不安全處置","忽略留置針異常");point("ivDecision",0,"首次選擇忽略異常")}
 if(k==="injuryFollow"){v.injuryFollow=true;v.decision="rescued";v.lineRemoved=true;v.line="已停止輸液、移除有疑慮的留置針並評估疑似靜脈炎，後續追蹤局部狀況。";note("219補救","移除異常通路；首次不安全選擇保留 0 分");point("ivDecision",0,"補救但不回補首次分數")}
 if(k==="rate"){v.rate=true;v.line="已核對 219 床有效輸液醫囑與實際滴速。";note("219輸液","比對醫囑與實際滴速，非輸液幫浦");point("ivRate",v.ratePrompted?1:2,"已確認輸液滴速");closeModal()}
 if(k==="aftercare"){v.aftercare=true;v.line="完成穿刺處照護與後續通路安排，並觀察局部狀況。";point("return",2,"有安排後續輸液與再評估");note("219追蹤","記錄後續輸液通路及皮膚照護")}
 render();
}
function do220(k){
 const v=s.b220;tick();
 if(k==="onset"){v.onset=true;v.line="中風以後開始會痛，以前沒有這麼明顯。";note("220疼痛起始","腦中風後開始")}
 if(k==="score"){v.score=true;v.line="左肩痠痠的，大概兩分，並不是突然很尖銳的疼痛。";note("220疼痛強度","左肩 2/10")}
 if(k==="triggers"){v.triggers=true;v.line="復健治療後或移位比較痛，有枕頭靠著托住手會好一點。";note("220疼痛因素","復健後加重，支托緩解")}
 if(k==="arm"){v.arm=true;v.line="中風以後左手沒什麼力氣，常常甩來甩去，我都要用右手幫忙扶。";note("220患側功能","左側偏癱、未適當支托")}
 if(k==="exam"){v.exam=true;v.line="評估：左上肢無力，坐姿時患側前臂下垂且支托不足；需留意牽拉相關肩痛，不能單憑此確診半脫位。";note("220姿勢評估","患側缺乏適當支托")}
 if(k==="position"){
  v.positioned=true;v.line="已示範枕頭支托患側上肢，提醒移位時避免拉扯患側手臂。";
  point("shoulderCare",v.prompted?1:2,"完成患側擺位及衛教");note("220衛教","支托患側上肢、避免牽拉");
 }
 if(k==="acet"){v.acetViewed=true;v.line="已查閱醫囑：Acetaminophen 1 tab PO BID；仍須核對實際劑量與最近給藥。";note("220 MAR","核對 Acetaminophen 1 tab PO BID");closeModal()}
 if(k==="follow"){v.follow=true;v.line="已重新確認左肩疼痛、患側支托與復健活動後的症狀。";point("return",v.positioned?2:1,"完成220床疼痛再評估");note("220追蹤","重新評估肩痛與擺位")}
 render();
}
function report(kind){
 const r=doctorReport(kind);if(!r)return;tick();
 const v=kind==="shoulder"?s.b220:s.b217;
 if(r.missing.length){
  if(kind==="glucose")v.glucosePrompted=true;
  if(kind==="aspirin")v.aspirPrompted=true;
  if(kind==="shoulder"){v.prompted=true;v.firstPremature=true;}
  note("醫師追問",r.doctor+"詢問缺漏："+r.missing.join("、"));
  note("初次通報資訊不完整","醫師追問後需要補齊資料；若最終沒有完成將保持未完成");
 }else{
  if(kind==="glucose"){v.glucoseReported=true;s.bell=true;point("gReport",v.glucosePrompted?1:2,"完成簡短血糖電話通報");note("219床呼叫鈴","217 床已安排通報，另床發出呼叫");}
  if(kind==="aspirin"){v.aspirReport=true;point("aAssess",v.stoolDetail&&v.bruise&&v.vital?2:1,"完成出血風險資料蒐集");point("aReport",v.aspirPrompted?1:2,"完成 Aspirin 疑似出血通報");}
  if(kind==="shoulder"){v.report=true;point("shoulderAssess",v.onset&&v.score&&v.triggers&&v.arm&&v.exam?2:1,"完成疼痛及患側評估");point("shoulderReport",v.prompted?1:2,"向林醫師報告左肩疼痛與藥膏需求");}
  note("醫師通報",r.doctor+"收到完整病況，未擅自代醫師開立新處置");
 }
 modal="reply:"+kind;drawModal();render();
}
function act(token){
 const p=token.split(":"),a=p[0],b=p[1];if(!a)return;
 if(a==="go"){move(b);return}
 if(a==="217"){do217(b);return}
 if(a==="219"){do219(b);return}
 if(a==="220"){do220(b);return}
 if(a==="modal"){openModal(b==="cart"?"cart":b);return}
 if(a==="doc"){openModal("doc:"+b);return}
 if(a==="report"){report(b);return}
 if(a==="glucose"){
  const v=s.b217;
  if(b==="meal"||b==="protocol"){
   const safe=v.objective&&v.bg;const score=safe?(v.glucosePrompted?1:2):0;
   if(safe){v.food=true;v.line="已確認可安全吞嚥，先請病人進食早餐，並同步向陳醫師通報；後續須按臨床指引追蹤低血糖。";note("217處置","先請病人吃早餐並同步通報，安排血糖追蹤");}
   else{v.glucosePrompted=true;v.line="尚未完成當下意識與安全吞嚥評估，不能直接認定可以安全口服；請先補做必要評估。";note("217安全提示","進食前需完成吞嚥與意識評估");}
   point("gAssess",v.objective&&v.meal?2:1,"進食、意識與血糖相關資訊查證");
   point("gAction",score,"首次處置選擇；教學仍需依院內 SOP 驗證");
  }else{
   v.gPriorUnsafe=true;v.glucosePrompted=true;point("gAction",0,"未做適當評估或未通報複測");
   v.line="這個選擇可能延誤症狀性低血糖處置，需先確認安全吞嚥並同步通報及追蹤。";
  }
  closeModal();render();return;
 }
 if(a==="aspirin"){
  const v=s.b217;v.aspirinPlan=true;
  if(b==="safe"){point("med217",v.aspirReport?2:1,"依出血評估及醫師回覆再判斷給藥");v.line="已記錄 Aspirin 給藥前安全判斷；需依醫囑確認本次給藥。";}
  else{point("med217",0,"未評估與通報便自行給藥或停藥");v.line="Aspirin 給藥需結合疑似出血評估及醫囑，不能不經確認直接給藥或自行永久停藥。";}
  note("Aspirin 給藥決策",b);closeModal();render();return;
 }
 if(a==="abx"){
  const t=s.abx;
  if(b==="culture")t.culture=true;
  if(b==="allergy")t.allergy=true;
  if(b==="renal")t.renal=true;
  if(b==="decide"){modal="abxDecision";drawModal();return}
  if(["safe","unsafe","ignore"].includes(b)){
   const good=b==="safe"&&t.culture&&t.allergy&&t.renal;
   t.decision=good?"safe":"unsafe";
   point("culture",good?2:0,good?"完整查證並註明腎功能需再確認":"醫囑及報告未充分核對");
   note("抗生素變更","Clindamycin→Cefepime；"+b);
   closeModal();render();return;
  }drawModal();render();return;
 }
 if(a==="aseptic"){
  const t=s.abx;const key=t.step;
  if(b==="unsafe"){if(!t.wrong.includes(key))t.wrong.push(key);note("無菌技術不安全","步驟 "+(key+1)+"，需要修正");render();return;}
  if(key===2){t.finished=true;point("sterile",t.wrong.length?1:2,"完成三步無菌準備及污染應變");note("配藥","配藥情境完成")}
  else t.step++;
  tick(2);render();return;
 }
 if(a==="end"){
  if(b==="review"){s.place="end";render();return}
  if(b==="continue"){s.place=s.firstPlace||"desk";render();return}
  if(b==="copy"){
   const rows=["NurseStart Lab｜病房任務 V6",...ITEMS.map(([key,label])=>label+"："+(s.score[key]===undefined?"未評估":s.score[key]+"/2")),"","操作紀錄",...s.log.map(x=>x.time+"｜"+x.place+"｜"+x.label+"｜"+x.value)];
   const text=rows.join("\n");if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).catch(()=>{});}
   return;
  }
  if(b==="reset"){if(!window.confirm||window.confirm("要重新試玩並清除本機進度嗎？")){s=INIT();save();render()}return}
 }
 if(a==="close"){closeModal();render();return}
}
function initialize(){
 $("enterGame").addEventListener("click",start);
 $("enterGame2").addEventListener("click",start);
 $("backHome").addEventListener("click",()=>{$("home").classList.remove("hidden");$("game").classList.add("hidden")});
 $("scene").addEventListener("click",e=>{const x=e.target.closest("[data-act]");if(x&&!x.disabled)act(x.dataset.act)});
 $("ward").addEventListener("click",e=>{const x=e.target.closest("[data-spot]");if(x)move(x.dataset.spot)});
 $("cart").addEventListener("click",()=>openModal("cart"));
 $("panelBody").addEventListener("click",e=>{const x=e.target.closest("[data-pa]");if(x&&!x.disabled)act(x.dataset.pa)});
 $("closePanel").addEventListener("click",closeModal);
 $("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closeModal()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
}
function start(){
 if(!restore())s=INIT();
 $("home").classList.add("hidden");$("game").classList.remove("hidden");
 document.title="Ward Quest｜NurseStart Lab V6";render();
 try{window.scrollTo({top:0,behavior:"instant"})}catch(e){}
}
initialize();
})();