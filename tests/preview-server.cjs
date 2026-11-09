// Test-only in-memory Supabase fixture; never connects to the production database.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
async function startPreview({fixturePort=3030,appPort=3031}={}) {
 const fixtureOrigin=`http://127.0.0.1:${fixturePort}`,appOrigin=`http://127.0.0.1:${appPort}`;
 const employees=[...Array.from({length:8},(_,i)=>({emp_id:`A0${i+1}`,name:`สมาชิกทีมตัวอย่าง ${i+1}`,department:'สำนักงานใหญ่',division:'ฝ่ายตัวอย่าง A',is_active:true})),...Array.from({length:4},(_,i)=>({emp_id:`B0${i+1}`,name:`สมาชิกต่างสาขา ${i+1}`,department:'หน่วยธุรกิจตัวอย่าง',division:'สาขาตัวอย่าง B',is_active:true})),{emp_id:'N01',name:'ข้อมูลทีมยังไม่ครบ',department:null,division:null,is_active:true},{emp_id:'X01',name:'Inactive fixture',department:'สำนักงานใหญ่',division:'ฝ่ายตัวอย่าง A',is_active:false}];
 const answers=Object.fromEntries(Array.from({length:36},(_,i)=>[`q${String(i+1).padStart(2,'0')}`,4]));
 const responses=employees.filter(e=>['A01','A02','A03','A04','A05','B01','B02','B03'].includes(e.emp_id)).map((e,i)=>({id:`fixture-${i}`,emp_id:e.emp_id,answers,average_score:4,open_answer_1:'PRIVATE COMMENT MUST NOT LEAK',open_answer_2:'PRIVATE COMMENT MUST NOT LEAK',created_at:'2026-11-09'}));
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,fixtureOrigin);const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);
  if(url.pathname.startsWith('/rest/v1/')){
   const table=url.pathname.split('/').pop();let rows=table==='employees'?employees:responses;
   if(!['employees','responses'].includes(table)){res.writeHead(404);return res.end('{}');}
   if(req.method==='POST') {const value=JSON.parse(body.toString());if(responses.some(r=>r.emp_id===value.emp_id)){res.writeHead(409,{'Content-Type':'application/json'});return res.end(JSON.stringify({code:'23505',message:'duplicate'}));}responses.push({...value,id:`fixture-${responses.length}`,created_at:'2026-11-09'});res.writeHead(201,{'Content-Type':'application/json'});return res.end('');}
   rows=rows.filter(row=>[...url.searchParams].every(([key,value])=>{if(value.startsWith('eq.'))return String(row[key])===value.slice(3);if(value.startsWith('in.'))return value.slice(4,-1).split(',').map(v=>v.replace(/^"|"$/g,'')).includes(String(row[key]));return true;}));
   const order=url.searchParams.get('order');if(order){const key=order.split('.')[0];rows=[...rows].sort((a,b)=>String(a[key]).localeCompare(String(b[key])));}
   const start=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||1000);rows=rows.slice(start,start+limit);
   const select=url.searchParams.get('select');if(select&&select!=='*'){const keys=select.split(',');rows=rows.map(row=>Object.fromEntries(keys.map(key=>[key,row[key]])));}
   const object=req.headers.accept?.includes('application/vnd.pgrst.object+json');res.writeHead(200,{'Content-Type':'application/json','Content-Range':`0-${Math.max(0,rows.length-1)}/*`});return res.end(JSON.stringify(object?(rows[0]||null):rows));
  }
  if(url.pathname.startsWith('/private/')){
   const name=url.pathname==='/private/'?'index.html':url.pathname.split('/').pop();if(!['index.html','styles.css','app.js'].includes(name)){res.writeHead(404);return res.end();}
   let content=fs.readFileSync(path.join(root,'results-site',name),'utf8');if(name==='app.js')content=content.replace('https://employee-happiness-survey.vercel.app/api/admin/summary',fixtureOrigin+'/api/admin/summary');
   res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html'});return res.end(content);
  }
  const headers={...req.headers,host:`127.0.0.1:${appPort}`};delete headers.connection;delete headers['content-length'];delete headers.origin;
  const upstream=await fetch(appOrigin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:body,redirect:'manual'});
  res.statusCode=upstream.status;for(const [key,value]of upstream.headers)if(!['transfer-encoding','connection','content-encoding','content-length','set-cookie'].includes(key))res.setHeader(key,value);
  const cookie=upstream.headers.get('set-cookie');if(cookie)res.setHeader('set-cookie',cookie.replace(/; Secure/ig,''));res.end(Buffer.from(await upstream.arrayBuffer()));
 }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({fixtureError:error.message}));}});
 await new Promise(resolve=>server.listen(fixturePort,'127.0.0.1',resolve));
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(appPort)],{cwd:root,env:{...process.env,NODE_ENV:'production',SUPABASE_URL:fixtureOrigin,SUPABASE_SERVICE_ROLE_KEY:'fixture-service-key-not-production',SURVEY_SESSION_SECRET:'fixture-session-secret',ADMIN_PIN:'fixture-owner-only'},stdio:['ignore','pipe','pipe']});
 let log='';child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 for(let i=0;i<100;i++){try{const response=await fetch(appOrigin);if(response.ok)break;}catch{}if(child.exitCode!==null)throw new Error(log);await new Promise(resolve=>setTimeout(resolve,100));if(i===99)throw new Error('Preview startup timeout: '+log);}
 return{fixtureOrigin,appOrigin,employees,responses,stop:async()=>{child.kill('SIGTERM');await new Promise(resolve=>server.close(resolve));}};
}
module.exports={startPreview};
if(require.main===module){startPreview().then(preview=>{console.log('Fixture preview: '+preview.fixtureOrigin+' | Private dashboard: '+preview.fixtureOrigin+'/private/');process.on('SIGINT',async()=>{await preview.stop();process.exit(0);});}).catch(error=>{console.error(error);process.exit(1);});}
