const $=id=>document.getElementById(id);
const apiBase = window.VICTORYX_API_BASE || "http://localhost:3000";
$("buildForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("result").classList.remove("hidden"); $("download").classList.add("hidden");
  $("statusTitle").textContent="BUILD IN PROGRESS"; $("status").textContent="Uploading project…"; $("logs").textContent="";
  const fd=new FormData(); fd.append("project",$("project").files[0]);
  const cfg={appName:$("appName").value,packageName:$("packageName").value,versionName:$("versionName").value,
    versionCode:Number($("versionCode").value),iconScale:Number($("iconScale").value),iconPadding:Number($("iconPadding").value),
    backgroundColor:$("backgroundColor").value,primaryColor:$("primaryColor").value,secondaryColor:$("secondaryColor").value,
    theme:$("theme").value,orientation:$("orientation").value,buildType:$("buildType").value,
    permissions:[...document.querySelectorAll(".checks input:checked")].map(x=>x.value)};
  fd.append("config",JSON.stringify(cfg));
  if($("icon").files[0]) fd.append("icon",$("icon").files[0]);
  if($("splashLogo").files[0]) fd.append("splashLogo",$("splashLogo").files[0]);
  try{
    const r=await fetch(apiBase+"/api/build",{method:"POST",body:fd}); const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Build request failed");
    $("status").textContent=`Build ID: ${d.buildId} — ${d.status}`;
    poll(d.buildId);
  }catch(err){$("statusTitle").textContent="BUILD FAILED";$("status").textContent=err.message}
});
async function poll(id){
  const r=await fetch(apiBase+"/api/build/"+encodeURIComponent(id)); const d=await r.json();
  $("status").textContent=`Build ID: ${id} — ${d.status}`;
  $("logs").textContent=d.logs||"";
  if(d.status==="success"){ $("statusTitle").textContent="BUILD SUCCESSFUL"; $("download").href=apiBase+"/api/build/"+encodeURIComponent(id)+"/download"; $("download").classList.remove("hidden"); }
  else if(d.status==="failed") $("statusTitle").textContent="BUILD FAILED";
  else setTimeout(()=>poll(id),4000);
}
$("resetBtn").onclick=()=>{location.reload()};