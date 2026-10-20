import subprocess, json, sqlite3, sys, time, urllib.request
db = sqlite3.connect(sys.argv[1])
db.execute("create table if not exists ds(id text primary key, name text, agency text, format text, descr text, cov_start text, cov_end text, updated text)")
page = 1
while True:
    url = f"https://api-production.data.gov.sg/v2/public/api/datasets?page={page}"
    for attempt in range(5):
        try:
            data = json.loads(subprocess.run(["curl","-sf","--max-time","30",url],capture_output=True,check=True).stdout)["data"]; break
        except Exception as e:
            time.sleep(2 * (attempt + 1))
    else:
        raise SystemExit(f"failed page {page}")
    rows = data["datasets"]
    if not rows: break
    db.executemany("insert or replace into ds values (?,?,?,?,?,?,?,?)", [
        (d["datasetId"], d["name"], d.get("managedByAgencyName"), d.get("format"), d.get("description"),
         d.get("coverageStart"), d.get("coverageEnd"), d.get("lastUpdatedAt")) for d in rows])
    db.commit()
    page += 1
    if page > data.get("totalPages", 10**6): break
    time.sleep(0.3)
print(db.execute("select count(*) from ds").fetchone()[0], "datasets")
