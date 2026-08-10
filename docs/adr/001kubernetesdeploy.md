# ADR 001 — Kubernetes via K3s em VM, em vez do MKS gerenciado

**Status:** Aceito
**Data:** 2026-08-09

## Contexto
A aplicação precisa rodar em um cluster Kubernetes com pelo menos duas
réplicas. As restrições da entrega são: crédito limitado na Magalu Cloud,
ambiente que possa ser criado e destruído a cada sessão de laboratório, e
manifests que continuem válidos caso o projeto migre para um cluster
gerenciado depois.

## Alternativas consideradas
- **MKS (Kubernetes gerenciado pela Magalu)** — upgrades, backup e alta
  disponibilidade do cluster. Contra: custa mais,
  porque cobra o cluster gerenciado além dos nós, e demora mais para
  provisionar.
- **K3s em VM única** — custa apenas uma VM, sobe em menos de 2 minutos.
  Contra: um nó só, e toda a manutenção fica por nossa conta.
- **Opções descartadas de imediato:** kind e k3d rodam o cluster dentro da
  máquina local usando o docker, sem IP público — a aplicação não ficaria acessível para
  clientes externos. Docker Compose seria mais barato, mas não usaria o
  Kubernetes, que é o objetivo do laboratório.

## Decisão
K3s em VM única, por ser a opção mais barata que ainda entrega uma API
Kubernetes de verdade acessível pela internet. Os manifests são os mesmos que
rodariam no MKS, tornando mais fácil a migração no futuro.

**Custo estimado (simulação MGC, 09/08/2026):**

| Cenário | Composição | R$/mês |
|---|---|---|
| K3s em VM (escolhido) | VM 2 vCPU/4 GB + DBaaS + Registry | ≈ 205,60 |
| MKS (alternativa) | 1 nó 2 vCPU/4 GB + DBaaS + Registry | ≈ 535,60 |

## Consequências

**Positivas**
- Custo limitado a uma VM.
- Ambiente sobe e desce rápido, o que permite recriar o cluster sempre que
  necessário.
- Acesso direto ao servidor facilita investigar problemas durante o lab.

**Negativas**
- **As duas réplicas ficam no mesmo servidor.** Se a VM reiniciar ou travar,
  a aplicação cai inteira — ter dois pods protege contra falha da aplicação,
  não contra falha da máquina. Por isso o alvo de 99,5% da tabela de
  requisitos vale para a aplicação, sem contar manutenção planejada.
- **A credencial usada no deploy dá acesso total ao cluster.** O pipeline se
  autentica com o kubeconfig do K3s, guardado como secret no GitHub Actions.
  O armazenamento é seguro, mas a credencial em si não tem limite de
  permissão: quem a obtiver é administrador do cluster. A mitigação seria
  restringir quem pode alterar os workflows do repositório e, principalmente,
  usar uma credencial com permissão apenas para atualizar a aplicação.
- **Capacidade fixa em um servidor.** O cluster não adiciona máquinas
  automaticamente quando a carga aumenta. É possível criar mais réplicas da
  aplicação, mas todas dividem os recursos da mesma VM — o limite continua
  sendo o tamanho dela.