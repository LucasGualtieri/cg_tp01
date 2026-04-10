# Trabalho prático — Computação Gráfica (Vite + TypeScript)

Aplicação para o trabalho prático de **Computação Gráfica**, com renderização em **matriz de pixels** (sem uso de primitivas de alto nível do canvas para os algoritmos de desenho).

O projeto utiliza:

- `Uint8ClampedArray` como buffer de pixels
- `ImageData` + `putImageData` para exibir os pixels no canvas
- Interação principalmente por clique/toque para desenho e seleção

Os algoritmos de rasterização e recorte **não** usam funções como `lineTo()` ou `arc()` do canvas.

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Como executar

Instale as dependências:

```bash
npm install
```

Modo desenvolvimento (Vite + HMR):

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Pré-visualizar o build de produção:

```bash
npm run preview
```

## Publicação no GitHub Pages

O Vite precisa de um [**`base`**](https://vitejs.dev/config/shared-options.html#base) correto quando o site não fica na raiz do domínio. Páginas de **projeto** no GitHub usam `https://<usuário>.github.io/<repositório>/`, então os assets devem ser carregados a partir de `/<repositório>/`.

### Opção A — GitHub Actions (recomendado)

1. Envie o repositório para o GitHub (branch `main` ou `master`; o workflow aceita os dois).
2. **Settings → Pages → Build and deployment → Source:** escolha **GitHub Actions**.
3. Faça um push (ou dispare o workflow manualmente). O site ficará em  
   `https://<usuário>.github.io/<repositório>/`.

O workflow define `GITHUB_PAGES_BASE=/<repositório>/` no build. O arquivo `public/.nojekyll` evita que o GitHub Pages rode Jekyll em cima do `dist`.

**Se o repositório for `<usuário>.github.io`** (site na raiz, sem subcaminho), edite `.github/workflows/deploy-pages.yml` e defina:

```yaml
env:
  GITHUB_PAGES_BASE: /
```

**Teste local** com o mesmo `base` do GitHub:

```bash
GITHUB_PAGES_BASE=/nome-do-seu-repo/ npm run build
npx vite preview
```

Abra a URL que o Vite mostrar; os caminhos devem funcionar sob `/nome-do-seu-repo/`.

### Opção B — Branch `gh-pages` manual

```bash
GITHUB_PAGES_BASE=/nome-do-seu-repo/ npm run build
npx gh-pages -d dist
```

(Instale `gh-pages` globalmente ou use `npx gh-pages`.) Nas configurações do Pages, aponte para a branch `gh-pages`.

## Estrutura do projeto

```text
.
├── index.html
├── src
│   ├── Algorithms.ts
│   ├── CanvasManager.ts
│   ├── InputHandler.ts
│   ├── UIManager.ts
│   ├── main.ts
│   ├── styles.css
│   └── types.ts
├── tsconfig.json
└── vite.config.ts
```

### Responsabilidades dos módulos

- **`CanvasManager.ts`**  
  Gerencia o contexto do canvas e o buffer de pixels. Expõe `setPixel(x, y, color)`, `clear()` e `present()` (`putImageData`) para atualizar o quadro.

- **`Algorithms.ts`**  
  Funções de rasterização, recorte e transformações usadas pela aplicação. Recebe um callback de escrita de pixel ligado ao `CanvasManager`.

- **`InputHandler.ts`**  
  Captura mouse e toque no canvas e converte coordenadas do navegador para pixels do canvas.

- **`UIManager.ts`**  
  Monta e controla a barra lateral; emite mudanças de estado (ferramenta, recorte, transformações) e o evento de limpar.

- **`main.ts`**  
  Integra os módulos, guarda primitivas da cena (pontos, retas, círculos), aplica transformações e recorte conforme o estado da UI e executa o laço de renderização.

## Uso da aplicação

### 1) Ferramentas

Escolha um modo na barra lateral:

- **Point**: cada clique/toque adiciona um ponto.
- **Line DDA**: primeiro clique no início da reta, segundo no fim.
- **Line Bresenham**: mesmo esquema (dois cliques).
- **Circle**: centro e depois um ponto que define o raio.
- **Selection**: dois cliques nos cantos opostos do retângulo de recorte.

### 2) Transformações

Sliders para transformar a cena na renderização:

- `dx`, `dy`: translação
- `angle`: rotação (graus)
- `sx`, `sy`: fatores de escala (há opção de escala uniforme na interface)

### 3) Recorte

Escolha o algoritmo:

- Cohen–Sutherland
- Liang–Barsky

Com um retângulo de recorte definido (ferramenta Selection), as retas são recortadas pelo método ativo.

### 4) Limpar

**Clear Matrix** remove todas as primitivas e o retângulo de recorte, limpando o conteúdo desenhado.

## Fluxo de renderização (resumo)

1. Entrada/UI alteram o estado e marcam a necessidade de redesenhar.
2. O `renderLoop` verifica se há redesenho.
3. Ao redesenhar: limpa o buffer, redesenha as primitivas com os algoritmos exportados e envia o quadro com `putImageData`.

Assim a cena permanece determinística e baseada só na matriz de pixels.

## Observações

- O canvas usa `image-rendering: pixelated` para visualização nítida em “pixels” ampliados.
- Há suporte a toque para uso em dispositivos móveis.
- TypeScript em modo strict para maior segurança de tipos.
