# Planejamento Estratégico 2027 · Escala IMOB

Aplicação web de planejamento de aquisição para corretores de imóveis. O usuário informa os números de 2026, os canais de onde vieram as vendas e a comissão desejada para 2027, e recebe um plano por canal.

> Projeto independente, em desenvolvimento. Não é funcionalidade existente da plataforma Escala IMOB e não altera o posicionamento, o Método Escala nem o Documento 09. Os números gerados são **estimativas** e não são garantia de vendas, leads, VGV, faturamento ou retorno.

## Requisitos

- Node.js 20 ou superior (testado com 26.13.1) e npm
- Git (opcional, para versionamento)

## Instalação e execução

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
npm run dev
```

Acesse http://localhost:3000.

| Comando | Função |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir o build |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários dos cálculos (Vitest) |
| `npm run test:e2e` | Testes de ponta a ponta e regressão responsiva (Playwright, usa o Google Chrome instalado) |
| `npm run test:all` | Unitários e ponta a ponta |

## Testes e verificação

- **Unitários** (`tests/unit/calculos.test.ts`, 13 testes): reproduzem o cenário da auditoria e conferem **paridade numérica com a referência**:
  - VGV de R$ 2 mi e 5 imóveis em 2026;
  - R$ 610 mil em canais sem uso;
  - 7 canais no plano;
  - Tráfego com 5,2 vendas e R$ 400 por mês;
  - comissão estimada de R$ 286 mil;
  - Índice de Aquisição de 44 para 78.

  Também cobrem formatação, validações e a regra de venda inteira.
- **Ponta a ponta** (`tests/e2e/fluxo.spec.ts`):
  - fluxo completo com validações na ordem, cálculo cruzado ticket ↔ imóveis, erro de soma por canal, voltar preservando respostas, transição e plano;
  - CTA do Diagnóstico desabilitado sem a variável;
  - "Ajustar os números" e retorno ao plano pela trilha;
  - persistência após recarregar e âncoras internas válidas;
  - nenhum erro de console;
  - "Recomeçar", descarte de rascunho de outra versão e navegação por teclado (Tab, Espaço e contorno de foco visível).
- **Captura de leads** (`tests/unit/lead.test.ts`, `tests/unit/api-leads.test.ts` e `tests/e2e/captura-lead.spec.ts`):
  - telefone (máscara, DDD e E.164), validação por campo e indicadores recalculados no servidor;
  - rota com antispam, limite por IP, idempotência, origem, tamanho, falha do Google e **nenhum dado pessoal em logs ou respostas**;
  - escape de fórmulas na planilha;
  - fluxo real até um Apps Script falso local: gravação, UTMs, consentimentos, eventos na ordem certa, PDF só depois da confirmação, sem novo pedido na mesma sessão, falha e queda de rede sem liberar a exportação, duplo clique, fechamento sem perda de dados, foco preso e layout em 390 e 1440 px.
- Os testes de ponta a ponta rodam no **build de produção** (porta 3100), com a captura ligada por variáveis de teste e um Apps Script falso (porta 3999). Nada é enviado ao Google.
- **Responsivo** (`tests/e2e/responsivo.spec.ts`): as 5 telas em 1440, 768 e 390 px, sem rolagem horizontal. As capturas ficam em `referencias/implementacao/`. Também gera o PDF do plano com o estilo de impressão (`plano-impressao.pdf`, A4), confirmando que a navegação e os botões são ocultados.

**Comparação visual:** as telas foram comparadas com as capturas da referência (`referencias/desktop`, `referencias/mobile`). Ajustes feitos depois da comparação:
- No mobile, o botão Voltar mostra só a seta, para o título não ser truncado (defeito presente na referência).
- Os cartões de canal ficaram mais compactos em telas estreitas, e as descrições caem de 3–4 para 2 linhas.
- Na verificação anterior, já haviam sido corrigidos: estouro de 1 px no mobile, corte do último degrau do funil e grade das semanas.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_DIAGNOSTICO_URL` | Não | Link do Diagnóstico da Escala IMOB, usado no botão do fecho do plano. Sem valor válido (`https://…`), o botão fica **desabilitado**, com aviso. Não há endereço padrão. |

| `LEADS_SHEETS_WEBHOOK_URL` | Para a captura | URL `/exec` do Apps Script (servidor) |
| `LEADS_SHEETS_TOKEN` | Para a captura | Token compartilhado com o script (servidor, 24+ caracteres) |
| `LEADS_IP_SALT` | Para a captura | Segredo do hash de IP (servidor, 16+ caracteres) |
| `PRIVACY_POLICY_VERSION` | Para a captura | Versão da Política de Privacidade gravada em cada lead |
| `NEXT_PUBLIC_PRIVACY_POLICY_URL` | Para a captura | Link da política exibido no modal |
| `LEADS_ALLOWED_ORIGINS`, `LEADS_RATE_LIMIT` | Não | Domínios extras permitidos; envios por IP a cada 10 min (padrão 5) |

As variáveis são lidas no build: depois de alterá-las, é preciso rodar `npm run build` de novo. **Sem as 5 variáveis da captura, ela fica desligada** e as exportações funcionam direto, como antes. Configuração: [`integracoes/google-sheets/LEIA-ME.md`](integracoes/google-sheets/LEIA-ME.md).

Com o link configurado, ele aparece em dois lugares:
- no botão do fecho do plano, que abre em nova aba;
- no **PDF** gerado por "Baixar PDF", num bloco "Próximo passo: Diagnóstico da Escala IMOB" com o link clicável. Esse bloco só aparece na impressão.

## Dados e privacidade

- Preencher e ver o plano **não exige cadastro**.
- **Ao exportar** (Baixar PDF ou Copiar link), com a captura ligada, um modal pede nome completo, WhatsApp e e-mail, com ciência **obrigatória** da Política de Privacidade e autorização de marketing **opcional e desmarcada**. O lead e os principais números do plano (perfil, VGV atual e alvo, ticket médio, vendas e comissão alvo) são gravados numa **planilha privada do Google Sheets** da Escala IMOB, pela rota `/api/leads`. O modal informa essa finalidade.
- A exportação só é liberada depois que a gravação é confirmada. Fechar o modal não apaga o plano. Na mesma sessão do navegador, os dados não são pedidos de novo (isso é só conveniência, não autentica nada).
- Proteções: validação no navegador e no servidor, segredos só no servidor, campo invisível e tempo mínimo contra robôs, limite por IP (gravado só como hash), retentativas idempotentes, escape de fórmulas, nenhum dado pessoal em logs ou eventos.
- UTMs e `referral_id` da URL de entrada ficam em `sessionStorage` durante a navegação e vão junto com o lead. Eles não entram no link compartilhável.
- Eventos `lead_form_opened`, `lead_submitted` (só depois da confirmação), `lead_submission_failed` e `planning_exported` são publicados como `CustomEvent("escala:evento")` e em `window.dataLayer`, se existir, sem dados pessoais nem financeiros. Hoje não há ferramenta de analytics instalada.
- As respostas ficam **apenas no navegador** (`localStorage`, chave `escala-imob:planejamento-2027`, formato versionado `versao: 1`). É possível apagar o rascunho e recomeçar.
- O link compartilhável leva só as respostas numéricas no fragmento `#plano=…` do endereço. Ele não contém dados de contato e não é enviado a nenhum servidor.
- Fora a captura de leads, não há integração com APIs externas, analytics ou pixels.

## Estrutura

```
src/
  app/                 layout, página e tokens globais (globals.css)
  config/
    premissas.ts       PREMISSAS DE CÁLCULO — PROVISÓRIAS
    canais.ts          canais de aquisição (pesos provisórios, textos próprios)
    ambiente.ts        leitura de NEXT_PUBLIC_DIAGNOSTICO_URL
  lib/
    estado.ts          esquema Zod, rascunho versionado, link compartilhável
    calculos.ts        cálculos de 2026, distribuição, Índice de Aquisição, plano e funis
    formatacao.ts      moeda, quantidades e percentuais em pt-BR
    usePlanejamento.ts hook de estado e navegação
    lead.ts            validação do lead (cliente e servidor), telefone, indicadores
    useCapturaLead.ts  fluxo do modal antes de exportar
    rastreamento.ts    UTMs e referral_id
    eventos.ts         eventos de produto (sem dados pessoais)
  server/leads/        configuração, antispam, destino Google Sheets, escape de fórmulas
  app/api/leads/       POST /api/leads
  components/
    casca/             trilho, barra, trilha de etapas e faixa fixa no mobile
    etapas/            telas de cada etapa
    lead/              modal de captura e campos
    ui/                botões, campo de mais e menos, cartões, placas, chave, anel, régua
assets/brand/          arquivos oficiais de marca recebidos
public/brand/          cópias usadas pela interface
integracoes/google-sheets/  script do Apps Script (Code.gs) e passo a passo (LEIA-ME.md)
```

## Premissas de cálculo (PROVISÓRIAS)

Por decisão do responsável pelo projeto (25/11/2026), as taxas de conversão, os pesos dos canais, os meses de entrada, o custo por lead e as demais premissas **repetem os valores observados na aplicação de referência** (ver `AUDITORIA_REFERENCIA.md` §9). Elas valem até a Escala IMOB validar premissas próprias.

Todas as premissas ficam em `src/config/premissas.ts` e nos campos `peso`, `mesEntrada` e `acima` de `src/config/canais.ts`. Para trocá-las, basta editar esses arquivos; a lógica de cálculo não muda.

**Diferenças intencionais em relação à referência** (ver `AUDITORIA_REFERENCIA.md` §9.7 e §12):

- O percentual de comissão é validado entre 0,5% e 20%, conforme a mensagem exibida. A referência aceitava qualquer valor acima de 0.
- Uma meta abaixo da comissão de 2026 é aceita, mas exibe um aviso.
- Quando a parceria divide a comissão e a soma fica abaixo da meta, o plano explica o motivo.
- "Copiar link" informa quando a cópia falha e tenta um método alternativo.
- Não há cadastro antes do plano; o contato só é pedido ao exportar. A referência exigia cadastro antes de mostrar o plano. Depois de "Ajustar os números", é possível voltar ao plano pela trilha de etapas.
- O plano inclui o botão "Recomeçar", que apaga o rascunho local.

## Identidade visual

A fonte oficial é o **Manual de Marca** (`assets/brand/ESCALA-IMOB-MANUAL-DE-MARCA.pdf`, recebido em 26/11/2026).

| Item | Situação |
|---|---|
| Paleta | **OFICIAL** (manual, p. 8): Eletric Blue `#0106FE` (rgb 1, 6, 254), Black `#000000` e White `#FFFFFF`. O código do azul foi lido das instruções vetoriais do manual, que não traz o hexadecimal escrito. |
| Cores de apoio | **Derivadas de interface**, fora do manual: tons claros e escuros do azul, cinzas de texto e fio, vermelho de erro e âmbar de alerta. Estão em `src/app/globals.css`. |
| Tipografia | **OFICIAL** (manual, p. 9): Montserrat, carregada via `next/font` e servida pelo próprio site. |
| Isotipo | **OFICIAL, vetorial.** Convertido das curvas de `assets/brand/vetor/escala-imob-vetor.pdf` para o componente `Isotipo` e para os SVGs em `assets/brand/vetor/` (azul, branco e preto). No trilho é usado com 40 px, a redução mínima do manual (p. 2). Também é o favicon (`src/app/icon.svg`). |
| Logotipo completo (com o nome) | PNG oficial, usado na tela de transição. **Pendente:** SVG com o texto convertido em curvas. No PDF vetorial, "escala imob" é texto com fonte embutida, sem contornos. |
| Símbolo com telhado | Resolvido pelo manual: o símbolo une "movimento ascendente de evolução" à "estrutura geométrica de um imóvel" (p. 2). Ele é usado sem alteração, e os demais ícones da interface não usam telhados, chaves ou prédios. |
| Grafia da marca | **"Escala IMOB"**, por decisão do responsável em 26/11/2026, mesmo com o manual escrevendo "Escala Imob". O logotipo oficial, em minúsculas, é usado sem alteração. |

### Marcas de terceiros

Os canais Tráfego pago, Social Selling, Lista Fria e Google Meu Negócio usam as logomarcas de Meta, Instagram, WhatsApp e Google Meu Negócio. Os arquivos foram fornecidos pelo responsável em 26/11/2026 e estão em `public/third-party/`, registrados em `LOGOS_DISPONIVEIS` (`src/components/ui/Placa.tsx`). Os outros canais usam ícones próprios.

Meta, Instagram, WhatsApp e Google são marcas de seus respectivos titulares. O uso é apenas para identificar os canais e não indica parceria nem endosso.

## Pendências

- [x] Endereço do Diagnóstico: `https://escalaimob.com.br`, informado pelo responsável em 26/11/2026 e configurado em `.env.local`. O `.env.local` não é versionado, então a variável também precisa ser definida no ambiente de hospedagem.
- [x] Manual de marca: paleta, tipografia e isotipo vetorial aplicados
- [x] Logomarcas de terceiros em `public/third-party/`
- [ ] Logotipo completo em SVG, com o texto convertido em curvas
- [x] Grafia: "Escala IMOB" (decidido em 26/11/2026)
- [ ] Validação das premissas de cálculo pela Escala IMOB
- [ ] Nomes das faixas do Índice de Aquisição (provisórios: Concentrada, Em expansão, Distribuída)
- [ ] **Política de Privacidade** publicada (URL e versão). **Bloqueia a ativação da captura de leads.**
- [ ] Planilha e Apps Script configurados (`integracoes/google-sheets/LEIA-ME.md`), com as variáveis da captura no `.env.local` e na hospedagem
- [ ] Hospedagem com servidor Node (a rota `/api/leads` não funciona em hospedagem só estática)
- [ ] Integração futura com Pipedrive (colunas `crm_sync_status` e `crm_external_id` já previstas)

## Deploy

Não fazer deploy em produção sem aprovação explícita.

## Referência

A arquitetura de experiência foi baseada na auditoria documentada em `AUDITORIA_REFERENCIA.md`, com screenshots em `referencias/`. O código, os textos e os ícones são originais.
