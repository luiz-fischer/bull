# Proof of Concept: Node.js Express API with Job Queue

Este projeto é uma prova de conceito de uma API Express Node.js que usa uma fila de trabalhos para lidar com cargas pesadas. Utilizamos a biblioteca `bull` para gerenciar a fila de trabalhos, e `Redis` como nosso armazenamento de dados para a fila. Também utilizamos `docker-compose` para iniciar facilmente o ambiente Redis.

## Pré-requisitos

- Node.js
- Yarn
- Docker e Docker Compose

## Instruções de instalação

1. Clone este repositório
2. Navegue até o diretório do repositório clonado
3. Instale as dependências do projeto executando `yarn install`
4. Construa e inicie os serviços do Docker Compose executando `docker-compose up -d`

## Executando o aplicativo

1. Inicie a aplicação executando `yarn start`
2. A aplicação deve estar rodando na porta 3000, e você pode enfileirar um trabalho enviando uma solicitação POST para `http://localhost:3000/enqueue`

## Observações

Esta POC é apenas um exemplo de como uma fila de trabalhos pode ser usada em uma API Express para lidar com cargas pesadas. Na implementação real, você precisaria tratar os erros e falhas de forma adequada, e também seria necessário adicionar testes e logging.


