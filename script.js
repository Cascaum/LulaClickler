// Estado inicial do jogo
const estado = {
  dinheiro: 0,
  totalGanho: 0,
  multiplicadorRps: 1,
  efeitosAtivos: [],  // { nome, icone, multiplicador, tipo, terminaEm, duracaoTotal }
  aliados: {
    haddad: false,
    bolsonaro: false,
    janja: false,
  },
  velocidade2x: false,
  venceu: false,
};

// Upgrades disponíveis na loja
const UPGRADES = [
  { id: 'propina',      icone: '🤝', nome: 'Propina',                  desc: 'Um envelope discreto acelera as coisas.',                                              rpsBase: 0.5,  precoBase: 10,     quantidade: 0 },
  { id: 'horario',      icone: '📺', nome: 'Horário eleitoral',         desc: 'Convença o povo a pagar mais impostos, feliz.',                                        rpsBase: 2,    precoBase: 75,     quantidade: 0 },
  { id: 'frango',       icone: '🍗', nome: 'Imposto sobre alimentos',   desc: 'Taxar o básico: clássico e eficiente.',                                                rpsBase: 5,    precoBase: 250,    quantidade: 0 },
  { id: 'eletronicos',  icone: '💻', nome: 'Imposto sobre eletrônicos', desc: 'Celular é luxo, diz quem tem iPhone presidencial.',                                    rpsBase: 10,   precoBase: 800,    quantidade: 0 },
  { id: 'automovel',    icone: '🚗', nome: 'Imposto sobre automóveis',  desc: 'O automóvel é seu, mas não esqueça do licenciamento e do IPVA...',                    rpsBase: 20,   precoBase: 2000,   quantidade: 0 },
  { id: 'mansao',       icone: '🏠', nome: 'Mansão em Atibaia',         desc: 'Reforma paga por terceiros, naturalmente.',                                            rpsBase: 50,   precoBase: 8000,   quantidade: 0 },
  { id: 'stf',          icone: '⚖️', nome: 'Inocentado pelo STF',       desc: 'A Justiça sorriu novamente.',                                                          rpsBase: 100,  precoBase: 25000,  quantidade: 0 },
  { id: 'mensalao',     icone: '🔴', nome: 'Absolvição no Mensalão',    desc: 'Revisão histórica bastante lucrativa.',                                                rpsBase: 250,  precoBase: 100000, quantidade: 0 },
  { id: 'reeleicao',    icone: '🗳️', nome: 'Reeleição',                 desc: 'Mais um mandato, mais oportunidades.',                                                 rpsBase: 500,  precoBase: 500000, quantidade: 0 },
];

// Aliados que podem ser contratados
const ALIADOS = [
  { id: 'haddad',    icone: '👨‍💼', nome: 'Haddad',    img: 'assets/img/haddad.png',    efeito: '+R$10 por clique',                      preco: 2000  },
  { id: 'bolsonaro', icone: '🟢',  nome: 'Bolsonaro', img: 'assets/img/bolsonaro.png', efeito: '+R$50 por clique',                      preco: 9000  },
  { id: 'janja',     icone: '👩',  nome: 'Janja',     img: 'assets/img/janja.png',     efeito: '+R$100 fixo por clique (permanente)',   preco: 15000 },
];

// Eventos aleatórios que aparecem durante o jogo
const EVENTOS = [
  { icone: '✅', titulo: 'Habeas Corpus Concedido',    desc: '"Mais uma decisão histórica e totalmente imparcial."',               bonus: '+50% renda por 20s',          tipo: 'rps',       multiplicador: 1.5,  duracao: 20 },
  { icone: '🎉', titulo: 'Aliança com o Centrão',      desc: '"Ideologia é uma coisa, governabilidade é outra."',                 bonus: 'Dobra renda passiva por 15s', tipo: 'rps',       multiplicador: 2,    duracao: 15 },
  { icone: '💸', titulo: 'Reforma Tributária Aprovada',desc: '"Simplificação que, coincidentemente, arrecada mais."',             bonus: '+5% permanente na renda!',    tipo: 'permanente',multiplicador: 1.05, duracao: 0  },
  { icone: '📰', titulo: 'Reportagem da Globo',        desc: '"Verba publicitária bem investida transforma críticos em aliados."',bonus: '+30% renda por 15s',          tipo: 'rps',       multiplicador: 1.3,  duracao: 15 },
];

// Funções de cálculo

// Preço atual de um upgrade (aumenta 15% a cada compra)
function getPrecoUpgrade(upg) {
  return Math.floor(upg.precoBase * Math.pow(1.15, upg.quantidade));
}

// Total de reais por segundo considerando upgrades e efeitos ativos
function getRps() {
  let rps = 0;
  for (const upg of UPGRADES) {
    rps += upg.rpsBase * upg.quantidade;
  }
  let mult = estado.multiplicadorRps;
  for (const ef of estado.efeitosAtivos) {
    if (ef.tipo === 'rps') mult *= ef.multiplicador;
  }
  return rps * mult;
}

// Valor ganho por clique considerando aliados e efeitos ativos
function getValorClique() {
  let base = 1;
  if (estado.aliados.haddad)    base += 10;
  if (estado.aliados.bolsonaro) base += 50;
  if (estado.aliados.janja)     base += 100;

  let mult = 1;
  for (const ef of estado.efeitosAtivos) {
    if (ef.tipo === 'rps') mult *= ef.multiplicador;
  }
  return base * mult;
}

// Formata valores monetários de forma legível
function formatarDinheiro(n) {
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return 'R$ ' + (n / 1e3).toFixed(1) + 'K';
  return 'R$ ' + Math.floor(n);
}

// Renderização da interface

function renderizarUpgrades() {
  const container = document.getElementById('tab-upgrades');
  container.innerHTML = '';

  for (const upg of UPGRADES) {
    const preco = getPrecoUpgrade(upg);
    const podePagar = estado.dinheiro >= preco;
    const div = document.createElement('div');
    div.className = 'upgrade-card' + (podePagar ? ' affordable' : ' disabled');
    div.innerHTML = `
      <div class="upgrade-icon">${upg.icone}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${upg.nome}</div>
        <div class="upgrade-desc">${upg.desc}</div>
        <div class="upgrade-rps">+${upg.rpsBase}/s cada</div>
      </div>
      <div class="upgrade-right">
        <div class="upgrade-price">${formatarDinheiro(preco)}</div>
        <div class="upgrade-count">x${upg.quantidade}</div>
      </div>
    `;
    if (podePagar) div.onclick = () => comprarUpgrade(upg);
    container.appendChild(div);
  }
}

function renderizarAliados() {
  const container = document.getElementById('tab-aliados');
  container.innerHTML = '';

  for (const aliado of ALIADOS) {
    const temAliado = estado.aliados[aliado.id];
    const podePagar = estado.dinheiro >= aliado.preco;
    const div = document.createElement('div');
    div.className = 'ally-card' + (temAliado ? ' owned' : (podePagar ? '' : ' disabled'));

    const rodape = temAliado
      ? `<div class="ally-owned-badge">✓ ALIADO</div>`
      : `<div class="ally-price">${formatarDinheiro(aliado.preco)}</div>`;

    div.innerHTML = `
      <div class="ally-avatar">
        <img src="${aliado.img}" alt="${aliado.nome}"
             onerror="this.style.display='none'; this.parentElement.innerHTML='${aliado.icone}'">
      </div>
      <div class="ally-info">
        <div class="ally-name">${aliado.nome}</div>
        <div class="ally-effect">${aliado.efeito}</div>
        <div class="ally-bottom">${rodape}</div>
      </div>
    `;

    if (!temAliado && podePagar) div.onclick = () => comprarAliado(aliado);
    container.appendChild(div);
  }
}

function renderizarEfeitos() {
  const agora = Date.now();
  estado.efeitosAtivos = estado.efeitosAtivos.filter(e => e.terminaEm > agora);

  const container = document.getElementById('active-effects');
  container.innerHTML = '';

  for (const ef of estado.efeitosAtivos) {
    const restante = Math.max(0, (ef.terminaEm - agora) / 1000);
    const pct = (restante / ef.duracaoTotal) * 100;
    const div = document.createElement('div');
    div.className = 'effect-badge';
    div.innerHTML = `
      <div>
        <div class="effect-name">${ef.icone} ${ef.nome}</div>
        <div class="effect-bar"><div class="effect-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="effect-timer">${restante.toFixed(0)}s</div>
    `;
    container.appendChild(div);
  }

  // Borda verde quando há efeito ativo
  const imagemClicker = document.getElementById('clicker-img');
  imagemClicker.classList.toggle('boosted', estado.efeitosAtivos.length > 0);
}

const META = 1_000_000;

function renderizarCabecalho() {
  document.getElementById('total-money').textContent = formatarDinheiro(estado.dinheiro);
  document.getElementById('rps-display').textContent = formatarDinheiro(getRps()) + '/s';
  document.getElementById('cpc-display').textContent = formatarDinheiro(getValorClique());
  verificarVitoria();
}

function verificarVitoria() {
  if (estado.dinheiro >= META && !estado.venceu) {
    estado.venceu = true;
    document.getElementById('victory-total').textContent = 'Em caixa: ' + formatarDinheiro(estado.dinheiro);
    document.getElementById('victory-screen').classList.add('show');
  }
}

// Ações do jogador

function comprarUpgrade(upg) {
  const preco = getPrecoUpgrade(upg);
  if (estado.dinheiro < preco) return;
  estado.dinheiro -= preco;
  upg.quantidade++;
  renderizarUpgrades();
  renderizarCabecalho();
  setarFace('animado');
  setTimeout(() => setarFace('normal'), 600);
}

function comprarAliado(aliado) {
  if (estado.dinheiro < aliado.preco || estado.aliados[aliado.id]) return;
  estado.dinheiro -= aliado.preco;
  estado.aliados[aliado.id] = true;
  renderizarAliados();
  renderizarCabecalho();
  adicionarLog(`👥 ${aliado.nome} virou seu aliado!`);
}

// Modo velocidade 2x

function toggleSpeed() {
  estado.velocidade2x = !estado.velocidade2x;
  const btn = document.getElementById('speed-btn');
  btn.classList.toggle('active', estado.velocidade2x);
  adicionarLog(estado.velocidade2x ? '⚡ Modo 2x ATIVADO!' : '⏸ Modo 2x desativado', estado.velocidade2x);
}

// Clique no Lula

document.getElementById('clicker').addEventListener('click', (e) => {
  const valor = getValorClique();
  estado.dinheiro += valor;
  estado.totalGanho += valor;
  renderizarCabecalho();
  renderizarUpgrades();
  renderizarAliados();

  setarFace('feliz');
  setTimeout(() => setarFace('normal'), 300);

  // Número flutuante na tela
  const num = document.createElement('div');
  num.className = 'float-num';
  num.textContent = '+' + formatarDinheiro(valor);
  num.style.left = e.clientX + 'px';
  num.style.top = e.clientY + 'px';
  document.body.appendChild(num);
  setTimeout(() => num.remove(), 1000);
});

// Troca foto do Lula 

function setarFace(humor) {
  const img = document.getElementById('lula-face');
  img.src = `assets/img/lula_${humor}.png`;
  img.onerror = function () {
    this.style.display = 'none';
    document.getElementById('face-fallback').style.display = 'flex';
  };
}

// Troca de abas na loja

function switchTab(aba) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && aba === 'upgrades') || (i === 1 && aba === 'aliados'));
  });
  document.getElementById('tab-upgrades').classList.toggle('active', aba === 'upgrades');
  document.getElementById('tab-aliados').classList.toggle('active', aba === 'aliados');
}

// Popup de eventos especiais 

let eventoAtual = null;
let timeoutEvento = null;

function mostrarEvento() {
  if (eventoAtual) return;
  const ev = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
  eventoAtual = ev;

  document.getElementById('ep-icon').textContent = ev.icone;
  document.getElementById('ep-title').textContent = ev.titulo;
  document.getElementById('ep-desc').textContent = ev.desc;
  document.getElementById('ep-bonus').textContent = ev.bonus;

  const barra = document.getElementById('ep-timer-fill');
  barra.style.transition = 'none';
  barra.style.width = '100%';

  document.getElementById('event-popup').classList.add('show');
  document.getElementById('overlay').classList.add('show');

  setTimeout(() => {
    barra.style.transition = 'width 8s linear';
    barra.style.width = '0%';
  }, 50);

  timeoutEvento = setTimeout(() => {
    fecharEventoPopup();
    adicionarLog(`❌ ${ev.titulo} — perdido!`);
  }, 8000);
}

function claimEvent() {
  if (!eventoAtual) return;
  clearTimeout(timeoutEvento);
  const ev = eventoAtual;

  if (ev.tipo === 'permanente') {
    estado.multiplicadorRps *= ev.multiplicador;
    adicionarLog(`${ev.icone} ${ev.titulo} — bônus permanente!`, true);
  } else {
    estado.efeitosAtivos.push({
      nome: ev.titulo,
      icone: ev.icone,
      multiplicador: ev.multiplicador,
      tipo: ev.tipo,
      terminaEm: Date.now() + ev.duracao * 1000,
      duracaoTotal: ev.duracao,
    });
    adicionarLog(`${ev.icone} ${ev.titulo} — ativo por ${ev.duracao}s`, true);
  }

  setarFace('animado');
  setTimeout(() => setarFace('normal'), 800);
  fecharEventoPopup();
}

function fecharEventoPopup() {
  document.getElementById('event-popup').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
  eventoAtual = null;
}

// Log de ações no rodapé 

const historicoLog = [];

function adicionarLog(mensagem, positivo = false) {
  historicoLog.unshift({ mensagem, positivo });
  if (historicoLog.length > 4) historicoLog.pop();
  const container = document.getElementById('log-entries');
  container.innerHTML = historicoLog
    .map(e => `<div class="log-entry ${e.positivo ? 'positive' : ''}">${e.mensagem}</div>`)
    .join('');
}

// Loop principal do jogo
// O modo 2x dobra o tempo efetivo. Tudo acontece mais rápido

let ultimoTick = Date.now();

function loopJogo() {
  const agora = Date.now();
  let dt = (agora - ultimoTick) / 1000;
  ultimoTick = agora;

  if (estado.velocidade2x) dt *= 2;

  const renda = getRps() * dt;
  estado.dinheiro += renda;
  estado.totalGanho += renda;

  // Efeito temporário  consomem mais rápido no modo 2x
  if (estado.velocidade2x) {
    const extra = dt / 2;
    for (const ef of estado.efeitosAtivos) {
      ef.terminaEm -= extra * 1000;
    }
  }

  renderizarCabecalho();
  renderizarEfeitos();

  requestAnimationFrame(loopJogo);
}

// Atualiza loja a cada 500ms
setInterval(() => {
  renderizarUpgrades();
  renderizarAliados();
}, 500);

// Agenda o próximo evento especial com intervalo aleatório
function agendarProximoEvento() {
  const delay = 35000 + Math.random() * 20000;
  setTimeout(() => {
    mostrarEvento();
    agendarProximoEvento();
  }, delay);
}

// Reinicia o jogo

function restartGame() {
  estado.dinheiro = 0;
  estado.totalGanho = 0;
  estado.multiplicadorRps = 1;
  estado.efeitosAtivos = [];
  estado.aliados.haddad = false;
  estado.aliados.bolsonaro = false;
  estado.aliados.janja = false;
  estado.velocidade2x = false;
  estado.venceu = false;

  for (const upg of UPGRADES) upg.quantidade = 0;

  document.getElementById('victory-screen').classList.remove('show');
  document.getElementById('speed-btn').classList.remove('active');

  renderizarUpgrades();
  renderizarAliados();
  renderizarCabecalho();
  adicionarLog('🎮 Nova partida iniciada!');
}

// Inicializa

renderizarUpgrades();
renderizarAliados();
renderizarCabecalho();
agendarProximoEvento();
requestAnimationFrame(loopJogo);
adicionarLog('🎮 Clique no Lula para começar!');