/* ==========================================================================
   Greda Dourada: comportamento do site
   Este arquivo cuida de quatro coisas:
     1. Idioma (português, inglês e espanhol)
     2. Modo noturno
     3. Preços dos cartões (individual / familiar, em CLP e R$)
     4. Menu para celular
   As traduções ficam em js/i18n.js (carregado antes deste arquivo).
   ========================================================================== */


/* ---------- 1. Configurações que você pode editar ---------- */

// Câmbio de referência: 1 BRL = 185,29 CLP (28/09/2026).
// Se mudar o valor, lembre de ajustar também os textos de preços nas páginas.
const CLP_POR_BRL = 185.29;

// Separadores de número em cada idioma: [milhar, decimal]
const SEPARADORES = {pt: ['.', ','], en: [',', '.'], es: ['.', ',']};

// Atributo lang do <html> para cada idioma
const HTML_LANG = {pt: 'pt-BR', en: 'en', es: 'es'};

// Textos que NÃO estão no HTML, e sim criados pelo JavaScript
// (legenda do formato nos cartões e rótulos de acessibilidade)
const UI = {
  pt: {
    formato: {ind: 'Individual · 450 g · 1 porção · 0 a 4 °C', fam: 'Familiar · 1,8 kg · 4 porções de 450 g · 0 a 4 °C'},
    menu: 'Abrir menu', idioma: 'Idioma', grupoFormato: 'Formato', tema: ['Modo noturno', 'Modo claro']
  },
  en: {
    formato: {ind: 'Single · 450 g · 1 serving · 0 to 4 °C', fam: 'Family · 1.8 kg · 4 servings of 450 g · 0 to 4 °C'},
    menu: 'Open menu', idioma: 'Language', grupoFormato: 'Format', tema: ['Dark mode', 'Light mode']
  },
  es: {
    formato: {ind: 'Individual · 450 g · 1 porción · 0 a 4 °C', fam: 'Familiar · 1,8 kg · 4 porciones de 450 g · 0 a 4 °C'},
    menu: 'Abrir menú', idioma: 'Idioma', grupoFormato: 'Formato', tema: ['Modo nocturno', 'Modo claro']
  }
};


/* ---------- 2. Funções de apoio ---------- */

// Guardar e ler preferências no navegador (idioma e tema).
// O try/catch evita erro quando o navegador bloqueia o armazenamento.
const memoria = {
  ler: chave => { try { return localStorage.getItem(chave); } catch (e) { return null; } },
  gravar: (chave, valor) => { try { localStorage.setItem(chave, valor); } catch (e) {} }
};

// Tira espaços e quebras de linha repetidos. Serve para comparar textos do HTML
// com as chaves do js/i18n.js, mesmo que o HTML esteja quebrado em várias linhas.
const normalizar = texto => texto.replace(/\s+/g, ' ').trim();

// Formata número no padrão do idioma: formatarNumero(29990, 0, 'pt') => "29.990"
function formatarNumero(n, decimais, idioma) {
  const [inteiro, decimal] = n.toFixed(decimais).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARADORES[idioma][0]);
  return decimal ? comMilhar + SEPARADORES[idioma][1] + decimal : comMilhar;
}


/* ---------- 3. Estado atual da página ---------- */

let idioma = memoria.ler('lang');          // idioma salvo (ou null na primeira visita)
if (!UI[idioma]) idioma = 'pt';            // padrão: português
let formato = 'ind';                       // formato mostrado nos cartões: 'ind' ou 'fam'


/* ---------- 4. Mapa dos textos traduzíveis ----------
   Ao abrir a página, o código percorre o HTML e guarda cada trecho de texto
   ("folha") junto com o original em português. Ao trocar de idioma, procura a
   tradução em js/i18n.js usando o texto em português como chave.
   Ficam de fora: preços, legenda do formato e ícones (SVG). */

const TAGS_NO_MEIO_DO_TEXTO = new Set(['B', 'STRONG', 'EM', 'BR', 'SMALL']); // podem aparecer dentro de um texto
const folhas = [];                                                            // lista de {el, pt}

document.body.querySelectorAll('*').forEach(el => {
  if (el.closest('svg') || el.tagName === 'SCRIPT') return;                   // ignora ícones e scripts
  if (el.matches('.price,[data-meta]')) return;                               // preços são feitos pelo JS
  if (el.parentElement && el.parentElement.closest('[data-i]')) return;       // já está dentro de uma folha
  if (!el.textContent.trim()) return;                                         // sem texto
  if ([...el.children].some(filho => !TAGS_NO_MEIO_DO_TEXTO.has(filho.tagName))) return; // tem blocos dentro: não é folha
  el.dataset.i = folhas.length;
  folhas.push({el, pt: normalizar(el.innerHTML)});
});

// Título da aba sem o " | Greda Dourada" (ex.: "Produtos")
const tituloDaPagina = document.title.split(' | ')[0];


/* ---------- 5. Atualização da tela ---------- */

// Preços e legenda de cada cartão de variedade, conforme formato e idioma.
// Os preços em CLP vêm do HTML (data-ind e data-fam); o R$ é calculado aqui.
function atualizarPrecos() {
  document.querySelectorAll('.toggle button').forEach(botao =>
    botao.classList.toggle('on', botao.dataset.fmt === formato));
  document.querySelectorAll('.card').forEach(cartao => {
    const clp = Number(cartao.dataset[formato]);
    cartao.querySelector('[data-clp]').textContent = 'CLP $' + formatarNumero(clp, 0, idioma);
    cartao.querySelector('[data-brl]').textContent = '≈ R$ ' + formatarNumero(clp / CLP_POR_BRL, 2, idioma);
    cartao.querySelector('[data-meta]').textContent = UI[idioma].formato[formato];
  });
}

// Textos de acessibilidade (aria-label) dos botões, no idioma e tema atuais
function atualizarRotulos() {
  const ui = UI[idioma];
  const noturno = document.documentElement.dataset.theme === 'dark';
  document.querySelector('.burger').setAttribute('aria-label', ui.menu);
  document.querySelector('.lang').setAttribute('aria-label', ui.idioma);
  const grupo = document.querySelector('.toggle');
  if (grupo) grupo.setAttribute('aria-label', ui.grupoFormato);
  const botaoTema = document.querySelector('.theme');
  botaoTema.setAttribute('aria-label', ui.tema[noturno ? 1 : 0]);
  botaoTema.title = ui.tema[noturno ? 1 : 0];
}

// Troca o idioma da página inteira ('pt', 'en' ou 'es')
function trocarIdioma(novo) {
  idioma = novo;
  memoria.gravar('lang', novo);
  const traducoes = (window.I18N && window.I18N[novo]) || {};        // dicionário do idioma (i18n.js)
  folhas.forEach(({el, pt}) => {
    el.innerHTML = novo === 'pt' ? pt : (traducoes[pt] || pt);       // sem tradução: mantém o português
  });
  document.documentElement.lang = HTML_LANG[novo];
  const titulo = novo === 'pt' ? tituloDaPagina : (traducoes[tituloDaPagina] || tituloDaPagina);
  document.title = titulo + ' | Greda Dourada';
  document.querySelectorAll('.lang button').forEach(botao =>
    botao.setAttribute('aria-pressed', botao.dataset.lang === novo));  // destaca o idioma ativo
  atualizarPrecos();
  atualizarRotulos();
}

// Troca entre modo claro e modo noturno ('light' ou 'dark')
function trocarTema(tema) {
  document.documentElement.dataset.theme = tema;   // o CSS reage a data-theme="dark"
  memoria.gravar('theme', tema);
  atualizarRotulos();
}


/* ---------- 6. Ligar os botões ---------- */

document.querySelectorAll('.lang button').forEach(botao =>
  botao.addEventListener('click', () => trocarIdioma(botao.dataset.lang)));

document.querySelector('.theme').addEventListener('click', () =>
  trocarTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

// Botões "Individual" e "Familiar" (só existem na página de produtos e na inicial)
document.querySelectorAll('.toggle button').forEach(botao =>
  botao.addEventListener('click', () => { formato = botao.dataset.fmt; atualizarPrecos(); }));

// Menu para celular: o botão com três riscos abre e fecha a lista de links
const botaoMenu = document.querySelector('.burger');
const menu = document.getElementById('nav');
botaoMenu.addEventListener('click', () =>
  botaoMenu.setAttribute('aria-expanded', menu.classList.toggle('open')));
menu.addEventListener('click', evento => {           // ao tocar em um link, fecha o menu
  if (evento.target.tagName === 'A') {
    menu.classList.remove('open');
    botaoMenu.setAttribute('aria-expanded', 'false');
  }
});

// Links internos entre páginas recebem uma saída suave antes da navegação.
document.addEventListener('click', evento => {
  const link = evento.target instanceof Element ? evento.target.closest('a[href]') : null;
  if (!link || evento.defaultPrevented || evento.button !== 0 || evento.metaKey ||
      evento.ctrlKey || evento.shiftKey || evento.altKey ||
      (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

  const destino = new URL(link.href, window.location.href);
  if (destino.origin !== window.location.origin || !/\.html?$/i.test(destino.pathname) ||
      (destino.pathname === window.location.pathname && destino.search === window.location.search)) return;

  evento.preventDefault();
  document.body.classList.add('page-leaving');
  const espera = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
  window.setTimeout(() => window.location.assign(destino.href), espera);
});


/* ---------- 7. Início ---------- */
trocarIdioma(idioma);   // aplica o idioma salvo (ou português) assim que a página carrega
