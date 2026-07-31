# Sorteio de Times — Chaveamento de Campeonato

Sorteio de times para campeonatos com **proteção regional** (times da mesma região só se enfrentam na semifinal ou na final) e **suporte a qualquer quantidade de times** (incluindo folgas/bye para números que não são potência de 2, como 20, 26, etc.).

## Funcionalidades

- **Proteção regional**: regras "Semifinal ou Final" e "Apenas na Final"
- **Folgas (bye)**: funciona com qualquer quantidade de times (mínimo 2)
- **Layout responsivo**: funciona no celular e no PC
- **Offline**: 100% local, dados salvos no `localStorage`
- **Animações**: urna girando, roleta de nomes, reveal 3D, deal-in sequencial, confete
- **Zoom**: controle de zoom da árvore de chaveamento

## Como usar

1. Abra `index.html` no navegador (ou sirva com um HTTP server local)
2. Adicione os times (nome + região)
3. Escolha a regra de proteção
4. Clique em "Sortear chaveamento"

## Deploy

Disponível online em: *(será atualizado após deploy no Vercel)*

## Tecnologias

- HTML5, CSS3, JavaScript (puro, sem dependências)
- Deploy: Vercel (estático)
