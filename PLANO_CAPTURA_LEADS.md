# Plano — Captura de leads na exportação

**Status:** plano aprovado em 26/11/2026 e **implementado** com a opção A (Google Apps Script), escolhida em 26/11/2026. A captura está pronta e testada; ela só é ativada quando as variáveis da planilha e da Política de Privacidade forem configuradas (seção 13).
**Base auditada:** commit `b55c019` (`main`, sincronizado com `origin/main`).

**Decisões assumidas com a aprovação** (as recomendações do plano):
- indicadores financeiros gravados com aviso transparente (opção A);
- **Copiar link** e **Baixar PDF** passam pelo modal;
- texto da autorização de marketing aprovado.

**Continuam pendentes:** a política de privacidade (URL e versão) e a hospedagem. Enquanto a política não existir, a funcionalidade fica desligada.

---

## 1. Auditoria do estado atual

### 1.1 Arquitetura

| Camada | Situação atual |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack, `cacheComponents`), React 19.3, TypeScript, Tailwind 4, Zod 4. |
| Renderização | Página única estática (`src/app/page.tsx`) com o componente cliente `Planejador`. |
| Estado | `usePlanejamento`, com rascunho versionado em `localStorage` (`escala-imob:planejamento-2027`, `versao: 1`). |
| Cálculos | `src/lib/calculos.ts` e `src/config/premissas.ts` (PROVISÓRIAS). 13 testes unitários. |
| Backend, API, banco | **Não existem.** |
| Variáveis de ambiente | Só `NEXT_PUBLIC_DIAGNOSTICO_URL`. |
| Tracking | **Não existe.** |
| Hospedagem | **Não definida.** |

### 1.2 Design system (reutilizado)

- **Tokens:** `azul #0106FE`, `tinta`/`noite #000`, branco, `fio`, `papel`, `risco`, `atencao`; raios 28/16 px; sombras `cartao`/`cta`; easing `mola`; animação `entra`.
- **Tipografia:** Montserrat.
- **Componentes:** `BotaoPrincipal`, `BotaoSecundario`, `Cartao`, `Rotulo`, `Aviso`, `Icone`, `Isotipo`.
- **Padrões:** foco azul; erros em `risco`; `prefers-reduced-motion`; `no-print`.

### 1.3 Ações que passarão pelo modal

| Ação | Onde | Hoje |
|---|---|---|
| **Baixar PDF** | Topo (`Plano.tsx:371`) e fecho (`Plano.tsx:646`) | `window.print()` |
| **Copiar link** | Topo (`Plano.tsx:367`) e fecho (`Plano.tsx:651`) | `copiar()` (link `#plano=`) |

**Não passam pelo modal:** "Ajustar os números", "Recomeçar" e o botão do Diagnóstico.

> O modal é uma barreira de experiência, não de segurança: Ctrl+P e a barra de endereço continuam funcionando. Isso é aceitável, porque o plano não é sigiloso.

### 1.4 Decisões anteriores alteradas

- **"Sem cadastro, nenhum dado sai do navegador" (25/11):** o preenchimento continua sem cadastro, mas a **exportação passa a enviar contato e indicadores para o Google Sheets da Escala IMOB**, com ciência da política.
- **`CLAUDE.md` ("dados locais por padrão; nada a APIs externas sem integração e consentimento explícitos"):** atendido, porque a integração passa a ser explícita (Google Sheets, aprovada por você) e o envio só ocorre por ação do usuário.

---

## 2. Arquitetura proposta

```
Navegador                                  Servidor do site (Next.js)                 Google
─────────                                  ──────────────────────────                 ──────
Plano → "Baixar PDF" / "Copiar link"
  └─ já salvo nesta sessão? ─ sim ─► executa a ação
        │ não
        ▼
ModalLead (<dialog>)                       POST /api/leads
  valida (Zod) ──────────────────────────► valida de novo (Zod), antispam, limite por IP,
  honeypot + tempo mínimo                    normaliza, recalcula indicadores,
  submission_key (UUID)                      neutraliza fórmulas (=,+,-,@)
                                             envia ao destino com segredo (server-only) ──► Planilha "Leads — Planejamento 2027"
  ◄── {ok:true} só se o Google confirmou ◄──                                                 aba planning_leads (privada)
  sucesso → ação liberada                     nunca registra dados pessoais em log
  falha   → formulário mantido, "Tentar novamente", nada liberado
```

Princípios:

1. **O navegador nunca fala direto com o Google.** As credenciais ficam só no servidor (`server-only`, sem `NEXT_PUBLIC_`).
2. **A planilha é privada:** compartilhada só com a equipe da Escala IMOB e com a credencial de integração. Ela substitui o RLS: nenhum visitante tem rota de leitura.
3. **A validação é dupla,** com o mesmo esquema Zod.
4. **Idempotência:** a `submission_key` gerada por abertura do modal é procurada na planilha antes de gravar. Se já existir, a rota devolve sucesso sem duplicar.
5. **E-mail repetido em outro momento gera uma nova linha.** Planejamentos anteriores nunca são sobrescritos.
6. **"Já salvo nesta sessão"** fica em `sessionStorage`. É só conveniência de interface e não autentica nada.
7. **A funcionalidade fica desligada sem configuração:** sem as variáveis do Google ou da política, o site funciona como hoje.
8. **O destino é trocável:** a interface `DestinoLead` permite migrar para Supabase ou Pipedrive no futuro sem mexer no modal.

---

## 3. Fluxo

1. O usuário preenche e vê o plano sem cadastro, como hoje.
2. Clica em Baixar PDF ou Copiar link. Se já salvou nesta sessão, a ação executa direto (`planning_exported`). Senão, o modal abre (`lead_form_opened`).
3. Validação ao sair de cada campo e no envio, com mensagens individuais.
4. Envio com estado de carregamento e botão bloqueado contra múltiplos envios.
5. Quando o servidor confirma a gravação na planilha:
   - aparece a tela de sucesso;
   - dispara `lead_submitted`;
   - a ação solicitada é executada (seção 9);
   - dispara `planning_exported`.
6. Em caso de falha:
   - os dados continuam no formulário;
   - aparece "Tentar novamente";
   - dispara `lead_submission_failed`;
   - **nada é liberado.**
7. Fechar o modal (×, Esc ou toque fora) não apaga o plano nem o rascunho. O que foi digitado fica em memória até recarregar a página.

---

## 4. Interface do modal

Sem alteração em relação à versão aprovada:
- `<dialog>` nativo, em cartão no desktop e painel inferior no mobile;
- textos aprovados ("Seu planejamento está pronto!", subtítulo, botão "Salvar meu planejamento");
- campos: nome completo, WhatsApp com máscara e gravação em E.164 (`+55…`), e-mail;
- ciência **obrigatória** da Política de Privacidade;
- autorização de comunicações comerciais **opcional e desmarcada**;
- honeypot;
- linha de transparência sobre os números gravados;
- erros individuais com `aria-invalid`/`aria-describedby`;
- estados de envio, sucesso e erro;
- nenhuma promessa de envio por e-mail ou WhatsApp.

---

## 5. Armazenamento em Google Sheets

### 5.1 Forma de integração — **decisão pendente**

| | **A. Google Apps Script (recomendada)** | B. API do Google Sheets com conta de serviço |
|---|---|---|
| Como funciona | Um script anexado à planilha publica um endpoint (`doPost`). A rota do site envia os dados para ele com um token secreto. | A rota do site grava direto na planilha pela API oficial, autenticada com uma chave de conta de serviço do Google Cloud. |
| Configuração manual | **Simples:** criar a planilha, colar o script que eu entrego, publicar e copiar a URL. Não exige Google Cloud. | Mais longa: criar projeto no Google Cloud, ativar a API, criar a conta de serviço, gerar a chave JSON e compartilhar a planilha com o e-mail da conta. |
| Segredo no servidor do site | URL do script e token compartilhado | E-mail e chave privada da conta de serviço |
| Duplicidade | `LockService` serializa os envios, e o script procura a `submission_key` antes de gravar. Sem condição de corrida. | Busca e depois grava: há uma pequena janela de corrida, mitigada pelo bloqueio de duplo envio no cliente. |
| Limite por IP | `CacheService` do script mais um limite na rota | Só na rota, com memória por instância, que é menos preciso em ambiente serverless |
| Velocidade | 1 a 3 s por envio | 0,5 a 1,5 s |
| Dependências no site | Nenhuma (usa `fetch`) | `google-auth-library` ou JWT manual |
| Cotas | Cotas diárias do Apps Script, com folga para o volume esperado | Cota da API: 300 requisições por minuto por projeto |

**Recomendo a opção A:** menos passos manuais, nenhuma chave privada do Google no site, e a trava de concorrência fica dentro do Google.

### 5.2 Estrutura da aba `planning_leads`

A primeira linha tem os cabeçalhos abaixo, nesta ordem, e cada lead ocupa uma linha.

| Coluna | Conteúdo |
|---|---|
| `id` | UUID gerado no servidor |
| `submission_key` | UUID da abertura do modal (idempotência) |
| `full_name` | Nome completo |
| `email` | E-mail em minúsculas |
| `whatsapp` | E.164 (`+5511987654321`) |
| `professional_profile` | `corretor`, `imobiliaria` ou `incorporadora` |
| `current_vgv` | `vgv2026()` = comissão 2026 ÷ % |
| `target_vgv` | `vgv2027()` = meta ÷ % |
| `average_ticket` | `ticketMedio()` |
| `sales_target` | `imoveis2027()`, vendas no ano |
| `commission_target` | Meta de comissão 2027 |
| `planning_year` | `2027` |
| `utm_source` … `utm_term` | URL de entrada |
| `referral_id` | URL de entrada |
| `marketing_consent` | `TRUE`/`FALSE` |
| `marketing_consent_at` | Data e hora ISO (só se houver consentimento) |
| `privacy_policy_version` | Versão configurada no servidor |
| `privacy_acknowledged_at` | Data e hora ISO do servidor |
| `source_action` | `pdf` ou `link` |
| `ip_hash` | SHA-256 do IP com segredo, usado só para o limite de envios |
| `crm_sync_status` | `pending` (preparação para o Pipedrive) |
| `crm_external_id` | vazio (futuro ID no Pipedrive) |
| `created_at` | Data e hora ISO |
| `updated_at` | Data e hora ISO |

Detalhes de gravação:
- **Números** são gravados como números, não texto, para permitir somas e filtros. Valores ausentes ficam em branco; nada é inventado.
- **Proteção contra injeção de fórmula:** todo texto que começa com `=`, `+`, `-`, `@`, tabulação ou retorno de linha é gravado com um apóstrofo na frente. Um "nome" como `=IMPORTXML(...)` não vira fórmula.
- **Indicadores** são recalculados no servidor a partir das respostas, com as funções de `calculos.ts`. Números prontos vindos do navegador não são aceitos.
- **Formato da planilha:** recomendo congelar a linha de cabeçalho e **não editar a ordem das colunas** sem me avisar, porque o script grava por posição.

---

## 6. Segurança, antispam e privacidade

| Requisito | Atendimento com Google Sheets |
|---|---|
| Validação no front e no back | Zod compartilhado; corpo de no máximo 8 KB; `Content-Type` JSON |
| Rota segura | `POST /api/leads` (`runtime nodejs`, sem cache); confere `Origin`; 405 para outros métodos |
| Credenciais | Opção A: `LEADS_SHEETS_WEBHOOK_URL` e `LEADS_SHEETS_TOKEN` só no servidor. O script recusa qualquer requisição sem o token correto (comparação de tempo constante). Opção B: chave da conta de serviço só no servidor |
| Acesso aos dados | Planilha **privada**, compartilhada só com pessoas autorizadas. Nenhuma rota de leitura no site. A resposta da API é só `{ ok, id }` |
| Spam e abuso | Honeypot; tempo mínimo de 3 s; até 5 envios em 10 min por `ip_hash` (rota + `CacheService`); limites de tamanho; Turnstile opcional no futuro |
| Duplicidade | `submission_key` única (retentativa devolve o mesmo `id`); e-mail repetido gera nova linha, sem sobrescrever |
| Injeção de fórmula | Escape de `= + - @` no servidor e no script |
| Logs | Só código de resultado e `id`. Nada pessoal nem financeiro. O script também não registra dados no log de execução |
| Analytics | Eventos só com `acao` e `motivo` |
| Falha | Só libera com `ok:true` depois da confirmação de gravação pelo Google |
| Política de privacidade | Exigida para ativar a funcionalidade. **Não será redigida por mim** |

**Atenção LGPD:** os dados pessoais passam a ficar no Google Drive da conta dona da planilha. A política de privacidade deve citar o Google como operador. Recomendo usar uma conta Google **institucional da Escala IMOB** (Workspace), não uma conta pessoal.

---

## 7. Tracking

Sem alteração em relação à versão aprovada.

**Parâmetros:**
- captura `utm_*` e `referral_id` na primeira carga;
- sanitiza e guarda em `sessionStorage` (`escala-imob:origem`);
- a query string é preservada na navegação;
- os parâmetros não entram no link compartilhável.

**Eventos** (`src/lib/eventos.ts`: `CustomEvent` + `dataLayer` se existir), sem dados pessoais:

| Evento | Quando |
|---|---|
| `lead_form_opened` | Modal aberto |
| `lead_submitted` | Só depois da confirmação do servidor |
| `lead_submission_failed` | Erro de validação, rede, limite ou falha do Google |
| `planning_exported` | PDF aberto ou link copiado |

---

## 8. Preparação para o Pipedrive

- Colunas `crm_sync_status` e `crm_external_id` na planilha.
- Interface `DestinoLead` (`src/server/leads/destinos.ts`) com a implementação `GoogleSheetsDestino`.
- No futuro: um gatilho do Apps Script ou um job que leia as linhas `pending`, crie Pessoa e Negócio no Pipedrive e preencha `crm_external_id`. Uma falha do CRM não bloqueia o usuário. **Não implementado agora.**

---

## 9. Ação depois do cadastro

- **Copiar link:** o navegador pode bloquear a cópia automática depois da espera da rede. A tela de sucesso traz **"Copiar link do planejamento"** e o link selecionável.
- **Baixar PDF:** o modal fecha e `window.print()` é chamado. Se o navegador bloquear, a tela de sucesso traz **"Abrir PDF para salvar"**. O modal tem `no-print`.
- O rascunho local não é alterado.

---

## 10. Arquivos

### Novos

| Arquivo | Conteúdo |
|---|---|
| `src/lib/lead.ts` | Esquema Zod, máscara e normalização de telefone e e-mail, indicadores a partir de `Respostas` |
| `src/lib/rastreamento.ts` | UTMs e `referral_id` |
| `src/lib/eventos.ts` | `registrarEvento` |
| `src/lib/useCapturaLead.ts` | Orquestra modal, sessão, envio e ação |
| `src/components/lead/ModalLead.tsx` | Modal |
| `src/components/lead/CampoTexto.tsx` | Campo de texto do design system |
| `src/components/lead/Caixa.tsx` | Checkbox acessível |
| `src/app/api/leads/route.ts` | Rota `POST` |
| `src/server/leads/destinos.ts` | Interface `DestinoLead` e `GoogleSheetsDestino` |
| `src/server/leads/antiabuso.ts` | Honeypot, tempo mínimo, limite |
| `src/server/leads/planilha.ts` | Ordem das colunas e escape de fórmulas |
| `src/config/privacidade.ts` | URL e versão da política; diz se a funcionalidade está ativa |
| `integracoes/google-sheets/Code.gs` | Script do Apps Script (opção A): token, trava, idempotência, limite, gravação |
| `integracoes/google-sheets/LEIA-ME.md` | Passo a passo para criar a planilha e publicar o script |
| `tests/unit/lead.test.ts`, `tests/unit/api-leads.test.ts`, `tests/unit/planilha.test.ts` | Testes |
| `tests/e2e/captura-lead.spec.ts` | Fluxo completo com a API interceptada |

### Modificados (mínimo)

| Arquivo | Mudança |
|---|---|
| `src/components/plano/Plano.tsx` | Os 4 botões passam por `useCapturaLead` |
| `src/components/Planejador.tsx` | Inicializa a captura de UTMs |
| `.env.example`, `README.md`, `AUDITORIA_REFERENCIA.md` §13.2 | Documentação |
| `package.json` | `server-only` (e `google-auth-library` só se for a opção B) |

**Inalterados:** cálculos, premissas, etapas, gráficos, tokens e responsividade.

---

## 11. Dependências

| Pacote | Uso | Opção |
|---|---|---|
| `server-only` | Impede importar o código de servidor no cliente | A e B |
| `google-auth-library` | Autenticação da conta de serviço | Só B |

---

## 12. Variáveis de ambiente

| Variável | Onde | Opção | Observação |
|---|---|---|---|
| `LEADS_SHEETS_WEBHOOK_URL` | Servidor | A | URL `https://script.google.com/macros/s/…/exec` |
| `LEADS_SHEETS_TOKEN` | Servidor | A | Segredo aleatório de 32+ caracteres, igual ao configurado no script |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Servidor | B | — |
| `GOOGLE_PRIVATE_KEY` | Servidor | B | Chave privada da conta de serviço |
| `LEADS_SHEET_ID` | Servidor | B | ID da planilha |
| `LEADS_IP_SALT` | Servidor | A e B | Segredo para o hash de IP |
| `PRIVACY_POLICY_VERSION` | Servidor | A e B | Ex.: `2026-12-01` |
| `NEXT_PUBLIC_PRIVACY_POLICY_URL` | Cliente | A e B | Link no modal |
| `LEADS_ALLOWED_ORIGINS` | Servidor | opcional | Padrão: o próprio domínio |

---

## 13. Ações manuais (você)

**Opção A (recomendada):**
1. Com uma conta Google **da Escala IMOB**, criar a planilha **"Leads — Planejamento 2027"** com a aba `planning_leads`. Posso criar a planilha e o cabeçalho por você pela integração com o Google Drive desta sessão, se autorizar.
2. Na planilha, abrir **Extensões → Apps Script**, colar o `Code.gs` que eu entrego e definir o token em **Configurações do projeto → Propriedades do script** (`LEADS_TOKEN`).
3. **Implantar → Nova implantação → App da Web**, executando como **"Eu"**, com acesso para **"Qualquer pessoa"**. A proteção fica por conta do token. Autorizar o script quando o Google pedir.
4. Copiar a URL `/exec` e colocar no `.env.local` (`LEADS_SHEETS_WEBHOOK_URL`), junto com o mesmo token (`LEADS_SHEETS_TOKEN`). **Não me envie o token pelo chat.**
5. Restringir o compartilhamento da planilha a quem precisa ver os leads.

**Para as duas opções:**
6. **Política de Privacidade:** publicar a URL e definir a versão, citando o Google como operador. **Bloqueia a publicação.**
7. **Hospedagem** com servidor Node (Vercel, por exemplo), com as mesmas variáveis configuradas.

**Só para a opção B:** criar um projeto no Google Cloud, ativar a Google Sheets API, criar a conta de serviço, gerar a chave JSON e compartilhar a planilha com o e-mail da conta, como Editor.

---

## 14. Riscos

| Risco | Mitigação |
|---|---|
| Publicar sem política de privacidade | Funcionalidade desligada sem as variáveis da política |
| Dados pessoais numa planilha que pode ser compartilhada por engano | Conta institucional; compartilhamento restrito; revisão periódica de acessos. O Sheets não tem permissão por linha: quem acessa a planilha vê todos os leads |
| Alguém editar ou reordenar as colunas | Cabeçalho congelado; o script confere o cabeçalho e recusa gravar se ele mudar, devolvendo erro, para o site não liberar a ação com dado gravado no lugar errado |
| Injeção de fórmula | Escape no servidor e no script, com teste unitário |
| Cotas ou instabilidade do Apps Script | A falha é tratada: nada é liberado e o usuário pode tentar de novo. O volume esperado fica bem abaixo das cotas |
| Latência de 1 a 3 s | Estado de carregamento claro; tempo-limite de 15 s com erro amigável |
| URL do script vazada | Sem o token, a requisição é recusada. O token pode ser trocado a qualquer momento |
| Cópia ou impressão bloqueadas depois da espera | Botões de ação na tela de sucesso |
| Ctrl+P contorna o modal | Aceito e documentado |
| Regressões | Funcionalidade desligada = comportamento atual; suítes existentes obrigatórias |
| Pasta no OneDrive | Recomendo mover o projeto para `C:\dev` |

---

## 15. Plano de testes

**Unitários:**
- esquema: nome, e-mail, telefone (máscara, DDD, 10 e 11 dígitos, E.164) e consentimentos;
- indicadores do cenário da auditoria (VGV de R$ 2 mi e R$ 5 mi, ticket de R$ 400 mil, 12,5 vendas, meta de R$ 300 mil);
- escape de fórmulas e ordem das colunas;
- rota, com o Google simulado:
  - sucesso;
  - 400 por campo;
  - honeypot (200 sem gravar);
  - tempo mínimo;
  - 429;
  - idempotência;
  - erro ou tempo esgotado no Google → 503;
  - 405;
  - 413;
  - 403 por origem;
  - **nenhum dado pessoal nos logs**;
- UTMs.

**Script do Apps Script:** funções puras (validação do token, escape, montagem da linha) testadas com Vitest a partir de um módulo espelho. O teste real é manual.

**E2E (Playwright, API interceptada):**
- fluxo sem cadastro intacto;
- PDF e link com modal, validação, máscara, carregamento e sucesso;
- `print` chamado e `lead_submitted` só depois da resposta;
- a segunda exportação na mesma sessão não abre o modal;
- falha 503 ou queda de rede: dados preservados e nada liberado;
- duplo clique gera um único POST;
- fechar o modal por Esc, × e fundo;
- teclado (foco preso e devolvido);
- 390, 768 e 1440 px sem rolagem horizontal;
- funcionalidade desligada;
- UTMs chegam no corpo do POST.

**Integração real (manual, depois da configuração):**
- um envio cria a linha correta na planilha;
- uma retentativa com a mesma chave não duplica;
- uma requisição sem token é recusada;
- os segredos não aparecem em `.next/static`.

**Gerais:** `tsc`, `lint`, `npm test`, `npm run test:e2e` e `build`.

---

## 16. Critérios de aceite

| Critério | Verificação |
|---|---|
| Sem cadastro inicial | E2E das etapas 1 a 4 sem modal |
| Resultados sempre acessíveis | Fechar o modal mantém o plano |
| Identidade visual | Componentes e tokens existentes; capturas em 1440/768/390 |
| Validação | Testes unitários e E2E |
| Lead persistido | Linha conferida na planilha (teste manual) |
| Exportação só depois da confirmação | E2E de sucesso e de falha |
| Falhas de conexão | E2E com `route.abort()` e 503 |
| Duplicados | Idempotência (unitário) e duplo clique (E2E) |
| Proteção | Planilha privada; token obrigatório; segredos fora do bundle |
| Desktop e mobile | E2E responsivo |
| Sem regressão | 13 unitários e 20 E2E atuais verdes |
| Build e testes | Todas as suítes |

---

## 17. Pendências para começar

1. **Opção A (Apps Script) ou B (conta de serviço)?** Recomendo a A.
2. **Planilha:** quer que eu crie a planilha e o cabeçalho pela integração com o Google Drive, ou você cria e me passa o link?
3. **Política de Privacidade e hospedagem:** não bloqueiam o desenvolvimento, só a publicação.
