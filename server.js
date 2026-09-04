require("dotenv").config();
const express=require("express"),cors=require("cors"),multer=require("multer"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const {Octokit}=require("octokit");
const app=express(); app.use(cors()); app.use(express.json());
const ROOT=path.resolve(__dirname,".."), STORE=path.join(ROOT,".builds"); fs.mkdirSync(STORE,{recursive:true});
const upload=multer({dest:path.join(STORE,"tmp"),limits:{fileSize:100*1024*1024},fileFilter:(req,file,cb)=>cb(null,file.fieldname==="project"?path.extname(file.originalname).toLowerCase()===".zip":[".png",".jpg",".jpeg",".webp"].includes(path.extname(file.originalname).toLowerCase()))});
const jobs=new Map();
function safeId(){return crypto.randomBytes(12).toString("hex")}
function validPackage(s){return /^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$/.test(s)}
app.post("/api/build",upload.fields([{name:"project",maxCount:1},{name:"icon",maxCount:1},{name:"splashLogo",maxCount:1}]),async(req,res)=>{
 try{
  const f=req.files?.project?.[0]; if(!f) return res.status(400).json({error:"Project ZIP is required"});
  const c=JSON.parse(req.body.config||"{}");
  if(!validPackage(c.packageName||"")) return res.status(400).json({error:"Invalid Android package name"});
  if(!/^[1-9]\\d*$/.test(String(c.versionCode))) return res.status(400).json({error:"Invalid version code"});
  const id=safeId(), dir=path.join(STORE,id); fs.mkdirSync(dir,{recursive:true});
  fs.renameSync(f.path,path.join(dir,"project.zip"));
  for(const k of ["icon","splashLogo"]) if(req.files?.[k]?.[0]) fs.renameSync(req.files[k][0].path,path.join(dir,k+path.extname(req.files[k][0].originalname).toLowerCase()));
  fs.writeFileSync(path.join(dir,"config.json"),JSON.stringify(c,null,2));
  jobs.set(id,{status:"queued",logs:"Queued. Triggering GitHub Actions…"});
  const octo=new Octokit({auth:process.env.GITHUB_TOKEN});
  await octo.rest.actions.createWorkflowDispatch({owner:process.env.GITHUB_OWNER,repo:process.env.GITHUB_REPO,workflow_id:"build-apk.yml",ref:process.env.GITHUB_BRANCH||"main",inputs:{build_id:id}});
  jobs.set(id,{status:"building",logs:"GitHub Actions workflow dispatched.\n"});
  res.json({buildId:id,status:"building"});
 }catch(e){res.status(500).json({error:e.message})}
});
app.get("/api/build/:id",(req,res)=>res.json(jobs.get(req.params.id)||{status:"unknown",logs:"Build ID not found on this backend instance."}));
app.get("/api/build/:id/download",(req,res)=>res.status(404).send("Artifact download is exposed by GitHub Actions. Configure artifact retrieval/storage for production."));
app.get("/health",(req,res)=>res.json({ok:true}));
app.listen(process.env.PORT||3000,()=>console.log("VictoryX backend listening"));
