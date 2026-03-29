# Castlight Phase 2 — Media, Slides, Videos, Notices, Backgrounds

## Escopo

Adicionar ao Castlight suporte a slides PPTX, imagens, videos, avisos e backgrounds.

## Armazenamento

Todos os arquivos de midia ficam em `~/.castlight/media/`, organizados por tipo:

```
~/.castlight/
├── castlight.db
└── media/
    ├── slides/      <- PNGs geradas do PPTX (subpasta por slide set)
    ├── images/      <- Imagens importadas
    ├── videos/      <- Videos importados
    └── backgrounds/ <- Backgrounds
```

O sidecar cria essa estrutura automaticamente na inicializacao.

## PPTX (Slides)

Operador importa `.pptx`. O sidecar converte cada slide em PNG usando `libreoffice --headless --convert-to png`. Os PNGs sao armazenados em `media/slides/{slideSetId}/`. No operador, aparecem como sequencia de slides clicaveis. Presenter dongle (Page Down/Up) navega entre slides.

**Fallback se LibreOffice nao estiver instalado:** Mensagem de erro clara pedindo instalacao. Nao tenta parsing JS — a conversao via LibreOffice e a unica abordagem suportada, pois garante fidelidade visual.

## Videos

Operador importa arquivo de video (MP4, WebM, MOV). O sidecar copia pra `media/videos/` e registra no banco. O sidecar serve o arquivo via HTTP estatico em `/api/media/file/:id`.

**Reproducao sincronizada:**
1. Operador clica play
2. Sidecar envia broadcast WebSocket `content:video` com `{ action: "play", url, timestamp: 0 }`
3. Cada tela cliente carrega o video do HTTP server e inicia reproducao
4. Pause/seek seguem o mesmo padrao — broadcast com action e timestamp

**Controles no operador:** Play, pause, seek (barra de progresso), volume (controla apenas saida local — telas clientes sem audio por padrao).

## Imagens

Importacao direta (JPG, PNG, SVG). O sidecar copia pra `media/images/` e registra no banco. Projecao fullscreen ou com template aplicado. Pode ser usada como slide manual (operador clica na imagem pra projetar).

## Avisos

Card de texto com titulo + corpo. Operador cria e envia pra tela. O template define o visual do card (posicao, fonte, cor). Avisos nao sao persistidos por padrao — sao efemeros. Opcionalmente, o operador pode salvar avisos recorrentes no banco.

## Backgrounds

Tipos suportados:
- Imagem estatica (JPG, PNG)
- Video em loop (MP4, WebM)
- Cor solida (hex)
- Gradiente (CSS gradient string)

Background e independente do conteudo. O operador define o background e o conteudo (letra, versiculo, aviso, slide) renderiza por cima. Cada template tem um background padrao, que o operador pode sobrescrever.

Pack de backgrounds inclusos (6-8 imagens genericas). Operador pode adicionar os proprios via importacao.

## Tipos Compartilhados (packages/shared)

### Novos enums

```typescript
// Adicionar ao ContentType existente
enum ContentType {
  Lyrics = "lyrics",
  Bible = "bible",
  Blank = "blank",
  Black = "black",
  Slide = "slide",
  Image = "image",
  Video = "video",
  Notice = "notice",
}
```

### Novos tipos

```typescript
interface SlideSet {
  id: string;
  name: string;
  originalFilename: string;
  slideCount: number;
  slides: string[];  // URLs relativas das PNGs (ex: "/api/media/file/abc123")
  createdAt: string;
}

interface Notice {
  id: string;
  title: string;
  body: string;
  saved: boolean;  // true se aviso recorrente salvo no banco
}

interface CreateNoticeInput {
  title: string;
  body: string;
  save?: boolean;
}

interface MediaFile {
  id: string;
  type: "image" | "video" | "background";
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface VideoCommand {
  action: "play" | "pause" | "seek";
  url: string;
  timestamp: number;
}

interface BackgroundConfig {
  type: "image" | "video" | "color" | "gradient";
  value: string;  // URL do arquivo, hex color, ou CSS gradient
}
```

### Novos eventos WebSocket

```typescript
// Adicionar ao ServerToClientEvents
"content:slide": (data: { slideSet: SlideSet; currentIndex: number }) => void;
"content:image": (data: { url: string; filename: string }) => void;
"content:video": (data: VideoCommand) => void;
"content:notice": (data: { title: string; body: string }) => void;
"background:change": (data: BackgroundConfig) => void;
```

## Rotas HTTP

```
POST   /api/media/upload       <- Upload de arquivo (multipart/form-data, campo "file" + "type")
GET    /api/media?type=image   <- Lista arquivos filtrados por tipo
DELETE /api/media/:id          <- Remove arquivo do banco e do disco
GET    /api/media/file/:id     <- Serve arquivo estatico (imagem, video, background)

POST   /api/slides/import      <- Upload de PPTX, converte pra PNGs, retorna SlideSet
GET    /api/slides              <- Lista todos os slide sets
GET    /api/slides/:id          <- Retorna slide set com URLs dos slides
DELETE /api/slides/:id          <- Remove slide set e PNGs do disco

POST   /api/notices             <- Cria aviso (salvo ou efemero)
GET    /api/notices             <- Lista avisos salvos
DELETE /api/notices/:id         <- Remove aviso salvo
```

## Migracao de Banco (002)

```sql
CREATE TABLE media_files (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'image', 'video', 'background'
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE slide_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE slide_set_slides (
  id TEXT PRIMARY KEY,
  slide_set_id TEXT NOT NULL REFERENCES slide_sets(id) ON DELETE CASCADE,
  media_file_id TEXT NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  UNIQUE(slide_set_id, "order")
);

CREATE TABLE notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## UI no Desktop

### Sidebar

Adicionar item "Midia" entre "Biblia" e "Telas":
```
Dashboard
Letras
Biblia
Midia     <- novo
Telas
```

### Pagina de Midia

Tabs: **Slides** | **Imagens** | **Videos** | **Avisos** | **Backgrounds**

**Tab Slides:**
- Botao "Importar PPTX" (abre file picker)
- Grid de slide sets (thumbnail do primeiro slide + nome)
- Clicar num slide set abre o presenter de slides (similar ao LyricsPresenter)
- Slide presenter: grid de thumbnails clicaveis, Page Down/Up navega

**Tab Imagens:**
- Botao "Importar" + area de drag & drop
- Grid de thumbnails
- Clicar numa imagem projeta ela

**Tab Videos:**
- Botao "Importar"
- Lista de videos com thumbnail + duracao
- Clicar abre player com controles (play, pause, seek)
- Botao "Projetar" envia o video pras telas

**Tab Avisos:**
- Formulario: titulo + corpo
- Botao "Enviar" (efemero) e "Salvar e Enviar" (persiste)
- Lista de avisos salvos (reutilizaveis)

**Tab Backgrounds:**
- Grid de backgrounds inclusos + importados
- Seletor de cor solida (color picker)
- Campo de gradiente CSS
- Clicar aplica o background em todas as telas

### Presentation Slice (atualizacao)

Adicionar ao Redux state:
```typescript
interface PresentationState {
  // existentes...
  currentSlideSet: SlideSet | null;
  currentSlideIndex: number;
  currentImage: string | null;
  currentVideo: VideoCommand | null;
  currentNotice: Notice | null;
  background: BackgroundConfig | null;
}
```
