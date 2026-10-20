"""Audit the NEA hawker closure CSV against what Uncle Says Closed needs.

Usage: python3 -I research/audit_closures.py <closures.csv> [YYYY-MM-DD]
Download the CSV from dataset d_bda4baa634dd1cc7a6c7cad5f19e2d68.
"""
import collections
import csv
import datetime as dt
import sys

WINDOWS = [(f"q{n}_cleaningstartdate", f"q{n}_cleaningenddate") for n in range(1, 5)]
WINDOWS.append(("other_works_startdate", "other_works_enddate"))


def parse(s):
    try:
        return dt.datetime.strptime(s.strip(), "%d/%m/%Y").date()
    except ValueError:
        return None


rows = list(csv.DictReader(open(sys.argv[1])))
today = dt.date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else dt.date.today()

dated, undated, closed = 0, collections.Counter(), []
for r in rows:
    for start_key, end_key in WINDOWS:
        a, b = parse(r[start_key]), parse(r[end_key])
        if a and b and a <= b:
            dated += 1
            if a <= today <= b:
                closed.append(r["name"])
        elif start_key.startswith("q"):
            undated[r[start_key]] += 1

print(f"centres: {len(rows)}")
print(f"dated windows: {dated}")
print(f"undated quarterly windows: {sum(undated.values())} {dict(undated)}")
print(f"centres missing coordinates: {sum(1 for r in rows if not r['latitude_hc'])}")
print(f"multi-block remarks: {sum(1 for r in rows for q in range(1, 5) if r[f'remarks_q{q}'] not in ('nil', ''))}")
print(f"closed on {today}: {len(closed)} {closed}")
