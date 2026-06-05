module.exports = function healthRoute(_request, response) {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: true }));
};
