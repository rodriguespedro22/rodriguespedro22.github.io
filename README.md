# Portfólio Pedro Rodrigues da Cunha

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Todo o conteúdo: topo, lista de projetos, Painel TV de Cupons, trilho dos outros projetos, números, trajetória, competências, sobre, contato e rodapé |
| `style.css` | Cores e tamanhos em variáveis no `:root`; layout para desktop, tablet (até 1080px) e celular (até 760px, testado até 360px) |
| `app.js` | Barra fixa, barra de progresso, cursor próprio, troca de telas da TV na rolagem, simulação "Quem vê o quê", trilho horizontal, contadores, entradas das seções e cenas de rolagem |
| `cena3d.js` | Cena 3D do topo (Three.js via CDN, com importmap no `index.html`): reage ao mouse e à rolagem |
| `img/` | Telas do painel (modo demonstração, dados fictícios) |
| `video/` | Gravações de tela (WebM) e pôsteres: demonstração do painel, 30 pra Show e Olha o Mapa!, gravadas dos sites no ar |
| `assets/` | Foto de Charqueadas (Wikimedia Commons, CC BY-SA 3.0) e `credits.json` |

## Animações

GSAP 3.12.5 com ScrollTrigger (em `lib/`) e Lenis 1.1.13 (CDN, só com mouse ou trackpad). Cenas em `app.js`, dentro de `gsap.matchMedia`:

1. Topo: cena 3D em Three.js 0.160.0 (`cena3d.js`): a TV do painel toca a gravação real da demonstração numa sala escura, com cupons 3D girando em volta. A sala inclina com o mouse; ao rolar, o nome recua, os cupons se espalham e a câmera entra na tela. Sem WebGL ou com "reduzir movimento", fica a imagem estática. O nome sobe de trás da linha de base ao carregar e acompanha o cursor em paralaxe.
2. Barra de progresso da leitura no topo da janela (`animation-timeline: scroll()`, com JavaScript nos navegadores sem suporte) e cursor próprio: ponto e anel que vem atrás e cresce sobre links (só com mouse).
3. Lista de projetos: os nomes entram um a um; a miniatura ao lado do nome cresce ao passar o mouse.
4. Painel TV de Cupons: a TV se endireita e chega perto; três barras mostram o passo da história; "Como os dados chegam à tela": um cupom percorre as cinco etapas e acende a etapa atual (preso só no desktop).
5. Trilho de projetos: preso à tela no desktop (largura mínima de 1024px), a rolagem vertical vira deslocamento lateral; as figuras andam em ritmo próprio e os títulos entram do lado. No celular, os painéis ficam empilhados.
6. Números: contadores sobem até o valor. Trajetória: a linha vertical se desenha com a rolagem. Rodapé: o e-mail sobe de trás da linha de base.
7. Fundo: campo de pontos (`<canvas id="campo">`) atrás das áreas escuras, que ondula com a rolagem e abre caminho para o cursor, acendendo em laranja.
8. Interações: relógio de Charqueadas, links que decodificam, botões magnéticos, telas e vídeos que inclinam, luz do cursor nas faixas escuras. Só com mouse.
9. Faixa de nomes (`.ribbon`): stack e projetos correndo de lado; acelera, inclina e troca de sentido com a rolagem.

Com "reduzir movimento" ligado no sistema, as cenas não rodam, os vídeos ficam no pôster e a página fica estática e completa. Para testar mesmo assim, abra com `?movimento=1`.

## Publicação

No ar em https://rodriguespedro22.github.io/ (GitHub Pages, branch `main`, pasta raiz).

- A foto de Charqueadas exige crédito (já está no rodapé) e, se for alterada, a versão alterada deve sair sob a mesma licença.
- O site não tem telefone nem currículo em PDF de propósito.
