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
- **Responsivo** (`tests/e2e/responsivo.spec.ts`): as 5 telas em 1440, 768 e 390 px, sem rolagem horizontal. As capturas ficam em `referencias/implementacao/`. Também gera o PDF do plano com o estilo de impressão (`plano-impressao.pdf`, A4), confirmando que a navegação e os botões são ocultados.

**Comparação visual:** as telas foram comparadas com as capturas da referência (`referencias/desktop`, `referencias/mobile`). Ajustes feitos depois da comparação:
- No mobile, o botão Voltar mostra só a seta, para o título não ser truncado (defeito presente na referência).
- Os cartões de canal ficaram mais compactos em telas estreitas, e as descrições caem de 3–4 para 2 linhas.
- Na verificação anterior, já haviam sido corrigidos: estouro de 1 px no mobile, corte do último degrau do funil e grade das semanas.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_DIAGNOSTICO_URL` | Não | Link do Diagnóstico da Escala IMOB, usado no botão do fecho do plano. Sem valor válido (`https://…`), o botão fica **desabilitado**, com aviso. Não há endereço padrão. |

A variável é embutida no build: depois de alterá-la, é preciso rodar `npm run build` de novo.

Com o link configurado, ele aparece em dois lugares:
- no botão do fecho do plano, que abre em nova aba;
- no **PDF** gerado por "Baixar PDF", num bloco "Próximo passo: Diagnóstico da Escala IMOB" com o link clicável. Esse bloco só aparece na impressão.

## Dados e privacidade

- Não há cadastro: nenhum nome, telefone ou e-mail é pedido.
- As respostas ficam **apenas no navegador** (`localStorage`, chave `escala-imob:planejamento-2027`, formato versionado `versao: 1`). É possível apagar o rascunho e recomeçar.
- O link compartilhável leva só as respostas numéricas no fragmento `#plano=…` do endereço. Ele não contém dados de contato e não é enviado a nenhum servidor.
- Não há integração com APIs externas, analytics ou pixels.

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
  components/
    casca/             trilho, barra, trilha de etapas e faixa fixa no mobile
    etapas/            telas de cada etapa
    ui/                botões, campo de mais e menos, cartões, placas, chave, anel, régua
assets/brand/          arquivos oficiais de marca recebidos
public/brand/          cópias usadas pela interface
```

## Premissas de cálculo (PROVISÓRIAS)

Por decisão do responsável pelo projeto (25/11/2026), as taxas de conversão, os pesos dos canais, os meses de entrada, o custo por lead e as demais premissas **repetem os valores observados na aplicação de referência** (ver `AUDITORIA_REFERENCIA.md` §9). Elas valem até a Escala IMOB validar premissas próprias.

Todas as premissas ficam em `src/config/premissas.ts` e nos campos `peso`, `mesEntrada` e `acima` de `src/config/canais.ts`. Para trocá-las, basta editar esses arquivos; a lógica de cálculo não muda.

**Diferenças intencionais em relação à referência** (ver `AUDITORIA_REFERENCIA.md` §9.7 e §12):

- O percentual de comissão é validado entre 0,5% e 20%, conforme a mensagem exibida. A referência aceitava qualquer valor acima de 0.
- Uma meta abaixo da comissão de 2026 é aceita, mas exibe um aviso.
- Quando a parceria divide a comissão e a soma fica abaixo da meta, o plano explica o motivo.
- "Copiar link" informa quando a cópia falha e tenta um método alternativo.
- Não há cadastro antes do plano. Depois de "Ajustar os números", é possível voltar ao plano pela trilha de etapas.
- O plano inclui o botão "Recomeçar", que apaga o rascunho local.

## Identidade visual (provisória)

| Item | Situação |
|---|---|
| Logotipo e ícone | Arquivos oficiais em PNG (`assets/brand/`). **Pendente:** versões vetoriais (SVG). |
| Azul principal `#0106FE` | **PROVISÓRIO.** Valor amostrado dos PNGs oficiais; aguarda confirmação no brandbook. |
| Demais cores | **PROVISÓRIAS.** São derivações de interface (neutros, escuro, estados) definidas em `src/app/globals.css`, não especificações de marca. |
| Tipografia | **PLACEHOLDER.** Pilha de fontes do sistema até a família oficial ser definida. |
| Símbolo com telhado | O logotipo oficial contém uma forma de telhado. Ele é usado sem alteração, e nenhum outro elemento usa telhados, chaves ou prédios. Pendente de validação. |
| Grafia "Escala IMOB" | Nome editorial provisório. |

### Marcas de terceiros

Os canais Tráfego pago, Social Selling, Lista Fria e Google Meu Negócio usarão as logomarcas oficiais de Meta, Instagram, WhatsApp e Google Maps (decisão de 25/11/2026). Os arquivos devem ser obtidos nos centros de marca oficiais e colocados em `public/third-party/`; depois, cada um é registrado em `LOGOS_DISPONIVEIS` (`src/components/ui/Placa.tsx`). Enquanto isso, a interface usa ícones próprios equivalentes.

Meta, Instagram, WhatsApp e Google são marcas de seus respectivos titulares. O uso é apenas para identificar os canais e não indica parceria nem endosso.

## Pendências

- [x] Endereço do Diagnóstico: `https://escalaimob.com.br`, informado pelo responsável em 26/11/2026 e configurado em `.env.local`. O `.env.local` não é versionado, então a variável também precisa ser definida no ambiente de hospedagem.
- [ ] Brandbook: cores, tipografia e versões vetoriais do logotipo
- [ ] Logomarcas oficiais de terceiros em `public/third-party/`
- [ ] Validação das premissas de cálculo pela Escala IMOB
- [ ] Nomes das faixas do Índice de Aquisição (provisórios: Concentrada, Em expansão, Distribuída)

## Deploy

Não fazer deploy em produção sem aprovação explícita.

## Referência

A arquitetura de experiência foi baseada na auditoria documentada em `AUDITORIA_REFERENCIA.md`, com screenshots em `referencias/`. O código, os textos e os ícones são originais.
