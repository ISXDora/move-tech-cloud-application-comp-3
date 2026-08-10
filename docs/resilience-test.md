# Teste de Resiliência — Auto-recuperação do Kubernetes

**Data:** 2026-08-09
**Objetivo:** comprovar que o cluster recupera automaticamente a aplicação após a falha de um pod, sem intervenção manual e sem indisponibilidade perceptível.

## Cenário

O Deployment `cloud-application` declara `replicas: 2`. O teste injeta uma falha deletando manualmente um dos pods e observa a reconciliação feita pelo ReplicaSet.

## Estado inicial

Duas réplicas saudáveis em execução:

```
$ kubectl get pods
NAME                                 READY   STATUS    RESTARTS   AGE
cloud-application-57d76948b5-2l57r   1/1     Running   0          95m
cloud-application-57d76948b5-9flw9   1/1     Running   0          95m
```

## Falha injetada

Deleção manual de uma das réplicas:

```
$ kubectl delete pod cloud-application-57d76948b5-2l57r
pod "cloud-application-57d76948b5-2l57r" deleted
```

## Recuperação automática

Os eventos do cluster registram a sequência completa — o ReplicaSet detecta a divergência entre estado desejado (2 réplicas) e estado real (1 réplica) e recria o pod imediatamente:

```
$ kubectl get events --sort-by=.lastTimestamp | tail -15
LAST SEEN   TYPE     REASON              OBJECT                                    MESSAGE
101s        Normal   Killing             pod/cloud-application-57d76948b5-2l57r    Stopping container cloud-application
100s        Normal   SuccessfulCreate    replicaset/cloud-application-57d76948b5   Created pod: cloud-application-57d76948b5-jth5r
100s        Normal   Scheduled           pod/cloud-application-57d76948b5-jth5r    Successfully assigned default/cloud-application-57d76948b5-jth5r to vm-k3s-cluster-cloud-application-cluster
99s         Normal   Pulled              pod/cloud-application-57d76948b5-jth5r    Container image "container-registry.br-ne1.magalu.cloud/cloud-application-registry-isadora/cloud-application:f8bf9bf6ac135a67e6684819c2b74b405631ce71" already present on machine and can be accessed by the pod
99s         Normal   Created             pod/cloud-application-57d76948b5-jth5r    Container created
99s         Normal   Started             pod/cloud-application-57d76948b5-jth5r    Container started
```

## Estado final

Duas réplicas novamente. O pod novo (`jth5r`, 3m de idade) tem **nome diferente** do deletado — evidência de que o ReplicaSet criou um substituto, e não reiniciou o mesmo container:

```
$ kubectl get pods
NAME                                 READY   STATUS    RESTARTS   AGE
cloud-application-57d76948b5-9flw9   1/1     Running   0          100m
cloud-application-57d76948b5-jth5r   1/1     Running   0          3m7s
```

## Conclusão

- **Tempo de recuperação:** ~2 segundos entre o `Killing` (101s) e o `Started` (99s). A imagem já estava em cache no nó (`already present on machine`), o que eliminou o tempo de pull.
- **Ação manual necessária:** nenhuma. O ReplicaSet reconciliou o estado desejado (`replicas: 2`) automaticamente.
- **Impacto no usuário:** durante a recriação, a réplica sobrevivente (`9flw9`) continuou atendendo o tráfego por trás do Klipper ServiceLB — a readiness probe garante que apenas pods prontos recebem requisições.

Este comportamento é a materialização das probes configuradas no `k8s/app.yaml`: a **liveness probe** reinicia containers travados, a **readiness probe** retira pods não-prontos do balanceamento, e o **ReplicaSet** garante o número declarado de réplicas — as três camadas juntas formam a auto-recuperação do Kubernetes.
