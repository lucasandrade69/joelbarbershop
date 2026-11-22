# Joel Barber — Site oficial

Site estático (HTML + CSS + JS puro, sem build e sem dependências) da **Joel Barber** — R. 11, 413 · Cidade Nova, Manaus-AM · WhatsApp +55 92 8481-9171.
Publicado no **GitHub Pages**: https://lucasandrade69.github.io/joelbarbershop/

## Estrutura

```text
index.html        Página única (SEO, Schema.org BarberShop, conteúdo)
style.css         Estilos (variáveis em :root; breakpoints 640 / 960 / 1100 px)
script.js         Serviços + simulador de reserva, carrossel, lightbox, formulário, menu, status "aberto agora"
assets/           Logo e ícones
img/              Fotografias reais da barbearia (portfólio)
favicon.ico · sitemap.xml · robots.txt · .nojekyll
tests/            smoke.html (testes), frame.html (screenshots em largura exata), serve.ps1
docs/             RELATORIO.md e docs/screenshots/
api/ vercel.json netlify.toml .htaccess .env.example   Opcionais; NÃO são usados no GitHub Pages
```

## Publicar
Settings → Pages → branch `main`, pasta `/ (root)`. Todos os caminhos são relativos (o site vive em `/joelbarbershop/`).
`robots.txt`/`sitemap.xml` só são lidos por buscadores na raiz do domínio; em site de projeto no GitHub Pages, envie o sitemap pelo Google Search Console.

## Manutenção — onde editar
| O quê | Onde |
|---|---|
| Serviços e preços (simulador) | `SERVICES_DATA` em `script.js` |
| Telefone / links | `PUBLIC_CONFIG` em `script.js` **e** os `href` de `index.html` (buscar `559284819171`) |
| Planos do clube | seção `#planos` do `index.html` |
| Avaliações | `<li class="review-card">` em `#avaliacoes`. Use só avaliações reais do Google; nunca duplique cards |
| Fotos do portfólio | arquivos em `img/` e cards em `#estilos` (`src`, `data-full`, `alt`, `data-caption`, `width`/`height` e classe de enquadramento) |
| Horário | `#contato`, `updateLiveHoursStatus()` e JSON-LD no `<head>` |
| Formulário via servidor | `PUBLIC_CONFIG.contactApiUrl` (vazio = abre o WhatsApp; padrão no GitHub Pages) |

Fotos novas: salve em `assets/images/` (`portfolio/`, `barbearia/`, `equipe/`, `hero/`), em WebP (~800 px e ~1400 px), com `width`/`height` e `loading="lazy"` (exceto a imagem do hero).

## Testes locais
Sirva a pasta com qualquer servidor HTTP estático e abra `/tests/smoke.html`, ou:
`chrome --headless --dump-dom --virtual-time-budget=40000 http://localhost:8765/tests/smoke.html`.
Valida em 6 resoluções: overflow, botões < 40 px, carrossel, lightbox, simulador/WhatsApp, menu, IDs duplicados, telefone.
Screenshots em largura exata: `/tests/frame.html?w=390&h=844`.

## Pendências de conteúdo
Ver `docs/RELATORIO.md`.
