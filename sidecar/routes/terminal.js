module.exports = function terminalRoute(_request, response) {
  response.writeHead(501, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_implemented" }));
};
