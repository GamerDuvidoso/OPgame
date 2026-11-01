# ORDO REALITAS — Ficha do Agente

Site interativo inspirado nas cinco capturas de tela fornecidas, pronto para personalização.

## Como abrir

Abra `index.html` no Chrome, Firefox ou Edge. Não precisa instalar nada nem usar servidor. A fonte de máquina de escrever é carregada do Google Fonts quando existe internet; sem internet o navegador usa a fonte monoespaçada disponível.

Se quiser executar num servidor local, dentro da pasta execute:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## O que está funcionando

- Navegação entre Introdução, Atributos, Origem, Classe e Autenticação.
- Pontos de atributo: todos começam em 1; distribua 4 pontos, mínimo 0, máximo 3, com ponto extra por atributo reduzido. Clique no atributo para aumentar; passe o mouse para exibir os controles de + / − ou clique com o botão direito para diminuir.
- Origens, incluindo uma origem própria preenchida pelo agente.
- Alternância entre Combatente, Especialista e Ocultista, com características completas: PV, PE, SAN, ganhos por nível de exposição, perícias treinadas e proficiências.
- Progressão de NEX de 5% a 99% para Combatente e Especialista conforme o material enviado, e Ocultista conforme a imagem de referência.
- Consulta de habilidades conhecidas por classe, sem inventar efeitos ainda não informados.
- Abas Progressão / Habilidades / Trilhas e subabas Habilidades / Rituais.
- Campos do agente e regras opcionais, upload de foto, assinatura e finalização.
- Painel **ADENDOS** para cadastrar origens, habilidades, rituais, trilhas e adendos à progressão de cada classe.
- Salvamento automático no armazenamento local do navegador.
- Exportação e importação de ficha em JSON.
- Layout para telas grandes e smartphones.

## Onde adicionar conteúdo

**`dados.js`** — todo o conteúdo original, as classes, suas progressões, origens, trilhas, habilidades e rituais. Basta acrescentar itens seguindo os exemplos existentes. As três classes já possuem suas características, e todas as progressões estão preenchidas com os dados fornecidos. Os detalhes de efeitos de poderes, trilhas, perícias e rituais que não foram enviados continuam abertos para complementação, sem inventar regras. A seleção automática das perícias específicas ainda não foi implementada: nesta versão a quantidade de perícias à escolha é mostrada junto ao Intelecto atual.

**`estilo.css`** — medidas, cores, textura e aparência da interface.

**`app.js`** — navegação, pontos de atributo, interação e armazenamento.

**`assets/`** — imagens e texturas extraídas dos arquivos de referência fornecidos.

## Observações

O registro é salvo **no próprio navegador**, não em uma conta na nuvem. Exporte periodicamente seus dados no painel ADENDOS para não perder o conteúdo se limpar o navegador. Ao abrir a ficha em outro aparelho, importe o JSON.

O projeto pode ser publicado em hospedagens estáticas como GitHub Pages, Netlify ou Vercel. Para sincronizar fichas entre usuários ou ter autenticação de login real será necessário acrescentar um backend futuramente.

## Camada de imersão (nova)

- `imersao.js` / `imersao.css`: capa do dossiê, virada de página 3D, assinaturas e rubricas com caneta (mouse, toque ou stylus), carimbos, texto censurado clicável, máquina de escrever, lâmpada que segue o cursor, poeira, apagões ocasionais, som sintetizado (botão SOM) e o final cinematográfico.
- Setas ← → do teclado viram a página.
- Para abrir localmente use o `index.html` (já inclui as metas necessárias).
