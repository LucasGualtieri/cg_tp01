# Trabalho prático de Computação Gráfica

Este projeto é uma aplicação web para desenhar e visualizar primitivas gráficas em uma matriz de pixels.

## Requisitos

- Node.js 18+ 
- npm

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra no navegador a URL mostrada no terminal.

## Comandos úteis

```bash
npm run dev
npm run build
npm run preview
```

- `npm run dev`: roda o projeto localmente.
- `npm run build`: gera a versão de produção.
- `npm run preview`: abre uma prévia local do build.

## Como usar

- **Point**: adiciona pontos com um clique.
- **Line DDA**: desenha uma reta com dois cliques.
- **Line Bresenham**: desenha uma reta com dois cliques.
- **Circle**: define centro e raio com dois cliques.
- **Selection**: cria um retângulo de recorte com dois cliques.

## Controles

- `dx`, `dy`: translação
- `angle`: rotação
- `sx`, `sy`: escala
- **Cohen-Sutherland** e **Liang-Barsky**: algoritmos de recorte
- **Clear Matrix**: limpa o desenho atual

## Observações

- O projeto usa renderização por pixels no canvas.
- O canvas pode ser usado com mouse ou toque.
