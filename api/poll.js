// api/poll.js
import fetch from 'node-fetch';

const API = "https://maps.cityofhenderson.com/arcgis/rest/services/public/ComDevServices/MapServer/1/query";
const ADDRESS = "343 PALISADES DR";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function sendTG(text){
  if(!BOT_TOKEN || !CHAT_ID) return;
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode:"HTML", disable_web_page_preview:true })
  });
  if(!r.ok) console.error("TG error", await r.text());
}

function params(){
  const p = new URLSearchParams();
  p.set("where", "REGISTERED_ADDRESS='343 PALISADES DR'");
  p.set("outFields","STATUS,REGISTERED_ADDRESS");
  p.set("returnGeometry","false");
  p.set("f","json");
  p.set("_", Date.now().toString());
  return p.toString();
}

export default async function handler(req,res){
  try{
    const url = `${API}?${params()}`;
    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();

    const ts = new Date().toLocaleString("en-US",{timeZone:"America/Los_Angeles"});

    if(!data.features || data.features.length===0){
      await sendTG(`🚨 <b>Removed from map</b>\n${ADDRESS}\nPT: ${ts}`);
      return res.status(200).json({ok:true,status:"removed",ts});
    }
    const st = data.features[0].attributes?.STATUS || "(no status)";
    if(st!=="Active"){
      await sendTG(`⚠️ <b>Status</b>: ${st}\n${ADDRESS}\nPT: ${ts}`);
      return res.status(200).json({ok:true,status:st,ts});
    }
    return res.status(200).json({ok:true,status:"Active",ts});
  }catch(e){
    await sendTG(`⚠️ <b>Monitor error</b>: ${e?.message||e}`);
    return res.status(200).json({ok:false,error:String(e)});
  }
}
