# Joel Barber — Site Oficial (`joelbarbershop`)

Site institucional e plataforma de pré-agendamento da **Joel Barber**, localizada na **R. 11, 413 - Cidade Nova, Manaus - AM, CEP 69099-447**.

## Funcionalidades

- **Design Minimalista em Preto Fosco:** Layout responsivo (mobile, tablet e desktop) com barra superior de navegação por tópicos e atalhos rápidos.
- **Tabela de Serviços & Simulador de Agendamento:** Catálogo com os 15 serviços oficiais, filtro por categoria e envio direto do resumo para o WhatsApp (`+55 92 8481-9171`) ou agendamento via [CashBarber](https://cashbarber.com.br/joelbarber).
- **Clube de Assinatura Mensal:** Apresentação dos 4 planos recorrentes oficiais.
- **Loop Contínuo de Avaliações do Google:** Faixa animada com pausa automática fora da tela para economia de bateria/CPU.
- **Segurança (AppSec Hardened):**
  - Cabeçalhos HTTP rigorosos (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` e `HSTS`) pré-configurados em `vercel.json`, `netlify.toml` e `.htaccess`.
  - Formulário de contato protegido com sanitização anti-XSS, *Honeypot*, *Time-Trap* e *Rate Limiting* (cliente + endpoint Serverless `api/contact.js`).

## Estrutura de Arquivos

```text
├── assets/
│   └── logo-joel-barber.png   # Logo e ícone oficial (Favicon)
├── api/
│   └── contact.js             # Endpoint Serverless protegido (Rate Limit + Anti-Bot)
├── index.html                 # Página principal
├── style.css                  # Estilização responsiva e animações otimizadas
├── script.js                  # Lógica de catálogo, simulador WhatsApp e segurança
├── vercel.json                # Configuração de Security Headers para Vercel
├── netlify.toml               # Configuração de Security Headers para Netlify
├── .htaccess                  # Configuração de Security Headers para Apache/Hostinger
└── .env.example               # Modelo de variáveis de ambiente
```

## Como Publicar (GitHub Pages / Vercel / Netlify)

1. Suba os arquivos deste repositório para `joelbarbershop` no GitHub.
2. Para **GitHub Pages**: acesse **Settings > Pages**, selecione a branch `main` (pasta `/root`) e clique em **Save**.
3. Para **Vercel** ou **Netlify**: importe o repositório `joelbarbershop` e o deploy será automático com todos os cabeçalhos de segurança ativos.
