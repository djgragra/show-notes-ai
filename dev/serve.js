"use strict";
// Dev server: static files with Cache-Control: no-store on :8123, plus a MOCK OpenAI-style provider on :8124
// (so the whole flow can be tried with the "Local" provider, with no real key and no real model).
// Mock behaviour: text containing FAIL401 -> 401, FAIL429 -> 429, SLOW -> answers after 4 s, LENGTH -> finish_reason "length".
const http = require("node:http"), fs = require("node:fs"), path = require("node:path");
const root = path.join(__dirname, "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || f.startsWith(path.join(root, "dev")) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(8123, () => console.log("app on http://localhost:8123"));

http.createServer((req, res) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type,authorization", "Access-Control-Allow-Methods": "POST,OPTIONS" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  let body = ""; req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, obj) => { res.writeHead(code, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    let j; try { j = JSON.parse(body); } catch (e) { return send(400, { error: "bad json" }); }
    const user = (j.messages || []).map((m) => m.content).join("\n");
    if (user.includes("FAIL401")) return send(401, { error: { message: "secret-like-text-should-not-show" } });
    if (user.includes("FAIL429")) return send(429, {});
    const answer = () => send(200, { choices: [{ message: { content: "MOCK show notes for model " + j.model + ".\n\n- Topic one\n- Topic two" }, finish_reason: user.includes("LENGTH") ? "length" : "stop" }] });
    if (user.includes("SLOW")) setTimeout(answer, 4000); else answer();
  });
}).listen(8124, () => console.log("mock provider on http://localhost:8124/v1"));
