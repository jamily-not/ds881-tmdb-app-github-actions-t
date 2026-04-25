# Atividade Prática: Automação de CI/CD com GitHub Actions

Este repositório contém uma aplicação React Native (Expo) que consome a API de filmes TMDB. O objetivo desta atividade é configurar um pipeline de integração e entrega contínua utilizando GitHub Actions para automatizar os testes, o deploy da versão web e a geração do pacote Android (APK).

## Pré-requisitos Obrigatórios

Antes de iniciar as etapas, você deve garantir que a aplicação tenha acesso aos dados:

1.  ✅**Fork:** Certifique-se de estar trabalhando no seu próprio Fork para ter permissão de execução das Actions.
2.  ✅**TMDB API Key:** Registre-se em [themoviedb.org](https://www.themoviedb.org/), crie um perfil de desenvolvedor e obtenha sua **API Key (v3 auth)**.
3.  ✅**GitHub Secrets:** No seu repositório (após o Fork), vá em *Settings > Secrets and variables > Actions* e crie um segredo chamado `TMDB_API_KEY` com o valor da sua chave.


## Etapa 1: Garantia de Qualidade (Testes) - Pedro

O primeiro passo de qualquer pipeline é garantir que o código novo não quebre funcionalidades existentes.

* ✅Crie o arquivo `.github/workflows/main.yml` no seu repositório.
* ✅Configure o gatilho para disparar apenas em `pushes` na branch `release` ou manualmente via `workflow_dispatch`.
* ✅Crie um Job de teste que utilize o **Node.js 20** (para compatibilidade com os métodos do Expo).
* ✅O job deve instalar as dependências usando `npm ci` (para garantir uma instalação fiel ao lockfile) e executar o script de teste padrão.


## Etapa 2: Entrega Web e GitHub Pages - Jamily

Nesta etapa, você deve transformar o código em um site estático e publicá-lo. 
**Atenção aos detalhes importantes abaixo.**

1.  ✅**Configuração da BaseURL:** Antes de mexer no workflow, edite o arquivo `app.json` no seu projeto. Adicione a propriedade `experiments.baseUrl` apontando para o nome do seu repositório (ex: `/seu-repositorio`). Sem isso, os scripts JS não serão encontrados no deploy.
2.  ✅**Variáveis de Ambiente:** No workflow, garanta que a chave do TMDB seja injetada em um arquivo `.env`. Lembre-se que o Expo exige que variáveis de frontend comecem com o prefixo `EXPO_PUBLIC_`.
3.  ✅**Build e Bypass do Jekyll:**
    * Execute o comando de exportação do Expo para a plataforma web.
    * **Importante:** O GitHub Pages ignora pastas que começam com sublinhado (como a `_expo` gerada pelo build). Crie um arquivo vazio chamado `.nojekyll` na pasta de saída (`dist`) para desativar esse comportamento.
4.  ✅**Deploy:** Utilize as Actions oficiais do GitHub para fazer o upload do artefato da pasta `dist` e realizar o deploy para o ambiente `github-pages`.


## Etapa 3: Build Nativo e Release de APK

A última etapa consiste em gerar o binário para instalação em dispositivos Android sem depender de serviços externos pagos.

1.  **Ambiente Nativo:** O job deve configurar o **JDK 17** e o ambiente Node.js.
2.  **Geração de Código Nativo:** Como este é um projeto gerenciado (Managed Workflow), você deve executar o comando `prebuild` do Expo para gerar a pasta `/android` dinamicamente no Runner do GitHub.
3.  **Compilação Gradle:** Garanta permissão de execução para o arquivo `gradlew` e execute o comando para montar o APK de release (`assembleRelease`).
4.  **Publicação da Release:**
    * Faça o upload do arquivo `.apk` gerado como um artefato do workflow.
    * Configure um passo final que dependa dos builds anteriores para criar uma **GitHub Release** oficial.
    * Utilize o número da execução (`github.run_number`) para taguear a versão automaticamente (ex: `v1`, `v2`).
    * Anexe o arquivo APK à Release criada.


## Validação da Atividade

A atividade será considerada concluída quando:
* A aba **Actions** mostrar o pipeline finalizado com sucesso (verde).
* O site da aplicação estiver acessível e consumindo dados da TMDB via URL do GitHub Pages.
* Uma **Release** aparecer na página inicial do repositório contendo o arquivo `app-release.apk` disponível para download.


## Etapas Bônus

Para os alunos que desejam elevar o nível do projeto e simular um ambiente real de produção, estas etapas adicionam camadas de segurança, organização e boas práticas de DevOps.

### Testes de Compatibilidade (Matrix Testing)

Em vez de testar apenas em uma versão do Node.js, você pode garantir que sua aplicação funciona em diferentes ambientes simultaneamente.

* **O que fazer:** Utilize a propriedade `strategy` e o objeto `matrix` dentro do seu job de testes.
* **Indicação:** Defina uma lista contendo as versões `20` e `24`. O GitHub Actions criará duas execuções paralelas automaticamente.
* **Por que fazer:** Isso valida se o código que funciona no Node 24 não quebra em versões ligeiramente mais antigas (ou vice-versa), garantindo a resiliência do projeto.

## Rastreabilidade com Tag Dinâmica (SHA do Commit)

Usar tags fixas (como "v1") dificulta saber exatamente qual versão do código está rodando no contêiner. O SHA é a "impressão digital" única de cada commit.

* **O que fazer:** Crie um passo (step) inicial que utilize comandos de shell para extrair os primeiros 7 caracteres da variável de ambiente `$GITHUB_SHA`.
* **Indicação:** Utilize o comando `echo "sha=$SHA" >> $GITHUB_OUTPUT` para que este valor fique disponível para os passos seguintes. No comando de build do Docker, recupere esse valor via `steps`.
* **Por que fazer:** Se surgir um bug em produção, você saberá exatamente qual código gerou aquela imagem específica.

## Integração com Docker Hub e Secrets

Agora que você já sabe usar segredos para a API do TMDB, vamos reforçar o padrão para infraestrutura.

* **O que fazer:** Crie uma conta no Docker Hub e gere um *Access Token*. No GitHub, configure os segredos `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN`.
* **Indicação:** Utilize a action oficial `docker/login-action` no seu workflow para realizar a autenticação automática antes de qualquer tentativa de envio (push).
* **Por que fazer:** Isso automatiza a entrega da sua imagem para um registro público, permitindo que ela seja baixada em qualquer servidor do mundo.

## Eficiência com Actions Oficiais (Build & Push)

No mundo real, evitamos escrever scripts manuais de `docker build` se houver uma solução robusta e testada pela comunidade.

* **O que fazer:** Substitua os comandos manuais de shell pela action oficial `docker/build-push-action`.
* **Indicação:** Configure a action para realizar o build e o push em um único bloco, apontando para o contexto do repositório e passando as tags necessárias.
* **Por que fazer:** Actions oficiais lidam melhor com cache, logs e erros do que scripts manuais simples.

## Estratégia de Tagging: Latest + SHA

Um padrão de mercado é manter uma tag que sempre aponta para o que há de mais novo, sem perder o histórico das versões anteriores.

* **O que fazer:** Configure o seu step de build para gerar **duas tags simultâneas** para a mesma imagem.
* **Indicação:** Uma tag deve ser fixa (`latest`) e a outra deve ser a tag dinâmica gerada no passo 2 (o SHA do commit).
* **Por que fazer:** A tag `latest` facilita o deploy rápido, enquanto a tag com o SHA permite fazer *rollbacks* precisos para versões anteriores caso algo dê errado.

## Fluxos Distintos: CI vs CD

Nem toda ação deve acontecer a todo momento. Testar é frequente; fazer deploy é um evento especial.

* **O que fazer:** Refine o gatilho `on` do seu workflow.
* **Indicação:** Configure o pipeline para que os **testes** rodem em todo `pull_request` aberto, mas garanta que o **deploy** e o **push de imagens** só aconteçam quando houver um `push` efetivo na branch `release`.
* **Por que fazer:** Isso economiza minutos de execução e evita que imagens de código "em andamento" (branches de feature) poluam o seu registro de produção.

## Desafio Extra: Múltiplas Arquiteturas (Buildx)

A nuvem moderna não roda apenas em processadores Intel/AMD (x86); muitos servidores e dispositivos móveis usam arquitetura ARM.

* **O que fazer:** Utilize a action `docker/setup-buildx-action`.
* **Indicação:** Configure o build para gerar imagens compatíveis com `linux/amd64` e `linux/arm64` simultaneamente. 
* **Nota:** Esta etapa é opcional e demorada. Ela demonstra como criar uma imagem "universal" que roda tanto em um servidor de alta performance quanto em um Raspberry Pi.

# Dinâmica de Trabalho: Simulando um Squad DevOps

Siga as regras operacionais abaixo para a organização do grupo:

### 1. Repositório Compartilhado e Proteção de Branch
* **✅Formação:** Formem grupos de 3 a 4 integrantes.
* **✅Hospedagem:** Apenas um integrante fará o Fork do repositório base para a sua conta e adicionará os demais membros do grupo como colaboradores (com permissão de escrita).
* **✅Branch Protection:** O dono do repositório deve acessar as configurações (*Settings > Branches > Add branch protection rule*). Crie uma regra para a branch `release` marcando a opção **"Require a pull request before merging"**. 

### 2. Gestão de Tarefas e Rastreabilidade
* ✅ Ativem a aba **Projects** no repositório e criem um board no estilo Kanban com as colunas: *To Do, In Progress, Review, Done*.
* ✅Cada etapa principal desta atividade (Etapa 1, Etapa 2, Etapa 3, etc.) deve ser transformada em uma **Issue**.
* ✅Quando iniciarem uma etapa, o responsável deve associar o seu usuário à Issue correspondente e movê-la pelo board conforme o progresso.

### 3. Rotação de Papéis e Revisão de Código
Para que todos pratiquem as diferentes responsabilidades do ciclo de vida de desenvolvimento, os papéis do time devem **obrigatoriamente rotacionar** a cada nova etapa da atividade.

Em cada entrega, o grupo deve distribuir as seguintes responsabilidades:
* **Engenheiro DevOps (Autor):** Puxa a tarefa, cria a branch, escreve o código no arquivo `.yml`, realiza os commits e abre o **Pull Request (PR)**. Na descrição do PR, deve inserir uma referência automática para fechar a tarefa correspondente (ex: digitando `Fixes #2`).
* **Revisor de Código (Reviewer):** Responsável por analisar o Pull Request do colega. **É proibido aprovar silenciosamente.** O revisor deve deixar pelo menos um comentário na aba *Files changed* ou na discussão principal do PR. Pode ser uma dúvida arquitetural, uma sugestão de melhoria ou a validação de que os logs do Actions confirmam o sucesso do código. Só então o PR deve ser aprovado.
* **Release Manager:** Responsável por realizar o *Merge* seguro do código revisado para a branch `release`, deletar a branch antiga e garantir que o pipeline de integração contínua rodou com sucesso no ambiente final.

### 4. Critérios de Validação da Atividade
A entrega do grupo **não** será avaliada apenas observando o código final do arquivo YAML. A aprovação da atividade levará em conta os rastros de auditoria gerados pelo time:
* As tarefas foram documentadas e fechadas via Issues.
* Todo o código entrou no repositório exclusivamente através de Pull Requests.
* Há evidências de comunicação técnica e validação cruzada (comentários) entre os membros do grupo durante as revisões de código.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
