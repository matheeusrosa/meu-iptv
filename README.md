# 📺 IPTV PRO BRASIL (v2.0.0) - Reprodutor Profissional de TV Ao Vivo

Aplicação web e servidor de streaming em Node.js de alta performance para reprodução de TV ao vivo com HLS, grade completa de canais fechados e abertos, design moderno e proxy integrado contra restrições de CORS.

---

## 🌟 Recursos Principais

- **Grade Completa de 75 Canais Verificados**:
  - 🏛️ **TV Aberta & Nacionais**: Rede Globo Nacional, Rede Globo São Paulo, Rede Globo Pará (TV Liberal Belém), Afiliadas Regionais (EPTV Campinas, TV Tribuna Santos, TV Vanguarda), TV Paraense, SBT, Record TV, Band, TV Cultura, etc.
  - ⚽ **Esportes & Combate**: ge Fast (Globo Esporte 1080p), SporTV, SporTV 2, SporTV 3, ESPN Brasil, ESPN 3, ESPN 4, Premiere Clubes, Combate, FIFA+, Red Bull TV, WooHoo.
  - 🌍 **Documentários & História**: History Channel, History 2 (H2), Discovery Channel, Discovery Turbo, Discovery Kids, Discovery Science, Discovery World, Discovery Theater, Animal Planet, NASA TV.
  - 🎬 **Filmes & Cinema**: Megapix, Telecine Premium, Telecine Action, Telecine Pipoca, Telecine Touch, Telecine Fun, Telecine Cult, TNT, Space, Sony Movies, Adrenalina Pura, Canal Fox, FX, Cinecanal, Warner Channel, Sony Channel, AXN, Universal TV, Cine Sucessos.
  - 📺 **Globosat & Variedades**: Canal Futura (Globo / FRM), GloboNews, Multishow, GNT, Viva, TNT Novelas.
  - 🧸 **Infantil & Cultura**: Cartoon Network, Turma da Mônica, Bob Esponja, Cartoonito, ZooMoo Kids, BabyFirst Kids, Arte 1, Play TV.
- **Dois Modos de Execução**:
  1. **Servidor Node.js (Recomendado)**: Execução local em `http://localhost:3000` com API REST e Proxy de Streaming com CORS habilitado.
  2. **Modo Standalone Direto**: Pode abrir o arquivo `index.html` dando 2 cliques diretamente pelo Windows Explorer (`file:///...`).
- **Resiliência Máxima**:
  - Logos com sistema de fallback instantâneo via iniciais estilizadas (nunca quebra ou exibe ícone de imagem quebrada).
  - Proxy inteligente (`/proxy?url=...`) para contornar bloqueios de CORS e HTTP/HTTPS misto.
  - Tratamento e recuperação automática de buffer e erros de rede via HLS.js.
  - Sistema de favoritos salvo localmente no seu navegador.

---

## 🚀 Como Executar

### Opção 1: Servidor Profissional em Node.js (Mais Rápido e Estável)

No terminal (PowerShell ou Prompt de Comando), dentro desta pasta:

```bash
# Iniciar o servidor
npm start
# Ou diretamente:
node server.js
```

Abra seu navegador em:
👉 **[http://localhost:3000](http://localhost:3000)**

Para verificar o status de todos os canais a qualquer momento:
```bash
npm run verify
```

Para visualizar os relatórios automáticos de erros registrados pela telemetria:
```bash
npm run logs
```

---

### Opção 2: Modo Standalone (Direto pelo Arquivo)

Se você preferir não rodar o servidor no momento, basta **dar dois cliques no arquivo `index.html`** na pasta do projeto. Ele abrirá no seu navegador padrão já com todos os 128 canais prontos para assistir.

---

## ⌨️ Atalhos do Teclado

| Tecla | Ação |
|---|---|
| **Espaço** ou **K** | Reproduzir / Pausar transmissão |
| **→** (Seta Direita) | Próximo canal |
| **←** (Seta Esquerda) | Canal anterior |
| **↑** (Seta Cima) | Aumentar volume (+5%) |
| **↓** (Seta Baixo) | Diminuir volume (-5%) |
| **F** | Alternar Tela Cheia (Fullscreen) |
| **M** | Silenciar som (Mudo) |
| **C** | Exibir / Ocultar Guia Lateral de Canais |
| **R** | Recarregar sinal do canal atual |
| **A** | Alternar Proporção da Tela (16:9, 4:3, Zoom, Ajustar) |
| **0 a 9** | Sintonizar canal pelo número direto |
| **H** | Abrir painel de ajuda e atalhos |
| **Esc** | Fechar modais / Sair de tela cheia |

---

## 🏗️ Estrutura do Projeto

```
iptv mr/
├── package.json              # Configurações do projeto e scripts npm
├── server.js                 # Servidor HTTP de streaming, API REST e Proxy CORS
├── canais_completos.json     # Base de dados central dos 75 canais
├── canais_completos.m3u      # Playlist no formato M3U para VLC, Smart TVs e TV Box
├── index.html                # Player standalone otimizado para abertura direta
├── public/                   # Frontend modular e desacoplado
│   ├── index.html            # Estrutura HTML da aplicação
│   ├── css/
│   │   ├── main.css          # Design system, variáveis, modais e scrollbars
│   │   ├── player.css        # Estilos de vídeo, controles e OSD
│   │   └── sidebar.css       # Guia de canais, categorias e busca
│   ├── js/
│   │   ├── config.js         # Configurações globais e opções do HLS
│   │   ├── channels-data.js  # Base de canais embutida para fallback
│   │   ├── player.js         # Mecanismo de reprodução HLS e recuperação de sinal
│   │   ├── channels.js       # Gerenciador de categorias, favoritos e filtros
│   │   ├── ui.js             # Gerenciador de interface, OSD e toasts
│   │   └── app.js            # Orquestrador principal da aplicação
│   └── data/
│       └── channels.json     # Endpoint estático de canais
└── scripts/
    └── verify_channels.js    # Ferramenta CLI de auditoria de sinal dos canais
```

---

## 📡 Endpoints da API REST do Servidor

- `GET /api/channels`: Lista de canais em JSON. Parâmetros suportados: `?category=Filmes` ou `?q=globo`.
- `GET /api/categories`: Contagem de canais por categoria.
- `GET /api/health`: Status do servidor, canais carregados e uptime.
- `GET /playlist.m3u`: Download da playlist M3U compatível com VLC e reprodutores externos.
- `GET /proxy?url=...`: Proxy transparente com suporte a CORS para reprodução sem travas.
