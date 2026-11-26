# Integração com o Google Sheets (Apps Script)

O site grava cada lead numa linha da aba `planning_leads` de uma planilha privada da Escala IMOB. A rota `/api/leads` do site envia os dados para um Apps Script publicado como App da Web, protegido por um token secreto.

> Use uma **conta Google da Escala IMOB**, de preferência do Workspace, e não uma conta pessoal. Quem tiver acesso à planilha vê todos os leads.

## 1. Planilha

A planilha **[Leads — Planejamento 2027](https://docs.google.com/spreadsheets/d/1p55zvobR2sTqI8eIxAgfitVXmSh8sJ4i9g2Zn8crqh0/edit)** já foi criada em 26/11/2026, com a aba `planning_leads`, o cabeçalho de 28 colunas congelado, localidade pt-BR e fuso de São Paulo.

- Ela está na conta Google conectada ao Claude nesta data (conta pessoal). Se os leads devem ficar numa conta **institucional** da Escala IMOB, transfira a propriedade da planilha (Compartilhar → transferir propriedade) ou crie outra planilha nessa conta; o script recria a aba e o cabeçalho se eles não existirem.
- Faça os passos abaixo **com a conta dona da planilha**.

## 2. Colar o script

1. Na planilha, abra **Extensões → Apps Script**.
2. Apague o conteúdo de `Código.gs` e cole todo o arquivo [`Code.gs`](Code.gs) desta pasta.
3. Salve (ícone de disquete) e dê um nome ao projeto, por exemplo `planning-leads`.

## 3. Criar a aba e o token

1. No seletor de função, no topo do editor, escolha **`configurarPlanilha`** e clique em **Executar**.
   - Na primeira vez, o Google pede autorização: **Revisar permissões → escolha a conta → Avançado → Acessar planning-leads (não seguro) → Permitir**. O aviso aparece porque o script é seu e não foi publicado na loja do Google.
   - Volte à planilha: a aba `planning_leads` foi criada, com o cabeçalho congelado.
2. Escolha a função **`gerarToken`** e clique em **Executar**.
3. Abra **Configurações do projeto** (ícone de engrenagem) → **Propriedades do script** e copie o valor de `LEADS_TOKEN`.

## 4. Publicar como App da Web

1. Clique em **Implantar → Nova implantação**.
2. Em "Selecionar tipo", escolha **App da Web**.
3. Preencha:
   - **Descrição:** `planning-leads v1`
   - **Executar como:** **Eu** (a conta da Escala IMOB)
   - **Quem pode acessar:** **Qualquer pessoa**. A proteção é o token: sem ele, o script recusa a gravação.
4. Clique em **Implantar** e copie a **URL do app da Web**, que termina em `/exec`.

> Se alterar o `Code.gs` no futuro, publique em **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão**. Assim a URL continua a mesma.

## 5. Configurar o site

No arquivo `.env.local` (desenvolvimento) e no painel da hospedagem (produção):

```
LEADS_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
LEADS_SHEETS_TOKEN=<o mesmo valor de LEADS_TOKEN>
LEADS_IP_SALT=<outro segredo aleatório, com 16 caracteres ou mais>
PRIVACY_POLICY_VERSION=<versão da política, ex.: 2026-12-01>
NEXT_PUBLIC_PRIVACY_POLICY_URL=<URL pública da Política de Privacidade>
```

- **Não envie o token nem o salt por chat ou e-mail.**
- Para gerar o `LEADS_IP_SALT`, rode no PowerShell:
  ```powershell
  -join ((1..40) | ForEach-Object { [char](Get-Random -InputObject (48..57 + 65..90 + 97..122)) })
  ```
- Enquanto qualquer uma dessas 5 variáveis faltar, o modal não aparece e o site funciona como antes.
- Depois de mudar variáveis, reinicie o `npm run dev` ou gere um novo build.

## 6. Testar

1. Abra a URL `/exec` no navegador. Ela deve mostrar `{"ok":true,"servico":"planning_leads"}`.
2. No site, gere um plano, clique em **Baixar PDF**, preencha o modal e salve. Confira a nova linha na aba `planning_leads`.

## Cuidados

- **Não renomeie nem apague colunas do cabeçalho.** O script grava pelo nome da coluna e recusa a gravação se faltar alguma; nesse caso, o site mostra erro e não libera o PDF. Reordenar as colunas ou acrescentar colunas no fim não tem problema.
- **Compartilhamento:** deixe a planilha restrita (Compartilhar → Acesso geral: **Restrito**) e dê acesso só a quem precisa.
- **Trocar o token:** rode `gerarToken` de novo e atualize `LEADS_SHEETS_TOKEN` no site. Não é preciso republicar.
- **Cotas:** o Apps Script tem cotas diárias de execução, com folga para o volume esperado. Se um envio falhar, o site mostra "Tentar novamente" e não libera a exportação.
