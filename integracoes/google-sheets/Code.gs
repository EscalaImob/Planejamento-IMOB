/**
 * Escala IMOB — Planejamento Estratégico 2027
 * Recebe os leads do site (rota /api/leads) e grava na aba "planning_leads" desta planilha.
 *
 * Segurança:
 *  - Só aceita requisições com o token igual à propriedade do script LEADS_TOKEN.
 *  - Trava (LockService) para gravações simultâneas; submission_key repetida não duplica a linha.
 *  - Limite de 5 envios a cada 10 minutos por ip_hash (CacheService).
 *  - Texto que começa com = + - @ é gravado como texto (evita injeção de fórmula).
 *  - Nenhum dado do lead é escrito no log de execução.
 *
 * Instalação: ver integracoes/google-sheets/LEIA-ME.md
 */

var ABA = 'planning_leads';
var COLUNAS = [
  'id', 'submission_key', 'full_name', 'email', 'whatsapp', 'professional_profile',
  'current_vgv', 'target_vgv', 'average_ticket', 'sales_target', 'commission_target', 'planning_year',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referral_id',
  'marketing_consent', 'marketing_consent_at', 'privacy_policy_version', 'privacy_acknowledged_at',
  'source_action', 'ip_hash', 'crm_sync_status', 'crm_external_id', 'created_at', 'updated_at'
];
var LIMITE_ENVIOS = 5;
var JANELA_SEGUNDOS = 600;

function doPost(e) {
  try {
    var corpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var esperado = PropertiesService.getScriptProperties().getProperty('LEADS_TOKEN');
    if (!esperado || esperado.length < 24 || !iguais_(String(corpo.token || ''), esperado)) {
      return resposta_({ ok: false, erro: 'nao_autorizado' });
    }
    var lead = corpo.lead || {};
    if (!lead.id || !lead.submission_key) return resposta_({ ok: false, erro: 'dados' });

    var trava = LockService.getScriptLock();
    if (!trava.tryLock(10000)) return resposta_({ ok: false, erro: 'ocupado' });
    try {
      var aba = obterAba_();
      var cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(String);
      for (var i = 0; i < COLUNAS.length; i++) {
        if (cabecalho.indexOf(COLUNAS[i]) === -1) return resposta_({ ok: false, erro: 'cabecalho' });
      }

      // Idempotência: a mesma submission_key devolve o registro já existente.
      var colChave = cabecalho.indexOf('submission_key') + 1;
      var colId = cabecalho.indexOf('id') + 1;
      if (aba.getLastRow() > 1) {
        var achado = aba.getRange(2, colChave, aba.getLastRow() - 1, 1)
          .createTextFinder(String(lead.submission_key)).matchEntireCell(true).findNext();
        if (achado) {
          return resposta_({ ok: true, id: String(aba.getRange(achado.getRow(), colId).getValue()), duplicado: true });
        }
      }

      // Limite por ip_hash (centralizado, vale para todas as instâncias do site).
      if (lead.ip_hash) {
        var cache = CacheService.getScriptCache();
        var chave = 'rl_' + String(lead.ip_hash).slice(0, 64);
        var contagem = Number(cache.get(chave) || 0);
        if (contagem >= LIMITE_ENVIOS) return resposta_({ ok: false, erro: 'limite' });
        cache.put(chave, String(contagem + 1), JANELA_SEGUNDOS);
      }

      var linha = cabecalho.map(function (coluna) {
        return celula_(Object.prototype.hasOwnProperty.call(lead, coluna) ? lead[coluna] : '');
      });
      aba.appendRow(linha);
      return resposta_({ ok: true, id: String(lead.id), duplicado: false });
    } finally {
      trava.releaseLock();
    }
  } catch (erro) {
    console.error('planning_leads: falha interna'); // sem dados do lead
    return resposta_({ ok: false, erro: 'interno' });
  }
}

/** Verificação simples de que o serviço está publicado (não revela dados). */
function doGet() {
  return resposta_({ ok: true, servico: 'planning_leads' });
}

/** Rode uma vez pelo editor (Executar → configurarPlanilha) para criar a aba e o cabeçalho. */
function configurarPlanilha() {
  obterAba_();
}

/** Rode uma vez pelo editor para gerar um token aleatório e salvá-lo nas propriedades do script. */
function gerarToken() {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('LEADS_TOKEN', token);
  Logger.log('Token gerado e salvo em LEADS_TOKEN. Copie-o em Configurações do projeto → Propriedades do script.');
}

function obterAba_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA);
  if (!aba) aba = planilha.insertSheet(ABA);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function celula_(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number' || typeof valor === 'boolean') return valor;
  var texto = String(valor);
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}

function iguais_(a, b) {
  if (a.length !== b.length) return false;
  var diferenca = 0;
  for (var i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

function resposta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
