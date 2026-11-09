"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const PORT = 3035;
const UPSTREAM = "https://employee-happiness-survey.vercel.app/api/admin/summary";
const origins = new Set([`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]);
const hosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const files = new Map([["/", "index.html"], ["/index.html", "index.html"], ["/styles.css", "styles.css"], ["/app.js", "app.js"]]);
const securityHeaders = {
 "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY",
 "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
const server = http.createServer(async (request, response) => {
 const reply = (status, body, type = "application/json; charset=utf-8") => { response.writeHead(status, { ...securityHeaders, "Content-Type": type }); response.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
 if (!hosts.has(request.headers.host)) return reply(403, { error: "ใช้เว็บผ่าน localhost ในเครื่องนี้เท่านั้น" });
 const origin = request.headers.origin;
 if (origin && !origins.has(origin)) return reply(403, { error: "ไม่อนุญาตเว็บไซต์อื่น" });
 const pathname = new URL(request.url, `http://127.0.0.1:${PORT}`).pathname;
 if (request.method === "GET" && pathname === "/health") return reply(200, { application: "happiness-private-results", localOnly: true });
 if (request.method === "GET" && files.has(pathname)) {
  const filename = files.get(pathname);
  return reply(200, fs.readFileSync(path.join(__dirname, filename)), filename.endsWith(".css") ? "text/css; charset=utf-8" : filename.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
 }
 if (request.method !== "POST" || pathname !== "/api/results") return reply(404, { error: "ไม่พบหน้า" });
 try {
  let size = 0; const chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > 8192) return reply(413, { error: "ข้อมูลคำขอใหญ่เกินไป" }); chunks.push(chunk); }
  const { pin, department = "", division = "" } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof pin !== "string" || !pin || typeof department !== "string" || typeof division !== "string") return reply(400, { error: "กรุณากรอกรหัส Admin" });
  // Pin travels only in the HTTPS request body to the existing survey server; never saved or logged.
  const upstream = await fetch(UPSTREAM, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, department, division }), signal: AbortSignal.timeout(30000), redirect: "error" });
  const data = await upstream.json();
  if (upstream.ok && (!Array.isArray(data.sectionSummary) || "responses" in data)) return reply(502, { error: "รูปแบบผลสำรวจไม่ถูกต้อง" });
  return reply(upstream.status, data);
 } catch { return reply(502, { error: "เชื่อมต่อเว็บสำรวจไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง" }); }
});
server.listen(PORT, "127.0.0.1", () => console.log(`Happiness private results: http://127.0.0.1:${PORT} (local computer only)`));
server.on("error", error => { console.error(error.code === "EADDRINUSE" ? "Port 3035 is in use. Close the previous results window or open http://127.0.0.1:3035." : "Cannot start the local results website."); process.exit(1); });
