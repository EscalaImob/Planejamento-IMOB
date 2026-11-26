# Auditoria da referência — Planejamento 2027

- **Referência:** https://acelera-planejamento27.vercel.app/
- **Data da auditoria:** 25/11/2026
- **Ferramentas:** navegador interno do Claude Desktop (navegação, cliques, digitação, teclado, inspeção de DOM e `localStorage`, rede, viewports 1440/768/390) e Google Chrome headless (capturas de página inteira).
- **Fonte complementar:** o HTML público da página traz todo o JavaScript e o CSS inline, sem minificação. Por isso as regras e fórmulas abaixo foram **lidas no código cliente e conferidas por entrada e saída no navegador**. Cada item indica como foi verificado:
  - **[V]** visto/testado no navegador;
  - **[C]** lido no código cliente e não exercitado visualmente;
  - **[V+C]** ambos.
- **Screenshots:** `referencias/desktop/`, `referencias/mobile/`, `referencias/tablet/` (índice na seção 14).

> **Uso deste documento.** Ele descreve o produto de terceiros (Acelera Hub / Acelera Imob) apenas para fundamentar uma implementação original. Textos, nomes de marca, logotipos, ícones, premissas de negócio e taxas citados aqui **não devem ser copiados** para o produto Escala IMOB sem decisão explícita (veja a seção 13).

---

## 1. Visão geral

A aplicação é uma página única (SPA em JavaScript puro, sem framework, num único `index.html` de cerca de 167 KB) com um fluxo de **4 etapas de entrada**, seguido por uma **tela de cadastro** e um **plano final** de 5 seções.

| # | Etapa (trilha) | Tela | Função |
|---|---|---|---|
| 1 | Diagnóstico | 4 cartões "Passo" + painel de resultado | Números de 2026 |
| 2 | Canais | 1 cartão com 9 canais liga/desliga + painel | De onde vieram as vendas de 2026 |
| 3 | Meta 2027 | 1 cartão + painel | Comissão desejada em 2027 |
| 4 | Seu plano | Bloco escuro "pronto para ser gerado" + formulário | Cadastro (gate do lead) |
| 5 | (sem rótulo na trilha) | Plano completo | Resultado final com 5 seções |

Internamente o estado usa `passo` de 1 a 5. O passo 5 só abre com `desbloqueado = true`, que é definido pelo envio do cadastro ou por um link de plano compartilhado. **[V+C]**

---

## 2. Estrutura da casca (layout global)

### 2.1 Desktop (≥ 1024 px) **[V+C]**

- **Trilho lateral fixo** à esquerda, com 76 px de largura, fundo branco e fio à direita.
  - No topo fica o botão do logotipo da marca (30×30 px, área de 64 px de altura).
  - Abaixo, 4 ícones de traço (estilo Lucide, traço 1,75), um por etapa: documento, fluxo, alvo e gráfico de colunas.
  - O ícone da etapa atual recebe fundo cinza-claro e cor verde. As etapas futuras ficam com opacidade de 45%. As etapas passadas viram botões clicáveis que levam de volta a elas.
- **Barra superior fixa** (sticky, cerca de 75 px de altura, fio inferior), da esquerda para a direita:
  1. Botão **Voltar** com chevron. O rótulo é o nome da etapa anterior ("Diagnóstico", "Canais", "Meta 2027"). Ele só aparece nos passos 2 a 4 e vem seguido de um divisor vertical de 32 px.
  2. Título "Planejamento 2027" (18 px, peso 600) e subtítulo de uma linha por etapa (14 px, cinza). Ambos são cortados com reticências quando não cabem.
  3. **Trilha de etapas** em pílulas numeradas ligadas por traços de 24 px. Ela só aparece a partir de **1180 px**.
     - Etapa atual: pílula preta, número em círculo branco.
     - Etapas concluídas: círculo verde com ✓; a pílula é clicável ("Voltar para X").
     - Etapas futuras: borda cinza, número em círculo cinza.
  4. Botão principal **Próximo**, que no passo 3 vira **Gerar meu plano**.
     - Formato pílula, 48 px de altura, fundo teal com sombra colorida.
     - À direita, um círculo preto com uma seta; no hover, uma segunda seta entra deslizando.
     - Fica oculto nos passos 4 e 5.
- **Área de conteúdo** com fundo cinza-claro (`#f5f5f7`), largura máxima de 1320 px, centralizada, com padding de 24 px no topo e `clamp(16px, 2,4vw, 32px)` nas laterais.
- **Grade das etapas 1 a 3:** coluna principal flexível com 824 px medidos a 1440 px, um gap de 32 px e um **painel de resultado de 400 px** à direita, sticky a `topo + 92 px`.

### 2.2 Tablet e mobile (< 1024 px) **[V+C]**

- O trilho lateral vira uma **barra superior de 56 px**: logo à esquerda e os 4 ícones da etapa à direita, com 40 px cada.
- A barra da ferramenta fica sticky logo abaixo dela (`top: 56px`). A trilha de pílulas fica oculta (ela já some abaixo de 1180 px).
- O painel de resultado deixa de ficar ao lado e passa a vir **depois dos cartões**, em fluxo normal.
- Aparece uma **faixa fixa no rodapé**, com fundo quase preto, 64 px e `safe-area-inset-bottom`. À esquerda vai o rótulo do indicador principal; à direita, o valor em verde vivo. O `body` ganha `padding-bottom: 64px`.
- A 390 px, título e subtítulo da barra são truncados ("Pla…", "P…") quando há botão Voltar e Próximo, e o subtítulo vira "Os seus números de 2026. O …". **[V]**

### 2.3 Breakpoints observados

| Largura | Efeito |
|---|---|
| ≥ 1180 px | Trilha de pílulas visível |
| ≥ 1024 px | Trilho lateral, grade com painel lateral sticky, cadastro em 2 colunas |
| < 1024 px | Barra superior de ícones, painel abaixo, faixa fixa no rodapé |
| ≤ 1180 px | Plano: "Primeiros 30 dias" passa para 2 colunas |
| ≤ 640 px | Plano: "Primeiros 30 dias" em 1 coluna |
| Container queries (520/560/600/640/880 px) | Ajustes internos dos cartões: faixa de números, funil, células e layout do canal |

---

## 3. Etapa 1 — Diagnóstico

**Subtítulo da barra:** "Os seus números de 2026. O resultado aparece ao lado." **[V]**

### 3.1 Estrutura do cartão "Passo" (componente comum às etapas 1 a 3) **[V+C]**

- Cartão branco: raio de 28 px, borda `#c7c7cc`, sombra suave e longa.
- Cabeçalho:
  - à esquerda, uma **placa** de 56×56 px (raio 16 px, borda e sombra) com um ícone cheio duotônico em dois verdes;
  - à direita, "Passo N" (15 px, peso 600, verde), o título (`clamp(22px, 2,2vw, 28px)`, peso 600, tracking −0,035em) e a pergunta (16 px, cinza).
- Corpo separado por um fio, com padding de 24 px.
- Animação de entrada: `translateY(14px)` mais opacidade, 0,4 s, curva `cubic-bezier(.22,1,.36,1)`, com atraso de 50 ms por cartão (efeito cascata).

### 3.2 Campos

| Passo | Pergunta (resumo) | Controle | Regras |
|---|---|---|---|
| 1 Você | Perfil | 3 botões-atalho com `aria-pressed`: Corretor autônomo, Imobiliária, Incorporador | Seleção única. O selecionado fica com fundo preto e texto branco. A altura é 56 px e o raio 16 px. **[V]** |
| 2 A comissão de 2026 | Comissão recebida | Campo "mais e menos" com prefixo R$ e placeholder 100.000 | Máscara de milhar pt-BR enquanto se digita; só dígitos. Os botões −/+ andam **10.000**. **[V+C]** |
| 3 O percentual de comissão | % médio por venda | Mais e menos com sufixo %, `inputmode=decimal` | Valor padrão **5** (pré-preenchido). Aceita vírgula ou ponto. É válido se for maior que 0 e no máximo 20; fora disso o estado fica nulo e o painel mostra "0%". Os botões −/+ andam **0,5**. **[V+C]** |
| 4 Ticket médio ou imóveis vendidos | Um **ou** outro | Dois campos mais e menos lado a lado, separados por "ou" | O campo digitado por último manda (veja a seção 3.3). Ticket ±**50.000**; imóveis ±**1** (só inteiros). **[V+C]** |

**Componente "mais e menos"** **[V+C]**

- Altura de 56 px, largura máxima de 300 px, borda de **2 px quase preta**, raio de 16 px.
- Botões − e + de 46 px separados por fio.
- Número centralizado na fonte numérica, 22 px, peso 700.
- Em foco, ganha um anel verde translúcido de 4 px (`box-shadow`).
- O valor nunca fica negativo (mínimo 0).

### 3.3 Cálculo cruzado ticket ↔ imóveis **[V+C]**

- Ao digitar no **ticket**, o campo de imóveis passa ao estado **calculado**:
  - fundo cinza, borda mais clara, texto cinza;
  - selo "calculado" ao lado do rótulo;
  - valor = VGV 2026 ÷ ticket.
- Ao digitar em **imóveis**, a lógica se inverte: ticket = VGV 2026 ÷ imóveis, arredondado.
- Ao focar o campo calculado, o texto inteiro é selecionado para facilitar a sobrescrita.
- Exemplo testado:
  - comissão R$ 120.000 com 6% gerou VGV de R$ 2.000.000;
  - ticket de 400.000 gerou **5 imóveis**;
  - imóveis = 8 gerou **ticket de 250.000**.

### 3.4 Painel de resultado (ao vivo, `aria-live="polite"`) **[V]**

- Topo escuro (`#07110f`): rótulo "VGV gerado em 2026" e o valor em verde vivo (`#33dcb2`), 48 px.
- Abaixo, uma grade 2×2 de células com fio: Imóveis vendidos, Ticket médio, Comissão em 2026, % Comissão.
- Atualiza a cada tecla.

### 3.5 Validação ao clicar em Próximo (ordem fixa) **[V]**

Os erros aparecem num **aviso vermelho no topo do conteúdo** (`role="alert"`, fundo rosado, borda rosa, raio 16 px), com rolagem suave até o topo. O aviso some na próxima interação com o perfil ou com os campos de número.

1. Sem perfil → "Escolha se você é corretor autônomo, imobiliária ou incorporador."
2. Comissão ≤ 0 → "Informe a comissão que você recebeu em 2026."
3. % inválido → "Informe o seu percentual de comissão, entre 0,5% e 20%."
   - **Inconsistência observada:** o texto diz 0,5%, mas o código aceita qualquer valor maior que 0 (por exemplo 0,1).
4. Ticket calculado ≤ 0 → "Informe o ticket médio ou o número de imóveis vendidos."

O botão Próximo nunca fica desabilitado nesta etapa: a validação acontece no clique.

---

## 4. Etapa 2 — Canais

**Subtítulo:** "De onde vieram as suas vendas de 2026." **[V]**

### 4.1 Cartão único

- O título é dinâmico: "De onde vieram as suas {N} vendas", com N = imóveis de 2026.
- A instrução diz que os campos em branco recebem o restante dividido igualmente.
- Há **9 linhas de canal**, cada uma um cartão interno com raio de 20 px, borda e altura mínima de 96 px:
  - à esquerda, uma placa com a logomarca da plataforma (Meta, Instagram, WhatsApp, Google Maps) ou um ícone duotônico;
  - o nome em 19 px e a descrição em 15 px;
  - à direita, uma chave liga/desliga de 56×32 px (`role="switch"`, `aria-checked`). Ligada, fica teal e a bolinha desliza com mola.
- Clicar no nome ou no ícone também alterna o canal.
- Quando o canal está ligado:
  - a borda fica preta, com `inset` de 1 px;
  - aparece um campo mais e menos compacto (160×52 px), o texto "imóveis" e o **% do canal** em verde, 24 px;
  - o foco vai automaticamente para o campo.
- Ao desligar, o valor informado é apagado.

| id | Nome (corretor) | Nome (perfil Imobiliária) | Descrição |
|---|---|---|---|
| trafego | Tráfego pago | = | Leads de anúncios pagos |
| social | Social Selling | = | Leads prospectados pelo Instagram |
| lista | Lista Fria | = | Leads antigos da sua base |
| indicacao | Indicação | = | Leads indicados por clientes |
| prospeccao | Prospecção Ativa | = | Leads abordados por ligação |
| portais | Portais | = | Leads de ZAP, Viva Real e OLX |
| gmn | Google Meu Negócio | = | Leads do Google e do Maps |
| imobiliaria | Imobiliária | **Parcerias** | Vendas em parceria / **Vendas com outras imobiliárias** |
| construtora | Construtora | = | Venda de lançamentos |

O perfil "Imobiliária" troca o nome e a descrição do canal `imobiliaria`. **[V]** O perfil "Incorporador" não altera os canais. **[C]**

### 4.2 Regras **[V+C]**

- **Próximo desabilitado** (opacidade de 50%) enquanto nenhum canal estiver ligado ou houver erro.
- **Erro de soma:** se a soma informada passar do total de 2026, aparece uma nota vermelha no **rodapé do cartão** ("Você informou X imóveis, mais que os Y de 2026. Ajuste os números.") e Próximo fica desabilitado.
- **Distribuição:**
  - os canais com número mantêm o valor informado;
  - o restante (total − soma) é dividido igualmente entre os canais ligados sem número;
  - se ainda assim a soma divergir do total, tudo é reescalado proporcionalmente.
  - Exemplo testado com total de 5: Tráfego 2, Indicação 1, Social e Imobiliária em branco geraram 1 e 1, ou seja, 40%, 20%, 20% e 20%.

### 4.3 Painel de resultado **[V]**

- Topo: "VGV parado, com N canais desligados" e o valor em verde vivo.
- Células: "Canais ligados: X de 9" e "Imóveis informados: soma de total".
- Sem canais ligados, mostra o texto "Ligue os canais que você usa para ver o seu Health Score."
- Com canais ligados, mostra:
  - um **anel de Health Score** (SVG de 112 px, traço de 11 px, transição de 0,6 s) com o número no centro e "de 100";
  - à direita, a faixa colorida e "X de 9 canais";
  - se um canal concentrar 50% ou mais das vendas, acrescenta ". NN% das vendas em {canal}";
  - a lista **"Oportunidades perdidas"**: placa, nome e valor em vermelho, ordenada do maior para o menor.

**Health Score:** `round(canais ligados ÷ 9 × 100)`.

| Faixa | Nome | Cor |
|---|---|---|
| < 34 | Dependente | vermelho `#b42727` |
| < 67 | Em construção | âmbar `#9a5b00` |
| ≥ 67 | Saudável | verde `#0b6a5b` |

Valores observados: 1 canal → 11 (Dependente); 4 canais → 44 (Em construção). **[V]**

**Oportunidade perdida por canal desligado:** `imóveis2026 × peso/100 × ticket × (13 − mêsEntrada)/12`. O "VGV parado" é a soma das oportunidades. Valores conferidos com 5 imóveis e ticket de R$ 400 mil: Lista Fria R$ 300 mil, Social R$ 275 mil, Indicação R$ 200 mil, Prospecção R$ 160 mil, Portais R$ 90 mil, GMN R$ 45 mil, Imobiliária R$ 36,7 mil, Construtora R$ 15 mil; total com tudo desligado R$ 1,86 mi. **[V+C]** Os pesos e meses de entrada estão na seção 9.

---

## 5. Etapa 3 — Meta 2027

**Subtítulo:** "Quanto você quer ganhar em 2027." O botão principal passa a "Gerar meu plano". **[V]**

- Um cartão "Passo 1 — A meta de 2027" com o campo mais e menos "Comissão desejada em 2027" (R$, placeholder 0, passo de 10.000).
- **"Gerar meu plano" desabilitado** até a meta ser maior que 0. **Não há validação mínima:** uma meta menor que a comissão de 2026 é aceita e mostra variação negativa (por exemplo −17%). **[V]**

**Painel de resultado:**

- Topo: "VGV necessário em 2027" = meta ÷ %.
- Células:
  - "Imóveis no ano" = VGV 2027 ÷ ticket;
  - "Sobre 2026" = meta ÷ comissão 2026 − 1, em verde, com sinal.
- Placar "Comissão em 2026 × Meta 2027" com uma **régua**: a barra verde é a meta em proporção ao maior dos dois valores, e um marcador vertical preto de 3 px indica 2026. A largura e a posição animam em 0,5 s.

Exemplo: meta de R$ 300 mil a 6% resultou em VGV de R$ 5 mi, 13 imóveis (12,5 arredondado) e +150%. **[V]**

---

## 6. Etapa 4 — Cadastro ("Seu plano")

**Subtítulo:** "Falta só dizer para quem é o plano." O botão Próximo fica oculto; Voltar leva a "Meta 2027". **[V]**

Layout em 2 colunas a partir de 1024 px (`1fr` e 460 px, máximo de 1080 px, centralizado) e empilhado no mobile:

- **Bloco escuro** (raio de 28 px): sobretítulo "Etapa 4 de 4 · Seu plano", título com destaque em verde vivo e uma lista de 5 entregáveis em cartões brancos com ✓ verde em círculo. Os entregáveis são: plano por canal, funil do mês, calendário, primeiros 30 dias, link e PDF. **[V]**
- **Formulário** "Para quem é o plano?", com rótulos acima dos campos:

| Campo | Tipo | Regras |
|---|---|---|
| Nome | text, `autocomplete=name` | Pelo menos 2 caracteres |
| Telefone (WhatsApp) | tel, placeholder "(00) 00000-0000" | Máscara progressiva "(DD) NNNNN-NNNN" com até 11 dígitos; exige pelo menos 10 |
| E-mail | email | Regex simples `x@y.zz` |
| Aceite | checkbox | Obrigatório. O texto autoriza contato da marca por WhatsApp e e-mail |
| Site (oculto) | text fora da tela, `tabindex=-1` | **Armadilha antispam (honeypot)** enviada junto |

- O botão de envio ocupa a largura toda, tem 56 px de altura e o texto "Gerar meu Plano 2027" com seta.
- **Validação no envio** (`novalidate`; mensagem única em vermelho acima do botão, `role="alert"`), testada na ordem **[V]**:
  1. "Informe o seu nome."
  2. "Informe o telefone com DDD."
  3. "Informe um e-mail válido."
  4. "Marque o aceite para receber o plano."
- Os campos do formulário **não são persistidos** e voltam vazios ao retornar à etapa. Só o nome é gravado, depois de um envio válido. **[V]**

### 6.1 Envio e tela "gerando" **[V+C]**

1. Com o formulário válido, o botão é desabilitado e o lead (id, nome, e-mail, telefone com prefixo 55, perfil, aceite, honeypot, data, **link do plano**, resumo das respostas e origem com UTMs e referrer guardados no `sessionStorage`) entra numa **fila no `localStorage`** e é enviado por `POST /api/lead` (JSON, timeout de 12 s, até 2 tentativas com 0,9 s de intervalo).
2. Ao mesmo tempo aparece uma **tela cheia escura** com o logotipo, uma frase que muda a cada cerca de 620 ms (3 frases sobre ler os números, distribuir a meta e montar os funis) e uma barra de progresso verde de 320 px que enche em 1,7 s. A tela dura cerca de 1,9 s e é pulada com `prefers-reduced-motion`.
3. O plano abre quando o envio termina ou depois de **no máximo 7 s**.
4. Se o envio falhar, o lead **fica na fila e é reenviado** automaticamente na próxima visita e no evento `online`.

**Observado no teste (com autorização do usuário):**

- O cadastro foi enviado com dados fictícios: nome "TESTE Auditoria (ignorar)", e-mail `@example.com` e telefone com DDD 00.
- O servidor respondeu **HTTP 503** em todas as tentativas, inclusive no reenvio automático ao recarregar a página. **Portanto o lead não foi gravado pela referência.**
- O plano abriu mesmo assim, depois do tempo-limite.
- A fila local do navegador interno foi apagada depois do teste para interromper os reenvios.
- Também é emitido o evento DOM `plano2027:lead` (provável gancho para pixel ou analytics). **[C]**

---

## 7. Passo 5 — Plano completo

Mudanças de casca **[V]**:

- a barra da ferramenta some;
- o fundo do conteúdo fica branco;
- no trilho lateral, os ícones deixam de ser clicáveis e o 4º fica ativo.

### 7.1 Navegação interna do plano **[V+C]**

- **Barra de seções sticky** (`top: topo + 12px`) com fundo branco translúcido e `backdrop-filter: blur(12px)`, raio de 16 px e sombra. Ela rola na horizontal, sem barra de rolagem visível.
- Itens numerados: 1 Planejamento, 2 Diagnóstico, 3 Gestão de canais, depois um subitem menor por canal do plano, 4 Calendário e 5 Próximos passos.
- **Scroll-spy:** o item da seção que está a 150 px ou menos do topo fica preto. No fim da página, marca o último. A barra centraliza o item ativo com rolagem suave. Clicar ancora na seção, e o `scroll-margin-top` compensa a barra.

### 7.2 Seção 1 — Abertura **[V]**

- Cartão grande (raio de 32 px) com fundo em gradientes radiais verdes, uma grade quadriculada de 56 px mascarada e sombra.
- Linha superior:
  - avatar circular com as **iniciais** do nome, o nome e "· {perfil}";
  - à direita, 3 botões secundários em pílula: **Copiar link**, **Baixar PDF** e **Ajustar os números**.
- Selo "1 · Etapa 1 de 5 · Seu planejamento".
- Título em 3 linhas (o h1 tem `aria-label` com a frase completa):
  - frase de abertura em 22–32 px;
  - **valor da meta gigante** (`clamp(48px, 7,4vw, 104px)`, peso 700);
  - complemento "de comissão, com R$ X de VGV".
- Faixa verde: "**NN% acima de 2026**" e "N imóveis no ano, ticket de R$ X, comissão de Y%".

### 7.3 Painéis escuros (seções 2 a 5)

- Cada seção é um painel `#07110f` (raio de 36 px).
- Cabeçalho com um quadrado branco numerado (52–72 px), "Etapa N de 5" e o título (28–40 px).
- Dentro, cartões claros.

**Seção 2 — Diagnóstico 2026** **[V]**

- 3 células: Comissão em 2026, VGV em 2026, Imóveis vendidos.
- **De onde vieram as vendas:** uma linha por canal usado, com placa, nome, **barra horizontal** proporcional ao maior canal e "N · %".
- **Health Score antes → depois:** dois anéis lado a lado, "hoje" e "com o plano", ligados por uma seta.
  - O score "com o plano" é a união dos canais usados com os canais do plano, dividida por 9.
  - Exemplo: 44 Em construção → 78 Saudável.

**Seção 3 — Gestão de canais** **[V]**

- Título "N canais para sair de X para Y vendas".
- **Tabela** (rolagem horizontal; largura mínima de 660 px):
  - colunas Canal | 2026 | 2027 | Entra no mês | O que precisa por mês;
  - **rodapé escuro** com Total e "Tráfego: R$ X por mês".
- Abaixo, "Comissão prevista em 2027: R$ X" (com ressalva quando há parceria dividida).
- **Um cartão por canal do plano:**
  - cabeçalho com placa, "Canal N", nome e selo ("Você já usa" em branco ou "Canal novo · entra no mês N" em verde);
  - **funil de anéis** (veja a seção 8) com o título "O funil do mês";
  - **6 células** em 2 colunas: medida principal, visitas (ou a segunda medida), vendas em 2026, vendas em 2027, VGV em 2027 e Comissão em 2027 (esta com destaque verde-claro). Cada célula tem uma unidade abaixo, como "por mês", "no ano" ou "canal novo";
  - "O que fazer": 3 ações com ✓ verde;
  - rodapé "Número para acompanhar: {KPI}".

**Seção 4 — Quando cada canal entra** **[V]**

- Grade tipo **Gantt**: coluna de canal (170–240 px) e 12 meses (Jan–Dez), com fios verticais.
- Cada canal tem uma barra em pílula do mês de entrada até dezembro:
  - verde-escuro "Já roda" para canais já usados;
  - teal "Entra em {Mês}" para canais novos.
- Rolagem horizontal no mobile; largura mínima de 720 px.

**Seção 5 — Os primeiros 30 dias** **[V]**

- Linha do tempo com 4 semanas: 4 colunas no desktop, 2 colunas até 1180 px e 1 coluna até 640 px.
- Cada semana tem um nó numerado (o 1º em verde vivo) ligado ao próximo por uma linha com gradiente, mais um cartão branco.
- Conteúdo de cada semana:
  1. **Organizar a base:** 2 itens fixos.
  2. **Ligar os canais** (ou **Ajustar os canais** se a pessoa já usa todos): até 4 canais do plano que entram até o mês 2 e ainda não são usados (se não houver, os que mais crescem), com "medida principal · valor por mês".
  3. **Atendimento diário:** 2 itens fixos.
  4. **Primeira revisão:** 1 item e uma régua verde-clara com Vendas e VGV "por mês" ou "a cada N meses".
- **Fecho:**
  - "Comissão, de 2026 para 2027": valor 2026 → **meta gigante em verde vivo**;
  - linha "N imóveis no ano · R$ X de VGV · N canais";
  - ações: **Baixar PDF** (primário) e **Copiar link**. Um botão "Quero ajuda para executar" (WhatsApp) só existe se o número estiver configurado; **na referência está vazio, então o botão não aparece**. **[C]**
- **Rodapé** centralizado: aviso de que são estimativas e **não garantia de resultado**.

### 7.4 Botões do plano

| Botão | Comportamento | Verificação |
|---|---|---|
| Copiar link | Copia `…/#plano={base64url}` para a área de transferência e troca o rótulo para "Link copiado". | No navegador interno a cópia falhou em silêncio: **sem feedback de erro**, e o rótulo não mudou. **[V]** O sucesso não foi observado. |
| Baixar PDF | Chama `window.print()`. O CSS de impressão (A4, margem de 10 mm) esconde trilho, barra, navegação de seções e botões, remove sombras e animações e evita quebras dentro de cartões. | **Não acionado:** abriria o diálogo do sistema. **[C]** |
| Ajustar os números | Limpa o hash e volta ao passo 1 com todos os dados. | **[V]** Para voltar ao plano é preciso **reenviar o cadastro**: não há atalho, e a trilha não oferece "Seu plano". |
| Logo do trilho | Nos passos 2 a 4 volta ao passo 1; nos passos 1 e 5 não faz nada. | **[V+C]** |

### 7.5 Link compartilhável **[V+C]**

- Formato `#plano=` seguido do JSON das respostas em base64url. O JSON leva perfil, comissão, %, modo, ticket, imóveis, canais, distribuição, meta e **apenas o primeiro nome**; não inclui contato.
- Ao abrir o link, o app monta o plano direto no passo 5, já desbloqueado.
- Testado em perfil limpo (Chrome headless): o plano renderizou completo.

---

## 8. Gráficos e visualizações

| Visual | Onde | Implementação | Verificação |
|---|---|---|---|
| Anel de progresso (Health Score) | Painel da Canais e plano, seção 2 | SVG com círculo r=50 e `stroke-dasharray`; trilho `#e3e3e8`; cor por faixa; início girado −90° | [V+C] |
| Régua meta × 2026 | Painel da Meta | Barra de 12 px com preenchimento verde e marcador de 3 px | [V] |
| Barras horizontais | Plano, seção 2 | 12 px, fundo cinza, preenchimento quase preto | [V] |
| **Funil de anéis** | Cartão de cada canal | SVG gerado em código: um tronco de cone por etapa, com elipse superior mais escura, estreitando cerca de 42% ao longo do funil. Cores de 6 pares (lilás, verde, laranja, rosa, azul, verde-água). Número centralizado em cada anel. Rótulos à direita com um fio-guia e a taxa em verde. Sombra projetada. **Sempre termina** em Vendas, VGV total e VGC. | [V+C] |
| Gantt de entrada | Plano, seção 4 | CSS grid de 12 colunas | [V] |
| Linha do tempo das semanas | Plano, seção 5 | Nós e conectores em CSS | [V] |

Não há biblioteca de gráficos: tudo é SVG ou CSS feito à mão.

---

## 9. Fórmulas e premissas (lidas no código e conferidas por entrada e saída)

### 9.1 Base de 2026

- `VGV26 = comissão ÷ (pct/100)`
- `ticket` = informado, ou `VGV26 ÷ imóveis`
- `imóveis` = informado, ou `VGV26 ÷ ticket`

### 9.2 Meta 2027

- `VGV27 = meta ÷ (pct/100)`
- `vendas27 = VGV27 ÷ ticket`
- `crescimento = max(0, vendas27 − vendas26)`
- `mult = vendas27 ÷ vendas26`, com valor 3 quando não há vendas em 2026

### 9.3 Canais que entram no plano

- os 4 "núcleo" (Tráfego, Social, Lista, Indicação);
- os canais já usados;
- canais extras quando `mult > acima + 1`.

Conferido: com mult = 2,5 entraram Prospecção (acima 1) e GMN (acima 1), mas não Portais nem Construtora (acima 2). O resultado foram 7 canais. **[V+C]**

### 9.4 Distribuição do crescimento por canal

| Canal | Peso | Núcleo | Mês de entrada (se novo) | Acima | Observação |
|---|---|---|---|---|---|
| Tráfego pago | 40 | sim | 2 | — | Único canal com investimento |
| Social Selling | 15 | sim | 2 | — | |
| Lista Fria | 15 | sim | 1 | — | |
| Indicação | 10 | sim | 1 | — | |
| Prospecção Ativa | 8 | — | 1 | 1 | |
| Portais | 6 | — | 4 | 2 | |
| Google Meu Negócio | 3 | — | 4 | 1 | |
| Imobiliária / Parcerias | 2 | — | 2 | 2 | **Comissão dividida por 2** |
| Construtora | 1 | — | 4 | 2 | |

Por canal:

- `crescimento do canal = crescimento × peso ÷ soma dos pesos do plano`
- `total do canal = vendas 2026 do canal + crescimento do canal`
- Um canal **já usado** entra no mês 1.
- `meses ativos = 13 − mês de entrada`
- `vendas/mês em cruzeiro = vendas 2026 do canal ÷ 12 + crescimento do canal ÷ meses ativos`
- `VGV do canal = total × ticket`
- `VGC do canal = VGV do canal × pct × divisão`

Conferido: Tráfego tinha 2 vendas em 2026; somou 3,23 de crescimento e chegou a 5,2. **[V]**

### 9.5 Funis de trás para frente (vendas/mês → o que o canal precisa)

| Canal | Taxas |
|---|---|
| Tráfego pago | fecha 20% · comparece 30% · agenda 19,5% (exibido "20%") |
| Portais / GMN | fecha 20% · comparece 30% · agenda 15% |
| Social Selling / Lista Fria | visita 1,5% · fecha 10% |
| Indicação | fecha 20% · visita 50% · indica 30% |
| Prospecção | fecha 10% · visita 1% |
| Parcerias | parceiros = max(1, vendas ÷ 0,1) · imóveis compartilhados = max(2, ⌈vendas ÷ 0,1⌉) por semana |
| Construtora | lançamentos no ano = max(1, ⌈vendas × 12 ÷ 3⌉) · 3 unidades por lançamento |

Medidas derivadas:

- **Custo por lead (Tráfego)** pela faixa do ticket, com desconto de 30%:

  | Ticket | CPL antes do desconto | CPL exibido |
  |---|---|---|
  | até 500 mil | R$ 12,50 | R$ 8,75 |
  | até 800 mil | R$ 22,50 | R$ 15,75 |
  | até 2 mi | R$ 45 | R$ 31,50 |
  | acima de 2 mi | R$ 90 | R$ 63 |

- **Investimento** = leads × CPL, arredondado para cima ao múltiplo de R$ 100.
- **Por dia útil** = valor mensal ÷ 22.

Conferido com vendas em cruzeiro de 0,4355 por mês: visitas 2,2, agendam 7,3, leads 37, CPL R$ 9 (8,75), investimento R$ 400 (325,7 arredondado para cima). **[V]**

### 9.6 "Venda inteira"

- Menos de 1 venda por mês aparece como **1 venda "a cada N meses"**, com `N = ⌈1 ÷ v⌉`.
- O VGV e o VGC do funil são os dessa venda única.
- Exemplos vistos: "a cada 3 meses", "a cada 38 meses". **[V]**

### 9.7 Inconsistências observáveis (não replicar sem decidir)

- A "Comissão prevista em 2027" (R$ 286 mil) **é menor que a meta** (R$ 300 mil) porque a parceria divide a comissão por 2. O plano não compensa essa diferença. **[V]**
- O "investimentoTrafegoMes" enviado no lead (326) difere do exibido (R$ 400) por causa do arredondamento só na tela. **[V]**
- O texto da validação diz "entre 0,5% e 20%", mas o código aceita valores maiores que 0. **[V+C]**
- Uma meta menor que 2026 é aceita sem aviso. **[V]**

### 9.8 Formatação de números **[V+C]**

- Moeda compacta:
  - ≥ 1 mi: "R$ 1,86 mi" (2 casas abaixo de 10, 1 casa abaixo de 100, sem zeros finais);
  - ≥ 1 mil: "R$ 36,7 mil" ou "R$ 400 mil";
  - abaixo disso, inteiro.
- Moeda cheia (investimento, CPL): "R$ 400".
- Quantidades: inteiro a partir de 10; com 1 casa abaixo disso ("5,2", "0,6").
- Percentual: inteiro, ou com 1 casa quando fracionário.

---

## 10. Persistência e dados

| Chave | Onde | Conteúdo | Verificação |
|---|---|---|---|
| `acelera-plano-2027-v2` | localStorage | Estado completo (passo, perfil, comissão, %, modo, ticket, imóveis, canais usados, distribuição, meta, desbloqueado, nome), salvo a cada alteração | [V] — recarregar restaura etapa e valores |
| `acelera-plano-2027-fila` | localStorage | Até 5 leads pendentes de envio | [V] |
| `acelera-plano-2027-origem` | sessionStorage | Página, referrer e UTMs da entrada | [V] |

Outros pontos:

- A chave tem sufixo de versão (`-v2`). **Não há botão de "limpar/recomeçar"**; o único reinício parcial é "Ajustar os números". **[V]**
- Depois de desbloqueado, recarregar a página volta direto ao plano (passo 5). **[V]**
- Não há cookies. Não há analytics de terceiros visíveis na página (apenas o evento DOM `plano2027:lead`). **[V+C]**
- **Integração externa:** `POST /api/lead` (rota serverless do próprio projeto). Na data do teste retornava **503**. **[V]**

---

## 11. Identidade visual da referência (tokens observados — **não reutilizar**)

| Token | Valor |
|---|---|
| Tinta / texto | `#1d1d1f` (secundário `#2c2c30`, corpo `#424245`) |
| Fios | `#c7c7cc` / `#d2d2d7` |
| Papel (fundo) | `#f5f5f7` / `#ececf0` |
| Noite (painéis) | `#07110f` |
| Verde vivo (números em fundo escuro) | `#33dcb2` |
| Verde marca | `#0b6a5b` |
| Teal (CTA, chaves) | `#22b89f` |
| Risco | `#b42727` |
| Sombra | `0 1px 2px rgb(0 0 0/.04), 0 24px 48px -28px rgb(29 29 31/.32)` |
| Curva "mola" | `cubic-bezier(.22,1,.36,1)` |
| Tipografia | Inter 400–700 (texto) e **Zalando Sans** 500–700 (números, classe `t-num`, tracking −0,045em) via Google Fonts |
| Raios | 28 px (cartões), 32–36 px (painéis), 16–20 px (campos e linhas), pílula (botões) |
| Ícones | Lucide (traço), Solar Bold Duotone (cheios, recoloridos) e logomarcas oficiais de Meta, Instagram, WhatsApp e Google Maps |

Para a Escala IMOB, devem ser **substituídos** pela identidade própria: base azul `#0106FE` (amostrado dos PNGs oficiais, PROVISÓRIO), tipografia ainda a definir e ícones próprios.

---

## 12. Microinterações, acessibilidade e qualidade

**Microinterações [V+C]**

- Entrada em cascata dos cartões.
- Botão principal: sobe 1 px no hover, escala 0,97 ao clicar e a seta desliza.
- Atalhos e chaves: escala 0,97 ao clicar; a chave tem mola.
- Anel e régua: transições de 0,5–0,6 s.
- Aviso com rolagem suave.
- Foco automático no campo do canal recém-ligado.
- Seleção automática do campo calculado.
- Scroll-spy no plano.
- `prefers-reduced-motion` reduz animações e pula a tela "gerando".

**Acessibilidade [V+C]**

- `lang="pt-BR"`.
- Landmarks: `aside`, `header`, `main`, `nav`.
- Botões −/+ com `aria-label` descritivo.
- `aria-pressed` nos atalhos, `role="switch"` e `aria-checked` nas chaves.
- `aria-current="step"` na etapa atual.
- `role="alert"` nos erros; `aria-live` no painel.
- `:focus-visible` com contorno verde de 2 px; anel nos campos mais e menos.
- A ordem de Tab segue a ordem visual.

Pontos fracos:

- A faixa fixa do rodapé no mobile tem `aria-hidden`.
- O rótulo `<label for>` dos campos mais e menos coexiste com `aria-label`.
- Contraste do cinza do placeholder `#aeaeb2` sobre branco é baixo.
- Falha silenciosa no "Copiar link".

**Defeitos visuais observados [V]**

- A 390 px, os cartões de canal **estouram cerca de 6 px** à direita do cartão pai (cortados pelo `overflow: hidden`).
- A 768 px, nos canais ligados a chave quebra para uma segunda linha, enquanto nos desligados fica na mesma linha.
- Os títulos da barra ficam truncados a 390 px ("P…").

**SEO/meta [V]**

- Apenas `charset`, `viewport` e `<title>`.
- Sem `meta description`, Open Graph ou favicon declarado.

---

## 13. Lacunas, limites e decisões pendentes

### 13.1 Não verificado visualmente

1. **Baixar PDF:** não acionado. Comportamento descrito pelo código e pelo CSS de impressão. **[C]**
2. **"Link copiado":** o estado de sucesso não foi observado, porque a área de transferência foi negada no navegador interno.
3. **Botão "Quero ajuda para executar" (WhatsApp):** inexistente na configuração atual da referência. **[C]**
4. **Envio bem-sucedido do lead:** o servidor respondeu 503. A resposta de sucesso e eventuais efeitos posteriores (e-mail ou WhatsApp enviados pelo backend) **não são observáveis** pelo cliente. O backend `api/lead.js` é privado.
5. **Perfil "Incorporador":** só altera o rótulo do perfil no plano; não foi percorrido de ponta a ponta. **[C]**
6. **Canais Portais e Construtora no plano:** só entram quando `mult > 3`; não apareceram no cenário testado. As regras foram lidas no código. **[C]**
7. **Cenário "já usa todos os canais"** (semana 2 "Ajustar os canais"): não exercitado. **[C]**
8. **Captura mobile de página inteira em headless** (`mobile/11-…-APROXIMADO.png`): pode estar cortada à direita por limite de largura mínima da janela headless. As capturas confiáveis de 390 px são as do navegador interno (`mobile/12` a `19`).
9. A **tela "gerando"** foi capturada só parcialmente (frase 1 e transição). As frases 2 e 3 e o fim da barra vêm do código.
10. **Resolução das capturas:** as do navegador interno a 1440 px foram reduzidas a 800 px de largura. As de alta resolução estão em `desktop/00` e `desktop/20` (Chrome headless).

### 13.2 Decisões que dependem de você (não tomei)

1. **Premissas e taxas de conversão — DECIDIDO em 25/11/2026:** usar **as mesmas premissas numéricas da referência** (taxas de funil, pesos, meses de entrada, limiares "acima", CPL por faixa com desconto de 30%, divisão de parceria, regra da venda inteira), **rotuladas como PROVISÓRIAS** até que a Escala IMOB valide premissas próprias. Condições de implementação:
   - concentrar todas em um único arquivo de configuração identificado como PROVISÓRIO, para troca futura sem mexer na lógica;
   - não citar a Acelera Hub nem descrever as taxas como benchmark de outra empresa;
   - mostrar ao usuário final um aviso de que são estimativas com taxas médias provisórias, sem garantia de resultado;
   - registrar no README que as premissas aguardam validação da Escala IMOB.
   - Os textos das ações por canal ("O que fazer") e dos KPIs **não** fazem parte desta decisão: serão redigidos de forma original.
2. **Gate de cadastro e integração de lead — DECIDIDO em 25/11/2026: sem cadastro.** Na Escala IMOB o plano abre sem pedir nome, telefone, e-mail ou aceite, e nenhum dado sai do navegador. Consequências para a implementação:
   - não há formulário, honeypot, `POST /api/lead`, fila de reenvio nem evento de lead;
   - não existe o estado "desbloqueado": o plano fica disponível assim que as etapas 1 a 3 forem válidas;
   - a abertura do plano não terá iniciais nem nome. Será usado um rótulo genérico com o perfil, por exemplo "Seu plano · Corretor autônomo";
   - "Ajustar os números" volta ao Diagnóstico, e o usuário pode retornar ao plano sem reenviar nada (diferente da referência);
   - o link compartilhável continua possível, por ser só local: leva as respostas no endereço, sem dados de contato;
   - **CONFIRMADO em 25/11/2026:** a trilha mantém 4 etapas: Diagnóstico → Canais → Meta 2027 → Seu plano.
     - "Gerar meu plano", na Meta 2027, mostra a tela de transição "gerando" (só visual, sem rede, respeitando `prefers-reduced-motion`) e abre o plano como etapa 4.
     - A tela intermediária de cadastro deixa de existir.
     - No plano, a trilha marca "Seu plano" como etapa atual. As etapas 1 a 3 continuam clicáveis para ajustes e, depois de editadas, permitem voltar ao plano.
3. **Destino comercial — DECIDIDO em 25/11/2026: CTA do Diagnóstico apenas no fecho do plano.** Na seção final (onde a referência tem o espaço opcional do WhatsApp), o botão primário passa a ser o CTA do **Diagnóstico da Escala IMOB**:
   - o link vem de `NEXT_PUBLIC_DIAGNOSTICO_URL` e nunca é inventado;
   - enquanto a variável não estiver configurada, o botão aparece **desabilitado**, com um aviso claro de que o link ainda não foi configurado;
   - Baixar PDF e Copiar link passam a ser ações secundárias;
   - o CTA não aparece no topo do plano, nas etapas 1 a 3 nem na barra de navegação;
   - o texto do CTA não promete vendas, leads, VGV nem retorno.
4. **Alinhamento aos 6 pilares do Método Escala — DECIDIDO em 25/11/2026: Canais = Aquisição.** O fluxo, as etapas e a lógica de cálculo da referência ficam iguais. Os 9 canais são tratados como o desdobramento do pilar **Aquisição**:
   - nenhum bloco, etapa ou pontuação é criado para os outros 5 pilares (Posicionamento; Estrutura Digital; Conteúdo e Autoridade; Processo Comercial; Gestão e Escala);
   - a etapa Canais e a seção "Gestão de canais" do plano podem indicar, em texto, que pertencem ao pilar Aquisição;
   - o produto não deve sugerir que o planejamento cobre o Método Escala inteiro, nem substituir o Diagnóstico;
   - a metodologia canônica não é alterada.
5. **Health Score — DECIDIDO em 25/11/2026: manter a métrica com outro nome.** Ficam iguais à referência:
   - o cálculo: `round(canais usados ÷ 9 × 100)`;
   - as 3 faixas: abaixo de 34, abaixo de 67 e a partir de 67;
   - o anel e o comparativo "hoje → com o plano".

   Precisam mudar:
   - o nome "Health Score", que é da referência;
   - os nomes e textos das faixas ("Dependente", "Em construção", "Saudável"), que precisam de redação original;
   - as cores das faixas, que seguem a identidade da Escala IMOB.

   A interface deve deixar claro que o índice mede só a **diversificação dos canais de aquisição**, não a saúde do negócio como um todo. **Nome definido em 25/11/2026: "Índice de Aquisição".** Os nomes das faixas continuam pendentes de redação.
6. **Logomarcas de terceiros — DECIDIDO em 25/11/2026: usar as logos oficiais** nos canais que correspondem a uma plataforma, como na referência:
   - Tráfego pago → Meta;
   - Social Selling → Instagram;
   - Lista Fria → WhatsApp;
   - Google Meu Negócio → Google Maps / Perfil da Empresa no Google.

   Condições:
   - os arquivos **não** serão extraídos da referência (que os embute em base64). Virão das **páginas oficiais de marca** de cada empresa (Meta Brand Resource Center, Instagram Brand, WhatsApp Brand, Google Brand Resource Center);
   - baixar esses arquivos depende da sua autorização, ou você mesmo os coloca em `assets/third-party/`;
   - as logos são usadas sem alteração de forma, proporção ou cor e com respiro mínimo, seguindo as diretrizes de cada marca. Não podem sugerir parceria ou endosso. O README deve trazer uma nota de que as marcas pertencem aos seus titulares;
   - os canais sem plataforma (Indicação, Prospecção Ativa, Portais, Imobiliária/Parcerias, Construtora) usam **ícones próprios da Escala IMOB**. Não usam os ícones Solar/duotônicos da referência nem telhados, chaves ou prédios genéricos;
   - Portais continua com ícone próprio (a referência não usa as logos de ZAP, Viva Real e OLX).
7. **Linguagem de promessa:** a referência apresenta metas, VGV e comissão "prevista", e fecha com um aviso de que os números não são garantia. Na Escala IMOB é preciso reforçar o caráter de estimativa (sem prometer vendas, leads, VGV ou retorno).
8. **Reiniciar:** a referência não tem botão de limpar ou recomeçar. O `PROMPT` pede rascunho versionado com opção de limpar, o que será um **acréscimo** sobre a referência.

### 13.3 Registro do teste com envio

Um cadastro fictício foi enviado **por autorização expressa do usuário**:

- nome "TESTE Auditoria (ignorar)", e-mail `teste.auditoria@example.com` (domínio reservado) e telefone "(00) 00000-0000" (DDD inexistente);
- 3 requisições `POST /api/lead` foram feitas, todas com **503**;
- a fila local foi removida em seguida.

---

## 14. Índice de screenshots (`referencias/`)

**desktop/** (1440 × 900; as capturas do navegador interno foram reduzidas a 800 px de largura)

| Arquivo | Conteúdo |
|---|---|
| 00-inicial-1440-alta-resolucao.png | Tela inicial em resolução real (Chrome headless) |
| 01 a 06 | Diagnóstico: vazio; erro de perfil; erro de comissão; erro de %; ticket preenchido; imóveis calculando o ticket |
| 07 a 12 | Canais: animação de entrada; vazio; erro de soma (topo e rodapé); preenchido com Health Score; perfil Imobiliária ("Parcerias") |
| 13 a 15 | Meta: vazia com botão desabilitado; meta abaixo de 2026; meta preenchida |
| 16 a 18, 21, 22 | Cadastro: vazio; erro de nome; erro de aceite; animação; preenchido (teste) |
| 19 | Anel de foco por teclado no campo mais e menos |
| 20-plano-completo-1440-pagina-inteira.png | **Plano inteiro** em resolução real (via link compartilhável) |
| 23 a 25 | Tela "gerando" e espera pelo envio (botão desabilitado) |
| 26 a 28 | Plano: topo; calendário com a seção ativa na navegação; Copiar link sem feedback |

**mobile/** (390 × 844)

| Arquivo | Conteúdo |
|---|---|
| 01 a 04 | Diagnóstico: entrada; topo; meio; painel em linha e faixa fixa |
| 05 a 07 | Canais: topo; lista; painel com Health Score |
| 08 | Meta |
| 09 e 10 | Cadastro |
| 11 | Plano em página inteira (headless, **aproximado**) |
| 12 a 19 | Plano: abertura; diagnóstico; tabela; funil; células e "O que fazer"; calendário; 30 dias; fecho e rodapé |

**tablet/** (768 × 1024)

| Arquivo | Conteúdo |
|---|---|
| 01 | Diagnóstico |
| 02 | Canais |
