'use strict';

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

const semAcento = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function detectarCategoria(tipo, texto) {
  const palavras = semAcento(texto).split(/[^a-z0-9]+/).filter(Boolean);
  for (const [cat, chaves] of Object.entries(CATEGORIAS[tipo])) {
    if (palavras.some(p => chaves.some(c => p.startsWith(c)))) return cat;
  }
  return PADRAO;
}

/* ---------- DADOS (ficam no aparelho, em localStorage) ---------- */
const CHAVE = 'meu-dia-lancamentos';
let lancamentos = [];
try { lancamentos = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { lancamentos = []; }
const salvar = () => localStorage.setItem(CHAVE, JSON.stringify(lancamentos));

/* ---------- UTILITÁRIOS ---------- */
const $ = id => document.getElementById(id);
const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function dataLocal(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}
function paraNumero(txt) {
  let s = txt.trim().replace(/[R$\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.abs(n);
}
const soma = (lista, tipo) => lista.filter(l => l.tipo === tipo).reduce((t, l) => t + l.valor, 0);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- TELA HOJE ---------- */
function renderHoje() {
  const hoje = dataLocal();
  const itens = lancamentos.filter(l => l.data === hoje).sort((a, b) => b.ts - a.ts);
  const ganho = soma(itens, 'ganho');
  const gasto = soma(itens, 'gasto');
  const saldo = ganho - gasto;

  $('dataHoje').textContent = new Date().toLocaleDateString('pt-BR',
    { weekday: 'long', day: 'numeric', month: 'long' });
  $('saldoHoje').textContent = brl(saldo);
  $('totalGanho').textContent = brl(ganho);
  $('totalGasto').textContent = brl(gasto);
  $('saldoCard').className = 'saldo-card ' + (saldo > 0 ? 'positivo' : saldo < 0 ? 'negativo' : '');

  $('vazio').style.display = itens.length ? 'none' : 'block';
  $('lista').innerHTML = itens.map(l => {
    const opcoes = [...Object.keys(CATEGORIAS[l.tipo]), PADRAO]
      .map(c => `<option ${c === l.cat ? 'selected' : ''}>${c}</option>`).join('');
    const hora = new Date(l.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `<li class="item">
      <span class="desc">${esc(l.desc || l.cat)}</span>
      <span class="v ${l.tipo === 'ganho' ? 'entrou' : 'saiu'}">${l.tipo === 'ganho' ? '+' : '−'} ${brl(l.valor)}</span>
      <span class="meta">${hora} · <select data-cat="${l.id}">${opcoes}</select></span>
      <button class="del" data-del="${l.id}">apagar</button>
    </li>`;
  }).join('');
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const tipo = e.submitter && e.submitter.dataset.tipo;
  const valor = paraNumero($('valor').value);
  if (!tipo || !valor) { $('valor').focus(); return; }
  const desc = $('desc').value.trim();
  lancamentos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    tipo, valor, desc,
    cat: detectarCategoria(tipo, desc),
    data: dataLocal(),
    ts: Date.now()
  });
  salvar();
  $('form').reset();
  renderHoje();
  $('valor').focus();
});

$('lista').addEventListener('click', e => {
  const id = e.target.dataset.del;
  if (id && confirm('Apagar este lançamento?')) {
    lancamentos = lancamentos.filter(l => l.id !== id);
    salvar(); renderHoje();
  }
});
$('lista').addEventListener('change', e => {
  const id = e.target.dataset.cat;
  if (!id) return;
  const l = lancamentos.find(x => x.id === id);
  if (l) { l.cat = e.target.value; salvar(); }
});

/* ---------- TELA RELATÓRIOS ---------- */
let periodo = '7';

function filtrarPeriodo() {
  const hoje = new Date();
  const hojeStr = dataLocal(hoje);
  if (periodo === 'hoje') return lancamentos.filter(l => l.data === hojeStr);
  if (periodo === 'mes') return lancamentos.filter(l => l.data.slice(0, 7) === hojeStr.slice(0, 7));
  if (periodo === '7') {
    const ini = new Date(hoje); ini.setDate(ini.getDate() - 6);
    const iniStr = dataLocal(ini);
    return lancamentos.filter(l => l.data >= iniStr && l.data <= hojeStr);
  }
  return lancamentos;
}

function barras(lista, tipo, classe) {
  const total = soma(lista, tipo);
  const porCat = {};
  lista.filter(l => l.tipo === tipo).forEach(l => { porCat[l.cat] = (porCat[l.cat] || 0) + l.valor; });
  const linhas = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  if (!linhas.length) return '<p class="vazio">Sem dados no período.</p>';
  return linhas.map(([cat, v]) => `<div class="barra">
    <div class="topo"><span>${cat}</span><span>${brl(v)} · ${Math.round(v / total * 100)}%</span></div>
    <div class="fundo"><div class="cheio ${classe}" style="width:${v / total * 100}%"></div></div>
  </div>`).join('');
}

function renderRelatorios() {
  const lista = filtrarPeriodo();
  const ganho = soma(lista, 'ganho');
  const gasto = soma(lista, 'gasto');
  const saldo = ganho - gasto;

  $('rGanho').textContent = brl(ganho);
  $('rGasto').textContent = brl(gasto);
  $('rSaldo').textContent = brl(saldo);
  $('rSaldo').className = saldo >= 0 ? 'entrou' : 'saiu';
  $('rCatGasto').innerHTML = barras(lista, 'gasto', 'g');
  $('rCatGanho').innerHTML = barras(lista, 'ganho', 'r');

  const dias = {};
  lista.forEach(l => { dias[l.data] = (dias[l.data] || 0) + (l.tipo === 'ganho' ? l.valor : -l.valor); });
  const ordenados = Object.entries(dias).sort((a, b) => b[0].localeCompare(a[0]));
  $('rDias').innerHTML = ordenados.length ? ordenados.map(([d, v]) => {
    const [a, m, dia] = d.split('-');
    return `<li class="item"><span class="desc">${dia}/${m}/${a}</span>
      <span class="v ${v >= 0 ? 'entrou' : 'saiu'}">${brl(v)}</span></li>`;
  }).join('') : '<p class="vazio">Sem dados no período.</p>';
}

$('periodos').addEventListener('click', e => {
  const p = e.target.dataset.p;
  if (!p) return;
  periodo = p;
  document.querySelectorAll('#periodos button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  renderRelatorios();
});

/* ---------- BACKUP ---------- */
$('exportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(lancamentos, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `meu-dia-backup-${dataLocal()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importar').addEventListener('change', e => {
  const arq = e.target.files[0];
  if (!arq) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(leitor.result);
      if (!Array.isArray(dados)) throw new Error();
      if (confirm(`Importar ${dados.length} lançamentos? Isso substitui os atuais.`)) {
        lancamentos = dados; salvar(); renderHoje(); renderRelatorios();
      }
    } catch (err) { alert('Arquivo inválido.'); }
  };
  leitor.readAsText(arq);
});

/* ---------- NAVEGAÇÃO ---------- */
document.querySelector('nav').addEventListener('click', e => {
  const v = e.target.dataset.view;
  if (!v) return;
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'relatorios') renderRelatorios(); else renderHoje();
  window.scrollTo(0, 0);
});

/* Ao voltar pro app (virou o dia, por exemplo), atualiza o saldo */
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHoje(); });

renderHoje();

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
