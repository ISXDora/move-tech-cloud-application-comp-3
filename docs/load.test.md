# Teste de Carga — Validação dos Requisitos Não-Funcionais

**Data:** 10/08/2026 · **Ferramenta:** k6 (300 VUs, 2 min, endpoint /orders)

## Resultado

| Métrica | Medido | Alvo (architecture.md) | Status |
|---|---|---|---|
| Vazão sustentada | 184 req/s | 300 req/s | ✗ |
| Latência P95 | 1,63 s | < 500 ms | ✗ |
| Taxa de erro | 0,19% | < 1% | ✓ |

## Output do k6

[cola o bloco final do terminal aqui]

## Conclusão

Sob ~184 req/s a aplicação degrada sem quebrar: 99,8% das requisições
respondidas, porém com P95 3× acima do alvo. O requisito de 300 req/s
sem degradação não se sustenta na configuração atual (2 réplicas,
VM 2 vCPU/2 GB compartilhada com o monitoramento). Próximo passo:
identificar o gargalo (CPU vs banco) e aplicar HPA ou escala vertical.