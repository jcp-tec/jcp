# Just Code People — Website (source)

Versão editável, em HTML/CSS/JS puro (sem build step), do site [justcodepeople.com](https://justcodepeople.com).

## Por que este projeto existe

O site publicado em produção é gerado por uma ferramenta no-code/IA (Hostinger Horizons) e entregue como um bundle Vite já minificado — ou seja, o HTML que o navegador carrega não é código-fonte legível/editável. Este repositório é uma **reconstrução fiel** do conteúdo e do visual do site (textos, seções, cores, tipografia e layout), escrita à mão em HTML, CSS e JavaScript simples, para que você possa editar, versionar e hospedar onde quiser.

Não é uma cópia "pixel-perfect" byte a byte do bundle original — é uma recriação organizada e comentada, pronta para manutenção contínua.

## Estrutura

```
jcp-site/
├── index.html          # Home
├── solutions.html       # Soluções
├── team.html            # Time / Equipe
├── about.html           # Sobre
├── talent.html          # Banco de talentos (candidatura; fora do menu de propósito)
├── contact.html          # Contato
├── assets/
│   ├── css/style.css    # Todo o design system (cores, tipografia, componentes)
│   ├── js/i18n.js       # Dicionário de traduções EN / PT-BR / DE
│   ├── js/main.js       # Tradutor, menu mobile, página ativa, formulário de contato
│   └── images/          # (vazio — ver "Imagens" abaixo)
└── README.md
```

## Imagens

As imagens usadas hoje (fotos de banco de imagens do Unsplash e as fotos da equipe) estão referenciadas por **URL externa**, exatamente como no site original:

- **Fotos da equipe:** já estão no repositório, em `assets/images/team/` (uma por executivo, nomeada pela pessoa). Foram baixadas do CDN da Hostinger e o `team.html` aponta para os arquivos locais — o site não depende mais daquele CDN.
- **Fotos de banco (Unsplash):** ainda são carregadas por URL externa (`images.unsplash.com`), no hero das páginas e em alguns blocos ilustrativos. Podem ser trocadas por outras de `unsplash.com` ou baixadas para `assets/images/` se você quiser o site 100% offline.

> Ao editar `team.html`, **não** acrescente `width`/`height` nas fotos da equipe: o CSS usa `aspect-ratio: 1/1` sem definir `height`, e esses atributos viram *presentational hints* que sobrepõem o recorte quadrado, esticando a imagem.

## Como rodar localmente

Não há build step. Basta abrir `index.html` no navegador, ou servir a pasta com qualquer servidor estático:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Depois acesse `http://localhost:8080`.

## Como subir para o GitHub

```bash
cd jcp-site
git init
git add .
git commit -m "Initial commit: recreated Just Code People website"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Troque `SEU-USUARIO/SEU-REPOSITORIO` pelo repositório que você criar no GitHub (crie um repositório vazio lá antes do `git push`, sem README/gitignore, para evitar conflitos).

## Publicar gratuitamente (GitHub Pages)

1. No repositório no GitHub, vá em **Settings → Pages**.
2. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
3. Salve — em alguns minutos o site estará no ar em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

## Idiomas (EN / PT-BR / DE)

O site é totalmente trilíngue. A troca acontece no navegador, sem recarregar a página:

- **Onde trocar:** no botão de idioma no topo (🇺🇸 EN ▾) ou nos rádios no rodapé — os dois ficam sempre sincronizados.
- **Persistência:** a escolha fica salva em `localStorage` e vale para todas as páginas.
- **Idioma inicial:** se o visitante nunca escolheu, o site usa o idioma do navegador (`pt*` → português, `de*` → alemão, qualquer outro → inglês).
- **SEO:** `<title>`, `<meta name="description">` e o atributo `<html lang>` também mudam junto.

### Como o tradutor funciona

`assets/js/i18n.js` é um dicionário indexado **pelo texto em inglês** que está no HTML. Ao carregar a página, `main.js` tira um retrato de todos os textos originais e depois só troca o que encontra no dicionário — por isso voltar para o inglês é sempre exato, e o HTML não precisa de atributos `data-i18n` espalhados.

**Para traduzir um texto novo:** escreva a página normalmente em inglês, depois adicione a frase como chave em `pt` e em `de` dentro de `i18n.js`:

```js
pt: {
  'Your new headline': 'Sua nova chamada',
},
de: {
  'Your new headline': 'Ihre neue Überschrift',
}
```

Nada mais é necessário. **Texto sem entrada no dicionário simplesmente continua em inglês** — nunca quebra a página.

O que fica de fora de propósito: nomes de pessoas, "Just Code People", CNPJ, e-mails, telefone e redes sociais.

**Para adicionar um quarto idioma:** acrescente uma entrada em `JCP_I18N.languages` (com `code`, `htmlLang`, `flag`, `short`, `label`) e um objeto com o código correspondente no mesmo arquivo.

## Formulário de contato

O formulário de `contact.html` valida os campos, tem proteção anti-spam (campo *honeypot* invisível) e mostra o retorno no idioma ativo.

**Como ele se comporta hoje**, sem nenhuma configuração: ao enviar, abre o aplicativo de e-mail do visitante com destinatário, assunto e mensagem já preenchidos. Funciona de imediato, mas depende de o visitante ter um cliente de e-mail configurado.

**Para receber os envios direto na caixa de entrada**, crie um formulário num serviço gratuito e cole a URL dele no topo de `assets/js/main.js`:

```js
const CONTACT_ENDPOINT = 'https://formspree.io/f/SEU-ID-AQUI';
```

Qualquer endpoint que aceite `POST` com JSON serve — [Formspree](https://formspree.io), [Basin](https://usebasin.com), ou uma função serverless sua. Com a URL preenchida, o envio passa a ser por `fetch`, sem sair da página: aparece "Enviando…", depois a confirmação em verde ou, se falhar, uma mensagem em vermelho **preservando o que a pessoa digitou**.

Se você publicar na Netlify, há ainda a opção nativa: adicione `data-netlify="true"` e `<input type="hidden" name="form-name" value="contact">` no `<form>` — aí a Netlify recebe os envios sem serviço externo nenhum.

O e-mail de destino do modo padrão fica em `CONTACT_EMAIL`, na mesma linha do arquivo.

## Banco de talentos (talent.html)

Página de candidatura, **de propósito fora da `.main-nav`**: o acesso é discreto, por três pontos de entrada: o convite em `team.html` e em `about.html` (`.talent-invite`, dentro da seção de liderança) e o balão flutuante "Join our team" (`.talent-float`), que fica no canto inferior esquerdo, em azul, na mesma linha do botão do WhatsApp (à direita), em todas as páginas, exceto na própria `talent.html`. O balão tem um tooltip que aparece uma vez por sessão, depois de 6 s, e o fechamento fica em `sessionStorage` (`jcp-talent-tip`).

**Fluxo:** cadastro rápido (nome, e-mail, telefone) -> `POST` no Web App do Google Apps Script -> redireciona para o WhatsApp do bot com `Código: XXXXXX`. O contrato do Web App está em `.claude/plans/integracao-web-app.md`.

### Configuração (ainda são placeholders)

Os dois valores ficam como atributos `data-*` no `<form id="talent-form">` de `talent.html`:

```html
<form id="talent-form" data-webapp-url="https://script.google.com/macros/s/AKfycbzsftp5ZGZJhptL2WDvY-yD0PwSW-3CMLIYH4BekkRLLjsut-XsKIcAHB88Xx_ogGdrwA/exec" data-bot-number="4915754436602">
```

- `data-webapp-url`: URL da implantação do Web App (termina em `/exec`).
- `data-bot-number`: número do bot no WhatsApp, só dígitos (DDI + DDD + número).

Enquanto qualquer um deles for placeholder (`REPLACE_ME` ou `5500000...`), o formulário não chama nada e mostra um aviso traduzido ("Applications are not open yet...").

**Nunca** coloque o `BOT_TOKEN` no site: ele vive só no servidor do bot.

### Detalhes do envio

- Corpo em JSON com `Content-Type: text/plain;charset=utf-8` (evita o preflight de CORS) e ação `cadastro`. O telefone é digitado no formato nacional e enviado como `+55` + dígitos (aceita DDD com 10 ou 11 dígitos; prefixo `+55`/`55` digitado é tolerado).
- Campo-isca `website` fora da tela (`.form-trap`, `tabindex="-1"`, `aria-hidden`); sempre enviado vazio.
- Confere `ok` na resposta (o HTTP costuma ser 200 mesmo com erro) e traduz `nome_invalido`, `email_invalido`, `telefone_invalido`, `consentimento`, `erro_interno` e falha de rede, no padrão `.form-status`.
- A mensagem pré-preenchida do WhatsApp segue o idioma ativo: `Olá! Quero me candidatar. Código: XXXXXX` (PT), `Hello! I want to apply. Code: XXXXXX` (EN), `Hallo! Ich möchte mich bewerben. Code: XXXXXX` (DE). **O bot precisa extrair o código de qualquer um dos três rótulos** (`Código:`, `Code:`), 6 caracteres depois dos dois-pontos.

### LGPD e política de privacidade

O checkbox de consentimento (obrigatório, nunca marcado por padrão) tem uma frase curta e um link azul "Learn more" que abre uma janela (`<dialog id="consent-dialog">`) com o detalhe: dados coletados, finalidade (avaliar a candidatura e entrar em contato sobre oportunidades) e o canal para pedir a remoção dos dados (`info@justcodepeople.com`). O site **ainda não tem página de política de privacidade**: recomenda-se publicar uma e linkar no texto do consentimento. Defina também, com o jurídico, por quanto tempo os dados ficam na planilha. Esse texto é um rascunho, não parecer jurídico.
