/* =========================================================
   LÓGICA PURA — Chaveamento com proteção regional
   ========================================================= */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function log2Int(n) { return Math.round(Math.log2(n)); }

// Rodada (1-based) em que os slots i e j colidem na árvore de pares consecutivos.
// Ex (T=8): (0,1)->1 (quartas), (0,2)->2 (semi), (0,4)->3 (final)
function faseColisao(i, j) {
  return Math.floor(Math.log2(i ^ j)) + 1;
}

// Valida se a distribuição respeita a regra:
// regra 'final': mesma região só colide na rodada p (final)
// regra 'semi' : mesma região só colide na rodada p-1 ou p (semi/final)
// Slots com null (folgas) não participam da validação.
function validarSlots(slots, regra) {
  const T = slots.length;
  const p = log2Int(T);
  const permitida = regra === "final" ? p : p - 1;
  for (let i = 0; i < T; i++) {
    if (!slots[i]) continue;
    for (let j = i + 1; j < T; j++) {
      if (!slots[j]) continue;
      if (slots[i]._regiao === slots[j]._regiao && faseColisao(i, j) < permitida) {
        return false;
      }
    }
  }
  return true;
}

function potenciaDe2(n) { return (n & (n - 1)) === 0; }

// Próxima potência de 2 >= n (tamanho da chave)
function proximaPotencia2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Nenhuma partida da 1ª rodada pode ter duas folgas (senão faltaria vencedor)
function semDuplaFolga(slots) {
  const P = slots.length;
  for (let k = 0; k < P / 2; k++) {
    if (!slots[2 * k] && !slots[2 * k + 1]) return false;
  }
  return true;
}

/* =========================================================
   SISTEMA DE LOGOS
   ========================================================= */

// Mapeamento de logos conhecidos (nome do arquivo -> nome do time normalizado)
const LOGOS_CONHECIDOS = [
  "BOCA DA MATA CITY.jpg",
  "BRASA.jpg",
  "CASTELO CITY.jpg",
  "CONDOR CITY.jpg",
  "DFC.jpg",
  "DOM CITY.jpg",
  "ESQUADRÃO DA FÉ.jpg",
  "ESQUADRÃO NB.jpg",
  "FÊNIX.jpg",
  "GUERREIROS DA FÉ.jpg",
  "INVICTOS DA FÉ.jpg",
  "MENORES MB.jpg",
  "NOVA CANAÃ.jpg",
  "NOVA JUVENTUDE.jpg",
  "OUSADIA E ALEGRIA.jpg",
  "PFC.jpg",
  "PSJ.jpg",
  "RDG.jpg",
  "UNION CITY.jpg",
  "VISIONÁRIOS.jpg",
  "ÁGUIAS FC.jpg"
];

function normalizarNomeArquivo(nome) {
  return nome
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function encontrarLogoParaTime(nomeTime) {
  const normTime = normalizarNomeArquivo(nomeTime);
  for (const logo of LOGOS_CONHECIDOS) {
    const normLogo = normalizarNomeArquivo(logo.replace(".jpg", ""));
    if (normTime === normLogo || normTime.includes(normLogo) || normLogo.includes(normTime)) {
      return "logos/" + logo;
    }
  }
  return null;
}

function carregarLogosDisponiveis() {
  const grid = document.getElementById("logos-grid");
  if (!grid) return;
  
  grid.innerHTML = "";
  for (const logo of LOGOS_CONHECIDOS) {
    const item = document.createElement("div");
    item.className = "logo-item";
    item.draggable = true;
    item.dataset.logo = "logos/" + logo;
    item.title = logo.replace(".jpg", "");
    
    const img = document.createElement("img");
    img.src = "logos/" + logo;
    img.alt = logo.replace(".jpg", "");
    img.loading = "lazy";
    
    const label = document.createElement("span");
    label.textContent = logo.replace(".jpg", "");
    
    item.appendChild(img);
    item.appendChild(label);
    grid.appendChild(item);
  }
  
  // Drag & drop para logos
  let logoSelecionada = null;
  let logoUploadTargetId = null; // ID do time alvo para upload
  
  grid.addEventListener("dragstart", e => {
    const item = e.target.closest(".logo-item");
    if (item) {
      logoSelecionada = item.dataset.logo;
      item.classList.add("arrastando");
      e.dataTransfer.setData("text/plain", logoSelecionada);
    }
  });
  
  grid.addEventListener("dragend", e => {
    const item = e.target.closest(".logo-item");
    if (item) item.classList.remove("arrastando");
  });
  
  // Click para selecionar logo
  grid.addEventListener("click", e => {
    const item = e.target.closest(".logo-item");
    if (item) {
      document.querySelectorAll(".logo-item.selecionada").forEach(el => el.classList.remove("selecionada"));
      item.classList.add("selecionada");
      logoSelecionada = item.dataset.logo;
    }
  });
  
  // Drop zones nos times
  const listaTimes = document.getElementById("lista-times");
  
  listaTimes.addEventListener("dragover", e => {
    e.preventDefault();
    const linha = e.target.closest(".linha-time");
    if (linha) linha.classList.add("drag-over");
  });
  
  listaTimes.addEventListener("dragleave", e => {
    const linha = e.target.closest(".linha-time");
    if (linha) linha.classList.remove("drag-over");
  });
  
  listaTimes.addEventListener("drop", e => {
    e.preventDefault();
    const linha = e.target.closest(".linha-time");
    if (linha) {
      linha.classList.remove("drag-over");
      const id = Number(linha.dataset.id);
      const time = state.times.find(t => t.id === id);
      if (time && logoSelecionada) {
        time.logo = logoSelecionada;
        salvar();
        renderLista();
      }
    }
  });
  
  // Click na linha do time para atribuir logo selecionada
  listaTimes.addEventListener("click", e => {
    if (logoSelecionada && e.target.closest(".linha-time") && !e.target.matches("input, button")) {
      const linha = e.target.closest(".linha-time");
      const id = Number(linha.dataset.id);
      const time = state.times.find(t => t.id === id);
      if (time) {
        time.logo = logoSelecionada;
        salvar();
        renderLista();
      }
    }
  });
  
  // Input de arquivo para logo customizada (abre galeria no mobile)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  // Sem capture="environment" para abrir galeria por padrão
  fileInput.style.display = "none";
  fileInput.id = "logo-upload";
  document.body.appendChild(fileInput);
  
  // Canvas para redimensionar imagem (máx 200x240)
  function redimensionarImagem(dataUrl, maxW, maxH, callback) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      
      // Calcular nova dimensão mantendo proporção
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      // Qualidade 0.85 para balancear tamanho/qualidade
      callback(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  }
  
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const dataUrl = evt.target.result;
        // Redimensionar para máx 200x240 antes de salvar
        redimensionarImagem(dataUrl, 200, 240, (resizedDataUrl) => {
          let timeAlvo = null;
          if (logoUploadTargetId) {
            timeAlvo = state.times.find(t => t.id === logoUploadTargetId);
            logoUploadTargetId = null;
          }
          if (!timeAlvo) {
            timeAlvo = state.times.find(t => !t.logo) || state.times[state.times.length - 1];
          }
          if (timeAlvo) {
            timeAlvo.logo = resizedDataUrl;
            salvar();
            renderLista();
          }
        });
      };
      reader.readAsDataURL(file);
    }
    fileInput.value = "";
  });
  
  // Botão para upload de logo customizada
  const btnUpload = document.createElement("button");
  btnUpload.type = "button";
  btnUpload.className = "btn btn-ghost";
  btnUpload.textContent = "📤 Upload logo";
  btnUpload.style.marginTop = "10px";
  btnUpload.addEventListener("click", () => fileInput.click());
  
  const painelLogos = document.getElementById("painel-logos");
  if (painelLogos) {
    const acoes = painelLogos.querySelector(".acoes") || document.createElement("div");
    acoes.className = "acoes";
    acoes.appendChild(btnUpload);
    if (!painelLogos.querySelector(".acoes")) painelLogos.appendChild(acoes);
  }
}

/*
  Sorteio guiado (garante a regra por construção):
  - regra 'final' -> 2 grupos (metades da chave); cada região no máx. 2 times (1 por metade)
  - regra 'semi'  -> 4 grupos (quadrantes);      cada região no máx. 4 times (1 por quadrante)
  Dentro de cada grupo não pode haver 2 times da mesma região (senão colidiriam
  antes da fase permitida). A distribuição separa os times de cada região em
  grupos distintos e embaralha as posições internas.
*/
function sortear(times, regra) {
  const N = times.length;
  if (N < 2) return { ok: false, erro: "Adicione pelo menos 2 times para sortear." };
  if (N === 2) return { ok: true, slots: shuffle(times), rodadas: 1, chave: 2 };

  const P = proximaPotencia2(N);
  const p = log2Int(P);
  const numGrupos = regra === "final" ? 2 : 4;
  const tamGrupo = P / numGrupos;

  // Capacidade por região
  const porRegiao = new Map();
  for (const t of times) {
    if (!porRegiao.has(t._regiao)) porRegiao.set(t._regiao, []);
    porRegiao.get(t._regiao).push(t);
  }
  for (const [regiao, lista] of porRegiao) {
    if (lista.length > numGrupos) {
      return {
        ok: false,
        erro: "A região \"" + regiao + "\" tem " + lista.length + " times, mas com a regra escolhida o máximo é " +
              numGrupos + " times por região (chave de " + P + "). " +
              (regra === "final"
                ? "Use a regra 'Semifinal ou Final' ou reduza o número de times dessa região."
                : "Reduza o número de times dessa região ou use 'Apenas na Final'.")
      };
    }
  }

  const minPorGrupo = Math.ceil(tamGrupo / 2); // cada partida do grupo precisa de >= 1 time

  for (let tentativa = 0; tentativa < 600; tentativa++) {
    // 1) atribui cada região a grupos distintos (um grupo por time da região)
    const timesPorGrupo = Array.from({ length: numGrupos }, () => []);
    let falhou = false;
    for (const lista of porRegiao.values()) {
      const emb = shuffle(lista);
      const grupos = shuffle(Array.from({ length: numGrupos }, (_, i) => i)).slice(0, emb.length);
      for (let k = 0; k < emb.length; k++) {
        timesPorGrupo[grupos[k]].push(emb[k]);
      }
    }

    // 2) overflow (mais times que slots do grupo) sempre invalida;
    //    underfill só importa quando tamGrupo > 1 (grupos se alinham com partidas)
    for (let g = 0; g < numGrupos; g++) {
      const qtd = timesPorGrupo[g].length;
      if (qtd > tamGrupo) { falhou = true; break; }
      if (tamGrupo > 1 && qtd < minPorGrupo) { falhou = true; break; }
    }
    if (falhou) continue;

    // 3) monta os slots: folgas espalhadas (no máx. 1 por partida) + times no resto
    const slots = new Array(P).fill(null);
    for (let g = 0; g < numGrupos; g++) {
      const timesG = shuffle(timesPorGrupo[g]);
      if (tamGrupo === 1) {
        // P=4 com regra semi: grupo = 1 slot (folga dupla é impossível: B <= 1)
        slots[g] = timesG[0] || null;
        continue;
      }
      const nM = tamGrupo / 2;                    // partidas dentro do grupo
      const byes = tamGrupo - timesG.length;      // <= nM (garantido pelo passo 2)
      const comFolga = new Set(shuffle(Array.from({ length: nM }, (_, i) => i)).slice(0, byes));
      const livres = [];
      for (let m = 0; m < nM; m++) {
        const base = g * tamGrupo + m * 2;
        if (comFolga.has(m)) {
          const ladoFolga = Math.random() < 0.5 ? 0 : 1;
          livres.push(base + 1 - ladoFolga);      // o outro lado recebe time
        } else {
          livres.push(base, base + 1);
        }
      }
      const livresShuf = shuffle(livres);
      for (let i = 0; i < timesG.length; i++) slots[livresShuf[i]] = timesG[i];
    }

    // 4) valida a regra de proteção por região
    if (!validarSlots(slots, regra)) continue;
    if (!semDuplaFolga(slots)) continue;
    return { ok: true, slots, rodadas: p, chave: P };
  }
  return { ok: false, erro: "Não foi possível montar o chaveamento com essas combinações. Tente sortear novamente." };
}

function nomeRodada(r, p) {
  if (r === p) return "Final";
  if (r === p - 1) return "Semifinal";
  if (r === p - 2) return "Quartas de Final";
  if (r === p - 3) return "Oitavas de Final";
  if (r === p - 4) return "16 avos de Final";
  return "Fase " + r;
}

function corRegiao(nome) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return "hsl(" + (h % 360) + ", 72%, 62%)";
}

/* =========================================================
   ESTADO + UI
   ========================================================= */

const state = {
  times: [],      // {id, nome, regiao, logo, _regiao, _cor}
  regra: "semi",
  slots: null,
  rodadas: 0,
  chave: 0        // potência de 2 usada (com folgas quando N não é potência)
};

const LS_KEY = "sorteio-times-v1";
const POTENCIAS = [2, 4, 8, 16, 32];

function carregar() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d.times)) state.times = d.times;
      if (d.regra === "semi" || d.regra === "final") state.regra = d.regra;
    }
  } catch (e) { /* ignora */ }
  for (const t of state.times) normalizarTime(t);
  if (state.times.length) nextId = Math.max(...state.times.map(t => t.id)) + 1;
}

function salvar() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ times: state.times, regra: state.regra }));
  } catch (e) { /* ignora */ }
}

let nextId = 1;

// Sem região = região única própria (não fica "protegido" junto com ninguém)
function normalizarTime(t) {
  t._regiao = (t.regiao || "").trim() || ("#auto-" + t.id);
  t._cor = corRegiao((t.regiao || "").trim() || "Sem região");
  // Auto-match logo se não tiver
  if (!t.logo && t.nome) {
    t.logo = encontrarLogoParaTime(t.nome);
  }
  return t;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const listaEl = document.getElementById("lista-times");
const contadorEl = document.getElementById("contador");
const btnSortear = document.getElementById("btn-sortear");
const painelRegra = document.getElementById("painel-regra");
const painelTimes = document.getElementById("painel-times");
const telaResultado = document.getElementById("tela-resultado");
const arvore = document.getElementById("arvore");
const arvoreScroll = document.getElementById("arvore-scroll");
const overlay = document.getElementById("overlay");
const roletaFaixa = document.getElementById("roleta-faixa");
const overlayTxt = document.getElementById("overlay-txt");
const revealContainer = document.getElementById("reveal-container");
const badgeRegra = document.getElementById("badge-regra");
const msgResultado = document.getElementById("msg-resultado");

let zoomAtual = 0.85;
let arvoreInner = null;
let larguraTotal = 0;
let alturaTotal = 0;

/* ---------- Lista de times ---------- */

function renderLista() {
  listaEl.innerHTML = "";
  for (const t of state.times) {
    const linha = document.createElement("div");
    linha.className = "linha-time";
    linha.dataset.id = t.id;

    // Preview da logo
    const logoPreview = document.createElement("div");
    logoPreview.className = "logo-preview";
    if (t.logo) {
      const img = document.createElement("img");
      img.src = t.logo;
      img.alt = t.nome;
      logoPreview.appendChild(img);
    } else {
      logoPreview.textContent = "📷";
      logoPreview.title = "Clique ou arraste uma logo aqui";
    }
    // Click no preview abre seletor de arquivo para ESTE time
    logoPreview.addEventListener("click", () => {
      logoUploadTargetId = t.id;
      fileInput.click();
    });

    const inpNome = document.createElement("input");
    inpNome.placeholder = "Nome do time";
    inpNome.value = t.nome;
    inpNome.addEventListener("input", () => { t.nome = inpNome.value; salvar(); });

    const inpReg = document.createElement("input");
    inpReg.placeholder = "Região (ex: Nordeste)";
    inpReg.value = t.regiao;
    inpReg.setAttribute("list", "datalist-regioes");
    inpReg.addEventListener("input", () => {
      t.regiao = inpReg.value;
      normalizarTime(t);
      atualizarDatalist();
      salvar();
    });

    const btnRem = document.createElement("button");
    btnRem.textContent = "x";
    btnRem.title = "Remover time";
    btnRem.addEventListener("click", () => removerTime(t.id));

    linha.append(logoPreview, inpNome, inpReg, btnRem);
    listaEl.appendChild(linha);
  }
  atualizarDatalist();
  atualizarContador();
}

function atualizarDatalist() {
  let dl = document.getElementById("datalist-regioes");
  if (!dl) {
    dl = document.createElement("datalist");
    dl.id = "datalist-regioes";
    document.body.appendChild(dl);
  }
  const regs = [...new Set(state.times.map(t => (t.regiao || "").trim()).filter(Boolean))];
  dl.innerHTML = regs.map(r => '<option value="' + esc(r) + '"></option>').join("");
}

function atualizarContador() {
  const n = state.times.length;
  const ok = n >= 2;
  let txt;
  if (n === 0) txt = "Nenhum time adicionado";
  else if (n === 1) txt = "1 time — adicione pelo menos mais 1 para sortear";
  else if (potenciaDe2(n)) txt = n + " times — chave de " + n + " pronta!";
  else {
    const P = proximaPotencia2(n);
    const f = P - n;
    txt = n + " times — chave de " + P + " com " + f + " folga" + (f > 1 ? "s" : "") + " na 1ª rodada";
  }
  contadorEl.innerHTML = ok ? "<b>" + txt + "</b>" : txt;
  contadorEl.classList.toggle("ok", ok);
  btnSortear.disabled = !ok;
}

function addTime(nome, regiao) {
  const t = normalizarTime({ id: nextId++, nome: nome || "", regiao: regiao || "" });
  state.times.push(t);
  renderLista();
  salvar();
  const inputs = listaEl.querySelectorAll("input");
  if (inputs.length) inputs[inputs.length - 3].focus();
  // Mostrar painel de logos
  document.getElementById("painel-logos").style.display = "block";
}

function removerTime(id) {
  state.times = state.times.filter(t => t.id !== id);
  renderLista();
  salvar();
  // Esconder painel se não houver times
  if (state.times.length === 0) {
    document.getElementById("painel-logos").style.display = "none";
  }
}

function preencherExemplo() {
  state.times = [];
  const lista = [
    ["Fortaleza", "Nordeste"], ["Bahia", "Nordeste"], ["Ceará", "Nordeste"], ["Sport", "Nordeste"],
    ["Flamengo", "Sudeste"], ["Palmeiras", "Sudeste"], ["Corinthians", "Sudeste"], ["São Paulo", "Sudeste"]
  ];
  for (const [n, r] of lista) {
    state.times.push(normalizarTime({ id: nextId++, nome: n, regiao: r }));
  }
  renderLista();
  salvar();
  // Mostrar painel de logos
  document.getElementById("painel-logos").style.display = "block";
}

/* ---------- Toast de erro ---------- */

let toastEl = null;
function toast(msg, isErro) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.style.cssText =
      "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:300;" +
      "padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:600;" +
      "background:#1c2440;border:1px solid #3a4468;color:#eef1fa;max-width:min(560px,92vw);" +
      "box-shadow:0 10px 30px rgba(0,0,0,.5);text-align:center;";
    document.body.appendChild(toastEl);
  }
  toastEl.style.borderColor = isErro ? "rgba(255,107,107,.6)" : "rgba(46,213,115,.6)";
  toastEl.style.background = isErro ? "rgba(40,10,15,.95)" : "rgba(10,40,25,.95)";
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toastEl.style.display = "none"; }, 4200);
}

/* ---------- Renderização da árvore ---------- */

const LINE_H = 64;   // altura vertical por posição
const CARD_H = 52;   // altura do card de jogo
const TITLE_H = 36;  // altura da faixa de título da rodada (espaço reservado no topo)
const COL_W = 250;
const GAP_W = 92;

function renderArvore(slots, p) {
  const T = slots.length;
  larguraTotal = p * COL_W + (p - 1) * GAP_W;
  alturaTotal = TITLE_H + T * LINE_H;

  arvore.innerHTML = "";
  arvoreInner = document.createElement("div");
  arvoreInner.style.cssText = "position:absolute;top:0;left:0;width:" + larguraTotal + "px;height:" + alturaTotal + "px;transform-origin:0 0;";
  arvore.appendChild(arvoreInner);

  const topoPorJogo = {};   // "r-k" -> top do card (px)
  const centroPorJogo = {}; // "r-k" -> centro vertical (px)
  const jogoIdMap = {};     // "r-k" -> id global do jogo
  let jogoId = 0;

  // -- Colunas com título --
  for (let r = 1; r <= p; r++) {
    const col = document.createElement("div");
    col.style.cssText = "position:absolute;top:0;bottom:0;left:" + ((r - 1) * (COL_W + GAP_W)) + "px;width:" + COL_W + "px;";
    const tit = document.createElement("div");
    tit.className = "col-titulo";
    tit.textContent = nomeRodada(r, p) + "  ·  Jogos " + (Math.pow(2, p - r)) + "";
    col.appendChild(tit);
    arvoreInner.appendChild(col);
  }

  // -- Cards dos jogos (rodada 1: times reais; demais: vencedores) --
  let rodadaAnterior = []; // centros por índice de partida na rodada r-1
  for (let r = 1; r <= p; r++) {
    const qtd = T / Math.pow(2, r);
    const atual = [];
    for (let k = 0; k < qtd; k++) {
      jogoId++;
      let top;
      if (r === 1) {
        top = TITLE_H + (2 * k) * LINE_H;
      } else {
        const c1 = rodadaAnterior[2 * k];
        const c2 = rodadaAnterior[2 * k + 1];
        top = (c1 + c2) / 2 - CARD_H / 2;
      }
      const centro = top + CARD_H / 2;
      atual.push(centro);
      topoPorJogo[r + "-" + k] = top;
      centroPorJogo[r + "-" + k] = centro;
      jogoIdMap[r + "-" + k] = jogoId;

      const jogo = document.createElement("div");
      jogo.className = "jogo";
      jogo.style.left = ((r - 1) * (COL_W + GAP_W)) + "px";
      jogo.style.top = top + "px";
      jogo.style.animationDelay = ((jogoId - 1) * 110) + "ms";

      const num = document.createElement("span");
      num.className = "jogo-num";
      num.textContent = "Jogo " + jogoId;
      jogo.appendChild(num);

      if (r === 1) {
        const sA = slots[2 * k];
        const sB = slots[2 * k + 1];
        if (!sA || !sB) jogo.classList.add("walkover");
        jogo.appendChild(sA ? montarTime(sA) : montarFolga());
        jogo.appendChild(sB ? montarTime(sB) : montarFolga());
      } else {
        const filho1 = r - 1 + "-" + (2 * k);
        const filho2 = r - 1 + "-" + (2 * k + 1);
        jogo.classList.add("pendente");
        jogo.appendChild(montarPlaceholder("Vencedor do Jogo " + jogoIdMap[filho1]));
        jogo.appendChild(montarPlaceholder("Vencedor do Jogo " + jogoIdMap[filho2]));
      }
      arvoreInner.appendChild(jogo);

      // conectores (para r > 1)
      if (r > 1) {
        const eixoX = (r - 1) * (COL_W + GAP_W);
        const c1 = rodadaAnterior[2 * k];
        const c2 = rodadaAnterior[2 * k + 1];
        const cMenor = Math.min(c1, c2);
        const cMaior = Math.max(c1, c2);
        const v = document.createElement("div");
        v.className = "conector-v";
        v.style.left = (eixoX - 1) + "px";
        v.style.top = cMenor + "px";
        v.style.height = Math.max(2, cMaior - cMenor) + "px";
        arvoreInner.appendChild(v);
        for (const cc of [c1, c2]) {
          const h = document.createElement("div");
          h.className = "conector-h";
          h.style.left = ((r - 2) * (COL_W + GAP_W) + COL_W) + "px";
          h.style.top = (cc - 1) + "px";
          h.style.width = GAP_W + "px";
          arvoreInner.appendChild(h);
        }
      }
    }
    rodadaAnterior = atual;
  }

  aplicarZoom();
}

function montarTime(t) {
  const div = document.createElement("div");
  div.className = "time";
  
  // Logo do time
  if (t.logo) {
    const logo = document.createElement("img");
    logo.className = "time-logo";
    logo.src = t.logo;
    logo.alt = t.nome;
    div.appendChild(logo);
  }
  
  const b = document.createElement("span");
  b.className = "bolinha";
  b.style.color = t._cor;
  const nome = document.createElement("span");
  nome.className = "nome";
  nome.textContent = t.nome || "Time sem nome";
  nome.title = t.nome || "";
  div.appendChild(b);
  div.appendChild(nome);
  const reg = (t.regiao || "").trim();
  if (reg) {
    const rg = document.createElement("span");
    rg.className = "regiao";
    rg.textContent = reg;
    rg.title = reg;
    div.appendChild(rg);
  }
  return div;
}

function montarFolga() {
  const div = document.createElement("div");
  div.className = "time folga";
  const b = document.createElement("span");
  b.className = "bolinha";
  b.style.color = "#4a5378";
  b.style.boxShadow = "none";
  const nome = document.createElement("span");
  nome.className = "nome";
  nome.textContent = "Folga — avança direto";
  div.appendChild(b);
  div.appendChild(nome);
  return div;
}

function montarPlaceholder(txt) {
  const div = document.createElement("div");
  div.className = "time";
  div.style.color = "#8b93b5";
  div.style.fontWeight = "500";
  div.style.fontStyle = "italic";
  const nome = document.createElement("span");
  nome.className = "nome";
  nome.textContent = txt;
  div.appendChild(nome);
  return div;
}

function aplicarZoom() {
  if (!arvoreInner) return;
  arvore.style.width = (larguraTotal * zoomAtual) + "px";
  arvore.style.height = (alturaTotal * zoomAtual) + "px";
  arvoreInner.style.transform = "scale(" + zoomAtual + ")";
}

/* ---------- Animação do sorteio ---------- */

function iniciarSorteio() {
  const res = sortear(state.times, state.regra);
  if (!res.ok) {
    toast(res.erro, true);
    return;
  }
  state.slots = res.slots;
  state.rodadas = res.rodadas;

  painelRegra.style.display = "none";
  painelTimes.style.display = "none";
  telaResultado.style.display = "block";

  badgeRegra.textContent = (state.regra === "final" ? "Proteção: Apenas na Final" : "Proteção: Semifinal ou Final") +
    " · Regiões separadas " + (state.regra === "final" ? "até a decisão" : "até a semi");
  const N = state.times.length;
  const P = res.chave;
  const folgas = P - N;
  const jogos1 = (P === N ? N / 2 : N - P / 2);
  let msg = N + " times · " +
    nomeRodada(1, res.rodadas) + " até " + nomeRodada(res.rodadas, res.rodadas) +
    " · " + jogos1 + " jogos na 1ª rodada";
  if (folgas) msg += " · " + folgas + " folga" + (folgas > 1 ? "s" : "") + " na 1ª rodada";
  msgResultado.textContent = msg;

  animarSorteio();
}

function animarSorteio() {
  // Roleta com os nomes
  const nomes = shuffle(state.times.map(t => t.nome || "?"));
  const faixa = nomes.concat(nomes).map(n => "<span>" + esc(n) + "</span>").join("");
  roletaFaixa.innerHTML = faixa;
  overlayTxt.innerHTML = "Sorteando<span class=\"dots\"><span>.</span><span>.</span><span>.</span></span>";
  revealContainer.innerHTML = "";
  revealContainer.classList.remove("ativo");

  overlay.classList.remove("saindo");
  overlay.classList.add("ativo");

  const espera = ms => new Promise(res => setTimeout(res, ms));

  (async () => {
    await espera(1500);

    // Revela a primeira partida real (pula folgas) com flip 3D
    overlayTxt.textContent = "Revelando a primeira partida";
    const sl = state.slots;
    let kReveal = 0;
    while (kReveal < sl.length / 2 && (!sl[2 * kReveal] || !sl[2 * kReveal + 1])) kReveal++;
    const t1 = sl[2 * kReveal];
    const t2 = sl[2 * kReveal + 1];
    revealContainer.classList.add("ativo");
    const card = document.createElement("div");
    card.className = "reveal-card";
    card.innerHTML =
      '<div class="reveal-jogo">Jogo ' + (kReveal + 1) + ' · ' + nomeRodada(1, state.rodadas) + '</div>' +
      '<div class="reveal-times">' +
      '<span class="rv">' + (t1.logo ? '<img class="reveal-logo" src="' + esc(t1.logo) + '" alt="">' : '') + esc(t1.nome || "?") + '<small>' + esc((t1.regiao || "").trim() || "—") + '</small></span>' +
      '<span class="reveal-vs">VS</span>' +
      '<span class="rv">' + (t2.logo ? '<img class="reveal-logo" src="' + esc(t2.logo) + '" alt="">' : '') + esc(t2.nome || "?") + '<small>' + esc((t2.regiao || "").trim() || "—") + '</small></span>' +
      '</div>';
    revealContainer.appendChild(card);
    await espera(30);
    card.classList.add("entrou");
    await espera(1400);
    card.classList.add("saiu");
    await espera(450);

    // Fecha overlay e monta a árvore com as partidas entrando em sequência
    overlay.classList.add("saindo");
    renderArvore(state.slots, state.rodadas);
    await espera(420);
    overlay.classList.remove("ativo", "saindo");
    revealContainer.classList.remove("ativo");

    const totalJogos = Math.pow(2, state.rodadas) - 1;
    await espera(totalJogos * 110 + 800);
    soltarConfete();
  })();
}

function soltarConfete() {
  const cores = ["#6c5ce7", "#00d2ff", "#f77062", "#2ed573", "#ffd93d", "#ff8a5c", "#a29bfe"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    el.className = "confete";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = cores[Math.floor(Math.random() * cores.length)];
    el.style.animationDuration = (2.2 + Math.random() * 2.2) + "s";
    el.style.animationDelay = (Math.random() * 0.8) + "s";
    el.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6500);
  }
}

/* ---------- Eventos ---------- */

document.querySelectorAll(".regra").forEach(lbl => {
  const radio = lbl.querySelector("input");
  const aplicar = () => {
    if (!radio.checked) { lbl.classList.remove("selecionada"); return; }
    state.regra = radio.value;
    lbl.classList.add("selecionada");
    salvar();
  };
  radio.addEventListener("change", aplicar);
  lbl.addEventListener("click", () => { if (!radio.checked) { radio.checked = true; aplicar(); } });
  aplicar();
});

document.getElementById("btn-adicionar").addEventListener("click", () => addTime("", ""));
document.getElementById("btn-exemplo").addEventListener("click", preencherExemplo);
btnSortear.addEventListener("click", iniciarSorteio);

document.getElementById("btn-novo").addEventListener("click", () => iniciarSorteio());
document.getElementById("btn-editar").addEventListener("click", () => {
  painelRegra.style.display = "block";
  painelTimes.style.display = "block";
  telaResultado.style.display = "none";
});

const zoomInput = document.getElementById("zoom");
const zoomVal = document.getElementById("zoom-val");
zoomInput.addEventListener("input", () => {
  zoomAtual = parseInt(zoomInput.value, 10) / 100;
  zoomVal.textContent = Math.round(zoomAtual * 100) + "%";
  aplicarZoom();
});

// Enter no campo de nome adiciona outro time
listaEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.tagName === "INPUT") {
    e.preventDefault();
    addTime("", "");
  }
});

/* ---------- Init ---------- */

carregar();
renderLista();
carregarLogosDisponiveis();

// Mostrar painel de logos se houver times
if (state.times.length > 0) {
  document.getElementById("painel-logos").style.display = "block";
}

// Exposição para testes automatizados
window.__sorteio = {
  sortear, validarSlots, faseColisao, shuffle,
  state, POTENCIAS, renderArvore, aplicarZoom,
  proximaPotencia2, potenciaDe2, semDuplaFolga
};
