import { getStore } from '@netlify/blobs';
import { seedAccounts } from './accounts.seed.js';

export const PROGRAMS = {
  FTMO_STANDARD_2STEP: {firm:'FTMO',stages:['Challenge','Verification','Funded']},
  E8_PRO_FOREX: {firm:'E8 Market',stages:['Challenge','Performance']},
  E8_ONE_FOREX: {firm:'E8 Market',stages:['Challenge','Performance']},
  E8_SIGNATURE_FOREX: {firm:'E8 Market',stages:['Challenge']}
};
const KEY='accounts-v1';
export const registryStore=()=>getStore({name:'quantlane-config',consistency:'strong'});
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export function normalizeAccount(a){
  if(!a || typeof a!=='object' || Array.isArray(a)) throw new Error('Cấu hình tài khoản không hợp lệ.');
  const alias=String(a.alias||'').toUpperCase();
  if(!/^[A-Z][A-Z0-9]{0,15}_[1-9][0-9]{0,5}$/.test(alias)) throw new Error('Alias theo mẫu FTMO_3, E8_2 hoặc E8ONE_1.');
  const p=PROGRAMS[a.program];
  if(!p || !p.stages.includes(a.stage)) throw new Error('Chương trình hoặc giai đoạn không hợp lệ.');
  const number=(n,min,max,label)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new Error(label+' không hợp lệ.');return n;};
  const size=number(a.size,100,10000000,'Vốn ban đầu');
  const s=a.settings||{};
  const signature=a.program==='E8_SIGNATURE_FOREX';
  const dailyPct=number(s.dailyPct,signature?0:0.01,99,'Tỷ lệ lỗ ngày');
  if(signature && dailyPct!==0)throw new Error('Signature Challenge không áp dụng Daily Pause. Nhập lỗ ngày = 0.');
  const totalPct=number(s.totalPct,0.01,99,'Tỷ lệ lỗ tổng');
  const dailyStopUsd=number(s.dailyStopUsd,0.01,size,'Dừng cá nhân');
  const warningPct=number(s.warningPct??80,0.01,99.99,'Mốc cảnh báo');
  const totalFloorOverride=number(s.totalFloorOverride??0,0,100000000,'Sàn tổng tuyệt đối');
  if((a.program==='E8_ONE_FOREX'||signature) && totalFloorOverride!==0)throw new Error('One / Signature dùng sàn động, không dùng sàn tổng tĩnh.');
  const confirmedPeak=number(s.confirmedPeak??0,0,100000000,'Đỉnh balance xác nhận');
  if(confirmedPeak>0 && confirmedPeak<size)throw new Error('Đỉnh balance phải từ vốn ban đầu trở lên.');
  if(typeof s.afterFirstPayout!=='boolean')throw new Error('Trạng thái payout không hợp lệ.');
  if(a.program!=='E8_PRO_FOREX' && s.afterFirstPayout)throw new Error('Cờ payout này chỉ dành cho E8 Pro.');
  if(!['active','archived','hidden'].includes(a.status))throw new Error('Trạng thái không hợp lệ.');
  const targetPct=['Performance','Funded'].includes(a.stage)?null:number(a.targetPct,0.01,100,'Mục tiêu lợi nhuận');
  if(a.program==='FTMO_STANDARD_2STEP' && targetPct!==null && targetPct!==(a.stage==='Challenge'?10:5))throw new Error('FTMO 2-Step: Challenge 10%, Verification 5%.');
  const archiveReason=String(a.archiveReason||'').trim().slice(0,120);
  const eodHour=number(s.eodHour??23,0,23,'Giờ EOD theo server');
  if(!Number.isInteger(eodHour))throw new Error('Giờ EOD phải là số nguyên.');
  return {alias,program:a.program,size,stage:a.stage,targetPct,status:a.status,archiveReason,rulesConfirmed:a.rulesConfirmed===true,
    settings:{dailyPct,totalPct,dailyStopUsd,warningPct,totalFloorOverride,afterFirstPayout:s.afterFirstPayout,confirmedPeak:(a.program==='E8_ONE_FOREX'||signature)?confirmedPeak:0,eodHour}};
}
export function publicAccount(a){
  return {...a,key:a.alias.toLowerCase(),firm:PROGRAMS[a.program].firm,active:a.status==='active'};
}
export async function loadRegistry(store=registryStore()){
  const found=await store.getWithMetadata(KEY,{type:'json',consistency:'strong'});
  if(!found)return {data:{revision:0,accounts:seedAccounts.map(normalizeAccount)},etag:null};
  if(!found.data || !Number.isInteger(found.data.revision)||!Array.isArray(found.data.accounts))throw new Error('Kho cấu hình bị lỗi; không tự ghi đè bằng bản mặc định.');
  return found;
}
export async function saveRegistry(next,etag,store=registryStore()){
  const result=await store.setJSON(KEY,next,etag?{onlyIfMatch:etag}:{onlyIfNew:true});
  return result.modified===true;
}
export function applyAccountChange(current,body){
  if(body.revision!==current.revision)throw Object.assign(new Error('Cấu hình đã thay đổi ở nơi khác. Tải lại danh sách rồi thử lại.'),{status:409});
  const accounts=current.accounts.map(a=>structuredClone(a));
  const alias=String(body.alias||body.account?.alias||'').toUpperCase();
  const i=accounts.findIndex(a=>a.alias===alias);
  if(body.action==='setup_e8_three'){
    const desired=seedAccounts;
    const chosen=[];
    for(const template of desired){
      const matches=accounts.filter(a=>a.program===template.program && a.size===template.size && a.status!=='hidden');
      if(matches.length>1)throw new Error('Có nhiều tài khoản '+template.program+'. Hãy lưu trữ/ẩn tài khoản cũ trước để chọn đúng login.');
      let account=matches[0];
      if(account && account.status!=='active')throw new Error(account.alias+' đã lưu trữ. Thêm tài khoản mới bằng alias mới; không dùng lại lịch sử cũ.');
      if(account){
        if(account.stage!==template.stage)throw new Error(account.alias+' khác giai đoạn yêu cầu. Kiểm tra tài khoản trước.');
      }else{
        let n=1,alias=template.alias;
        const prefix=alias.slice(0,alias.lastIndexOf('_'));
        while(accounts.some(a=>a.alias===alias))alias=prefix+'_'+(++n);
        account=normalizeAccount({...template,alias});accounts.push(account);
      }
      chosen.push(account.alias);
    }
    for(const account of accounts)if(account.status==='active'&&!chosen.includes(account.alias)){
      account.status='archived';account.archiveReason='Chuyển sang bộ ba E8; dữ liệu cũ được giữ';
    }
  }else if(body.action==='add'){
    const account=normalizeAccount({...body.account,status:'active',archiveReason:''});
    if(accounts.some(a=>a.alias===account.alias))throw new Error('Alias đã tồn tại, kể cả tài khoản đã xóa khỏi danh sách. Hãy dùng alias mới.');
    if(accounts.length>=100)throw new Error('Giới hạn cấu hình là 100 tài khoản.');
    accounts.push(account);
  }else{
    if(i<0)throw new Error('Không tìm thấy tài khoản.');
    if(body.action==='update'){
      const next=normalizeAccount({...body.account,alias});
      if(next.program!==accounts[i].program||next.size!==accounts[i].size)throw new Error('Đổi chương trình hoặc vốn ban đầu: tạo alias mới để không trộn lịch sử.');
      next.status=accounts[i].status; accounts[i]=next;
    }else if(body.action==='archive'){
      accounts[i].status='archived'; accounts[i].archiveReason=String(body.reason||'Đã ngừng hoạt động').slice(0,120);
    }else if(body.action==='hide'){
      if(accounts[i].status==='active')throw new Error('Hãy lưu trữ tài khoản trước khi xóa khỏi danh sách.');
      accounts[i].status='hidden';
    }else if(body.action==='restore'){
      accounts[i].status='archived';
    }else if(body.action==='activate'){
      accounts[i].status='active'; accounts[i].archiveReason='';
    }else throw new Error('Thao tác không hợp lệ.');
  }
  return {revision:current.revision+1,updatedAt:new Date().toISOString(),accounts};
}
