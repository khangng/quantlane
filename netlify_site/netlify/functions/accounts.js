import { timingSafeEqual } from 'node:crypto';
import { loadRegistry,saveRegistry,applyAccountChange,publicAccount,json } from '../../lib/registry.js';

function authorized(req){
  const secret=process.env.ADMIN_KEY;
  const supplied=req.headers.get('authorization')||'';
  if(!secret)return false;
  const a=Buffer.from(supplied),b=Buffer.from('Bearer '+secret);
  return a.length===b.length && timingSafeEqual(a,b);
}
export default async req=>{
  try{
    const url=new URL(req.url),isAdmin=authorized(req);
    if(req.method==='GET'){
      if(url.searchParams.has('admin')&&!isAdmin)return json({error:'Khóa quản trị không đúng hoặc ADMIN_KEY chưa được cấu hình.'},401);
      const {data}=await loadRegistry();
      return json({revision:data.revision,accounts:data.accounts.filter(a=>isAdmin||a.status!=='hidden').map(publicAccount)});
    }
    if(req.method!=='POST')return json({error:'method_not_allowed'},405);
    if(!isAdmin)return json({error:'Khóa quản trị không đúng hoặc ADMIN_KEY chưa được cấu hình.'},401);
    const origin=req.headers.get('origin');
    if(origin && origin!==url.origin)return json({error:'origin_not_allowed'},403);
    const text=await req.text();
    if(text.length>12000)return json({error:'Yêu cầu quá lớn.'},413);
    let body;try{body=JSON.parse(text);}catch{return json({error:'JSON không hợp lệ.'},400);}
    const {data,etag}=await loadRegistry();
    const next=applyAccountChange(data,body);
    if(!await saveRegistry(next,etag))return json({error:'Có người vừa sửa cấu hình. Tải lại danh sách rồi thử lại.'},409);
    return json({revision:next.revision,accounts:next.accounts.map(publicAccount)});
  }catch(e){return json({error:e.message||'Không lưu được cấu hình.'},e.status||400);}
};
