# ADR 003 — Usar GitHub Actions para CI/CD

**Status:** Aceito
**Data:** 2026-08-09

## Contexto

A aplicação precisa ser testada, empacotada e implantada no cluster K3s da
Magalu Cloud a cada mudança. O processo manual (build local, push da imagem,
kubectl apply) é sujeito a erros: etapas esquecidas, imagens divergentes do
código versionado e deploys sem rastro de quem fez o quê. O repositório já
está hospedado no GitHub, e o projeto não dispõe de infraestrutura própria
para executores de pipeline.

## Alternativas consideradas

- **GitHub Actions** — integrado ao repositório; runners gerenciados sem
  custo para repositório público; secrets nativos; sem infraestrutura extra.
  Contra: lock-in com o GitHub; limites de minutos em repositórios privados.
- **Deploy manual (scripts locais)** — simples de começar; sem dependência
  externa. Contra: sem gate de testes, sem rastreabilidade, resultado depende
  do ambiente da máquina de quem executa.
- **Runner self-hosted (ex.: Jenkins em VM)** — controle total do ambiente.
  Contra: mais uma VM para operar e pagar; manutenção do próprio servidor de
  CI excede o escopo e o orçamento do projeto.

## Decisão

Usar GitHub Actions com um workflow em dois jobs: `test` (gate obrigatório)
e `build-and-deploy`, que constrói a imagem, publica no Container Registry
da MGC e aplica os manifests no cluster. Critério: menor atrito operacional
e custo zero, aproveitando a plataforma onde o código já vive.

Duas decisões complementares dentro do pipeline:

- **Imagem versionada pelo SHA do commit** (em vez de `:latest`), garantindo
  correspondência exata entre código e artefato em execução e rollback via
  `kubectl rollout undo`.
- **Secrets do cluster criados pelo pipeline** de forma idempotente
  (`--dry-run=client -o yaml | kubectl apply -f -`), permitindo reconstruir
  o ambiente do zero apenas executando o workflow, sem passos manuais.

## Consequências

**Positivas:**
- Deploy só ocorre com os testes verdes (gate automático)
- Rastreabilidade completa: cada deploy vinculado a um commit e a uma execução com logs
- Rollback determinístico para qualquer versão anterior pela tag do SHA
- Credenciais fora do código, gerenciadas como GitHub Secrets

**Negativas:**
- Dependência da disponibilidade do GitHub para fazer deploys
- Kubeconfig armazenado como secret na plataforma (superfície de exposição a gerenciar)
- Disparo manual (`workflow_dispatch`): deploy contínuo por push exigiria evolução do gatilho
- Sem ambiente intermediário: o pipeline publica direto em produção
- Pull secret do Container Registry criado manualmente no cluster (fora do
  pipeline): após recriação da VM, exige um passo manual — movê-lo para o
  workflow, no mesmo padrão idempotente do db-secret, é evolução pendente