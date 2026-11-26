# Escala IMOB — Instruções locais do projeto

## Objetivo
Desenvolver uma adaptação de alta fidelidade da experiência de planejamento acessível em https://acelera-planejamento27.vercel.app/, com identidade institucional própria da Escala IMOB. A referência é para arquitetura, experiência, fluxo e qualidade de acabamento. O projeto final não deve aparentar ser produto da Acelera Hub.

## Hierarquia e limites
- As fontes canônicas originais da Escala IMOB prevalecem sobre sugestões e inferências. Havendo conflito, registrar explicitamente e não tomar decisões estratégicas sozinho.
- A Escala IMOB oferece uma implementação integrada de crescimento a profissionais do mercado imobiliário, principalmente corretores, através do Método Escala, e não uma prateleira desconectada de serviços.
- Os seis pilares vigentes do Método Escala são: Posicionamento; Estrutura Digital; Conteúdo e Autoridade; Processo Comercial; Aquisição; Gestão e Escala.
- O diagnóstico antecede recomendações comerciais. O destino comercial prioritário é o Diagnóstico da Escala IMOB, mas o URL real deve ser configurado pelo usuário; nunca inventar.
- Não prometer número garantido de vendas, leads, VGV, faturamento ou retorno financeiro.
- Usar o nome editorial provisório "Escala IMOB". A grafia institucional definitiva e brandbook completo ainda precisam de validação.
- A identidade aprovada prioriza azul e o conceito visual "REDE = ESCALA", evitando clichês visuais como chaves, telhados, casas e prédios genéricos.
- Não inventar códigos hexadecimais definitivos, família tipográfica, versão final de logo ou outras especificações não fornecidas. Extrair os valores dos materiais oficiais que estiverem na pasta `assets/brand/`. Caso não existam, adotar tokens provisórios identificados como PROVISÓRIOS no README e manter um placeholder tipográfico.
- A marca pessoal de Paulo Theilacker não é a marca institucional da Escala IMOB. Esta aplicação é institucional.
- Não tratar planejamento, protótipo ou implementação técnica como funcionalidade existente da plataforma Escala IMOB. Este projeto é independente, salvo integração explicitamente fornecida.
- A aplicação proposta não altera, por si, o posicionamento, o Método, a estratégia nem o Documento 09 da Escala IMOB.

## Regras de desenvolvimento
- Inspecionar a referência em navegador real com Playwright antes de implementar. Analisar todos os passos e estados acessíveis sem burlar autenticação ou restrições de acesso.
- Replicar os padrões de layout, hierarquia, espaçamento, navegação e interação observados, mas criar código original. Não reutilizar marca, logotipo, fotografias, ícones proprietários nem copiar textos exclusivos da referência.
- Priorizar responsividade, acessibilidade, performance, estados de erro, campos validados e conclusão efetiva de cada interação.
- Não inventar telas, métricas, fórmulas, relatórios ou integrações que não possam ser demonstrados na referência ou exigidos pelo escopo aprovado. Relatar lacunas em `AUDITORIA_REFERENCIA.md`.
- Guardar dados de entrada apenas localmente por padrão. Não enviar dados de clientes a APIs externas sem integração e consentimento explícitos.
- O endpoint/link de Diagnóstico será lido de `NEXT_PUBLIC_DIAGNOSTICO_URL`, com estado desabilitado e aviso claro enquanto não configurado.
- Não realizar deploy em produção sem aprovação explícita do usuário.
