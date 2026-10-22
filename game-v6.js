(()=>{
"use strict";
const $=id=>document.getElementById(id);
const KEY="nursestart-lab-ward-v6";
const SUBMIT_URL="https://script.google.com/macros/s/AKfycbx5VHmtqMvYc1TOy4HYlwNCJ6rlvLRDq90PYkzPZuhzpSyd4yf6U2tCcrSqCbAvkr9k/exec";
const ITEMS=[
 ["gAssess","217｜血糖相關評估"],["gAction","217｜血糖處置與追蹤安排"],["gReport","217｜向陳醫師通報血糖"],
 ["aAssess","217｜Aspirin 出血風險評估"],["famotidine","217｜Aspirin 藥品作用查證"],["aReport","217｜向陳醫師通報疑似出血"],["med217","217｜用藥安全核對"],
 ["interrupt","跨床中斷與任務安排"],["ivAssess","219｜主動留置針檢查"],["ivDecision","219｜留置針異常處置"],["ivRate","219｜輸液醫囑與滴速核對"],
 ["shoulderAssess","220｜疼痛評估"],["shoulderCare","220｜患側支托與衛教"],["shoulderReport","220｜向林醫師通報"],
 ["culture","新抗生素醫囑查證"],["sterile","無菌備藥流程"],["return","跨床追蹤與再評估"]
];
const INIT=()=>({
 version:6,place:"start",minute:0,firstPlace:"",log:[],score:{},feedback:"",bell:false,bellHandled:false,handoff:false,
 identity:{fullName:"",unit:"",phase:"試玩"},upload:{id:"",state:"",error:""},startedAt:0,
 b217:{intro:false,line:"",focus:"start",returnFocus:"start",lastFeedback:"",gMistakes:0,aMistakes:0,medQuiz:{index:0,firstCorrect:0,answer:"",done:false},symptom:false,onset:false,meal:false,objective:false,swallow:false,bg:false,bgMinute:0,
  food:false,glucoseReported:false,glucosePrompted:false,gPriorUnsafe:false,recheck:false,recheckValue:null,
  stool:false,stoolDetail:false,bruise:false,vital:false,aspReview:false,aspirReport:false,aspirPrompted:false,
  aspirinPlan:false,metforminChecked:false,famotidineChecked:false,otherOpen:false},
 b219:{visited:false,line:"",focus:"start",site:false,asked:false,red:false,painPrompted:false,ratePrompted:false,
  decision:"",injury:false,injuryMinute:null,injuryFollow:false,rate:false,lineRemoved:false,aftercare:false},
 b220:{visited:false,line:"",focus:"start",onset:false,score:false,triggers:false,arm:false,exam:false,positioned:false,
  acetViewed:false,report:false,prompted:false,firstPremature:false,follow:false},
 abx:{order:false,culture:false,allergy:false,renal:false,decision:"",step:0,wrong:[],finished:false},
 lastDoctor:"",gameEnded:false,bellPromptShown:false,freeText:{bell:"",reflection:""}
});
let s=INIT(),modal="";
function save(){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function restore(){
 try{
  const d=JSON.parse(localStorage.getItem(KEY)||"null");
  if(d&&d.version===6&&d.b217&&d.b219&&d.b220&&d.abx&&Array.isArray(d.log)){
   const g=d.b217,i=d.b219,w=d.b220;
   if(!d.identity)d.identity={fullName:"",unit:"",phase:"試玩"};
   if(!d.upload)d.upload={id:"",state:"",error:""};
   if(!Number.isFinite(d.startedAt))d.startedAt=0;
   if(!d.freeText)d.freeText={bell:"",reflection:""};
   if(typeof d.bellPromptShown!=="boolean")d.bellPromptShown=false;
   if(!g.medQuiz)g.medQuiz={index:0,firstCorrect:0,answer:"",done:false};
   if(!Number.isFinite(g.gMistakes))g.gMistakes=0;
   if(!Number.isFinite(g.aMistakes))g.aMistakes=0;
   if(!g.returnFocus)g.returnFocus="start";
   if(typeof g.lastFeedback!=="string")g.lastFeedback="";
   if(!g.focus){
    g.focus=g.aspirinPlan?"aspirinPlan":
     g.aspirReport?"aspirReported":g.aspReview?"aspReview":g.vital?"vital":
     g.bruise?"bruise":g.stoolDetail?"stoolDetail":g.stool?"stool":
     g.glucoseReported?"glucoseReported":g.food?"food":g.bg?"bg":
     g.meal?"meal":g.objective?"objective":g.onset?"onset":g.symptom?"clarify":"start";
   }
   if(!i.focus)i.focus=i.injuryFollow?"injuryFollow":i.aftercare?"aftercare":i.rate?"rate":
     i.decision==="replace"?"replace":i.decision==="ignore"?"ignored":
     i.site?"site":i.asked?"ask":i.painPrompted?"painPrompted":"start";
   if(!w.focus)w.focus=w.follow?"follow":w.report?"reported":w.acetViewed?"acet":
     w.positioned?"position":w.exam?"exam":w.arm?"arm":w.triggers?"triggers":
     w.score?"score":w.onset?"onset":"start";
   s=d;save();return true;
  }
 }catch(e){}
 return false;
}
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
 const previous=s.place;
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
  if(!v.site&&!v.painPrompted){
   v.painPrompted=true;v.focus="painPrompted";v.line="護理師，我的手有點痛，可以幫我看一下嗎？";
   note("219病人提醒","第一次準備離開時，病人反映手痛");
   render();return;
  }
  if(v.site&&!v.rate&&!v.ratePrompted&&!v.lineRemoved&&v.decision){
   v.ratePrompted=true;v.focus="ratePrompted";v.line="護理師，現在點滴滴得好像比昨天快，這樣正常嗎？";
   note("219病人提醒","下一次準備離開時，病人才提出滴速疑問");
   render();return;
  }
 }
 if(s.place==="bed217"&&s.b217.bg&&!s.b217.food&&!s.b217.gPriorUnsafe)note("待追蹤","217 床低血糖尚未完成處置");
 s.place=place;tick(2);render();
 walkFrom(previous,place);
}
const WALK_POS={start:[50,53],bed217:[26,52],bed219:[74,52],bed220:[74,64],desk:[26,64],med:[26,64]};
function walkFrom(previous,next){
 if(previous===next)return;
 const from=WALK_POS[previous]||WALK_POS.start,to=WALK_POS[next]||WALK_POS.start;
 for(const [id,dx,dy] of [["nurse",0,0],["cart",7,2]]){
  const node=$(id);
  if(!node||typeof node.animate!=="function")continue;
  if(typeof node.getAnimations==="function")node.getAnimations().forEach(a=>a.cancel());
  const step=(x,y,offset)=>({left:(x+dx)+"%",top:(y+dy)+"%",offset});
  node.animate([
   step(from[0],from[1],0),
   step(from[0],53,.24),
   step(to[0],53,.78),
   step(to[0],to[1],1)
  ],{duration:1100,easing:"ease-in-out"});
 }
}
function coords(){
 const p=WALK_POS[s.place]||WALK_POS.start;
 $("nurse").style.left=p[0]+"%";$("nurse").style.top=p[1]+"%";
 $("cart").style.left=(p[0]+7)+"%";$("cart").style.top=(p[1]+2)+"%";
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

function bed217Stage(v){
 const f=v.focus||"start";
 if(f==="medQuiz"||f==="medQuizAnswer")return "藥物查證";
 if(f==="feedback")return "重新評估";
 if(v.aspirReport||f==="aspirinPlan"||f==="done")return "後續追蹤";
 if(v.stool||f==="stool"||f==="stoolDetail"||f==="bruise"||f==="vital"||f==="aspReview")return "用藥風險評估";
 if(v.bg||f==="bg"||f==="glucoseUnsafe"||f==="food")return "血糖處置";
 if(v.objective||f==="objective"||f==="meal")return "床旁評估";
 return "了解主訴";
}
function bed217Tools(v){
 const focus=v.focus||"start",stage=bed217Stage(v);
 const action=focus==="feedback"?"評估提醒":focus==="medQuizAnswer"?"查證結果":"床旁互動";
 return '<div class="bed217-tools" aria-label="217 床資料查閱">'+
 '<button type="button" data-act="modal:handoff217" class="bed217-tool"><span class="tool-mark tool-book" aria-hidden="true">交</span><span>交班內容</span></button>'+
 '<button type="button" data-act="modal:ehr217" class="bed217-tool"><span class="tool-mark tool-sheet" aria-hidden="true">醫</span><span>目前醫囑</span></button>'+
 '<button type="button" data-act="modal:leaflet" class="bed217-tool"><span class="tool-mark tool-med" aria-hidden="true">藥</span><span>藥物仿單</span></button>'+
 '</div><div class="bed217-section-heading"><span>'+action+'</span><span>'+stage+'</span></div>';
}
function bed217Status(){
 const v=s.b217;
 if(!v.visited)return "未巡視";
 if(v.aspirReport)return "待追蹤";
 if(v.bg&&!v.recheck)return "待追蹤";
 if(v.symptom)return "評估中";
 return "已探視";
}
function refreshWardMap(){
 const states=[
  ["bed217State",bed217Status(),s.place==="bed217"],
  ["bed219State",s.b219.visited?(s.b219.injury&&!s.b219.injuryFollow?"待處理":"已探視"):"未巡視",s.place==="bed219"],
  ["bed220State",s.b220.visited?(s.b220.report?"待追蹤":"評估中"):"未巡視",s.place==="bed220"]
 ];
 for(const [id,label,active] of states){
  const node=$(id);
  if(!node)continue;
  node.textContent=label;
  node.className="bed-map-state"+(active?" is-active":"")+(label==="待處理"||label==="待追蹤"?" has-followup":"");
 }
 const consoleNode=$("wardConsole");
 if(consoleNode)consoleNode.classList.toggle("bed217-active",s.place==="bed217");
}
function render217(){
 const v=s.b217;v.visited=true;
 header("217 床｜臨床評估與給藥","");
 let focus=v.focus||"start",line=v.line||"護理師，我覺得不太舒服，昨天沒有這樣。",a=[];
 const pair=(correct,good,wrong,bad,wrongFirst=false)=>wrongFirst?[btn(bad,wrong),btn(good,correct)]:[btn(good,correct),btn(bad,wrong)];
 if(focus==="start"){
  line="護理師，我覺得不太舒服，昨天沒有這樣。";
  a=pair("217:clarify","「可以請您再描述清楚一點嗎？是哪裡不舒服、什麼感覺？」","doc:glucose","尚未了解症狀，就先打電話向陳醫師報告");
 }else if(focus==="clarify"){
  a=pair("217:onset","「手抖和心悸是從什麼時候開始？還有其他症狀嗎？」","217:wrongClarify","先請病人休息，等一下再了解手抖與心悸");
 }else if(focus==="onset"){
  a=pair("217:objective","先評估意識狀態、瞳孔及是否能安全吞嚥","217:wrongOnset","覺得只是緊張，先不做客觀評估",true);
 }else if(focus==="objective"){
  a=pair(v.symptom?"217:meal":"217:clarify",v.symptom?"「從昨晚到現在，進食的時間與量如何？」":"「可以描述一下剛剛不舒服的情形嗎？」",
     "217:wrongObjective","意識清楚就直接給常規口服藥，不必確認進食情形");
 }else if(focus==="meal"){
  a=pair(v.objective?"217:bg":"217:objective",v.objective?"執行床邊 OneTouch 血糖測量":"補充評估意識及吞嚥安全",
    "217:wrongMeal","直接認定是沒吃早餐引起，不測血糖，稍後再觀察",true);
 }else if(focus==="bg"){
  a=pair("217:glucoseMenu","先針對血糖 68 mg/dL 與手抖、心悸採取處置",
    "doc:glucose","尚未完成當下處置，就直接向陳醫師報告");
 }else if(focus==="glucoseUnsafe"){
  a=[btn("重新評估與處理症狀性低血糖","217:glucoseMenu")];
 }else if(focus==="food"){
  a=pair("doc:glucose","向陳醫師完整報告症狀、進食、血糖及已執行處置",
    "217:wrongFood","不必再通報，直接給所有常規口服藥",true);
 }else if(focus==="glucoseReported"){
  a=pair("217:stool","接續了解病人其他不舒服及排便情形",
    "217:wrongPostReport","血糖已通報就不再評估其餘情形，直接完成所有給藥");
 }else if(focus==="stool"){
  a=pair("217:stoolDetail","「請描述便色、性質、次數及大約的量。」",
    "doc:aspirin","光聽到便色較深，就立刻向醫師報告要停 Aspirin",true);
 }else if(focus==="stoolDetail"){
  a=pair("217:bruise","評估皮膚瘀青及其他出血徵象",
    "217:wrongStoolDetail","只要今天沒再排黑便，就可以忽略出血風險");
 }else if(focus==="bruise"){
  a=pair("217:vital","測量血壓、心跳並確認有無循環異常",
    "217:wrongBruise","只有少量瘀青就不必測生命徵象",true);
 }else if(focus==="vital"){
  a=pair("217:aspReview","核對 Aspirin 1 cap PO QD 醫囑與給藥紀錄",
    "217:wrongVital","未查詢 Aspirin 醫囑，就自行決定停藥");
 }else if(focus==="aspReview"){
  a=pair("doc:aspirin","整理排便、瘀青、生命徵象與用藥後向陳醫師報告",
    "217:wrongAspReview","有原醫囑就直接給 Aspirin，不必報告疑似出血風險",true);
 }else if(focus==="aspirReported"){
  a=pair("217:aspirinMenu","依評估及醫師回覆確認本次 Aspirin 給藥安全",
    "217:wrongAspirReported","未取得後續醫囑，直接自行決定永久停 Aspirin");
 }else if(focus==="aspirinPlan"){
  line="已完成 Aspirin 給藥前安全判斷，後續仍須依醫師回覆與有效醫囑追蹤。";
  a=[btn("接續巡房及其他照護工作","217:finish")];
 }
 else if(focus==="medQuiz"){
  line="查看 Aspirin 1 cap PO QD 的資料後，你認為它的主要作用是什麼？";
  a=[btn("抗血小板作用，降低血栓形成風險","quiz:asp"),btn("抑制胃酸分泌","quiz:fam")];
 }else if(focus==="medQuizAnswer"){
  line=v.medQuiz.answer;
  a=[btn("返回剛才的照護進度","quiz:next")];
 }
 else if(focus==="feedback"){
  line=v.lastFeedback||"需要補充目前未完成的評估。";
  a=[btn("回到病人旁，補充評估後再決定","217:resume")];
 }else if(focus==="done"){
  line="已完成目前的症狀評估及藥物作用說明，請記得追蹤原先的血糖及醫師處置。";
  a=[btn("查看學習紀錄","end:review")];
 }else if(focus==="recheck"){
  a=[btn("接續了解排便與 Aspirin 給藥安全","217:stool")];
 }
 if(v.bg&&!v.recheck&&s.minute>=v.bgMinute+15&&focus==="glucoseReported"){
  a=[btn("回到 217 床複測血糖、追蹤症狀","217:recheck"),
     btn("沒有必要複測，直接繼續常規給藥","217:wrongRecheck")];
 }
 const resultState=["objective","bg","vital","recheck"].includes(focus);
 const quizState=focus==="medQuiz"||focus==="medQuizAnswer";
 const patientLabel=quizState?"藥物作用判斷":resultState?"床旁評估結果":"217 床病人";
 const body=focus==="feedback"?
  '<section class="assessment-alert bed217-alert" role="alert"><strong>需要補充評估</strong><p>'+line+'</p></section>':
  '<section class="bed217-statement '+(resultState?"is-observation":quizState?"is-quiz":"is-patient")+'">'+
   '<div class="bed217-speaker"><span class="speaker-symbol" aria-hidden="true">'+(resultState?"觀":quizState?"藥":"人")+'</span>'+patientLabel+'</div>'+
   '<p>'+line+'</p></section>';
 let follow="";
 if(v.bg&&focus!=="bg"&&focus!=="start"&&focus!=="feedback"){
  follow='<div class="bed217-followup"><span aria-hidden="true">●</span>血糖 68 mg/dL'+
   (v.recheck?" · 已複測 "+v.recheckValue+" mg/dL":" · 尚待複測")+"</div>";
 }
 const actionArea=a.length?'<div class="bed217-answer-heading">你的下一步</div>'+choices(...a):"";
 return '<div class="bed217-view">'+bed217Tools(v)+body+follow+actionArea+"</div>";
}
function render219(){
 const v=s.b219;v.visited=true;
 header("219 床｜點滴照護","");
 let line=v.line||"護理師，早安。",a=[];
 if(v.injury&&!v.injuryFollow){
  line="護理師，我的手越來越痛。";
  return box("219 床病人",line)+noteBox("入針處紅斑擴大、局部溫度升高並出現壓痛；需評估疑似靜脈炎。")+
    choices(btn("停止使用原通路，依規範移除並執行照護","219:injuryFollow"));
 }
 const f=v.focus||"start";
 if(f==="start"){
  line="護理師，早安。";
  a=[btn("詢問點滴部位是否疼痛或不舒服","219:ask"),btn("主動檢查留置針部位與敷料","219:site")];
 }else if(f==="ask")a=[btn("檢視穿刺處、皮膚與敷料","219:site")];
 else if(f==="site"){
  line="留置針入針處局部泛紅，敷料完整；病人沒有明顯壓痛。";
  a=[btn("評估後停止使用異常通路，依規範處理","219:replace"),
     btn("病人沒喊痛、點滴還能滴，暫時繼續使用","219:ignore")];
 }else if(f==="replace"||f==="injuryFollow"){
  line="已停止使用原通路，需要完成穿刺處照護與後續輸液安排。";
  a=[btn("處理穿刺處並安排新輸液通路","219:aftercare")];
 }else if(f==="aftercare"||f==="ratePrompted"){
  line=v.ratePrompted&&!v.rate?"護理師，現在點滴滴得好像比昨天快，這樣正常嗎？":"目前已安排後續輸液。";
  a=!v.rate?[btn("開啟工作車，核對有效醫囑與滴速","modal:cart")]:[btn("前往其他病床","go:bed217")];
 }else if(f==="rate"){
  line="已核對目前有效輸液醫囑與實際滴速。";
  a=[btn("接續其他病床照護","go:bed217")];
 }else if(f==="painPrompted"){
  line="護理師，我的手有點痛，可以幫我看一下嗎？";
  a=[btn("評估留置針入針處周圍","219:site"),btn("點滴還能滴，晚點再處理","219:ignore")];
 }else if(f==="ignored"){
  a=[btn("返回評估並停止有疑慮通路","219:injuryFollow")];
 }else if(!v.site)a=[btn("檢查留置針部位","219:site")];
 if(v.ratePrompted&&!v.rate&&f!=="ratePrompted"&&f!=="painPrompted"&&!v.lineRemoved&&a.length<2)
  a.push(btn("打開工作車核對滴速","modal:cart"));
 return box("219 床病人",line)+(a.length?choices(...a):"");
}
function render220(){
 const v=s.b220;v.visited=true;
 header("220 床｜左肩疼痛","");
 let line=v.line||"護理師，我左邊肩膀有點痛。",a=[],f=v.focus||"start";
 if(f==="start"){
  line="護理師，我左邊肩膀有點痛。";
  a=[btn("「肩膀什麼時候開始痛？以前會這樣嗎？」","220:onset"),
     btn("只問了哪裡痛，就先向林醫師報告","doc:shoulder")];
 }else if(f==="onset")a=[btn("「痛起來是什麼感覺？現在大約幾分？」","220:score")];
 else if(f==="score")a=[btn("「哪個時候會更痛？靠著枕頭或休息會好一點嗎？」","220:triggers")];
 else if(f==="triggers")a=[btn("「中風後左手有力氣嗎？坐起來時怎麼放？」","220:arm")];
 else if(f==="arm")a=[btn("檢視患側上肢姿勢、肩部及支托情形","220:exam")];
 else if(f==="exam"){
  line="客觀觀察：左上肢無力，坐姿時缺少適當支托；可能有肩部牽拉風險。";
  a=[btn("協助患側適當支托及擺位，並執行衛教","220:position")];
 }else if(f==="position")a=[btn("核對 Acetaminophen 與 Norvasc 醫囑","220:acet")];
 else if(f==="acet")a=[btn("向林醫師完整報告疼痛及藥膏需求","doc:shoulder")];
 else if(f==="reported")a=[btn("追蹤疼痛及患側擺位","220:follow")];
 else if(f==="follow")a=[btn("檢視完成的評估與分數","end:review")];
 let content=box(f==="exam"?"肩部與患側肢體評估":"220 床病人",line);
 if(f==="arm"||f==="exam")
  content+='<div class="thought-bubble"><b>護理師內心 OS</b><p>「患側沒有支托，肩膀可能受到牽拉，會不會增加疼痛或半脫位風險？還需要進一步評估。」</p></div>';
 return content+(a.length?choices(...a):"");
}
function renderDesk(){
 header("護理站｜查閱資料與工作待辦","");
 let h=box("護理站","選擇想查閱的紀錄；新抗生素醫囑會隨工作時間開啟。")+status();
 h+=choices(btn("217 床｜電子病歷、血糖紀錄、醫囑","modal:ehr217"),
 btn("219 床｜一般輸液醫囑","modal:ehr219"),
 btn("220 床｜復健與用藥紀錄","modal:ehr220"),
 btn("新醫囑｜Clindamycin → Cefepime","modal:abx"),
 btn("無菌備藥流程","go:med"),
 btn("查看巡房進度","end:review"));
 return h;
}
function renderMed(){
 const a=s.abx;
 header("新醫囑｜無菌備藥","");
 const prompts=[
 ["準備前核對","核對病人、Cefepime 醫囑、藥名、溶劑與配製要求"],
 ["無菌準備","完成手部衛生、工作區清潔與穿刺部位消毒"],
 ["抽藥污染情境","抽藥時碰觸到須保持無菌的關鍵部位，應如何處理？"]
 ];
 if(a.finished)return box("治療室","你已完成本次教學無菌準備與污染應變。")+choices(btn("回護理站","go:desk"));
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
 noteBox("同一評分項目只計首次決策；病人提示、再次評估、修正與補救則完整保留操作歷程。沒有接觸的項目顯示「未評估」，不等同於做錯。此為教學，不是 EPA 信賴等級。");
}

function safeHTML(value){
 return String(value==null?"":value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function wardFinished(){
 return !!(s.b217.visited&&s.b219.visited&&s.b220.visited&&
   s.b217.aspirReport&&
   ["gAction","ivDecision","shoulderReport"].every(k=>Object.prototype.hasOwnProperty.call(s.score,k)));
}
function submissionUI(){
 const id=s.identity||{fullName:"",unit:"",phase:"試玩"},up=s.upload||{id:"",state:""};
 const sent=up.state==="sent",sending=up.state==="sending";
 const disabled=sent||sending;
 const status=sent?"已發送至 Apps Script，請到教師試算表確認是否確實入庫。由於 Google Apps Script 跨網域限制，本頁無法直接讀取寫入成功回應。":
  sending?"正在傳送，請稍候……":
  up.state==="failed"?"傳送時發生連線錯誤："+safeHTML(up.error||"請檢查網路並重試"):"";
 const phase=id.phase||"試玩";
 const completed=wardFinished();
 return '<div class="submit-identity"><h3>提交本次病房評量</h3>'+
  '<div class="submit-identity-grid">'+
  '<label for="submitFullName">姓名<input id="submitFullName" type="text" maxlength="40" value="'+safeHTML(id.fullName)+'" '+(disabled?"disabled":"")+' required></label>'+
  '<label for="submitUnit">單位<input id="submitUnit" type="text" maxlength="60" value="'+safeHTML(id.unit)+'" '+(disabled?"disabled":"")+' required></label>'+
  '<label for="submitPhase">評量階段<select id="submitPhase" '+(disabled?"disabled":"")+'>'+
   ["試玩","前測","後測"].map(v=>'<option value="'+v+'" '+(v===phase?"selected":"")+'>'+v+"</option>").join("")+
  "</select></label></div>"+
  '<small>本次記錄狀態：'+(completed?"已完成核心任務":"仍有核心任務未完成")+'。原有評分採首次選擇，未完成項目保持「未評估」。姓名與單位只用於教師辨識，不應填入病人資料。</small>'+
  (status?'<div role="status" class="submit-state'+(up.state==="failed"?" warning":"")+'">'+status+"</div>":"")+
  (up.id?'<small>本次提交編號：'+safeHTML(up.id)+'</small>':"")+
  '<button type="button" class="choice" data-act="end:submit" '+(disabled?"disabled":"")+">"+
  (sent?"已送出":sending?"傳送中……":"送出成績與操作紀錄")+"</button>"+
  '<small>請勿在確認資料入庫前清除本機進度；重新試玩會重設分數及提交編號。</small>'+
  "</div>";
}
async function submitWardGame(){
 const up=s.upload||{id:"",state:"",error:""};
 if(up.state==="sending"||up.state==="sent")return;
 const name=$("submitFullName")?.value.trim()||"";
 const unit=$("submitUnit")?.value.trim()||"";
 const phase=$("submitPhase")?.value||"試玩";
 if(!name||!unit){
  if(typeof window.alert==="function")window.alert("請完整填寫姓名和單位，再提交成績。");
  const missing=!name?$("submitFullName"):$("submitUnit");
  if(missing&&typeof missing.focus==="function")missing.focus();
  return;
 }
 const completed=wardFinished();
 if(!completed&&typeof window.confirm==="function"&&!window.confirm("目前仍有病房主要任務未完成，要以「未完成」狀態送出這次試玩紀錄嗎？"))return;
 s.identity={fullName:name,unit,phase};
 if(!up.id)up.id="NS-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,14);
 up.state="sending";up.error="";s.upload=up;save();render();
 const values=s.score||{};
 const firstUnsafe=(s.log||[]).filter(x=>String(x.label||"").startsWith("首次決策／")&&String(x.value||"").startsWith("0 分")).length;
 const corrections=(s.log||[]).filter(x=>String(x.label||"").startsWith("補充／")||String(x.label||"").includes("補救")).length;
 const payload={
  type:"nursestart_ward_v1",submissionId:up.id,
  learnerCode:name,fullName:name,unit,phase,
  status:completed?"完成":"未完成",
  version:"ward-v6",durationSeconds:Math.max(0,Math.round((Date.now()-(s.startedAt||Date.now()))/1000)),
  scores:{...values},
  visitedBeds:{bed217:!!s.b217.visited,bed219:!!s.b219.visited,bed220:!!s.b220.visited},
  events:(s.log||[]).slice(0,500).map(x=>({time:x.time,place:x.place,label:x.label,value:x.value})),
  firstUnsafeCount:firstUnsafe,correctedCount:corrections
 };
 try{
  // The deployed Apps Script processes text/plain JSON in doPost().
  // no-cors avoids a cross-origin preflight but cannot expose the server response.
  await fetch(SUBMIT_URL,{
   method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=UTF-8"},
   body:JSON.stringify(payload),redirect:"follow"
  });
  up.state="sent";
 }catch(err){
  up.state="failed";up.error=String(err?.message||err||"傳送失敗");
 }
 save();if(s.place==="end")render();
}

function reflectionUI(){
 return '<section class="learner-reflection">'+
  '<h3>你的臨床判斷</h3>'+
  '<label for="clinicalReflection">這次巡房中，哪一個線索最影響你的決定？為什麼？</label>'+
  '<textarea id="clinicalReflection" maxlength="260" rows="3" placeholder="用你自己的話描述，不必照標準答案">'+safeHTML(s.freeText?.reflection||"")+'</textarea>'+
  '<p>自由填寫；儲存後將與首次決策及操作歷程一起保留，供教師引導回顧。</p>'+
  '<button class="choice" type="button" data-act="end:saveReflection">儲存我的想法</button>'+
  '</section>';
}
function renderEnd(){
 header("巡房回顧｜臨床決策紀錄","");
 const unseen=[["bed217","217 床",!!s.b217.visited],["bed219","219 床",!!s.b219.visited],["bed220","220 床",!!s.b220.visited]].filter(x=>!x[2]);
 let h=(unseen.length?noteBox("<b>還有病床尚未探視：</b>"+unseen.map(x=>x[1]).join("、")+"。請先完成巡房，才能視為全部結束。")+choices(...unseen.map(x=>btn("前往 "+x[1], "go:"+x[0]))):"")+scoreSummary()+reflectionUI()+submissionUI()+choices(btn("回到病房繼續值班","end:continue"),btn("複製學習紀錄","end:copy"),btn("從頭重新試玩","end:reset"));
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
 $("scene").innerHTML=html;refreshWardMap();save();
}
function openModal(kind){
 if(s.place==="bed217"&&["handoff217","ehr217","leaflet"].includes(kind)){
  note("217資料查閱",kind==="handoff217"?"查看交班":kind==="ehr217"?"查看電子病歷與醫囑":"查看藥物仿單");
 }
 modal=kind;$("overlay").classList.remove("hidden");
 drawModal();
}
function closeModal(){
 const wasGlucoseReply=modal==="reply:glucose";
 modal="";$("overlay").classList.add("hidden");
 if(wasGlucoseReply&&s.bell&&!s.bellHandled&&!s.bellPromptShown){
  s.bellPromptShown=true;
  openModal("bellNotice");
 }
}
function doctorReport(kind){
 const g=s.b217,v=s.b220;
 if(kind==="glucose"){
  let missing=[];
  if(!g.symptom)missing.push("主訴與伴隨症狀");
  if(!g.onset)missing.push("症狀開始時間與持續情形");
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
  g.aspReview?"目前有 Aspirin 1 cap PO QD 醫囑，給藥前正在釐清疑似出血風險。":"",
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
 if(modal==="bellNotice"){
  title="219 床｜呼叫鈴";
  html='<div class="bell-notice-hero" role="alert">'+
       '<span class="bell-visual" aria-hidden="true">🔔</span>'+
       '<div><strong>219 床呼叫鈴響起</strong><p>你正在處理 217 床的工作，現在又有另一床需要協助。</p></div></div>'+
       '<label class="bell-thought-label" for="bellReason">你現在會怎麼安排？請寫下一句判斷理由（可選填）</label>'+
       '<textarea id="bellReason" maxlength="180" rows="3" placeholder="寫下你當下的想法，不必使用標準答案">'+safeHTML(s.freeText?.bell||"")+'</textarea>'+
       '<p class="bell-thought-tip">這句話會連同你接下來的選擇存入教師後台，作為課後討論依據。</p>'+
       pbtn("安排 217 床後續血糖追蹤，並前往確認 219 床","bell:assign")+
       pbtn("先前往 219 床查看，再回頭確認 217 床追蹤安排","bell:go");
 }else if(modal==="cart"){
  title="護理工作車";
  if(p==="bed219"){
    html='<div class="record-head">219 床｜輸液醫囑</div><table class="record">'+
    '<tr><th>點滴</th><td>0.9% N/S 500 mL IVD BID</td></tr>'+
    '<tr><th>流速</th><td>60 mL/hr</td></tr></table>'+
    (i.lineRemoved?'<div class="panel-answer">原留置針已停止使用，待確認後續輸液通路。</div>':
    pbtn("完成本次醫囑與滴速核對","219:rate"));
  }else if(p==="bed220"){
    html='<div class="record-head">220 床｜給藥醫囑</div><table class="record">'+
    '<tr><th>Acetaminophen</th><td>1 tab PO BID</td></tr>'+
    '<tr><th>Norvasc</th><td>1 tab PO QD</td></tr></table>'+
    pbtn("確認這兩筆醫囑","220:acet");
  }else{
    html='<div class="record-head">217 床｜給藥醫囑</div><table class="record">'+
    '<tr><th>Aspirin</th><td>1 cap PO QD</td></tr>'+
    '<tr><th>Famotidine</th><td>1 tab PO BID</td></tr>'+
    '<tr><th>Metformin</th><td>1 tab PO BID</td></tr></table>'+
    pbtn("查閱 Aspirin 藥物作用與仿單","quiz:openLeaflet");
  }
 
 }else if(modal==="handoff217"){
 title="217 床｜交班內容";
 html='<div class="record-head">217 床｜本班照護資訊</div>'+
 '<div class="panel-answer"><b>病人背景：</b>腦中風後住院接受復健照護，目前沒有吞嚥障礙問題。</div>'+
 '<div class="panel-answer"><b>本班事項：</b>上午需核對常規醫囑與病人當下狀況，依評估結果執行給藥安全查核。</div>'+
 '<p class="panel-info">交班內容僅包含前一班已知事項。當下新出現的症狀，仍需要你到床旁詢問及評估。</p>';
 }else if(modal==="ehr217"){
 title="217 床｜電子病歷";
 html='<div class="record-head">血糖紀錄</div><table class="record">'+
 '<tr><th>昨日 06:30</th><td>108 mg/dL</td></tr><tr><th>昨日 21:00</th><td>126 mg/dL</td></tr>'+
 (g.bg?'<tr><th>今日床邊血糖</th><td>68 mg/dL</td></tr>':"")+
 (g.recheck?'<tr><th>處置後複測</th><td>'+g.recheckValue+" mg/dL</td></tr>":"")+'</table>'+
 '<div class="record-head">醫囑</div><table class="record">'+
 '<tr><th>0.9% N/S</th><td>500 mL IVD BID</td></tr>'+
 '<tr><th>Aspirin</th><td>1 cap PO QD</td></tr>'+
 '<tr><th>Famotidine</th><td>1 tab PO BID</td></tr>'+
 '<tr><th>Metformin</th><td>1 tab PO BID</td></tr></table>';
 
 }else if(modal==="ehr219"){
 title="219 床｜輸液醫囑";
 html='<table class="record"><tr><th>0.9% N/S</th><td>500 mL IVD BID</td></tr>'+
 '<tr><th>流速</th><td>60 mL/hr</td></tr></table>';
 
 }else if(modal==="ehr220"){
 title="220 床｜醫囑紀錄";
 html='<div class="record-head">腦中風後左側偏癱，住院接受復健治療</div>'+
 '<table class="record"><tr><th>Acetaminophen</th><td>1 tab PO BID</td></tr>'+
 '<tr><th>Norvasc</th><td>1 tab PO QD</td></tr></table>';
 
 }else if(modal==="abx"){
 title="217 床｜抗生素醫囑與檢驗";a.order=true;
 html='<div class="record-head">Clindamycin 停用；Cefepime 新增</div>'+
 pbtn("查看血液培養報告","abx:culture")+
 pbtn("查看藥物過敏史","abx:allergy")+
 pbtn("查看腎功能","abx:renal")+
 pbtn("核對醫囑，決定備藥","abx:decide");
 if(a.culture)html+='<div class="panel-answer"><b>Blood culture</b>：GNB／Acinetobacter spp.／Cefepime S</div>';
 if(a.allergy)html+='<div class="panel-answer"><b>藥物過敏史</b>：Vancomycin HCl／Skin rash</div>';
 if(a.renal)html+='<div class="panel-answer"><b>Cr</b>：0.8 mg/dL　<b>eGFR</b>：96 mL/min/1.73 m²</div>';
 
 }else if(modal.startsWith("need:")){
  const kind=modal.slice(5),r=doctorReport(kind);
  title=(kind==="shoulder"?"220 床":"217 床")+"｜評估尚未完成";
  html='<div class="assessment-alert" role="alert"><strong>評估尚未完成，請先補充資料再向醫師通報。</strong><p>目前缺少：</p><p>'+r.missing.join("、")+"</p></div>"+
   pbtn("返回床旁繼續評估","close");
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
 }else if(modal==="leaflet"){
  title="藥品仿單｜作用重點";
  html='<div class="record-head">目前三種口服藥物的主要作用</div><table class="record">'+
    '<tr><th>Aspirin</th><td>抗血小板，降低血栓形成風險</td></tr>'+
    '<tr><th>Famotidine</th><td>抑制胃酸分泌</td></tr>'+
    '<tr><th>Metformin</th><td>協助控制血糖</td></tr></table>'+
    '<p class="panel-info">這裡為作用重點；正式藥品仿單依實際廠牌與許可證查詢。</p>'+
    '<p><a href="https://mcp.fda.gov.tw/" target="_blank" rel="noopener noreferrer">開啟食藥署正式藥品仿單查詢平台 ↗</a></p>'+
    pbtn("辨識 Aspirin 的主要作用","quiz:start");
 }else if(modal==="glucose"){
  title="217 床｜血糖 68 mg/dL";
  html='<div class="panel-answer"><b>當下資料：</b> '+(g.objective?"GCS E4V5M6，Pupil size 2.0 mm (+) OU，已評估吞嚥安全。":"尚未完成意識與吞嚥安全評估。")+' 手抖、心悸。</div>'+
  pbtn("確認病人可安全吞嚥，先請病人進食早餐，同步通報陳醫師並安排複測","glucose:meal")+
  pbtn("不先處理症狀，照常給 Metformin，等下次常規血糖","glucose:unsafeMed");
 }else if(modal==="med217"){
  title="217 床｜給藥條件";html=pbtn("Metformin：核對病況、進食、腎功能及醫囑","217:metformin")+
   pbtn("Famotidine：核對適應症並回應用藥疑慮","217:famotidine")+
   pbtn("Aspirin：先評估出血風險並通報確認給藥","217:aspirinMenu");
 }else if(modal==="aspirinMenu"){
  title="217 床｜Aspirin 給藥安全";
  html=box("用藥決策","已出現疑似出血線索，你會如何決定本次 Aspirin 給藥？")+
  pbtn("因有原醫囑，就不確認異常直接給藥","aspirin:unsafe")+
  pbtn("先完成出血評估、醫師通報及核對，再依醫囑處理","aspirin:safe");
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
 const wrong={
  wrongClarify:"病人已主訴手抖與心悸，還需要詢問發生時間及其他症狀，不能只請病人休息。",
  wrongOnset:"不能僅憑病人能對答，就把手抖與心悸認定為緊張；應完成必要客觀評估。",
  wrongObjective:"尚未確認進食與當下病況，不應直接執行常規口服給藥。",
  wrongMeal:"進食不足可能與症狀有關，但不能只靠推測，仍須測得當下血糖。",
  wrongFood:"不能因為已經請病人進食，就忽略必要通報及後續血糖追蹤。",
  wrongPostReport:"血糖通報不代表所有照護已完成，仍須釐清病人其他症狀和給藥風險。",
  wrongRecheck:"血糖 68 mg/dL 已有症狀，完成處置後需要複測並追蹤，不應直接跳過。",
  wrongStoolDetail:"一次偏黑、較黏的排便仍需進一步評估可能的出血徵象。",
  wrongBruise:"出現便色變深、瘀青，需要測量生命徵象並評估是否有其他異常。",
  wrongVital:"應核對 Aspirin 醫囑、完成評估及通報，不能自行決定永久停藥。",
  wrongAspReview:"有 Aspirin 醫囑並不代表可以忽略新出現的疑似出血徵象。",
  wrongAspirReported:"沒有醫師確認，不應自行決定永久停用 Aspirin。",
  wrongFamotidine:"回答病人疑問前應先查證藥物用途，不能只用「醫師有開」代替衛教。"
 };
 if(wrong[k]){
  const previous=v.focus||"start";
  if(["stool","stoolDetail","bruise","vital","aspReview","aspirReported","aspirinPlan"].includes(previous))v.aMistakes++;
  else v.gMistakes++;
  v.returnFocus=previous;v.lastFeedback=wrong[k];v.focus="feedback";
  note("217 床首次判斷","未完成適當評估："+wrong[k]);
  render();return;
 }
 if(k==="resume"){
  v.focus=v.returnFocus||"start";
  note("217 床補充評估","經提示後返回："+v.focus);
  render();return;
 }
 if(["clarify","onset","objective","meal","bg","stool","stoolDetail","bruise","vital","aspReview","recheck"].includes(k))v.focus=k;
 if(k==="clarify"){v.symptom=true;v.line="我手有點抖，心臟跳得有點快，昨天沒有這樣。";note("217主訴","主動釐清手抖與心悸")}
 if(k==="onset"){v.onset=true;v.line="剛才開始，現在還有一點抖，也覺得虛虛的。";note("217症狀","詢問發作時間與伴隨症狀")}
 if(k==="objective"){v.objective=true;v.swallow=true;v.line="客觀評估：GCS E4V5M6，Pupil size 2.0 mm (+) OU；意識清楚、可正常對答，完成吞嚥安全評估。";note("217客觀評估","意識、瞳孔及安全吞嚥")}
 if(k==="meal"){v.meal=true;v.line="昨晚睡前到現在大概九個小時都沒正常吃東西，早上只喝幾口豆漿。";note("217進食詢問","約九小時未正常進食")}
 if(k==="bg"){v.bg=true;v.bgMinute=s.minute;v.line="床邊 OneTouch 血糖數值：68 mg/dL。";note("217血糖","實際測得 68 mg/dL");point("gAssess",!v.symptom||!v.objective||!v.meal?0:v.gMistakes===0?2:v.gMistakes===1?1:0,"症狀、客觀評估、進食及血糖量測的首次判斷");}
 if(k==="finish"){v.focus="done";note("217本階段","完成給藥判斷，後續追蹤仍待完成");render();return;}
 if(k==="handoff"){s.handoff=true;note("217追蹤交接","確認血糖複測與症狀追蹤、安排必要協助");render();return}
 if(k==="glucoseMenu"){openModal("glucose");return}
 if(k==="recheck"){
  if(s.minute<v.bgMinute+15){v.line="血糖處置後仍需等到安排的複測時點；期間請持續觀察症狀。";note("血糖追蹤","複測時點尚未到");}
  else {v.recheck=true;v.recheckValue=96;v.line="這次複測血糖 96 mg/dL；病人表示手抖與心悸已較先前減輕。";note("217複測","96 mg/dL，症狀減輕（個案數值）");}
 }
 if(k==="stool"){v.stool=true;v.line="昨天晚上大便顏色看起來比平常深，我也不確定是怎麼回事。";note("217排便主訴","昨晚便色偏深")}
 if(k==="stoolDetail"){v.stoolDetail=true;v.line="昨晚只有一次，比平常黑、比較黏，量我沒注意。";note("217排便追問","偏黑較黏，一次，量未注意")}
 if(k==="bruise"){v.bruise=true;v.line="手臂有幾塊瘀青，我不確定什麼時候有的。";note("217出血評估","手臂瘀青；尚未證實消化道出血")}
 if(k==="vital"){v.vital=true;v.line="生命徵象：BP 126/78 mmHg，HR 82/min；無法排除仍有出血風險。";note("217生命徵象","BP126/78，HR82")}
 if(k==="aspReview"){v.aspReview=true;v.line="你已查閱 Aspirin 醫囑與使用紀錄；尚須依當下病況決定是否適合給藥。";note("217醫囑","核對 Aspirin");closeModal()}
 if(k==="aspirinMenu"){openModal("aspirinMenu");return}
 if(k==="metformin"){v.metforminChecked=true;point("med217",v.bg&&v.food?2:1,"核對 Metformin、病況與低血糖後給藥條件");v.line="已核對 Metformin 的給藥條件；不可把低血糖直接歸因於 Metformin 單用。";closeModal()}
 if(k==="famotidine"){v.famotidineChecked=true;v.line="已核對 Famotidine 適應症，不能因病人沒有胃痛就自行停藥。";note("217用藥","核對 Famotidine 與病人疑慮");closeModal()}
 render();
}
function do219(k){
 const v=s.b219;tick();
 if(["site","ask","replace","ignore","injuryFollow","rate","aftercare"].includes(k))v.focus=k==="ignore"?"ignored":k;
 if(k==="site"){v.site=true;v.red=true;v.line="觀察：入針處局部泛紅，敷料完整。病人尚未主訴明顯壓痛。";note("219穿刺評估",v.painPrompted?"病人提醒後觀察到泛紅":"自主發現局部泛紅");point("ivAssess",v.painPrompted?1:2,"已查看留置針周圍")}
 if(k==="ask"){v.asked=true;v.line="目前不會很痛，但那附近有點怪怪的。";note("219訪談","詢問輸液部位不適")}
 if(k==="replace"){v.decision="replace";v.lineRemoved=true;v.line="已停止使用原有疑慮的周邊靜脈留置針並依規範移除，需安排後續輸液通路。";note("219處置","移除有疑慮的通路");point("ivDecision",2,"主動安全處置")}
 if(k==="ignore"||k==="ignoreAgain"){v.decision="ignore";v.injuryMinute=s.minute;v.line="點滴還能滴，暫時不處理。";note("219不安全處置","忽略留置針異常");point("ivDecision",0,"首次選擇忽略異常")}
 if(k==="injuryFollow"){v.injuryFollow=true;v.decision="rescued";v.lineRemoved=true;v.line="已停止輸液、移除有疑慮的留置針並評估疑似靜脈炎，後續追蹤局部狀況。";note("219補救","移除異常通路；首次不安全選擇保留 0 分");point("ivDecision",0,"補救但不回補首次分數")}
 if(k==="rate"&&v.lineRemoved){note("219安全提醒","尚未重新建立通路，不應核對實際流速");closeModal();render();return;}
 if(k==="rate"){v.rate=true;v.line="已核對 219 床有效輸液醫囑與實際滴速。";note("219輸液","比對醫囑與實際滴速，非輸液幫浦");point("ivRate",v.ratePrompted?1:2,"已確認輸液滴速");closeModal()}
 if(k==="aftercare"){v.aftercare=true;v.lineRemoved=false;v.line="已完成穿刺處照護，依有效醫囑確認新建立的周邊靜脈輸液通路；續評估局部狀況。";point("return",2,"有安排後續輸液與再評估");note("219追蹤","記錄後續輸液通路及皮膚照護")}
 render();
}
function do220(k){
 const v=s.b220;tick();
 if(["onset","score","triggers","arm","exam","position","acet","follow"].includes(k))v.focus=k;
 if(k==="onset"){v.onset=true;v.line="中風以後開始會痛，以前沒有這麼明顯。";note("220疼痛起始","腦中風後開始")}
 if(k==="score"){v.score=true;v.line="左肩痠痠的，大概兩分，並不是突然很尖銳的疼痛。";note("220疼痛強度","左肩 2/10")}
 if(k==="triggers"){v.triggers=true;v.line="復健治療後或移位比較痛，有枕頭靠著托住手會好一點。";note("220疼痛因素","復健後加重，支托緩解")}
 if(k==="arm"){v.arm=true;v.line="中風以後左手沒什麼力氣，常常甩來甩去，我都要用右手幫忙扶。";note("220患側功能","左側偏癱、未適當支托")}
 if(k==="exam"){v.exam=true;v.line="評估：左上肢無力，坐姿時患側前臂下垂且支托不足；需留意牽拉相關肩痛，不能單憑此確診半脫位。";note("220姿勢評估","患側缺乏適當支托")}
 if(k==="position"){
  v.positioned=true;v.line="已示範枕頭支托患側上肢，提醒移位時避免拉扯患側手臂。";
  point("shoulderCare",v.prompted?1:2,"完成患側擺位及衛教");note("220衛教","支托患側上肢、避免牽拉");
 }
 if(k==="acet"){v.acetViewed=true;v.line="已查閱醫囑：Acetaminophen 1 tab PO BID、Norvasc 1 tab PO QD。";note("220 給藥紀錄","核對 Acetaminophen 與 Norvasc");closeModal()}
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
  if(kind==="glucose"){v.glucoseReported=true;v.focus="glucoseReported";s.bell=true;point("gReport",v.glucosePrompted?1:2,"完成簡短血糖電話通報");note("219床呼叫鈴","217 床已安排通報，另床發出呼叫");}
  if(kind==="aspirin"){v.aspirReport=true;v.focus="aspirReported";point("aAssess",!v.stoolDetail||!v.bruise||!v.vital?0:v.aMistakes===0?2:v.aMistakes===1?1:0,"排便、瘀青、生命徵象及醫囑查核");point("aReport",v.aspirPrompted?1:2,"完成 Aspirin 疑似出血通報");}
  if(kind==="shoulder"){v.report=true;v.focus="reported";point("shoulderAssess",v.onset&&v.score&&v.triggers&&v.arm&&v.exam?2:1,"完成疼痛及患側評估");point("shoulderReport",v.prompted?1:2,"向林醫師報告左肩疼痛與藥膏需求");}
  note("醫師通報",r.doctor+"收到完整病況，未擅自代醫師開立新處置");
 }
 modal="reply:"+kind;drawModal();render();
}
function act(token){
 const p=token.split(":"),a=p[0],b=p[1];if(!a)return;
 if(a==="bell"){
  const thought=String($("bellReason")?.value||"").trim().slice(0,180);
  if(!s.freeText)s.freeText={bell:"",reflection:""};
  s.freeText.bell=thought;
  if(thought)note("學員思維｜跨床處置",thought);
  note("呼叫鈴決策",b==="assign"?"安排217床追蹤，再查看219床":"先查看219床，再回頭安排217床追蹤");
  if(b==="assign"){s.handoff=true;note("217追蹤交接","安排血糖複測與症狀追蹤");}
  if(!["assign","go"].includes(b))return;
  move("bed219");return;
 }
 if(a==="go"){move(b);return}
 if(a==="217"){do217(b);return}
 if(a==="219"){do219(b);return}
 if(a==="220"){do220(b);return}
 if(a==="modal"){openModal(b==="cart"?"cart":b);return}
 if(a==="doc"){
  if(b==="glucose"||b==="aspirin"||b==="shoulder"){
   const r=doctorReport(b);
   if(r&&r.missing.length){
    const v=b==="shoulder"?s.b220:s.b217;
    if(b==="glucose")v.glucosePrompted=true;
    else if(b==="aspirin")v.aspirPrompted=true;
    else{v.prompted=true;v.firstPremature=true;}
    note((b==="shoulder"?"220":"217")+" 床提早通報嘗試",b+"：評估尚未完整："+r.missing.join("、"));
    openModal("need:"+b);return;
   }
  }
  openModal("doc:"+b);return;
 }
 if(a==="report"){report(b);return}
 if(a==="glucose"){
  const v=s.b217;
  if(b==="meal"||b==="protocol"){
   const safe=v.objective&&v.bg;const score=safe?(v.glucosePrompted?1:2):0;
   if(safe){v.food=true;v.focus="food";v.line="已確認可安全吞嚥，先請病人進食早餐，並同步向陳醫師通報；後續須按臨床指引追蹤低血糖。";note("217處置","先請病人吃早餐並同步通報，安排血糖追蹤");}
   else{v.glucosePrompted=true;v.focus="glucoseUnsafe";v.line="尚未完成當下意識與安全吞嚥評估，不能直接認定可以安全口服；請先補做必要評估。";note("217安全提示","進食前需完成吞嚥與意識評估");}
   point("gAssess",v.objective&&v.meal?2:1,"進食、意識與血糖相關資訊查證");
   point("gAction",score,"首次處置選擇；教學仍需依院內 SOP 驗證");
  }else{
   v.gPriorUnsafe=true;v.glucosePrompted=true;point("gAction",0,"未做適當評估或未通報複測");
   v.focus="glucoseUnsafe";v.line="這個選擇可能延誤症狀性低血糖處置，需先確認安全吞嚥並同步通報及追蹤。";
  }
  closeModal();render();return;
 }
 if(a==="quiz"){
  if(b==="openLeaflet"){openModal("leaflet");return;}
  const v=s.b217,q=v.medQuiz;
  if(b==="start"){
   q.index=0;q.firstCorrect=0;q.answer="";q.done=false;
   v.quizReturnFocus=v.focus;
   v.focus="medQuiz";note("藥品作用查證","閱讀 Aspirin 的資料並進行單項配對");
   closeModal();render();return;
  }
  if(b==="next"){
   q.done=true;v.focus=v.quizReturnFocus||"aspirinPlan";
   point("famotidine",q.firstCorrect===1?2:0,"Aspirin 作用首次選擇："+(q.firstCorrect===1?"正確":"不正確"));
   note("藥品查證","返回先前評估節點："+v.focus);
   render();return;
  }
  const correct=b==="asp";
  q.firstCorrect=correct?1:0;
  q.answer=correct?"作用配對正確：Aspirin 具有抗血小板作用。":"作用配對不正確：Aspirin 的主要作用是抗血小板，Famotidine 才是抑制胃酸分泌。";
  q.index=1;v.focus="medQuizAnswer";
  note("Aspirin 作用判斷",correct?"首次辨識正確":"首次辨識不正確，已提供正確作用");
  render();return;
 }
 if(a==="aspirin"){
  const v=s.b217;v.aspirinPlan=true;v.focus="aspirinPlan";
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
  if(b==="saveReflection"){
   const thought=String($("clinicalReflection")?.value||"").trim().slice(0,260);
   if(!s.freeText)s.freeText={bell:"",reflection:""};
   if(thought!==s.freeText.reflection){
    s.freeText.reflection=thought;
    if(thought)note("學員思維｜課後反思",thought);
   }
   render();return;
  }
  if(b==="submit"){
   const thought=String($("clinicalReflection")?.value||"").trim().slice(0,260);
   if(!s.freeText)s.freeText={bell:"",reflection:""};
   if(thought&&thought!==s.freeText.reflection){
    s.freeText.reflection=thought;
    note("學員思維｜課後反思",thought);
   }
   submitWardGame();return;
  }
  if(b==="review"){s.place="end";render();return}
  if(b==="continue"){s.place=s.firstPlace||"desk";render();return}
  if(b==="copy"){
   const rows=["NurseStart Lab｜病房任務 V6",...ITEMS.map(([key,label])=>label+"："+(s.score[key]===undefined?"未評估":s.score[key]+"/2")),"","操作紀錄",...s.log.map(x=>x.time+"｜"+x.place+"｜"+x.label+"｜"+x.value)];
   const text=rows.join("\n");if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).catch(()=>{});}
   return;
  }
  if(b==="reset"){if(!window.confirm||window.confirm("要重新試玩並清除本機進度嗎？")){s=INIT();$("startFullName").value="";$("startUnit").value="";save();render()}return}
 }
 if(a==="close"){closeModal();render();return}
}
function initialize(){
 $("enterGame").addEventListener("click",start);
 $("enterGame2").addEventListener("click",start);
 $("backHome").addEventListener("click",()=>{$("home").classList.remove("hidden");$("game").classList.add("hidden")});
 $("restartWard").addEventListener("click",()=>{if(!window.confirm||window.confirm("重新試玩將清除本次進度與分數，確定嗎？")){s=INIT();$("startFullName").value="";$("startUnit").value="";save();render()}});
 $("scene").addEventListener("click",e=>{const x=e.target.closest("[data-act]");if(x&&!x.disabled)act(x.dataset.act)});
 $("ward").addEventListener("click",e=>{const x=e.target.closest("[data-spot]");if(x)move(x.dataset.spot)});
 $("ward").addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ")return;
  const target=e.target.closest('[data-spot][role="button"]');
  if(!target)return;
  e.preventDefault();move(target.dataset.spot);
 });
 $("wardControls").addEventListener("click",e=>{
  const target=e.target.closest("[data-jump]");
  if(target)move(target.dataset.jump);
 });
 $("cart").addEventListener("click",()=>openModal("cart"));
 $("panelBody").addEventListener("click",e=>{const x=e.target.closest("[data-pa]");if(x&&!x.disabled)act(x.dataset.pa)});
 $("closePanel").addEventListener("click",closeModal);
 $("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closeModal()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
}
function start(){
 const name=$("startFullName").value.trim(),unit=$("startUnit").value.trim();
 if(!name||!unit){
  $("startIdentityError").textContent="請先填寫姓名及單位，才能進入病房。";
  const missing=!name?$("startFullName"):$("startUnit");
  if(typeof missing.focus==="function")missing.focus();
  return;
 }
 $("startIdentityError").textContent="";
 if(!restore())s=INIT();
 s.identity={fullName:name,unit,phase:s.identity?.phase||"試玩"};
 if(!s.startedAt)s.startedAt=Date.now();
 $("home").classList.add("hidden");$("game").classList.remove("hidden");
 document.title="Ward Quest｜NurseStart Lab V6";render();
 try{window.scrollTo({top:0,behavior:"instant"})}catch(e){}
}
initialize();
try{
 const previous=JSON.parse(localStorage.getItem(KEY)||"null");
 if(previous?.identity){
  $("startFullName").value=previous.identity.fullName||"";
  $("startUnit").value=previous.identity.unit||"";
 }
}catch(e){}
})();