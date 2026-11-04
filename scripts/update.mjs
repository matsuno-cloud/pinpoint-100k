// YouTube Data API から現在の登録者数を取り、data/history.json に今日（日本時間）の値として記録する
import { readFile, writeFile } from "node:fs/promises";

const key = process.env.YT_API_KEY;
if (!key) { console.error("YT_API_KEY が設定されていません"); process.exit(1); }

const config = JSON.parse(await readFile("data/config.json", "utf8"));
const historyPath = "data/history.json";
const history = JSON.parse(await readFile(historyPath, "utf8"));

const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${config.channelId}&key=${key}`;
const res = await fetch(url);
if (!res.ok) { console.error("API エラー", res.status, await res.text()); process.exit(1); }
const json = await res.json();
const subs = Number(json.items?.[0]?.statistics?.subscriberCount);
if (!subs) { console.error("登録者数を取得できませんでした", JSON.stringify(json)); process.exit(1); }

const now = new Date();
const today = new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
history.points = (history.points || []).filter((p) => p.date !== today);
history.points.push({ date: today, subs, source: "api" });
history.points.sort((a, b) => a.date.localeCompare(b.date));
history.updatedAt = now.toISOString();

await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n");
console.log(`${today}: ${subs}`);
