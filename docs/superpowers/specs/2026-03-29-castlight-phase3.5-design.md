# Castlight Phase 3.5 — Client Screens

## Escopo

Implementar as telas clientes que dispositivos na rede acessam via browser. HTML/JS puro + Socket.IO client + Tailwind CDN. O sidecar serve os arquivos estaticos.

## Telas

| Rota | Papel | O que exibe |
|------|-------|-------------|
| `/` | Welcome | Pagina de boas-vindas, registro automatico via WebSocket |
| `/public` | Publico | Letra, versiculo, slide, imagem, video, aviso — visual limpo com background |
| `/stage` | Retorno | Letra atual + proximo trecho + tom + notas |
| `/stream` | Stream | Fullscreen + lower third, video com audio habilitado |
| `/monitor` | Monitor | Versiculo, avisos, info do culto |
| `/bible` | Biblia | Interface de busca/controle pra tablet do pastor |
| `/tech` | Tecnica | Status de conexoes, preview de todas as telas |

## Arquitetura

```
apps/sidecar/
└── public/
    ├── index.html          <- Welcome / registro
    ├── public.html         <- Tela publico
    ├── stage.html          <- Tela retorno
    ├── stream.html         <- Tela stream/OBS
    ├── monitor.html        <- Tela monitor/pastor
    ├── bible.html          <- Controle biblia (tablet)
    ├── tech.html           <- Tela tecnica
    ├── css/
    │   └── screen.css      <- Estilos compartilhados (fullscreen, animacoes)
    └── js/
        ├── socket-client.js <- Conexao WebSocket + fingerprint + registro
        ├── renderer.js      <- Renderizacao de conteudo (letra, versiculo, slide, etc)
        ├── public.js        <- Logica especifica da tela publica
        ├── stage.js         <- Logica especifica do retorno
        ├── stream.js        <- Logica especifica do stream
        ├── monitor.js       <- Logica especifica do monitor
        ├── bible.js         <- Logica especifica do controle de biblia
        └── tech.js          <- Logica especifica da tela tecnica
```

O sidecar serve a pasta `public/` como arquivos estaticos via Hono.

## Fluxo de Conexao

1. Dispositivo acessa `http://castlight.local/` (ou IP direto)
2. Welcome page carrega, gera fingerprint (hash do user-agent + resolucao + timestamp salvo em localStorage)
3. Conecta via Socket.IO, envia `screen:register` com fingerprint, user-agent, resolucao
4. Recebe `screen:registered` com info da tela (incluindo role se ja atribuida)
5. Se role ja atribuida, redireciona automaticamente pra rota correspondente
6. Se nao, mostra "Aguardando atribuicao..." ate o operador atribuir
7. Ao receber `screen:role-assigned`, redireciona pra rota

## Tela Publica (`/public`)

Layout fullscreen, sem scrollbar, sem UI chrome.

```
+------------------------------------------+
|                                          |
|             [BACKGROUND]                 |
|                                          |
|          Grande e o Senhor               |
|          E mui digno de louvor           |
|                                          |
|                                          |
+------------------------------------------+
```

Escuta eventos:
- `content:lyrics` -> exibe texto da secao centralizado
- `content:bible` -> exibe versiculo com referencia
- `content:slide` -> exibe imagem do slide fullscreen
- `content:image` -> exibe imagem fullscreen
- `content:video` -> reproduz video (SEM audio por padrao)
- `content:notice` -> exibe card de aviso
- `content:clear` -> volta pro background
- `background:change` -> muda background
- `screen:identify` -> pisca a tela

Transicoes: fade entre conteudos (CSS transition).

## Tela Retorno (`/stage`)

Layout dividido: conteudo atual em cima (grande), proximo trecho embaixo (menor).

```
+------------------------------------------+
| Tom: G                          2/4      |
|------------------------------------------|
|                                          |
|     Grande e o Senhor                    |
|     E mui digno de louvor        ATUAL   |
|                                          |
|------------------------------------------|
|     Na cidade do nosso Deus     PROXIMO  |
|     Seu santo monte                      |
+------------------------------------------+
```

Escuta os mesmos eventos, mas renderiza diferente:
- Mostra secao atual + proxima
- Mostra tom da musica
- Mostra posicao (ex: "2/4 secoes")
- Fundo escuro simples (sem backgrounds elaborados)

## Tela Stream (`/stream`)

Identica a publica mas com:
- Lower third (barra inferior com info contextual)
- Video com AUDIO HABILITADO (pra OBS Browser Source capturar)

Escuta evento adicional: `stream:lower-third`

## Tela Monitor (`/monitor`)

Layout informativo pro pastor:

```
+------------------------------------------+
| CASTLIGHT MONITOR                        |
|------------------------------------------|
| Versículo atual:                         |
| Joao 3:16 (ACF)                         |
| "Porque Deus amou o mundo..."           |
|------------------------------------------|
| Aviso:                                   |
| Culto especial sexta 19h                 |
|------------------------------------------|
| Status: 5 telas conectadas              |
+------------------------------------------+
```

## Tela Biblia (`/bible`)

Interface responsiva otimizada pra tablet. O pastor navega e envia versiculos.

```
+------------------------------------------+
| ACF v  | Genesis > Cap 1                 |
|------------------------------------------|
| 1 No principio criou Deus os ceus...    |
| 2 E a terra era sem forma e vazia...    |
| 3 E disse Deus: Haja luz...       [>>]  |
|------------------------------------------|
| Busca: [________________] [Buscar]       |
+------------------------------------------+
```

Ao tocar num versiculo, emite `bible:send` via WebSocket pro sidecar, que faz broadcast pras telas.

## Tela Tecnica (`/tech`)

Dashboard tecnico com status:
- Lista de telas conectadas e seus papeis
- Preview em miniatura de cada tela (via iframe ou screenshot)
- Status do sidecar (uptime, IP, porta)
- Status OBS

## Servindo Arquivos Estaticos

O sidecar Hono serve a pasta `public/` com:
```typescript
app.get("/", (c) => c.html(readFileSync("public/index.html", "utf-8")));
app.get("/public", (c) => c.html(readFileSync("public/public.html", "utf-8")));
// etc.
```

Ou usando `hono/serve-static` pra servir CSS/JS.

## Dependencias Client-Side (CDN)

- Socket.IO client: `https://cdn.socket.io/4.7.5/socket.io.min.js`
- Tailwind CSS: `https://cdn.tailwindcss.com`

Zero instalacao no cliente. Funciona offline se os CDNs forem cacheados ou embutidos.
