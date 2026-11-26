// Simula o Google Apps Script (integracoes/google-sheets/Code.gs) para os testes de ponta a ponta.
// POST /       → grava a linha (exige token; submission_key repetida devolve o mesmo id)
// GET  /linhas → linhas gravadas (somente para os testes)
// POST /limpar → apaga as linhas
// GET  /saude  → pronto
import { createServer } from "node:http";

const TOKEN = process.env.FALSO_TOKEN ?? "token-de-teste-com-mais-de-24-caracteres";
const PORTA = Number(process.env.FALSO_PORTA ?? 3999);
let linhas = [];

const responder = (res, status, corpo) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
};

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/saude") return responder(res, 200, { ok: true });
  if (req.method === "GET" && req.url === "/linhas") return responder(res, 200, linhas);
  if (req.method === "POST" && req.url === "/limpar") {
    linhas = [];
    return responder(res, 200, { ok: true });
  }
  if (req.method !== "POST") return responder(res, 404, {});
  let corpo = "";
  req.on("data", (c) => (corpo += c));
  req.on("end", () => {
    try {
      const { token, lead } = JSON.parse(corpo);
      if (token !== TOKEN) return responder(res, 200, { ok: false, erro: "nao_autorizado" });
      const existente = linhas.find((l) => l.submission_key === lead.submission_key);
      if (existente) return responder(res, 200, { ok: true, id: existente.id, duplicado: true });
      linhas.push(lead);
      return responder(res, 200, { ok: true, id: lead.id, duplicado: false });
    } catch {
      return responder(res, 200, { ok: false, erro: "interno" });
    }
  });
}).listen(PORTA, "127.0.0.1");
