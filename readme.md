# 🦆 Duck Hunt Multiplayer

Uma versão multiplayer do clássico **Duck Hunt**, onde jogadores utilizam seus **celulares como controles** para mirar e atirar no jogo principal exibido no host.

O projeto foi desenvolvido como um **MVP**, com foco em jogos em tempo real, WebSockets e integração com sensores de dispositivos móveis.

---

## 🎯 Visão Geral

- 🎮 **Host**: roda o jogo principal no navegador (desktop / TV).
- 📱 **Controller**: jogadores acessam pelo celular e usam giroscópio e botões.
- 🔌 Comunicação em tempo real via **WebSocket**.
- 🔁 Suporte a **reconexão (rejoin)** para evitar perda de player em quedas de rede.

---

## 🚀 Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Renan-ag/duck-hunt-multiplayer.git
cd duck-hunt-multiplayer
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o projeto

```bash
npm run dev
```

### 4. Inicie o servidor Web Socket 
```bash
Siga as intruções do repositorio para inciar o servidor: https://github.com/Renan-ag/duck-hunt-multiplayer-server
```

### 5. Define a URL do servidor (WebSocket) na ".env" como demonstrado no ".env.example"
```bash
VITE_WS_URL=wss://tales-april-pst-behavioral.trycloudflare.com/
```

Acesse:

- **Host:** http://localhost:5173  
- **Controller:** http://localhost:5173/controller.html

---

## 📱 Nota importante para iOS (Safari)

Dispositivos iOS **não permitem acesso ao giroscópio** quando a aplicação está rodando em:

- `http://localhost`
- IPs locais (`192.168.x.x`)

Para que o **giroscópio funcione corretamente no iPhone**, é necessário expor o projeto usando **HTTPS**.

### ✔ Solução recomendada: Cloudflared

```bash
cloudflared tunnel --url http://localhost:5173
```

Após isso:
- Acesse o **link HTTPS gerado** no iPhone
- O Safari solicitará permissão de movimento
- O giroscópio funcionará corretamente

> Essa etapa é necessária apenas para testes locais em dispositivos iOS.

---

## 🧠 Funcionalidades

- Criação de salas (host)
- Entrada de múltiplos controllers
- Limite de jogadores por sala
- Controle por giroscópio
- Rejoin simples (reconexão mantendo o mesmo player)
- Proteção contra duplicação de player
- Notificações de conexão e desconexão

---

## 📦 Stack

- HTML
- CSS
- TypeScript
- WebSocket (`ws`)
- Vite
- Kaplay (old name Kaboom.js game engine)

---

## ⚠️ Observações

- O estado do jogo é mantido apenas em memória
- Não utiliza banco de dados ou persistência externa
- Não possui autenticação
- Ideal para MVPs e protótipos multiplayer

---

## 📄 Licença

Projeto pessoal e educacional.
