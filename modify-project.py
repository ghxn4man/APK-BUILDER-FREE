#!/usr/bin/env python3
import json,re,sys,zipfile,shutil
from pathlib import Path
def safe_extract(z,d):
    base=Path(d).resolve()
    for x in z.infolist():
        p=(base/x.filename).resolve()
        if not str(p).startswith(str(base)+"/") and p!=base: raise RuntimeError("Unsafe ZIP path: "+x.filename)
        if x.is_dir(): p.mkdir(parents=True,exist_ok=True)
        else: p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(z.read(x))
def replace_app_gradle(p,c):
    s=p.read_text(errors="ignore")
    s=re.sub(r'applicationId\\s+[\'"][^\'"]+[\'"]', "applicationId '"+c["packageName"]+"'", s)
    s=re.sub(r'versionName\\s+[\'"][^\'"]+[\'"]', "versionName '"+c["versionName"]+"'", s)
    s=re.sub(r'versionCode\\s+\\d+', "versionCode "+str(c["versionCode"]), s)
    p.write_text(s)
def main():
    z,work,cfg=sys.argv[1],Path(sys.argv[2]),Path(sys.argv[3]); c=json.loads(cfg.read_text())
    if work.exists(): shutil.rmtree(work)
    work.mkdir(parents=True)
    with zipfile.ZipFile(z) as f: safe_extract(f,work)
    files=list(work.rglob("build.gradle"))+list(work.rglob("build.gradle.kts"))
    app=[p for p in files if p.parent.name=="app"]
    if not app: raise RuntimeError("No app module with build.gradle/build.gradle.kts was found.")
    p=app[0]
    if p.suffix==".gradle": replace_app_gradle(p,c)
    else: print("WARNING: Kotlin DSL app build file detected; automatic Gradle text modification was skipped.")
    strings=list(work.rglob("strings.xml"))
    for p in strings:
        s=p.read_text(errors="ignore")
        s=re.sub(r'(<string\\s+name=["\']app_name["\'][^>]*>).*?(</string>)',r'\\1'+c["appName"]+r'\\2',s, count=1)
        p.write_text(s)
    print("Customization completed with safe, targeted edits.")
if __name__=="__main__": main()
