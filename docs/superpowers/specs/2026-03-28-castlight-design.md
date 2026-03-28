# Castlight — Design Spec

## 1. Visao Geral

**Castlight** e uma plataforma de projecao e transmissao para cultos. Qualquer dispositivo na rede local vira uma tela de projecao — sem cabos HDMI, sem configuracao de IP. O operador controla tudo de um app desktop, e cada tela exibe conteudo adequado ao seu papel (publico, retorno, stream, etc.).

### Modelo de Negocio

**Freemium:**
- **Free:** Letras, biblia, slides PPTX, telas em rede, video, audio hibrido (WebRTC), cifras, retorno musical, presenter dongle, timer, liturgia, escala, integracao OBS.
- **Premium:** Controle DMX (iluminacao), controle de cameras, switcher de video.

### Fases de Entrega

| Fase | Escopo | Tier |
|------|--------|------|
| 1 | App operador + telas via rede + letras + biblia | Free |
| 2 | Slides PPTX, imagens, videos, avisos, backgrounds | Free |
| 3 | Integracao OBS, output streaming, audio hibrido (WebRTC) | Free |
| 4 | Cifras, partituras, retorno musical, presenter dongle | Free |
| 5 | Timer, cronometro, liturgia, escala de equipe | Free |
| 6 | Controle DMX, cenas de luz | Premium |
| 7 | Controle de cameras, switcher de video | Premium |

---

## 2. Arquitetura Tecnica

### Abordagem: Tauri + Sidecar (Bun)

O app do operador e um Tauri v2 (React + Rust). A logica de rede, banco de dados e servicos roda num processo sidecar em Bun, gerenciado pelo Tauri.

```
+----------------------------------------------+
|              Tauri App (Operador)             |
|  +---------------+  +-----------------------+|
|  |   React UI    |  |   Rust Core           ||
|  |  - Controle   |  |  - Window mgmt        ||
|  |  - Preview    |  |  - File system         ||
|  |  - Config     |  |  - Sidecar lifecycle   ||
|  |  - Templates  |  |  - Presenter dongle    ||
|  |               |  |    (global key events) ||
|  +-------+-------+  +-----------+-----------+|
|          |   IPC (Tauri cmds)   |            |
+----------+-----------+----------+------------+
           |           |
           v           v spawn/manage
+----------------------------------------------+
|           Sidecar (Bun)                      |
|                                              |
|  +-------------+  +------------------------+|
|  | WebSocket   |  |  Services              ||
|  | Server      |  |  - Letras (busca+DB)   ||
|  | (Socket.IO) |  |  - Biblia (offline)    ||
|  +-------------+  |  - PPTX parser         ||
|  | mDNS        |  |  - Midia/Video         ||
|  | (Bonjour)   |  |  - WebRTC (audio)      ||
|  +-------------+  |  - Templates engine    ||
|  | HTTP Server |  |  - OBS integration     ||
|  | (Hono)      |  +------------------------+|
|  +-------------+                             |
|  | SQLite DB   |  Fases futuras:             |
|  | (local)     |  - DMX (premium)            |
|  +-------------+  - Cameras (premium)        |
+----------+-----------------------------------+
           | WebSocket + HTTP (LAN)
     +-----+------+----------+----------+
     v     v      v          v          v
  Publico Retorno  OBS     Celular   Celular
  (TV)   (Palco) (Stream) (Pastor)  (Biblia)
  /public /stage  /stream  /monitor  /bible
```

### Comunicacao Tauri <-> Sidecar

HTTP local (`localhost:3001`) ou IPC via stdin/stdout do processo filho.

### Banco de Dados

SQLite local via `better-sqlite3`. Armazena letras, configuracoes, templates, liturgias, escala. Zero setup pro usuario.

---

## 3. Sistema de Telas e Descoberta de Rede

### Papeis de Tela

| Papel | Rota | O que exibe |
|-------|------|-------------|
| Publico | `/public` | Letra, versiculo, slide, video — visual limpo |
| Retorno (Palco) | `/stage` | Letra atual + proximo trecho + tom + notas do operador |
| Stream | `/stream` | Output limpo pra OBS — chroma key, lower thirds |
| Monitor (Pastor) | `/monitor` | Versiculo, avisos, timer, notas da liturgia |
| Biblia (Controle) | `/bible` | Interface de busca/controle — pastor escolhe versiculo do celular/tablet |
| Tecnica | `/tech` | Status de conexoes, preview de todas as telas, cues |

### Fluxo de Descoberta (mDNS)

1. Sidecar publica `_castlight._tcp.local.` na rede via mDNS (Bonjour).
2. Dispositivo acessa `castlight.local` (ou IP direto).
3. Pagina de boas-vindas aparece. Dispositivo se registra via WebSocket com info (user-agent, resolucao, nome).
4. No painel do operador, a tela aparece com dropdown pra atribuir papel.
5. Operador atribui papel. Tela recarrega automaticamente no modo correto.

### Fallbacks (quando mDNS nao funciona)

- QR Code no app do operador (URL com IP direto)
- Digitacao manual do IP
- Broadcast UDP como discovery alternativo

### Identificacao de Tela

Botao "Identificar" no operador faz a tela piscar com seu nome/numero — pra saber qual TV e qual.

### Persistencia

Telas ja configuradas sao lembradas por MAC/fingerprint. Na proxima conexao, assume o papel anterior automaticamente.

---

## 4. Conteudo

### 4.1 Letras de Musica

**Armazenamento:** SQLite local. Cada musica com:
- Titulo, artista, tom original
- Letra dividida em secoes (verso, refrao, ponte, etc.)
- Tags (louvor, adoracao, ofertorio, etc.)

**Importacao:**
- Busca online (Vagalume, Letras.mus) — operador busca, seleciona, edita e salva local
- Importacao manual: TXT, ChordPro, PPTX (cada slide vira secao)
- Copiar/colar texto livre

**Interface do operador:** Lista de secoes clicaveis. Clicar envia o trecho pra tela. Preview do proximo trecho visivel.

### 4.2 Biblia

**Banco offline embutido.** Versoes em dominio publico/licenca livre:
- ARA (Almeida Revista e Atualizada)
- ACF (Almeida Corrigida Fiel)
- NVI (se licenca permitir)
- KJV, ESV (ingles)

**Controle independente:** O pastor abre `/bible` no celular/tablet e navega livremente — livro, capitulo, versiculo. Quando seleciona, a tela publica exibe.

**Interface responsiva:** Otimizada pra tablet (iPad, Android). Navegacao por livro > capitulo > versiculo com UI limpa e organizada. Suporte a busca por texto e referencia.

**Conflito de controle:** Ultimo comando prevalece. O operador tambem pode enviar versiculos do app principal.

### 4.3 Slides PPTX

**Parsing:** Converte `.pptx` em imagens (slide por slide) via lib JS. Slides estaticos, sem animacoes.

**Fluxo:**
1. Operador importa o `.pptx`
2. Sidecar converte em imagens PNG
3. Aparecem como sequencia de slides no controle
4. Presenter dongle (Page Down/Up) navega entre slides

---

## 5. Midia — Video, Audio e Backgrounds

### Video

**Formatos:** MP4, WebM, MOV (nativos do browser).

**Fluxo de reproducao:**
1. Operador seleciona video e da play
2. Sidecar distribui comando de play + timestamp via WebSocket
3. Cada tela cliente carrega o video do HTTP server e sincroniza pelo timestamp
4. Controles: play, pause, seek, volume — tudo pelo operador

### Audio Hibrido (Free)

- **PA da igreja:** Audio sai direto da placa de som da maquina -> cabo pra mesa de som. Zero latencia.
- **OBS / Streaming:** Recebe audio via WebRTC do sidecar. Latencia ~50-100ms, aceitavel pra stream.
- **Telas clientes:** Sem audio por padrao (evita eco). Ativavel por tela se necessario.

### Backgrounds

**Tipos:**
- Imagens estaticas (JPG, PNG)
- Videos em loop (motion backgrounds)
- Gradientes / cores solidas

**Aplicacao:** Background e independente do conteudo. Operador define o background e o conteudo (letra, versiculo) renderiza por cima. Cada template define como o texto se comporta sobre o background.

**Biblioteca inclusa:** Pack de backgrounds genericos embutidos (ceu, natureza, abstrato, etc.). Operador pode adicionar os proprios.

---

## 6. Templates e Customizacao Visual

### Estrutura de um Template

Cada template define como o conteudo aparece na tela:
- Layout (posicao do texto, alinhamento)
- Tipografia (fonte, tamanho, peso, sombra)
- Cores (texto, contorno, sombra)
- Background padrao
- Animacao de transicao (fade, slide, none)
- Variantes por tipo de conteudo (letra, versiculo, aviso, slide PPTX)

### Templates Inclusos (~8-10)

| Template | Estilo |
|----------|--------|
| Minimalista | Fundo escuro, texto branco, sem serifa |
| Classico | Fundo com textura, fonte serifada |
| Moderno | Gradientes, fonte bold, transicoes suaves |
| Conferencia | Clean, fundo solido, logo no canto |
| Natal | Tematico sazonal |
| Pascoa | Tematico sazonal |
| Kids | Colorido, fontes arredondadas, divertido |
| Acustico | Tons quentes, visual intimista |
| Impacto | Texto grande, alto contraste |

### Customizacao por Igreja

Operador escolhe um template e pode sobrescrever:
- Fontes (Google Fonts ou local)
- Paleta de cores
- Logo da igreja (posicao configuravel)
- Background padrao
- Intensidade da sombra/contorno do texto
- Transicao entre slides (fade, slide, dissolve, nenhuma)

**Preview em tempo real** enquanto edita.

**Templates por tela:** Cada tela pode ter template diferente. Publico com "Moderno", retorno com "Minimalista", kids com "Kids".

---

## 7. Integracao OBS e Streaming

### Output pra OBS (tela `/stream`)

**Modos:**
- **Chroma key** — fundo verde/azul solido, texto por cima. OBS remove o fundo.
- **Transparente (NDI)** — envia com canal alpha direto pro OBS. Sem chroma key necessario.
- **Fullscreen** — output completo com background, igual tela do publico.

**Configuravel:** Operador escolhe modo e quais elementos sao visiveis (letra, versiculo, logo, lower third, avisos).

### Lower Thirds

Barra inferior automatica no stream:
- Durante musica: nome da musica e artista
- Durante pregacao: referencia biblica e versao
- Personalizavel: fonte, cor, posicao, animacao

### OBS WebSocket

Integracao via `obs-websocket-js`:
- Trocar cenas automaticamente (ex: versiculo -> cena "Pregacao")
- Iniciar/parar gravacao
- Controlar transicoes

---

## 8. Recursos Musicais

### Tela de Retorno (`/stage`)

Exibe pro musico no palco:
- Letra + cifra juntas (formato ChordPro)
- Transposicao automatica — operador define o tom, cifras se ajustam
- Trecho atual destacado + preview do proximo
- Rolagem automatica ou manual

### Cifras

Armazenadas no formato ChordPro junto com a letra. Na importacao online, se a fonte tiver cifras, puxa junto.

### Partituras

Suporte a imagens (PDF/PNG). Exibe como slide. Musico pode fazer swipe/scroll no tablet.

### Presenter Dongle

Tauri captura teclas globais. Mapeamento padrao:

| Tecla | Acao |
|-------|------|
| `->` / `Page Down` | Proximo slide/trecho |
| `<-` / `Page Up` | Anterior |
| `F5` | Tela preta (blackout) |
| `.` (ponto) | Tela branca |
| `Esc` | Limpar tela (volta pro background) |

Configuravel pelo operador. Qualquer presenter USB (Logitech R500, R800, etc.) funciona.

---

## 9. Ferramentas de Producao

### Timer / Cronometro

Visivel na tela do pastor (`/monitor`), opcionalmente no publico.

**Modos:**
- Contagem regressiva
- Cronometro (tempo corrido)
- Relogio (hora atual)

**Alertas visuais:** Muda de cor conforme o tempo (verde -> amarelo -> vermelho).

### Liturgia / Roteiro do Culto

Operador monta a sequencia do culto como playlist. Cada item tem conteudo vinculado (musica, versiculo, video, aviso). Operador avanca item por item (ou via dongle). Todas as telas reagem automaticamente.

**Reuso:** Salvar liturgias como modelo ("Culto de domingo padrao", "Culto de jovens", etc.).

### Escala de Equipe

- Cadastro de voluntarios (nome, funcao: midia, louvor, som, recepcao)
- Escala semanal/mensal
- Visualizar quem esta escalado no dia

---

## 10. Stack Tecnica

### Tauri App (Operador)

| Camada | Tecnologia |
|--------|------------|
| Framework | Tauri v2 |
| Frontend | React + TypeScript + TailwindCSS v4 |
| State | Redux Toolkit (RTK Query pra async) |
| Build | Vite |
| Rust Core | Window mgmt, file system, sidecar lifecycle, captura de teclas globais |

### Sidecar (Servidor de Rede)

| Camada | Tecnologia |
|--------|------------|
| Runtime | Bun |
| HTTP Server | Hono |
| WebSocket | Socket.IO |
| Banco | SQLite via `better-sqlite3` |
| mDNS | `@homebridge/ciao` |
| PPTX | `libreoffice-convert` ou `pptx2json` |
| WebRTC | `simple-peer` + `wrtc` |
| Biblia | JSON/SQLite offline |
| OBS | `obs-websocket-js` |

### Telas Clientes (Browser)

| Camada | Tecnologia |
|--------|------------|
| Framework | React + TypeScript |
| State | Redux Toolkit |
| Conexao | Socket.IO client |
| Renderizacao | CSS Animations, Web Animations API |
| Responsivo | TailwindCSS v4 |

### Estrutura do Monorepo

```
castlight/
├── apps/
│   ├── desktop/          <- Tauri app (operador)
│   │   ├── src/          <- React frontend
│   │   └── src-tauri/    <- Rust backend
│   └── sidecar/          <- Bun server
│       ├── src/
│       │   ├── ws/       <- WebSocket handlers
│       │   ├── mdns/     <- Descoberta de rede
│       │   ├── services/ <- Letras, biblia, PPTX, midia
│       │   ├── webrtc/   <- Audio streaming
│       │   └── db/       <- SQLite schemas + migrations
│       └── public/       <- Assets das telas clientes
├── packages/
│   ├── shared/           <- Types, enums, constantes
│   ├── ui/               <- Componentes React compartilhados
│   └── templates/        <- Templates de projecao
├── assets/
│   ├── bibles/           <- Biblias offline (JSON/SQLite)
│   ├── backgrounds/      <- Backgrounds inclusos
│   └── fonts/            <- Fontes embutidas
├── pnpm-workspace.yaml
└── package.json
```
