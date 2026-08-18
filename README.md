# TradeCalc Pro - Gerenciador de Risco e R-Multiples

Uma calculadora financeira Single Page Application (SPA) desenvolvida para traders do mercado financeiro internacional. Ela permite calcular de forma rápida o risco financeiro de uma operação e projetar alvos baseados em múltiplos de risco (R-Multiples: 1R, 2R, 3R... até 8R).

## 🚀 Funcionalidades

- **Cálculo Imediato:** Os cálculos são feitos em tempo real conforme você digita.
- **Risco Financeiro:** Insira sua Entrada e Stop Loss, e o sistema calcula automaticamente a distância em pontos e o risco financeiro total baseado no tamanho da posição (Lotes) e valor do Tick/Ponto.
- **Projeção de Saídas (Targets):** Gera automaticamente os preços exatos para saídas parciais ou finais, variando de 1x1 até 8x1 (Gain/Risk ratio).
- **Cálculo de Porcentagem:** Se informado o saldo da conta, mostra qual a porcentagem da banca está em risco e qual a projeção de retorno (%).
- **Dark Mode UI:** Interface moderna e de alto contraste projetada para ficar aberta junto com a plataforma de trading sem cansar a visão.
- **Ativos Pré-configurados:** Valores de ponto embutidos para ativos como Nasdaq, S&P 500, Dow Jones, DAX, Nikkei, Hong Kong, Bitcoin e Forex.

## 🛠 Tecnologias

- HTML5
- CSS3 (Vanilla, sem frameworks)
- JavaScript (Vanilla)

## 💻 Como usar localmente

O projeto não requer nenhum servidor complexo ou banco de dados. Roda inteiramente no lado do cliente (Client-side).

1. Clone o repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` diretamente em qualquer navegador moderno.
3. Insira os parâmetros do seu trade e veja a mágica acontecer!

## 📸 Interface

O sistema conta com inputs intuitivos:
- Direção do Trade (Compra / Venda)
- Seletor de Ativo / Valor do Ponto
- Tamanho da Posição (Lotes)
- Saldo da Conta (Opcional)
- Preço de Entrada
- Preço de Stop Loss

E exibe um painel de Resumo do Risco (1R) juntamente com a Tabela de Projeção de Alvos detalhada.
