/* eslint-disable @typescript-eslint/no-require-imports */

const http = require("node:http");
const healthRoute = require("./routes/health");
const reposRoute = require("./routes/repos");
const filesRoute = require("./routes/files");
const gitRoute = require("./routes/git");
const terminalRoute = require("./routes/terminal");

const routes = {
  "/health": healthRoute,
  "/repos": reposRoute,
  "/files": filesRoute,
  "/git": gitRoute,
  "/terminal": terminalRoute,
};

const port = Number(process.env.PORT || 27107);

const server = http.createServer((request, response) => {
  const route = routes[request.url];

  if (!route) {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  route(request, response);
});

server.listen(port, () => {
  console.log(`ADEOW sidecar listening on http://localhost:${port}`);
});
