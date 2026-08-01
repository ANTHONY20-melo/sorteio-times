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
  
  // Botão para upload de logo customizada (só adiciona uma vez)
  if (!document.getElementById("btn-upload-logo")) {
    const btnUpload = document.createElement("button");
    btnUpload.id = "btn-upload-logo";
    btnUpload.type = "button";
    btnUpload.className = "btn btn-ghost";
    btnUpload.textContent = "📤 Upload logo";
    btnUpload.style.marginTop = "10px";
    btnUpload.addEventListener("click", () => fileInput.click());
    
    const painelLogos = document.getElementById("painel-logos");
    if (painelLogos) {
      let acoes = painelLogos.querySelector(".acoes");
      if (!acoes) {
        acoes = document.createElement("div");
        acoes.className = "acoes";
        painelLogos.appendChild(acoes);
      }
      acoes.appendChild(btnUpload);
    }
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
  chave: 0,        // potência de 2 usada (com folgas quando N não é potência)
  resultados: {}   // "r-k" -> {gols1, gols2, penais1, penais2, cartoes:{a1,v1,a2,v2}}
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
      if (d.resultados && typeof d.resultados === "object") state.resultados = d.resultados;
    }
  } catch (e) { /* ignora */ }
  for (const t of state.times) normalizarTime(t);
  if (state.times.length) nextId = Math.max(...state.times.map(t => t.id)) + 1;
}

function salvar() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      times: state.times,
      regra: state.regra,
      resultados: state.resultados
    }));
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

let jogoIdMap = {};  // "r-k" -> id global do jogo (usado no histórico e no modal)

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
  jogoIdMap = {};           // "r-k" -> id global do jogo
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
      jogo.style.animationDelay = ((jogoId - 1) * 600) + "ms";

      const num = document.createElement("span");
      num.className = "jogo-num";
      num.textContent = "Jogo " + jogoId;
      jogo.appendChild(num);

      const jogoKey = r + "-" + k;
      const timesJogo = timesDoJogo(r, k);
      const t1 = timesJogo[0];
      const t2 = timesJogo[1];
      const res = state.resultados[jogoKey] || null;

      const ehFolga = t1 === null || t2 === null;
      if (res) jogo.classList.add("jogado");
      else if (ehFolga) jogo.classList.add("walkover");
      else if (t1 === undefined || t2 === undefined) jogo.classList.add("pendente");
      else jogo.classList.add("jogavel");

      montarLado(jogo, t1, res, 1, jogoKey, r, k);
      montarLado(jogo, t2, res, 2, jogoKey, r, k);

      if (res && res.penais1 != null && res.penais2 != null) {
        const pn = document.createElement("div");
        pn.className = "penais-txt";
        pn.textContent = "PÊNALTIS " + res.penais1 + " x " + res.penais2;
        jogo.appendChild(pn);
      }

      if (jogo.classList.contains("jogavel") || jogo.classList.contains("jogado")) {
        jogo.addEventListener("click", () => abrirModalResultado(r, k));
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

function montarTime(t, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.className = "time";
  
  // Borda lateral colorida pela região
  if (t._cor) {
    div.style.borderLeft = "4px solid " + t._cor;
  }
  
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

  // Placar (gols) quando a partida já foi registrada
  if (opts.placar !== undefined) {
    const pl = document.createElement("span");
    pl.className = "placar";
    pl.textContent = opts.placar;
    div.appendChild(pl);
  }

  // Cartões (amarelos/vermelhos)
  if (opts.cartoes && (opts.cartoes.am > 0 || opts.cartoes.vm > 0)) {
    const cc = document.createElement("span");
    cc.className = "cartoes";
    cc.title = "Amarelos: " + (opts.cartoes.am || 0) + " · Vermelhos: " + (opts.cartoes.vm || 0);
    if (opts.cartoes.am > 0) {
      const am = document.createElement("span");
      am.className = "am";
      am.textContent = "🟨" + opts.cartoes.am;
      cc.appendChild(am);
    }
    if (opts.cartoes.vm > 0) {
      const vm = document.createElement("span");
      vm.className = "vm";
      vm.textContent = "🟥" + opts.cartoes.vm;
      cc.appendChild(vm);
    }
    div.appendChild(cc);
  }

  const reg = (t.regiao || "").trim();
  if (reg) {
    const rg = document.createElement("span");
    rg.className = "regiao";
    rg.textContent = reg;
    rg.title = reg;
    rg.style.background = t._cor + "33"; // 20% opacity da cor da região
    rg.style.borderColor = t._cor + "80";
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

/* =========================================================
   RESULTADOS DE PARTIDA — placar, cartões, pênaltis,
   avanço automático do vencedor, tabela Geral e histórico
   ========================================================= */

// Lado vencedor do jogo "r-k": 0 = não decidido, 1 = lado 1, 2 = lado 2
function vencedorDe(key) {
  const res = state.resultados[key];
  if (!res) return 0;
  if (res.gols1 > res.gols2) return 1;
  if (res.gols2 > res.gols1) return 2;
  const p1 = res.penais1;
  const p2 = res.penais2;
  if (p1 != null && p2 != null && p1 !== p2) return p1 > p2 ? 1 : 2;
  return 0;
}

// Time que avança do jogo (r,k) para a rodada seguinte:
// - resultado registrado -> vencedor (pênaltis decidem o empate)
// - folga (um lado null) -> o outro lado avança direto
// - jogo ainda não jogado com os 2 times definidos -> undefined (pendente)
function timeVencedorDoJogo(r, k, times) {
  const side = vencedorDe(r + "-" + k);
  if (side === 1) return times[0];
  if (side === 2) return times[1];
  const a = times[0];
  const b = times[1];
  if (a === null && b === null) return null;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return undefined;
}

// Participantes reais do jogo (r,k): [t1, t2]
// null = folga (1ª rodada), undefined = vencedor ainda não definido
function timesDoJogo(r, k) {
  if (r === 1) {
    return [state.slots[2 * k] || null, state.slots[2 * k + 1] || null];
  }
  const [a1, a2] = timesDoJogo(r - 1, 2 * k);
  const [b1, b2] = timesDoJogo(r - 1, 2 * k + 1);
  return [
    timeVencedorDoJogo(r - 1, 2 * k, [a1, a2]),
    timeVencedorDoJogo(r - 1, 2 * k + 1, [b1, b2])
  ];
}

// Monta um lado do card de jogo (time, folga ou placeholder de vencedor)
function montarLado(jogo, t, res, lado, key, r, k) {
  if (t === null) {
    jogo.appendChild(montarFolga());
    return;
  }
  if (t === undefined) {
    const kFilho = 2 * k + (lado - 1);
    const chaveFilho = (r - 1) + "-" + kFilho;
    jogo.appendChild(montarPlaceholder("Vencedor do Jogo " + (jogoIdMap[chaveFilho] || chaveFilho)));
    return;
  }
  const opts = {};
  const venceu = vencedorDe(key);
  if (res) {
    opts.placar = lado === 1 ? res.gols1 : res.gols2;
    const cartoes = res.cartoes || { a1: 0, v1: 0, a2: 0, v2: 0 };
    opts.cartoes = {
      am: lado === 1 ? cartoes.a1 : cartoes.a2,
      vm: lado === 1 ? cartoes.v1 : cartoes.v2
    };
  }
  const el = montarTime(t, opts);
  if (venceu === lado) {
    el.classList.add("venceu");
    const tick = document.createElement("span");
    tick.className = "venceu-tick";
    tick.textContent = "✓";
    el.appendChild(tick);
  }
  jogo.appendChild(el);
}

/* ---------- Modal de lançamento de resultado ---------- */

let modalJogoKey = null;

function abrirModalResultado(r, k) {
  const key = r + "-" + k;
  const [t1, t2] = timesDoJogo(r, k);
  if (t1 == null || t2 == null || t1 === undefined || t2 === undefined) return;
  modalJogoKey = key;
  const res = state.resultados[key] || null;
  const conteudo = document.getElementById("modal-conteudo");
  conteudo.innerHTML = "";

  const tit = document.createElement("h3");
  tit.textContent = "Jogo " + (jogoIdMap[key] || key) + " · Resultado";
  conteudo.appendChild(tit);

  const roda = document.createElement("div");
  roda.className = "modal-roda";
  roda.textContent = nomeRodada(r, state.rodadas);
  conteudo.appendChild(roda);

  conteudo.appendChild(montarLinhaModal(t1, 1, res));
  conteudo.appendChild(montarLinhaModal(t2, 2, res));

  // Pênaltis (decidem empate no tempo normal)
  const checkWrap = document.createElement("label");
  checkWrap.className = "check-penais";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.id = "modal-penais-check";
  const chkTxt = document.createElement("span");
  chkTxt.textContent = "Decisão nos pênaltis (jogo empatou no tempo normal)";
  checkWrap.appendChild(chk);
  checkWrap.appendChild(chkTxt);

  const penais = document.createElement("div");
  penais.className = "m-penais";
  penais.id = "modal-penais";
  penais.appendChild(montarLadoPenais(t1, "modal-penais1"));
  penais.appendChild(montarLadoPenais(t2, "modal-penais2"));
  conteudo.appendChild(checkWrap);
  conteudo.appendChild(penais);

  const temPenais = res && res.penais1 != null && res.penais2 != null;
  if (temPenais) {
    chk.checked = true;
    penais.classList.add("ativo");
    document.getElementById("modal-penais1").value = res.penais1;
    document.getElementById("modal-penais2").value = res.penais2;
  }

  // Placar empatado -> força pênaltis; diferente -> esconde
  const sinc = () => {
    const g1 = intModal("modal-gols1");
    const g2 = intModal("modal-gols2");
    if (g1 === g2) {
      chk.checked = true;
      penais.classList.add("ativo");
    } else {
      penais.classList.remove("ativo");
    }
  };
  document.getElementById("modal-gols1").addEventListener("input", sinc);
  document.getElementById("modal-gols2").addEventListener("input", sinc);
  chk.addEventListener("change", () => penais.classList.toggle("ativo", chk.checked));

  // Botões
  const acoes = document.getElementById("modal-acoes");
  acoes.innerHTML = "";
  if (res) {
    const btnApagar = document.createElement("button");
    btnApagar.className = "btn btn-perigo";
    btnApagar.textContent = "Apagar resultado";
    btnApagar.addEventListener("click", apagarModalResultado);
    acoes.appendChild(btnApagar);
  }
  const btnSalvar = document.createElement("button");
  btnSalvar.className = "btn btn-primario";
  btnSalvar.textContent = res ? "Atualizar resultado" : "Salvar resultado";
  btnSalvar.addEventListener("click", salvarModalResultado);
  acoes.appendChild(btnSalvar);

  document.getElementById("modal-resultado").style.display = "flex";
}

function montarLinhaModal(time, lado, res) {
  const cartoes = res ? (res.cartoes || { a1: 0, v1: 0, a2: 0, v2: 0 }) : { a1: 0, v1: 0, a2: 0, v2: 0 };
  const linha = document.createElement("div");
  linha.className = "m-time";

  const info = document.createElement("div");
  info.className = "mt-info";
  if (time.logo) {
    const img = document.createElement("img");
    img.src = time.logo;
    img.alt = time.nome || "";
    info.appendChild(img);
  }
  const b = document.createElement("b");
  b.textContent = time.nome || "Time sem nome";
  info.appendChild(b);
  linha.appendChild(info);

  const campos = [
    { lbl: "Gols", id: "modal-gols" + lado, val: lado === 1 ? (res ? res.gols1 : 0) : (res ? res.gols2 : 0) },
    { lbl: "Amarelos", id: "modal-am" + lado, val: lado === 1 ? cartoes.a1 : cartoes.a2 },
    { lbl: "Vermelhos", id: "modal-vm" + lado, val: lado === 1 ? cartoes.v1 : cartoes.v2 }
  ];
  for (const campo of campos) {
    const wrap = document.createElement("div");
    const l = document.createElement("div");
    l.className = "m-lbl";
    l.textContent = campo.lbl;
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.value = campo.val;
    inp.id = campo.id;
    inp.inputMode = "numeric";
    wrap.appendChild(l);
    wrap.appendChild(inp);
    linha.appendChild(wrap);
  }
  return linha;
}

function montarLadoPenais(time, id) {
  const lado = document.createElement("div");
  lado.className = "mp-lado";
  const span = document.createElement("span");
  span.textContent = time.nome || "?";
  span.title = time.nome || "";
  const inp = document.createElement("input");
  inp.type = "number";
  inp.min = "0";
  inp.value = "0";
  inp.id = id;
  inp.inputMode = "numeric";
  lado.appendChild(span);
  lado.appendChild(inp);
  return lado;
}

function intModal(id) {
  const el = document.getElementById(id);
  const v = parseInt(el ? el.value : "", 10);
  return isNaN(v) ? 0 : Math.max(0, v);
}

function salvarModalResultado() {
  if (!modalJogoKey) return;
  const gols1 = intModal("modal-gols1");
  const gols2 = intModal("modal-gols2");
  const am1 = intModal("modal-am1");
  const vm1 = intModal("modal-vm1");
  const am2 = intModal("modal-am2");
  const vm2 = intModal("modal-vm2");

  let penais1 = null;
  let penais2 = null;
  if (gols1 === gols2) {
    penais1 = intModal("modal-penais1");
    penais2 = intModal("modal-penais2");
    if (penais1 === penais2) {
      toast("Empate nos pênaltis não define vencedor. Verifique os valores.", true);
      return;
    }
  }

  state.resultados[modalJogoKey] = {
    gols1: gols1,
    gols2: gols2,
    penais1: penais1,
    penais2: penais2,
    cartoes: { a1: am1, v1: vm1, a2: am2, v2: vm2 }
  };
  salvar();
  fecharModalResultado();
  renderArvore(state.slots, state.rodadas);
  renderTabelaGeral();
}

function apagarModalResultado() {
  if (!modalJogoKey) return;
  delete state.resultados[modalJogoKey];
  salvar();
  fecharModalResultado();
  renderArvore(state.slots, state.rodadas);
  renderTabelaGeral();
}

function fecharModalResultado() {
  modalJogoKey = null;
  document.getElementById("modal-resultado").style.display = "none";
}

/* ---------- Tabela Geral (classificação) ---------- */

function computarEstatisticas() {
  const stats = [];
  for (const t of state.times) {
    stats.push({ time: t, J: 0, V: 0, D: 0, GP: 0, GC: 0, Am: 0, Vm: 0, Pts: 0 });
  }
  const porId = new Map(stats.map(s => [s.time.id, s]));
  const p = state.rodadas;
  if (state.slots && p > 0) {
    const T = state.slots.length;
    for (let r = 1; r <= p; r++) {
      const qtd = T / Math.pow(2, r);
      for (let k = 0; k < qtd; k++) {
        const key = r + "-" + k;
        const res = state.resultados[key];
        if (!res) continue;
        const [t1, t2] = timesDoJogo(r, k);
        if (t1 == null || t2 == null || t1 === undefined || t2 === undefined) continue;
        const s1 = porId.get(t1.id);
        const s2 = porId.get(t2.id);
        if (!s1 || !s2) continue;
        s1.J++;
        s2.J++;
        s1.GP += res.gols1;
        s1.GC += res.gols2;
        s2.GP += res.gols2;
        s2.GC += res.gols1;
        const c = res.cartoes || { a1: 0, v1: 0, a2: 0, v2: 0 };
        s1.Am += c.a1;
        s1.Vm += c.v1;
        s2.Am += c.a2;
        s2.Vm += c.v2;
        const w = vencedorDe(key);
        if (w === 1) {
          s1.V++;
          s2.D++;
          s1.Pts += 3;                          // vitória (normal ou pênaltis)
          if (res.penais1 != null) s2.Pts += 1; // derrota nos pênaltis
        } else if (w === 2) {
          s2.V++;
          s1.D++;
          s2.Pts += 3;
          if (res.penais1 != null) s1.Pts += 1;
        }
      }
    }
  }
  stats.sort((a, b) =>
    (b.Pts - a.Pts) ||
    ((b.GP - b.GC) - (a.GP - a.GC)) ||
    (b.GP - a.GP)
  );
  return stats;
}

function renderTabelaGeral() {
  const tabela = document.getElementById("tabela-geral");
  if (!tabela) return;
  const hist = document.getElementById("historico-partidas");
  const stats = computarEstatisticas();
  const colunas = ["#", "Time", "Região", "J", "V", "D", "GP", "GC", "SG", "Am", "Vm", "Pts"];

  let html = "<thead><tr>";
  for (const col of colunas) html += "<th>" + col + "</th>";
  html += "</tr></thead><tbody>";

  if (stats.length === 0) {
    html += '<tr><td colspan="12" style="padding:20px;color:var(--muted);text-align:center;">Adicione times e sorteie o chaveamento para começar a classificação.</td></tr>';
  } else {
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const lider = i === 0 && s.J > 0;
      html += "<tr" + (lider ? ' class="lider"' : "") + ">";
      html += "<td>" + (i + 1) + "</td>";
      html += '<td><div class="time-cell">' +
        (s.time.logo ? '<img src="' + esc(s.time.logo) + '" alt="">' : "") +
        '<span class="tg-nome">' + esc(s.time.nome || "Time sem nome") + "</span></div></td>";
      html += '<td><span class="tg-reg">' + esc((s.time.regiao || "").trim() || "—") + "</span></td>";
      html += "<td>" + s.J + "</td>";
      html += "<td>" + s.V + "</td>";
      html += "<td>" + s.D + "</td>";
      html += "<td>" + s.GP + "</td>";
      html += "<td>" + s.GC + "</td>";
      html += "<td>" + (s.GP - s.GC) + "</td>";
      html += "<td>" + (s.Am > 0 ? s.Am : "–") + "</td>";
      html += "<td>" + (s.Vm > 0 ? s.Vm : "–") + "</td>";
      html += '<td class="pts">' + s.Pts + "</td>";
      html += "</tr>";
    }
  }
  html += "</tbody>";
  tabela.innerHTML = html;
  renderHistorico(hist);
}

function renderHistorico(container) {
  if (!container) return;
  const itens = [];
  const p = state.rodadas;
  if (state.slots && p > 0) {
    const T = state.slots.length;
    for (let r = 1; r <= p; r++) {
      const qtd = T / Math.pow(2, r);
      for (let k = 0; k < qtd; k++) {
        const key = r + "-" + k;
        const res = state.resultados[key];
        if (!res) continue;
        const [t1, t2] = timesDoJogo(r, k);
        if (t1 == null || t2 == null || t1 === undefined || t2 === undefined) continue;
        const w = vencedorDe(key);
        itens.push({ r: r, key: key, res: res, t1: t1, t2: t2, w: w });
      }
    }
  }

  container.innerHTML = "";
  if (itens.length === 0) {
    container.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:6px 2px;">Nenhuma partida registrada ainda. Clique em um jogo do chaveamento para lançar o placar e os cartões.</div>';
    return;
  }

  for (const it of itens) {
    const el = document.createElement("div");
    el.className = "historico-item";
    const c = it.res.cartoes || { a1: 0, v1: 0, a2: 0, v2: 0 };
    const penais = it.res.penais1 != null && it.res.penais2 != null;
    const vencedor = it.w === 1 ? it.t1 : it.w === 2 ? it.t2 : null;
    const totalAm = c.a1 + c.a2;
    const totalVm = c.v1 + c.v2;
    let cartoesTxt = "";
    if (totalAm > 0) cartoesTxt += "🟨 " + totalAm;
    if (totalVm > 0) cartoesTxt += (cartoesTxt ? " · " : "") + "🟥 " + totalVm;
    el.innerHTML =
      '<span class="h-roda">' + nomeRodada(it.r, state.rodadas) + " · Jogo " + (jogoIdMap[it.key] || it.key) + "</span>" +
      '<span class="h-times">' + esc(it.t1.nome || "?") + "</span>" +
      '<span class="h-placar">' + it.res.gols1 + " x " + it.res.gols2 +
        (penais ? " <small>(" + it.res.penais1 + "-" + it.res.penais2 + " pen)</small>" : "") + "</span>" +
      '<span class="h-times">' + esc(it.t2.nome || "?") + "</span>" +
      (vencedor ? '<span class="h-venceu">→ ' + esc(vencedor.nome) + "</span>" : "") +
      (cartoesTxt ? '<span class="h-cartoes">' + cartoesTxt + "</span>" : "");
    container.appendChild(el);
  }
}

/* ---------- Tabs (Chaveamento / Geral) ---------- */

function ativarTab(qual) {
  const mostrarArvore = qual === "arvore";
  const tabA = document.getElementById("tab-arvore");
  const tabG = document.getElementById("tab-geral");
  if (!tabA || !tabG) return;
  tabA.classList.toggle("ativa", mostrarArvore);
  tabG.classList.toggle("ativa", !mostrarArvore);
  const areaArvore = document.getElementById("area-arvore");
  const painelGeral = document.getElementById("painel-geral");
  if (areaArvore) areaArvore.style.display = mostrarArvore ? "block" : "none";
  if (painelGeral) painelGeral.style.display = mostrarArvore ? "none" : "block";
  if (!mostrarArvore) renderTabelaGeral();
}

document.getElementById("tab-arvore").addEventListener("click", () => ativarTab("arvore"));
document.getElementById("tab-geral").addEventListener("click", () => ativarTab("geral"));
document.getElementById("modal-backdrop").addEventListener("click", fecharModalResultado);
document.getElementById("modal-fechar").addEventListener("click", fecharModalResultado);

/* ---------- Animação do sorteio ---------- */

function iniciarSorteio() {
  const res = sortear(state.times, state.regra);
  if (!res.ok) {
    toast(res.erro, true);
    return;
  }
  state.slots = res.slots;
  state.rodadas = res.rodadas;
  state.resultados = {}; // novo sorteio = nova competição (limpa placares)

  painelRegra.style.display = "none";
  painelTimes.style.display = "none";
  telaResultado.style.display = "block";
  ativarTab("arvore");

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

function abrirPaginaLimpa() {
  if (!state.slots || !state.rodadas) {
    toast("Faça um sorteio primeiro!", true);
    return;
  }
  
  // Salvar dados para a página limpa (localStorage é compartilhado entre abas)
  const dados = {
    slots: state.slots.map(t => t ? { id: t.id, nome: t.nome, regiao: t.regiao, logo: t.logo, _cor: t._cor } : null),
    rodadas: state.rodadas,
    regra: state.regra,
    resultados: state.resultados,
    timestamp: Date.now()
  };
  
  localStorage.setItem("sorteio-pagina-limpa", JSON.stringify(dados));
  
  // Abrir em nova janela
  const url = window.location.origin + window.location.pathname + "?view=clean";
  window.open(url, "_blank", "noopener,noreferrer");
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
    await espera(2400);

    // Revela TODOS os confrontos da primeira rodada (pula folgas), um a um, com flip 3D
    overlayTxt.textContent = "Revelando os confrontos";
    const sl = state.slots;
    revealContainer.classList.add("ativo");

    const confrontos = [];
    for (let k = 0; k < sl.length / 2; k++) {
      if (!sl[2 * k] || !sl[2 * k + 1]) continue;
      confrontos.push({ k: k, t1: sl[2 * k], t2: sl[2 * k + 1] });
    }

    for (let i = 0; i < confrontos.length; i++) {
      const j = confrontos[i];
      const t1 = j.t1;
      const t2 = j.t2;
      const card = document.createElement("div");
      card.className = "reveal-card";
      card.innerHTML =
        '<div class="reveal-jogo">Jogo ' + (j.k + 1) + ' · ' + nomeRodada(1, state.rodadas) + '</div>' +
        '<div class="reveal-times">' +
        '<span class="rv">' + (t1.logo ? '<img class="reveal-logo" src="' + esc(t1.logo) + '" alt="">' : '') + esc(t1.nome || "?") + '<small>' + esc((t1.regiao || "").trim() || "—") + '</small></span>' +
        '<span class="reveal-vs">VS</span>' +
        '<span class="rv">' + (t2.logo ? '<img class="reveal-logo" src="' + esc(t2.logo) + '" alt="">' : '') + esc(t2.nome || "?") + '<small>' + esc((t2.regiao || "").trim() || "—") + '</small></span>' +
        '</div>';
      revealContainer.appendChild(card);
      await espera(60);
      card.classList.add("entrou");
      await espera(2200);
      card.classList.add("saiu");
      await espera(650);
      card.remove();
    }

    revealContainer.classList.remove("ativo");

    // Fecha overlay e monta a árvore com as partidas entrando em sequência
    overlay.classList.add("saindo");
    renderArvore(state.slots, state.rodadas);
    await espera(650);
    overlay.classList.remove("ativo", "saindo");

    const totalJogos = Math.pow(2, state.rodadas) - 1;
    await espera(totalJogos * 600 + 1400);
    soltarConfete();
    renderTabelaGeral();
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

document.getElementById("btn-voltar").addEventListener("click", () => {
  painelRegra.style.display = "block";
  painelTimes.style.display = "block";
  telaResultado.style.display = "none";
  document.getElementById("painel-logos").style.display = "block";
});
document.getElementById("btn-novo").addEventListener("click", () => iniciarSorteio());
document.getElementById("btn-editar").addEventListener("click", () => {
  painelRegra.style.display = "block";
  painelTimes.style.display = "block";
  telaResultado.style.display = "none";
  document.getElementById("painel-logos").style.display = "block";
});
document.getElementById("btn-pagina-limpa").addEventListener("click", abrirPaginaLimpa);

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

/* ---------- Página Limpa (view=clean) ---------- */

function initPaginaLimpa() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "clean") {
    // Modo página limpa - esconder tudo exceto a árvore
    document.body.classList.add("clean-view");
    painelRegra.style.display = "none";
    painelTimes.style.display = "none";
    document.getElementById("painel-logos").style.display = "none";
    telaResultado.style.display = "block";
    document.querySelector(".resultado-top").style.display = "none";
    document.querySelector(".zoom-row").style.display = "none";
    document.querySelector(".tabs").style.display = "none";
    document.getElementById("painel-geral").style.display = "none";
    document.getElementById("arvore-scroll").style.border = "none";
    document.getElementById("arvore-scroll").style.background = "transparent";
    
    // Carregar dados do localStorage (compartilhado entre abas)
    try {
      const raw = localStorage.getItem("sorteio-pagina-limpa");
      if (raw) {
        const dados = JSON.parse(raw);
        // Verificar se os dados são recentes (últimos 5 minutos)
        if (Date.now() - (dados.timestamp || 0) < 5 * 60 * 1000) {
          state.slots = dados.slots.map(t => t ? Object.assign({}, t, { _cor: t._cor }) : null);
          state.rodadas = dados.rodadas;
          state.regra = dados.regra;
          state.resultados = dados.resultados || {};
          // Re-renderizar árvore
          renderArvore(state.slots, state.rodadas);
          // Zoom inicial 100% para página limpa
          zoomAtual = 1.0;
          document.getElementById("zoom").value = 100;
          document.getElementById("zoom-val").textContent = "100%";
          aplicarZoom();
        } else {
          document.getElementById("arvore").innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Sessão expirada. Faça um novo sorteio.</div>';
        }
      } else {
        document.getElementById("arvore").innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Nenhum sorteio encontrado.</div>';
      }
    } catch (e) {
      console.error("Erro ao carregar página limpa:", e);
      document.getElementById("arvore").innerHTML = '<div style="text-align:center;padding:40px;color:#d00;">Erro ao carregar dados.</div>';
    }
    return true;
  }
  return false;
}

/* ---------- Init ---------- */

carregar();
if (!initPaginaLimpa()) {
  renderLista();
  carregarLogosDisponiveis();
  // Mostrar painel de logos se houver times
  if (state.times.length > 0) {
    document.getElementById("painel-logos").style.display = "block";
  }
}
carregarLogosDisponiveis();

// Mostrar painel de logos se houver times
if (state.times.length > 0) {
  document.getElementById("painel-logos").style.display = "block";
}

// Exposição para testes automatizados
window.__sorteio = {
  sortear, validarSlots, faseColisao, shuffle,
  state, POTENCIAS, renderArvore, aplicarZoom,
  proximaPotencia2, potenciaDe2, semDuplaFolga,
  vencedorDe, timesDoJogo, computarEstatisticas,
  renderTabelaGeral, abrirModalResultado
};

renderTabelaGeral();
