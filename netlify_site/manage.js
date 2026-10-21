const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const names={FTMO_STANDARD_2STEP:'FTMO Standard 2-Step',E8_PRO_FOREX:'E8 Pro Forex',E8_ONE_FOREX:'E8 One · MT5 Classic',E8_SIGNATURE_FOREX:'E8 Signature · Challenge'};
let key='',registry={revision:0,accounts:[]},editing=null,preset='';
function message(s,error=false){$('message').textContent=s;$('message').className=error?'error':'';}
async function api(body){
  const res=await fetch('/.netlify/functions/accounts'+(body?'':'?admin=1'),{method:body?'POST':'GET',cache:'no-store',headers:{authorization:'Bearer '+key,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify({...body,revision:registry.revision})}:{})});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Không kết nối được máy chủ.');return data;
}
async function load(){registry=await api();render();}
$('loginForm').onsubmit=async e=>{e.preventDefault();key=$('adminKey').value.trim();try{await load();$('adminKey').value='';$('loginPanel').hidden=true;$('workspace').hidden=false;message('Đã mở quản lý.');}catch(e){key='';message(e.message,true);}};
$('logout').onclick=()=>{key='';$('workspace').hidden=true;$('loginPanel').hidden=false;message('Đã khóa quản lý.');};
$('reload').onclick=()=>load().then(()=>message('Đã tải cấu hình mới nhất.')).catch(e=>message(e.message,true));
$('setupThree').onclick=async()=>{
  $('confirmTitle').textContent='Áp dụng Signature 100k / One 200k / Pro 200k';
  $('confirmText').textContent='Giữ đúng tài khoản E8 đã có, thêm tài khoản thiếu và lưu trữ tài khoản khác; không xóa lịch sử. Các Inputs MT5 không tự thay đổi. Chỉ tiếp tục khi tài khoản E8 khớp hiện tại là đúng login bạn muốn giữ.';
  $('reasonLabel').hidden=true;$('confirmDialog').returnValue='cancel';$('confirmDialog').showModal();
  const action=await new Promise(r=>$('confirmDialog').addEventListener('close',()=>r($('confirmDialog').returnValue),{once:true}));
  if(action!=='ok')return;
  try{registry=await api({action:'setup_e8_three'});render();message('Đã áp dụng bộ ba. Mở Chỉnh sửa từng tài khoản, xác nhận luật và tải .set mới.');}catch(e){message(e.message,true);}
};
function render(){
  const visible=registry.accounts.filter(a=>a.status!=='hidden');
  $('counts').textContent=registry.accounts.filter(a=>a.active).length+' đang hoạt động · '+registry.accounts.filter(a=>a.status==='archived').length+' lưu trữ';
  $('accountList').innerHTML=visible.length?visible.map(a=>`<article class="card"><h2>${esc(a.alias)} <span class="chip ${a.active?'':'off'}">${a.active?'Hoạt động':'Lưu trữ'}</span></h2><p>${esc(names[a.program])} · ${esc(a.stage)}</p><div class="meta-grid"><div><span>Vốn ban đầu</span><b>$${money(a.size)}</b></div><div><span>Dừng cá nhân / ngày</span><b>$${money(a.settings.dailyStopUsd)}</b></div><div><span>Lỗ ngày / ${a.program==='E8_ONE_FOREX'?'Dynamic DD':a.program==='E8_SIGNATURE_FOREX'?'EOD DD':'lỗ tổng'}</span><b>${a.settings.dailyPct}% / ${a.settings.totalPct}%</b></div><div><span>Mục tiêu</span><b>${a.targetPct==null?'Không áp dụng':a.targetPct+'%'}</b></div></div>${a.archiveReason?'<p>'+esc(a.archiveReason)+'</p>':''}<div class="actions"><button class="secondary" data-action="edit" data-alias="${a.alias}">Chỉnh sửa</button><button class="secondary" data-action="preset" data-alias="${a.alias}">Cấu hình MT5</button>${a.active?`<button class="secondary danger" data-action="archive" data-alias="${a.alias}">Lưu trữ / tài khoản tạch</button>`:`<button class="secondary" data-action="activate" data-alias="${a.alias}">Kích hoạt lại</button><button class="secondary danger" data-action="hide" data-alias="${a.alias}">Xóa khỏi danh sách</button>`}</div></article>`).join(''):'<p>Chưa có tài khoản hiển thị. Bấm Thêm tài khoản để bắt đầu.</p>';
  $('hiddenList').innerHTML=registry.accounts.filter(a=>a.status==='hidden').map(a=>`<p><b>${esc(a.alias)}</b> · ${esc(names[a.program])} <button class="secondary" data-action="restore" data-alias="${a.alias}">Khôi phục vào lưu trữ</button></p>`).join('')||'<p>Không có tài khoản đã xóa khỏi danh sách.</p>';
}
function programFields(keep=false){
  const program=$('program').value,isFTMO=program==='FTMO_STANDARD_2STEP',isOne=program==='E8_ONE_FOREX',isSig=program==='E8_SIGNATURE_FOREX',old=$('stage').value;
  const stages=isFTMO?['Challenge','Verification','Funded']:isSig?['Challenge']:['Challenge','Performance'];
  $('stage').innerHTML=stages.map(s=>`<option>${s}</option>`).join('');if(keep&&stages.includes(old))$('stage').value=old;
  $('payoutField').hidden=program!=='E8_PRO_FOREX';$('peakField').hidden=!(isOne||isSig);$('eodField').hidden=!isSig;
  $('floorField').hidden=isOne||isSig;if(isOne||isSig)$('totalFloorOverride').value=0;
  $('totalPctLabel').firstChild.nodeValue=isSig?'EOD dynamic drawdown (%)':isOne?'Dynamic drawdown (%)':'Giới hạn lỗ tổng (%)';
  $('dailyPct').disabled=isSig;if(isSig)$('dailyPct').value=0;
  $('afterFirstPayout').checked=false;
  if(!keep){$('dailyPct').value=isSig?0:isOne?'':isFTMO?5:2.5;$('totalPct').value=isSig?3:isOne?'':isFTMO?10:8;$('targetPct').value=isSig?6:isOne?'':isFTMO?10:'';}
  $('programHelp').textContent=isOne?'E8 One có thông số tùy chỉnh: nhập đúng % trên dashboard quỹ. Profile chỉ quản lý ngưỡng ngày/tổng; không tự kiểm soát tin tức hoặc Best Day. Sàn tăng theo đỉnh balance đã chốt và không giảm sau payout.':'Đối chiếu tỷ lệ với gói đã mua. Sau khi lưu, tải .set và nạp vào MT5 để áp dụng; web không tự đổi Inputs của EA.';
  stageFields();
  if(isSig)$('programHelp').textContent='Profile này dành riêng Signature Classic MT5 đang thi. Không có Daily Pause; vẫn áp dụng dừng cá nhân. Sàn nâng theo đỉnh balance cuối ngày (giờ server), không theo đỉnh trong phiên. Khi pass cần profile Performance riêng, không tiếp tục dùng cấu hình Challenge.';
}
function stageFields(){const s=$('stage').value,funded=['Performance','Funded'].includes(s);$('targetPct').disabled=funded;$('targetPct').required=!funded;if(funded)$('targetPct').value='';else if($('program').value==='FTMO_STANDARD_2STEP')$('targetPct').value=s==='Verification'?5:10;}
$('program').onchange=()=>programFields();$('stage').onchange=stageFields;
function edit(a=null){
  editing=a;$('accountForm').reset();$('editError').textContent='';$('editorTitle').textContent=a?'Chỉnh '+a.alias:'Thêm tài khoản';
  $('alias').disabled=!!a;$('program').disabled=!!a;$('size').disabled=!!a;
  $('alias').value=a?.alias||'';$('program').value=a?.program||'E8_SIGNATURE_FOREX';$('size').value=a?.size||100000;
  programFields();
  if(a){$('stage').value=a.stage;stageFields();$('targetPct').value=a.targetPct??'';for(const k of ['dailyPct','totalPct','dailyStopUsd','confirmedPeak','warningPct','totalFloorOverride'])$(k).value=a.settings[k]??(k==='warningPct'?80:0);$('afterFirstPayout').checked=a.settings.afterFirstPayout;}
  $('eodHour').value=a?.settings?.eodHour??23;
  $('editor').showModal();
}
$('newAccount').onclick=()=>edit();$('closeEditor').onclick=()=>$('editor').close();
$('accountForm').onsubmit=async e=>{e.preventDefault();$('saveAccount').disabled=true;try{
  const account={alias:$('alias').value.trim().toUpperCase(),program:$('program').value,size:Number($('size').value),stage:$('stage').value,targetPct:$('targetPct').disabled?null:Number($('targetPct').value),status:editing?.status||'active',archiveReason:editing?.archiveReason||'',settings:{dailyPct:Number($('dailyPct').value),totalPct:Number($('totalPct').value),dailyStopUsd:Number($('dailyStopUsd').value),warningPct:Number($('warningPct').value),totalFloorOverride:Number($('totalFloorOverride').value||0),afterFirstPayout:$('program').value==='E8_PRO_FOREX'&&$('afterFirstPayout').checked,confirmedPeak:Number($('confirmedPeak').value||0)}};
  account.rulesConfirmed=$('verifiedRules').checked;account.settings.eodHour=Number($('eodHour').value||23);
  registry=await api({action:editing?'update':'add',account});render();$('editor').close();message('Đã lưu '+account.alias+'. Bấm Cấu hình MT5 để tải .set; sau đó kiểm tra đồng bộ trên dashboard.');
}catch(e){$('editError').textContent=e.message;}finally{$('saveAccount').disabled=false;}};
async function confirmAction(action,a){
  const words={archive:['Lưu trữ '+a.alias,'Tài khoản sẽ ngừng nhận dữ liệu mới và không cộng vào tổng. Hãy xử lý vị thế/lệnh chờ rồi gỡ EA tại MT5.'],hide:['Xóa '+a.alias+' khỏi danh sách?','Thẻ sẽ bị ẩn; dữ liệu vẫn được giữ và có thể khôi phục. Alias này không được tái sử dụng.'],restore:['Khôi phục '+a.alias,'Tài khoản được đưa về lưu trữ, chưa bật theo dõi.'],activate:['Kích hoạt lại '+a.alias,'Chỉ thực hiện khi đây vẫn là đúng tài khoản và được phép hoạt động. Không dùng thao tác này cho tài khoản mới mua.']};
  $('confirmTitle').textContent=words[action][0];$('confirmText').textContent=words[action][1];$('reasonLabel').hidden=action!=='archive';$('reason').value='';$('confirmDialog').returnValue='cancel';$('confirmDialog').showModal();
  const result=await new Promise(r=>$('confirmDialog').addEventListener('close',()=>r($('confirmDialog').returnValue),{once:true}));if(result!=='ok')return;
  try{registry=await api({action,alias:a.alias,reason:$('reason').value});render();message('Đã cập nhật '+a.alias+'. Dashboard sẽ nhận cấu hình ở lần tải dữ liệu tiếp theo.');}catch(e){message(e.message,true);}
}
function showPreset(a){
  if(a.rulesConfirmed!==true){message('Mở Chỉnh sửa '+a.alias+' và xác nhận thông số thực tế trước khi tải .set.',true);return;}
  const profile={FTMO_STANDARD_2STEP:1,E8_PRO_FOREX:2,E8_ONE_FOREX:3,E8_SIGNATURE_FOREX:4}[a.program];
  const values={InpAccountAlias:a.alias,InpAccountSize:a.size,InpBrokerProfile:profile,InpDailyStopUSD:a.settings.dailyStopUsd,InpDailyLossPctOverride:a.settings.dailyPct,InpTotalLossPctOverride:a.settings.totalPct,InpRiskWarningUsedPct:a.settings.warningPct??80,InpTotalLossLevelOverride:a.settings.totalFloorOverride??0,InpE8AfterFirstPayout:a.settings.afterFirstPayout,InpE8OneConfirmedPeak:a.settings.confirmedPeak,InpEnableNetlifyPush:true,InpNetlifyIngestUrl:location.origin+'/.netlify/functions/ingest',InpNetlifyKey:''};
  values.InpRulesConfirmed=true;
  values.InpE8OneConfirmedPeak=a.program==='E8_ONE_FOREX'?a.settings.confirmedPeak:0;
  values.InpSignatureConfirmedEODPeak=a.program==='E8_SIGNATURE_FOREX'?a.settings.confirmedPeak:0;
  values.InpSignatureEODHour=a.settings.eodHour??23;
  preset='; Quantlane 2.13 - partial account preset; review all Inputs after Load\r\n'+Object.entries(values).map(([k,v])=>k+'='+v).join('\r\n')+'\r\n';
  $('presetName').textContent=a.alias+' · '+names[a.program];$('presetPreview').textContent=preset;$('downloadPreset').dataset.alias=a.alias;$('presetDialog').showModal();
}
$('closePreset').onclick=()=>$('presetDialog').close();$('downloadPreset').onclick=()=>{const bytes=new Uint8Array(2+preset.length*2);bytes[0]=255;bytes[1]=254;for(let i=0;i<preset.length;i++){bytes[2+i*2]=preset.charCodeAt(i)&255;bytes[3+i*2]=preset.charCodeAt(i)>>8;}const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=$('downloadPreset').dataset.alias+'_v2_13.set';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=registry.accounts.find(a=>a.alias===b.dataset.alias);if(!a)return;if(b.dataset.action==='edit')edit(a);else if(b.dataset.action==='preset')showPreset(a);else confirmAction(b.dataset.action,a);});
