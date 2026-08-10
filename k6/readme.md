## Teste de carga

Executado com [k6](https://k6.io/) (Grafana). O k6 é um binário Go com
interpretador JavaScript embutido — o arquivo `.js` descreve o cenário,
não requer Node.js nem dependências instaladas.

### Executar

    k6 run k6/load-test.js

Instalação: https://grafana.com/docs/k6/latest/set-up/install-k6/

### O que valida

Os requisitos não-funcionais declarados em docs/architecture.md:
P95 < 500 ms e sustentação de ~300 req/s (thresholds no próprio script).