# Castlight Phase 3 — OBS Integration, Streaming Output, Hybrid Audio

## Escopo

- Output de streaming (tela `/stream` com modo fullscreen)
- Lower thirds automaticos (barra inferior com info contextual)
- Integracao OBS WebSocket (troca de cenas, gravacao)
- Audio hibrido via WebRTC (audio da maquina pra OBS/stream via rede)
- Auto-detect OBS na rede + fallback manual

## Tela de Stream (`/stream`)

Tela cliente acessivel via browser, otimizada pra captura pelo OBS (Window Capture ou Browser Source).

**Modo fullscreen:** Output completo com background + conteudo, identico a tela publica. O OBS captura essa janela do browser inteira.

**Lower thirds:** Barra inferior sobreposta ao conteudo:
- Durante musica: nome da musica e artista
- Durante pregacao/biblia: referencia biblica e versao
- Personalizavel: visibilidade, posicao, fonte

**Configuracao no operador:**
- Elementos visiveis na tela stream (letra, versiculo, lower third, logo)
- Lower third on/off
- Lower third customizacao (texto, cor, animacao)

## Integracao OBS WebSocket

O OBS expoe um WebSocket server (protocolo `obs-websocket` v5, porta padrao 4455).

**Descoberta:**
1. Tenta conectar em `ws://localhost:4455` (auto-detect local)
2. Se falhar, o operador configura IP:porta manualmente
3. Suporte a senha do OBS WebSocket

**Funcionalidades:**
- Trocar cena automaticamente baseado no tipo de conteudo (ex: letra -> cena "Louvor", biblia -> cena "Pregacao")
- Iniciar/parar gravacao
- Status de conexao visivel no operador

**Mapeamento de cenas:** O operador configura qual cena do OBS corresponde a cada tipo de conteudo. Ex:
```
Letras    -> "Cena Louvor"
Biblia    -> "Cena Pregacao"
Video     -> "Cena Video"
Aviso     -> "Cena Avisos"
```

## Audio Hibrido via WebRTC

**Problema:** Quando o operador toca um video, o audio precisa chegar no OBS/stream. O audio local vai pro PA via cabo, mas o OBS numa outra maquina precisa receber via rede.

**Solucao:** O sidecar captura o audio do video sendo reproduzido e oferece um stream WebRTC. O OBS (ou qualquer cliente) se conecta e recebe o audio.

**Implementacao simplificada pra Fase 3:**
- O sidecar serve o arquivo de video via HTTP
- A tela `/stream` reproduz o video com audio habilitado (diferente das outras telas que sao mudas)
- O OBS captura o audio da tela `/stream` junto com o video (Browser Source com audio)

Isso evita a complexidade de WebRTC real na Fase 3. O audio chega no OBS porque o Browser Source do OBS reproduz o video com som.

**Nota:** WebRTC real (pra cenarios onde OBS esta em outra maquina na rede) fica pra fase futura se necessario.

## Tipos Compartilhados

```typescript
interface OBSConfig {
  host: string;
  port: number;
  password: string;
  autoConnect: boolean;
  sceneMapping: Record<string, string>; // ContentType -> OBS scene name
}

interface OBSStatus {
  connected: boolean;
  currentScene: string | null;
  recording: boolean;
  streaming: boolean;
}

interface StreamConfig {
  showLyrics: boolean;
  showBible: boolean;
  showLowerThird: boolean;
  showLogo: boolean;
  lowerThirdColor: string;
  lowerThirdPosition: "bottom" | "top";
}

interface LowerThirdData {
  text: string;
  subtext: string;
  visible: boolean;
}
```

### Novos eventos WebSocket

```typescript
// Server -> Client
"stream:config": (config: StreamConfig) => void;
"stream:lower-third": (data: LowerThirdData) => void;
"obs:status": (status: OBSStatus) => void;
```

## Rotas HTTP

```
GET    /api/obs/status          <- Status da conexao OBS
POST   /api/obs/connect         <- Conectar ao OBS (host, port, password)
POST   /api/obs/disconnect      <- Desconectar
GET    /api/obs/scenes          <- Listar cenas do OBS
POST   /api/obs/scene           <- Trocar cena
POST   /api/obs/record/start    <- Iniciar gravacao
POST   /api/obs/record/stop     <- Parar gravacao
GET    /api/settings/obs        <- Ler config OBS salva
PUT    /api/settings/obs        <- Salvar config OBS
GET    /api/settings/stream     <- Ler config stream
PUT    /api/settings/stream     <- Salvar config stream
```

## UI no Desktop

### Pagina de Configuracoes (nova)

Adicionar item "Config" no sidebar (ultimo item). Tabs:
- **OBS** — conexao, mapeamento de cenas, controles (gravar, cena)
- **Stream** — config da tela stream (elementos visiveis, lower third)

### Dashboard

Adicionar card de status OBS:
- Indicador conectado/desconectado
- Cena atual
- Status de gravacao

## Armazenamento

Configs de OBS e stream salvos na tabela `settings` existente (key-value):
- `obs_config` -> JSON da OBSConfig
- `stream_config` -> JSON da StreamConfig
