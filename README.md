# Portfólio de Pedro Cunha

Site estático de uma página (HTML, CSS e JavaScript, sem etapa de build). A ideia visual: o cupom, a peça que os sistemas do Pedro emitem e validam. O topo é um cupom com canhoto, os projetos são pastas com aba e o rodapé é o verso do cupom.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Todo o conteúdo: topo, Painel TV de Cupons, outros projetos, trajetória, sobre, contato e rodapé |
| `style.css` | Cores e tamanhos em variáveis no `:root`; layout para desktop, tablet (até 1080px) e celular (até 760px) |
| `app.js` | Barra fixa, troca de telas da TV na rolagem, simulação "Quem vê o quê" e entradas das seções |
| `img/` | Telas do painel (modo demonstração, dados fictícios) |
| `video/` | Gravações de tela (WebM) e pôsteres: demonstração do painel, 30 pra Show e Olha o Mapa!, gravadas dos sites no ar |
| `cena3d.js` | Cena 3D do topo (Three.js via CDN, com importmap no `index.html`) |
| `assets/` | Foto de Charqueadas (Wikimedia Commons, CC BY-SA 3.0) e `credits.json` |

## Como editar

- **Texto de um projeto:** procure o `id` da seção em `index.html` (`painel`, `roleta`, `show`, `hub`, `pdf`, `mapa`).
- **Novo projeto:** copie um bloco `<article class="folder ...">` e alterne a cor (`f-ink`, `f-paper`, `f-light`) para que duas pastas vizinhas não fiquem iguais.
- **Perfis da simulação:** objeto `perfis` em `app.js` e linhas `data-r` da tabela em `index.html`.

## Animações de rolagem

GSAP 3.12.5 com ScrollTrigger (em `lib/`) e Lenis 1.1.13 (CDN, só com mouse ou trackpad). Cenas em `app.js`, dentro de `gsap.matchMedia`:

1. Topo: cena 3D em Three.js 0.160.0 (`cena3d.js`): a TV do painel toca a gravação real da demonstração numa sala escura, com cupons 3D girando em volta. Ao rolar, o canhoto se solta pelo picote, o cupom sai, os cupons se espalham e a câmera entra na tela. Sem WebGL ou com "reduzir movimento", fica a imagem estática.
2. A TV se endireita e chega perto; três barras mostram o passo da história.
3. "Como os dados chegam à tela": um cupom percorre as cinco etapas e acende a etapa atual (preso só no desktop).
4. Pastas de projeto se empilham: cada uma recua e escurece quando a próxima chega (empilhamento só no desktop).
5. Canhotos da trajetória saem de um maço e se espalham; foto de Charqueadas recua; o verso do cupom vira ao chegar.
6. Títulos sobem palavra por palavra.
7. Fundo: campo de pontos (`<canvas id="campo">`) atrás das áreas laranja, que ondula com a rolagem e abre caminho para o cursor.
8. Interações estudadas em portfólios da lista developer-portfolios: cargo que rola (para em "full stack" depois de duas voltas), números em odômetro, relógio de Charqueadas, links que decodificam, botões magnéticos, imagens que inclinam e luz do cursor nas faixas escuras. Só com mouse, exceto o odômetro e o cargo.
9. Faixa de nomes (`.ribbon`): stack e projetos correndo de lado; acelera, inclina e troca de sentido com a rolagem. Os textos ficam em `index.html`.

Com "reduzir movimento" ligado no sistema, as cenas não rodam e a página fica estática e completa. Para testar mesmo assim, abra com `?movimento=1`.

## Como ver localmente

Abra `index.html` no navegador, ou sirva a pasta com `python -m http.server` e acesse `http://localhost:8000`.

## Publicação

No ar em https://rodriguespedro22.github.io/ (GitHub Pages, branch `main`, pasta raiz).

- A foto de Charqueadas exige crédito (já está no rodapé) e, se for alterada, a versão alterada deve sair sob a mesma licença.
- O site não tem telefone nem currículo em PDF de propósito.
