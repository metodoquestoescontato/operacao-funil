# Operação Funil — MVP PMPE

Funil conversacional estático, sem chatbot externo, banco de dados, IA ou checkout. O objetivo é qualificar interessados nas apostilas PMPE e encaminhá-los para atendimento humano pelo WhatsApp.

## Como testar
Abra `index.html` em um navegador moderno. Para servir os arquivos localmente, utilize `python -m http.server 8000` e visite `http://localhost:8000`.

## Configuração
Edite `config.js`:
- `whatsappNumber`: número comercial com DDI, DDD e número, apenas dígitos (ex.: `5582999999999`). Sem ele, o botão final fica desabilitado.
- `media.apostila1` e `media.apostila2`: URLs públicas de prints reais do produto. Sem elas, o funil funciona, mas não exibe imagens.
- `showPrice`: `false` por padrão, com fechamento no WhatsApp.
- `typingDelayMs`: controla os intervalos de digitação.

Não coloque chaves secretas, tokens ou dados de clientes no arquivo. Tudo aqui é público.

## Hospedagem grátis (Cloudflare Pages)
1. Acesse **Workers & Pages** no painel Cloudflare e crie um projeto Pages conectado ao GitHub.
2. Selecione este repositório e a branch `chatgpt/mvp-funil-pmpe` como branch inicial de teste (se disponível).
3. Como é um site estático, deixe o comando de build vazio e indique o diretório raiz `.` como saída.
4. Confira a prévia e configure número e prints antes de divulgar.

## Limitações atuais
- Sem número de WhatsApp, prints reais ou hospedagem configurados.
- Não há persistência de analytics. O app emite eventos `funil:event` para futura integração.
- Clique no WhatsApp não comprova envio de mensagem nem fechamento.
- O roteiro é automatizado e se identifica como tal.
- Não há cobrança, promessas de aprovação nem depoimentos fictícios.

## Isolamento
Este repositório é independente de `organizay-app`; nenhuma mudança naquele projeto é necessária.

## Publicação de teste
Branch de publicação: `chatgpt/mvp-funil-pmpe`. A publicação automática deve ser validada no painel do Cloudflare.
