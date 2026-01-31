# Racha AI - Divisão de Contas Simplificada

![Racha AI Overview](https://placehold.co/800x300/1e293b/4ade80?text=Racha+AI+Dashboard&font=roboto)

Aplicação web fullstack para divisão de despesas entre amigos, focada em simplicidade e privacidade.

## 📊 Fluxo de Funcionamento

```mermaid
graph TD
    A[Usuário] -->|Cria Grupo + PIN| B(Grupo Seguro)
    B -->|Link de Convite| C[Convidados]
    C -->|Entram apenas com Nome| B
    B -->|Adicionar Despesas| D[(Database SQLite)]
    D --> E[Cálculo Automático]
    E -->|Minimiza Transações| F[Relatório de Quem Paga Quem]
```

## 🚀 Funcionalidades

- **Sem Login/Email:** Acesso via Link e PIN de 4 dígitos.
- **Divisão Justa:** Algoritmo inteligente que minimiza transações.
- **Admin do Grupo:** Quem cria tem poderes de resetar senhas e remover usuários.
- **Moeda BRL:** Formatação automática para Real.
- **Mobile First:** Interface responsiva e com Dark Mode.

## 🛠️ Tecnologias

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS.
- **Backend:** Next.js Server Actions.
- **Database:** SQLite com Prisma ORM.

## 📦 Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o Banco de Dados (SQLite):
   ```bash
   npx prisma db push
   ```

3. Geração do Cliente Prisma:
   ```bash
   npx prisma generate
   ```

4. Rodar em Desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000).

## 🧪 Testes

Para validar a lógica de cálculo de saldos:

```bash
npm test
```

## 🧹 Manutenção Automatizada

O projeto inclui um script para limpeza de grupos inativos (sem atualizações há mais de 30 dias). Pode ser agendado via Cron.

```bash
node scripts/cleanup.js
```

## ⚡ Disclaimer

Este projeto foi integralmente **vibecoded**. 
Desenvolvido através de fluxo natural de prompts e colaboração IA + Humano, priorizando a velocidade e a experiência do usuário.


## 📝 Licença

MIT
