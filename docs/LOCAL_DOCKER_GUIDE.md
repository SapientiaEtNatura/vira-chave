# Tutorial — Rodando o VIRA CHAVE em Container na Máquina Principal (Windows)

Este guia explica como subir o ambiente completo do **VIRA CHAVE** (Node.js 22 + PostgreSQL 16 + suporte a Grafana k6) usando **Docker** na sua máquina Windows.

---

## 1. Pré-requisito: Instalar / Abrir o Docker Desktop

Na verificação do seu Windows, o **WSL 2** já está instalado, mas o comando `docker` ainda não está disponível no sistema.

1. Baixe e instale o **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. Durante a instalação, mantenha marcada a opção **Use WSL 2 instead of Hyper-V**.
3. Abra o **Docker Desktop** e aguarde aparecer **"Engine running"** (ícone da baleia verde no canto inferior esquerdo).
4. Confirme no PowerShell que funcionou:
   ```powershell
   docker --version
   docker compose version
   ```

---

## 2. Subir os Containers do Projeto

1. Abra o PowerShell na pasta do projeto:
   ```powershell
   cd "c:\Users\crodr\OneDrive\Área de Trabalho\ViraChave"
   ```
2. Copie o arquivo de variáveis de ambiente de exemplo (apenas na primeira vez):
   ```powershell
   copy .env.example .env
   ```
3. Suba o banco (**PostgreSQL 16**) e o container da aplicação (**Node.js 22**):
   ```powershell
   docker compose up -d --build
   ```
4. Verifique se os containers estão rodando:
   ```powershell
   docker compose ps
   ```
   Você deve ver `virachave-local-db` (**healthy**) e `virachave-local-app` (**Up**).

> **Nota:** Enquanto ainda não houver um `package.json` (projeto Next.js) no repositório, o container `virachave-local-app` fica ligado em espera para você poder entrar nele e testar comandos ou criar o projeto. Assim que existir um `package.json`, ele instala as dependências e sobe o Next.js automaticamente em `http://localhost:3000`.

---

## 3. Comandos Úteis do Dia a Dia

### Entrar no terminal dentro do container da aplicação
```powershell
docker compose exec app bash
```
Dentro dele você pode rodar qualquer comando `npm`, `npx prisma ...`, `vitest`, etc., isolado do Windows.

### Ver os logs em tempo real
```powershell
docker compose logs -f app
```

### Testar conexão com o PostgreSQL local
```powershell
docker compose exec db psql -U virachave -d virachave -c "\dt"
```

### Rodar testes de carga com Grafana k6 (quando houver scripts em `tests/load/`)
```powershell
docker compose --profile loadtest run --rm k6 run /scripts/smoke.js
```

### Parar os containers (sem apagar os dados do banco)
```powershell
docker compose down
```

### Parar e apagar tudo (incluindo volume do banco de dados local)
```powershell
docker compose down -v
```
