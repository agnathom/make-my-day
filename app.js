'use strict';

/* =========================================================
   MAKE MY DAY — app 100% no aparelho (sem servidor, sem login)
   Os dados ficam no localStorage, na mesma chave da versão anterior.
   ========================================================= */

/* ---------- CATEGORIAS AUTOMÁTICAS ----------
   O app olha as palavras da descrição. Se alguma palavra COMEÇAR com
   uma das chaves abaixo, a categoria é essa. Edite à vontade! */
const CATEGORIAS = {
  gasto: {
    'Alimentação': ['cafe', 'almoc', 'janta', 'lanche', 'mercado', 'pizza', 'padaria', 'comida', 'refri',
                    'restaurante', 'marmita', 'pao', 'hamburg', 'salgado', 'sorvete'],
    'Transporte': ['abast', 'gasolina', 'combust', 'uber', 'oleo', 'moto', 'pedagio', 'estacion', 'pneu',
                   'manutenc', 'mecanic'],
    'Insumos Bar': ['cerveja', 'gelo', 'carvao', 'bebida', 'insumo', 'fornecedor', 'atacad', 'carne',
                    'embalag', 'chopp', 'destilado'],
    'Tatuagem': ['agulha', 'tinta', 'tattoo', 'tatuagem', 'luva', 'filme', 'grafite', 'vaselina'],
    'Casa': ['aluguel', 'luz', 'energia', 'internet', 'gas', 'condominio', 'casa'],
    'Saúde': ['farmacia', 'remedio', 'medico', 'dentista', 'exame'],
    'Lazer': ['cinema', 'balada', 'jogo', 'festa', 'presente', 'viagem'],
    'Taxas': ['taxa', 'imposto', 'mei', 'das', 'multa', 'tarifa', 'juros']
  },
  ganho: {
    'Tatuagem': ['tattoo', 'tatuagem', 'sessao', 'tatu', 'flash', 'sinal'],
    'Entregas': ['entrega', 'corrida', 'frete', 'ifood', '99', 'delivery'],
    'Bar': ['bar', 'mesa', 'comanda', 'caixa', 'balcao', 'toma'],
    'Vendas': ['venda', 'vendi', 'produto', 'encomenda', 'cliente']
  }
};
const PADRAO = 'Outros';

const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function detectarCategoria(tipo, texto) {
  const palavras = semAcento(texto).split(/[^a-z0-9]+/).filter(Boolean);
  for (const [cat, chaves] of Object.entries(CATEGORIAS[tipo])) {
    if (palavras.some(p => chaves.some(c => p.startsWith(c)))) return cat;
  }
  return PADRAO;
}

/* ---------- CORES DAS BARRAS (tons alternados) ---------- */
const TONS_GANHO = ['#2eff6a', '#17b84a', '#86ffa8', '#0f8a37'];
const TONS_GASTO = ['#ff4b1f', '#c93610', '#ff8a66', '#992a0c'];

/* ---------- RABISCOS (kit) ---------- */
const D = {
  sparkle: '<path d="M50 4Q52 42 96 50Q52 58 50 96Q48 58 4 50Q48 42 50 4Z" fill="currentColor" stroke="none"/>',
  burst: '<polygon points="50,4 58,30 86,14 70,40 96,50 70,60 84,88 56,70 50,96 42,70 14,86 30,60 4,50 30,40 14,12 42,30"/>',
  spiral: '<path d="M50 50a4 4 0 1 1 8 0a10 10 0 1 1 -20 0a18 18 0 1 1 36 0a26 26 0 1 1 -52 0a34 34 0 1 1 68 0"/>',
  wave: '<path d="M4 38Q16 18 28 38T52 38T76 38T100 38M4 62Q16 42 28 62T52 62T76 62T100 62"/>',
  eye: '<path d="M4 50Q50 8 96 50Q50 92 4 50Z"/><circle cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="5" fill="currentColor"/><path d="M50 20V30M50 70V80M24 28L31 36M76 28L69 36" stroke="#ff4b1f" stroke-width="3.5"/>',
  fantasma: '<path d="M20 90V46Q20 12 50 12T80 46V90L67 80L55 90L43 80L31 90Z"/><circle cx="40" cy="44" r="4" fill="currentColor"/><circle cx="60" cy="44" r="4" fill="currentColor"/>'
};
const rab = (k, sw = 2.5) =>
  `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${D[k]}</svg>`;

const CAPAS = [
  () => '<svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true">' +
        '<ellipse cx="120" cy="18" rx="72" ry="9"/>' +
        '<path d="M0 30H240M0 52H240M0 80H240M0 114H240M120 18L-90 150M120 18L-20 150M120 18L40 150M120 18L120 150M120 18L200 150M120 18L260 150M120 18L330 150"/></svg>',
  ...['spiral', 'burst', 'wave', 'eye', 'fantasma'].map(k => () => `<div class="arte-big">${rab(k, 1.6)}</div>`)
];

/* ---------- UTILITÁRIOS ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduzido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } }
};

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const arred = n => Math.round(n * 100) / 100;
const money = n => (n < 0 ? '−' : '') + fmt.format(Math.abs(n));

function dataLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function paraNumero(txt) {
  let s = String(txt).trim().replace(/[R$\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? null : n;
}
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const soma = (lista, tipo) => arred(lista.filter(l => l.tipo === tipo).reduce((t, l) => t + l.valor, 0));
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/* ---------- DADOS (ficam no aparelho; mesma chave da versão anterior) ---------- */
const CHAVE = 'meu-dia-lancamentos';

function limpar(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(l => l && (l.tipo === 'gasto' || l.tipo === 'ganho') && Number(l.valor) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(l.data)))
    .map(l => ({
      id: l.id ? String(l.id) : novoId(),
      tipo: l.tipo,
      valor: Number(l.valor),
      desc: String(l.desc || '').slice(0, 120),
      cat: String(l.cat || PADRAO).slice(0, 40),
      data: String(l.data),
      ts: Number(l.ts) || Date.now()
    }));
}
let lancamentos = [];
try { lancamentos = limpar(JSON.parse(ls.get(CHAVE))); } catch (e) { lancamentos = []; }
const salvar = () => ls.set(CHAVE, JSON.stringify(lancamentos));

let periodo = '7';
let oculto = ls.get('mmd-oculto') === '1';
let ultimoApagado = null;

/* ---------- TOAST ---------- */
let toastTimer;
function toast(msg, acao, fn) {
  const t = $('toast');
  t.innerHTML = esc(msg) + (acao ? `<button id="toastAcao">${esc(acao)}</button>` : '');
  t.classList.add('on');
  if (acao) $('toastAcao').onclick = () => { t.classList.remove('on'); fn(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), acao ? 5000 : 3000);
}

/* ---------- NAVEGAÇÃO ---------- */
function irPara(v) {
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.id === 'view-' + v));
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'hoje') renderHoje();
  if (v === 'relatorios') renderRelatorios();
  window.scrollTo(0, 0);
}
$('tabs').addEventListener('click', e => { if (e.target.dataset.view) irPara(e.target.dataset.view); });

/* ---------- HOJE ---------- */
let visorAtual = 0;
let anim;
const dinheiro = n => (oculto ? 'R$ ••••' : money(n));

function capaIndex() {
  const d = new Date();
  const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return (dia + (parseInt(ls.get('mmd-capa'), 10) || 0)) % CAPAS.length;
}
function renderCapa() {
  $('capaArte').innerHTML = CAPAS[capaIndex()]();
  ['spk1', 'spk2', 'spk3'].forEach(id => { $(id).innerHTML = rab('sparkle'); });
  $('olho').innerHTML = rab('eye');
  $('olho').classList.toggle('off', oculto);
  $('olho').setAttribute('aria-pressed', oculto ? 'true' : 'false');
  $('vazioArte').innerHTML = rab('fantasma', 2);
}
$('trocarCapa').addEventListener('click', () => {
  ls.set('mmd-capa', String((parseInt(ls.get('mmd-capa'), 10) || 0) + 1));
  renderCapa();
});
$('olho').addEventListener('click', () => {
  oculto = !oculto;
  ls.set('mmd-oculto', oculto ? '1' : '0');
  $('olho').classList.toggle('off', oculto);
  $('olho').setAttribute('aria-pressed', oculto ? 'true' : 'false');
  renderHoje();
});

function animarVisor(alvo) {
  const el = $('saldoHoje');
  cancelAnimationFrame(anim);
  el.classList.toggle('neg-v', alvo < 0 && !oculto);
  if (oculto || reduzido || visorAtual === alvo) {
    el.textContent = dinheiro(alvo);
    visorAtual = alvo;
    return;
  }
  const ini = visorAtual, t0 = performance.now(), dur = 500;
  const passo = t => {
    const k = Math.min(1, (t - t0) / dur);
    const v = ini + (alvo - ini) * (1 - Math.pow(1 - k, 3));
    el.textContent = money(arred(v));
    if (k < 1) anim = requestAnimationFrame(passo);
    else { visorAtual = alvo; el.textContent = money(alvo); }
  };
  anim = requestAnimationFrame(passo);
}

function piscar() {
  const s = $('spk1');
  s.classList.remove('bate');
  void s.offsetWidth;
  s.classList.add('bate');
  setTimeout(() => s.classList.remove('bate'), 520);
}

function renderHoje() {
  const hoje = dataLocal();
  const itens = lancamentos.filter(l => l.data === hoje).sort((a, b) => b.ts - a.ts);
  const ganho = soma(itens, 'ganho');
  const gasto = soma(itens, 'gasto');
  const d = new Date();
  $('dataHoje').textContent = `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  $('totalGanho').textContent = dinheiro(ganho);
  $('totalGasto').textContent = dinheiro(gasto);
  animarVisor(arred(ganho - gasto));

  $('vazio').hidden = itens.length > 0;
  $('lista').innerHTML = itens.map(l => {
    const nomes = [...Object.keys(CATEGORIAS[l.tipo]), PADRAO];
    if (!nomes.includes(l.cat)) nomes.push(l.cat);
    const opcoes = nomes.map(c => `<option ${c === l.cat ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const hora = new Date(l.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const sinal = l.tipo === 'ganho' ? '+' : '−';
    return `<li class="item">
      <div class="l1"><span class="desc">${esc((l.desc || l.cat).toLowerCase())}</span>
        <span class="v ${l.tipo === 'ganho' ? 'pos' : 'neg'}">${sinal} ${oculto ? 'R$ ••••' : fmt.format(l.valor)}</span></div>
      <div class="l2"><span>${hora}</span><select data-cat="${esc(l.id)}" aria-label="categoria">${opcoes}</select>
        <button class="lnk" data-del="${esc(l.id)}">apagar</button></div>
    </li>`;
  }).join('');
}

function lancar(tipo) {
  const erro = $('erroLanc');
  erro.textContent = '';
  const valor = paraNumero($('valor').value);
  if (!valor) { erro.textContent = 'digite um valor maior que zero'; $('valor').focus(); return; }
  const desc = $('desc').value.trim();
  lancamentos.push({
    id: novoId(), tipo, valor, desc,
    cat: detectarCategoria(tipo, desc),
    data: dataLocal(), ts: Date.now()
  });
  salvar();
  $('form').reset();
  renderHoje();
  piscar();
  if (navigator.vibrate) navigator.vibrate(20);
  $('valor').focus();
}
$('btnGasto').addEventListener('click', () => lancar('gasto'));
$('btnGanho').addEventListener('click', () => lancar('ganho'));
$('form').addEventListener('submit', e => e.preventDefault());

$('lista').addEventListener('click', e => {
  const id = e.target.dataset.del;
  if (!id) return;
  const alvo = lancamentos.find(l => l.id === id);
  if (!alvo) return;
  lancamentos = lancamentos.filter(l => l.id !== id);
  salvar();
  renderHoje();
  ultimoApagado = alvo;
  toast('lançamento apagado', 'desfazer', () => {
    if (ultimoApagado) { lancamentos.push(ultimoApagado); ultimoApagado = null; salvar(); renderHoje(); }
  });
});
$('lista').addEventListener('change', e => {
  const id = e.target.dataset.cat;
  if (!id) return;
  const l = lancamentos.find(x => x.id === id);
  if (l) { l.cat = e.target.value; salvar(); }
});

/* ---------- RELATÓRIOS ---------- */
function filtrarPeriodo() {
  const hoje = new Date();
  const hojeStr = dataLocal(hoje);
  if (periodo === 'hoje') return lancamentos.filter(l => l.data === hojeStr);
  if (periodo === 'mes') return lancamentos.filter(l => l.data.slice(0, 7) === hojeStr.slice(0, 7));
  if (periodo === '7') {
    const ini = new Date(hoje);
    ini.setDate(ini.getDate() - 6);
    const iniStr = dataLocal(ini);
    return lancamentos.filter(l => l.data >= iniStr && l.data <= hojeStr);
  }
  return lancamentos;
}

function barras(lista, tipo, tons) {
  const total = soma(lista, tipo);
  const porCat = {};
  lista.filter(l => l.tipo === tipo).forEach(l => { porCat[l.cat] = (porCat[l.cat] || 0) + l.valor; });
  const linhas = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  if (!linhas.length) return '<p class="nota mono">sem dados no período.</p>';
  return linhas.map(([cat, v], i) => {
    const pct = total ? v / total * 100 : 0;
    return `<div class="lb"><span>${esc(cat.toLowerCase())}</span><span>${Math.round(pct)}% · ${money(arred(v))}</span></div>
      <div class="bar"><i style="width:${Math.max(pct, 2)}%;background:${tons[i % tons.length]}"></i></div>`;
  }).join('');
}

function renderRelatorios() {
  const lista = filtrarPeriodo();
  const ganho = soma(lista, 'ganho');
  const gasto = soma(lista, 'gasto');
  $('rGanho').textContent = money(ganho);
  $('rGasto').textContent = money(gasto);
  $('rSaldo').textContent = money(arred(ganho - gasto));
  $('rCatGasto').innerHTML = barras(lista, 'gasto', TONS_GASTO);
  $('rCatGanho').innerHTML = barras(lista, 'ganho', TONS_GANHO);
  $('burst').innerHTML = rab('burst', 1.6);

  const dias = {};
  lista.forEach(l => {
    const x = dias[l.data] || (dias[l.data] = { ganho: 0, gasto: 0 });
    x[l.tipo] += l.valor;
  });
  const asc = Object.keys(dias).sort();
  const leg = document.querySelector('.leg');
  if (!asc.length) {
    $('rCols').innerHTML = '<p class="nota mono">sem dados no período.</p>';
    $('rDias').innerHTML = '';
    leg.hidden = true;
    return;
  }
  leg.hidden = false;
  const ult = asc.slice(-14);
  const max = Math.max(...ult.map(d => Math.max(dias[d].ganho, dias[d].gasto)), 1);
  const alt = v => (v > 0 ? Math.max(4, v / max * 100) : 0);
  $('rCols').innerHTML = '<div class="cols">' + ult.map(d => {
    const [, m, dd] = d.split('-');
    const x = dias[d];
    return `<div class="col"><div class="pair">
      <i class="g" style="height:${alt(x.ganho)}%;${x.ganho ? '' : 'visibility:hidden'}"></i>
      <i class="o" style="height:${alt(x.gasto)}%;${x.gasto ? '' : 'visibility:hidden'}"></i>
    </div><small>${dd}/${m}</small></div>`;
  }).join('') + '</div>';

  $('rDias').innerHTML = asc.slice().reverse().slice(0, 31).map(d => {
    const [a, m, dd] = d.split('-');
    const v = arred(dias[d].ganho - dias[d].gasto);
    const sem = DIAS[new Date(+a, +m - 1, +dd).getDay()];
    return `<li class="item"><div class="l1"><span class="desc">${dd}/${m}/${a} <small class="mono">${sem}</small></span>
      <span class="v ${v >= 0 ? 'pos' : 'neg'}">${money(v)}</span></div></li>`;
  }).join('');
}

$('periodos').addEventListener('click', e => {
  const p = e.target.dataset.p;
  if (!p) return;
  periodo = p;
  document.querySelectorAll('#periodos button').forEach(b => b.classList.toggle('a', b.dataset.p === p));
  renderRelatorios();
});

/* ---------- BACKUP ---------- */
$('exportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(lancamentos, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `make-my-day-backup-${dataLocal()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('importar').addEventListener('change', e => {
  const arq = e.target.files[0];
  e.target.value = '';
  if (!arq) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(leitor.result);
      const lista = Array.isArray(dados) ? dados : dados.lancamentos;
      if (!Array.isArray(lista)) throw new Error('arquivo inválido');
      const validos = limpar(lista);
      if (!confirm(`importar ${validos.length} lançamentos? isso substitui os lançamentos atuais.`)) return;
      lancamentos = validos;
      salvar();
      renderRelatorios();
      toast(`${validos.length} importados` + (lista.length > validos.length ? ` · ${lista.length - validos.length} ignorados` : ''));
    } catch (err) { toast('arquivo inválido'); }
  };
  leitor.readAsText(arq);
});

/* ---------- ao voltar para o app (virou o dia, por exemplo), atualiza ---------- */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if ($('view-hoje').classList.contains('on')) renderHoje();
  if ($('view-relatorios').classList.contains('on')) renderRelatorios();
});

/* ---------- início ---------- */
renderCapa();
renderHoje();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
