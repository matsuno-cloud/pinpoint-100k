// YouTube Studio のアナリティクスから書き出した「日別の登録者増減」CSV を履歴に取り込む
// 使い方: node scripts/import-studio-csv.mjs 表データ.csv 92300 2026-11-03
//   第2引数: 基準日（第3引数）時点の登録者総数（YouTube Studio の正確な数字）
import { readFile, writeFile } from "node:fs/promises";

const [csvPath, totalArg, anchorDate] = process.argv.slice(2);
if (!csvPath || !totalArg || !anchorDate) {
  console.error("使い方: node scripts/import-studio-csv.mjs <CSV> <基準日時点の総数> <基準日 YYYY-MM-DD>");
  process.exit(1);
}
const lines = (await readFile(csvPath, "utf8")).replace(/^﻿/, "").trim().split(/\r?\n/);
const header = lines[0].split(",");
const dateCol = header.findIndex((h) => /日付|Date/i.test(h));
const subCol = header.findIndex((h) => /登録者|Subscribers/i.test(h));
const rows = lines.slice(1)
  .map((l) => l.split(","))
  .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c[dateCol]))
  .map((c) => ({ date: c[dateCol], net: Number(c[subCol]) }))
  .sort((a, b) => a.date.localeCompare(b.date));

// 基準日の総数から日別の増減をさかのぼって、各日の総数を出す
let total = Number(totalArg);
const out = [];
for (let i = rows.length - 1; i >= 0; i--) {
  if (rows[i].date > anchorDate) continue;
  out.unshift({ date: rows[i].date, subs: total, source: "studio" });
  total -= rows[i].net;
}

const history = JSON.parse(await readFile("data/history.json", "utf8"));
const map = new Map((history.points || []).map((p) => [p.date, p]));
for (const p of out) if (!map.has(p.date) || map.get(p.date).source !== "api") map.set(p.date, p);
history.points = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
history.updatedAt = history.updatedAt || new Date().toISOString();
await writeFile("data/history.json", JSON.stringify(history, null, 2) + "\n");
console.log(`${out.length} 日分を取り込みました`);
