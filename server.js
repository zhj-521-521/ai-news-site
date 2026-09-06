// 日报本地服务器：只用 Node.js 内置模块，零第三方依赖。
// 启动：node server.js   （或 PORT=3000 node server.js 自定义端口）
// 端口被占用时自动换下一个端口，并把新的访问地址打印出来。
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function serve(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400); res.end("Bad Request"); return;
  }
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.join(ROOT, path.normalize(urlPath));
  // 防目录穿越：只能访问本站目录内的文件
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end(err.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store" });
    res.end(data);
  });
}

const basePort = Number(process.env.PORT) || 4173;

function start(port, tries) {
  const server = http.createServer(serve);
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && tries < 20) {
      console.log(`端口 ${port} 被占用，自动改用 ${port + 1} …`);
      start(port + 1, tries + 1);
    } else {
      console.error("启动失败：", err.message);
      process.exit(1);
    }
  });
  server.listen(port, "127.0.0.1", () => {
    console.log("");
    console.log("  ✅ 日报已启动，本机访问地址（可复制到浏览器）：");
    console.log("       http://127.0.0.1:" + port);
    console.log("");
    console.log("  💡 这个地址只能在这台电脑上访问，还没有发布到互联网。");
    console.log("  ⏹️  想停止时：回到这个窗口按 Ctrl+C，或直接关闭窗口。");
    console.log("     下次要看日报：重新运行  node server.js  即可。");
  });
}

start(basePort, 0);