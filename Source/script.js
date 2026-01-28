// Importa a biblioteca Leaflet
const L = window.L

console.log("[v0] Inicializando mapa...")

// 1. Definição das Camadas Base (Tile Layers)
const layersMap = {
  padrao: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }),
  satelite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 19
  }),
  clean: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  })
};

// 2. Inicializa o mapa com a camada "padrao"
var map = L.map("map", { 
  zoomControl: false,
  layers: [layersMap.padrao] // Define padrão como inicial
}).setView([-22.805, -43.372], 13);

// 3. Lógica para troca de camadas via HTML (Radio Buttons)
const baseLayerInputs = document.querySelectorAll('input[name="baseLayer"]');

baseLayerInputs.forEach(input => {
  input.addEventListener('change', (e) => {
    const layerSelected = e.target.value;
    
    // Remove todas as camadas base
    map.removeLayer(layersMap.padrao);
    map.removeLayer(layersMap.satelite);
    map.removeLayer(layersMap.clean);

    // Adiciona a selecionada
    if (layersMap[layerSelected]) {
      map.addLayer(layersMap[layerSelected]);
      console.log(`[v0] Camada alterada para: ${layerSelected}`);
    }
  });
});

// Controles de Zoom
document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());

// Controle de Fullscreen
const fullscreenBtn = document.getElementById("fullscreenBtn")
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("[v0] Erro ao entrar em fullscreen:", err)
    })
  } else {
    document.exitFullscreen()
  }
})

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenBtn.textContent = "⛶"
    fullscreenBtn.title = "Sair da tela cheia"
  } else {
    fullscreenBtn.textContent = "⛶"
    fullscreenBtn.title = "Tela cheia"
  }
})

console.log("[v0] Mapa inicializado com sucesso")

// Menu Lateral Toggle
const menuToggle = document.getElementById("menuToggle")
const menu = document.getElementById("menu")

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("collapsed")
})

// Accordion (Seções do Menu)
document.querySelectorAll(".section-header[data-section]").forEach((header) => {
  const sectionName = header.dataset.section
  const content = document.getElementById(`${sectionName}Container`)
  const icon = header.querySelector(".section-icon")

  // Se for a seção de estilo do mapa, trata igual as outras
  if (!content) return;

  header.addEventListener("click", (e) => {
    if (e.target.type === "checkbox") return
    content.classList.toggle("collapsed")
    header.classList.toggle("collapsed")
  })
})

// Accordion (Submenus - Municipal, Outros, Proximas Entregas, etc.)
document.querySelectorAll(".submenu-header[data-submenu]").forEach((header) => {
  const submenuName = header.dataset.submenu
  const content = document.getElementById(`${submenuName}Container`)

  if (!content) return;

  header.addEventListener("click", (e) => {
    // Ignora cliques em checkboxes dentro do header
    if (e.target.type === "checkbox") return
    // Impede que o clique propague para elementos pai (evita fechar a seção principal)
    e.stopPropagation()
    e.preventDefault()
    content.classList.toggle("collapsed")
    header.classList.toggle("collapsed")
  }, true)
})

// Array de cores para bairros
const coresBairros = [
  "#e6194ca1", "#3cb44c94", "#ffe01993", "#4363d898", "#f58331a1",
  "#911eb496", "#46f0f0a1", "#f032e698", "#bcf60c9d", "#fabebe96",
  "#00808094", "#e6beff93", "#9a63249d", "#fffac89c", "#80000094", "#aaffc4a1",
]

let corIndex = 0
const bairroLayers = {}
let childrenDataCache = null

// --- Lógica de Bairros ---
function carregarDadosCriancas() {
  fetch("../Data/Processed/Educação/faixaetaria_criancas_sjm.geojson")
    .then((res) => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`)
      return res.json()
    })
    .then((data) => {
      childrenDataCache = {}
      data.features.forEach((feature) => {
        const nomeBairro = feature.properties["Crianças de 0 a 5 anos por bairro"]
        childrenDataCache[nomeBairro] = feature.properties
      })
    })
    .catch((error) => console.error("[v0] Erro ao carregar dados de crianças:", error))
}

function mostrarDadosCriancas(nomeBairro) {
  const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
  const nomeBairroNormalizado = normalizar(nomeBairro)
  let dadosEncontrados = null

  if (childrenDataCache) {
    for (const [nomeCache, dados] of Object.entries(childrenDataCache)) {
      if (normalizar(nomeCache) === nomeBairroNormalizado) {
        dadosEncontrados = dados
        break
      }
    }
  }

  if (!dadosEncontrados) {
    return
  }

  const dados = dadosEncontrados
  const modal = document.getElementById("childrenDataModal")
  const title = document.getElementById("childrenDataTitle")
  const container = document.getElementById("childrenDataTableContainer")

  title.textContent = `Sumário de Crianças - ${nomeBairro}`

  let tableHTML = `
    <table class="children-data-table">
      <thead>
        <tr>
          <th>Faixa Etária</th>
          <th>Quantidade</th>
          <th>Percentual</th>
        </tr>
      </thead>
      <tbody>
  `

  const faixasEtarias = ["0 anos", "1 ano", "2 anos", "3 anos", "4 anos", "5 anos"]
  const total = dados.TOTAL

  faixasEtarias.forEach((faixa) => {
    const quantidade = dados[faixa] || 0
    const percentual = total > 0 ? ((quantidade / total) * 100).toFixed(1) : 0
    tableHTML += `
      <tr>
        <td>${faixa}</td>
        <td class="quantidade">${quantidade}</td>
        <td class="percentual">${percentual}%</td>
      </tr>
    `
  })

  tableHTML += `
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="quantidade"><strong>${total}</strong></td>
          <td class="percentual"><strong>100%</strong></td>
        </tr>
      </tbody>
    </table>
  `

  container.innerHTML = tableHTML
  modal.classList.remove("hidden")
}

document.getElementById("closeChildrenDataModal").addEventListener("click", () => {
  document.getElementById("childrenDataModal").classList.add("hidden")
})

fetch("../Data/Processed/Bairros/bairros_clean.geojson")
  .then((res) => {
    if (!res.ok) throw new Error(`Erro ao carregar GeoJSON: ${res.status}`)
    return res.json()
  })
  .then((data) => {
    const bairrosContainer = document.getElementById("bairrosContainer")

    data.features.forEach((feature) => {
      const cor = coresBairros[corIndex % coresBairros.length]
      corIndex++

      const layer = L.geoJSON(feature, {
        style: { color: "black", weight: 1, fillColor: cor, fillOpacity: 0.65 },
      }).addTo(map)

      const popupContent = `<b>${feature.properties.name}</b><br>População: ${feature.properties.população || "Não Informado"}<br>Domicílios: ${feature.properties.domicílios || "Não Informado"}<br>Dom. Ocupados: ${feature.properties.domOcupados || "Não Informado"}<br><button class="ver-criancas-btn" data-bairro="${feature.properties.name}">Visualizar Sumário de Crianças</button>`

      layer.bindPopup(popupContent)
      bairroLayers[feature.properties.name] = layer

      const label = document.createElement("label")
      label.className = "layer-item"
      label.innerHTML = `
        <input type="checkbox" checked class="layer-checkbox bairro" data-bairro="${feature.properties.name}">
        <span class="layer-symbol" style="background-color: ${cor};"></span>
        <span class="layer-name">${feature.properties.name}</span>
      `
      bairrosContainer.appendChild(label)
    })

    bairrosContainer.querySelectorAll("input.bairro").forEach((cb) => {
      cb.addEventListener("change", function () {
        const bairro = this.dataset.bairro
        const layer = bairroLayers[bairro]
        if (this.checked) layer.addTo(map)
        else map.removeLayer(layer)
      })
    })
  })
  .catch((error) => console.error("[v0] Erro ao carregar bairros:", error))

const toggleBairros = document.getElementById("toggleBairros")
toggleBairros.addEventListener("change", function () {
  const bairrosContainer = document.getElementById("bairrosContainer")
  bairrosContainer.querySelectorAll("input.bairro").forEach((cb) => {
    cb.checked = this.checked
    const bairro = cb.dataset.bairro
    const layer = bairroLayers[bairro]
    if (this.checked) layer.addTo(map)
    else map.removeLayer(layer)
  })
})

/* =================================================================
   FUNCIONALIDADE DE CLUSTERIZAÇÃO (AGRUPAMENTO)
   ================================================================= */

// Helper para pegar o raio baseado no estado atual do checkbox
function getClusterRadius() {
  const toggle = document.getElementById('clusterToggle');
  // Se estiver marcado (checked) = Agrupamento Ativo = Raio 50
  // Se não estiver marcado (unchecked) = Agrupamento Desativado = Raio 0
  return (toggle && toggle.checked) ? 50 : 0;
}

function criarClusterGroup(cor) {
  return L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    maxClusterRadius: getClusterRadius(), // Lê o valor ao criar
    iconCreateFunction: function (cluster) {
      const childCount = cluster.getChildCount();
      const style = `
        background-color: ${cor};
        width: 30px;
        height: 30px;
        margin-left: -15px;
        margin-top: -15px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-family: 'Roboto', sans-serif;
        font-size: 12px;
      `;
      return new L.DivIcon({ 
        html: `<div style="${style}">${childCount}</div>`, 
        className: 'custom-cluster-icon', 
        iconSize: new L.Point(30, 30) 
      });
    }
  });
}

const toggleMunicipal = document.getElementById("toggleMunicipal")
const toggleOutros = document.getElementById("toggleOutros")
const toggleCreches = document.getElementById("toggleCreches")
const toggleEscolas = document.getElementById("toggleEscolas")
const toggleEscolasEstaduais = document.getElementById("toggleEscolasEstaduais")
const toggleEscolasParticulares = document.getElementById("toggleEscolasParticulares")
const toggleNovasConstrucoes = document.getElementById("toggleNovasConstrucoes")

// Toggle "Exibir Municipal" - controla Creches e Escolas Municipais
toggleMunicipal.addEventListener("change", function () {
  toggleCreches.checked = this.checked
  toggleEscolas.checked = this.checked

  if (this.checked) {
    map.addLayer(crechesLayer)
    map.addLayer(escolasLayer)
  } else {
    map.removeLayer(crechesLayer)
    map.removeLayer(escolasLayer)
  }
})

// Toggle "Exibir Outros" - controla Escolas Estaduais e Particulares
toggleOutros.addEventListener("change", function () {
  toggleEscolasEstaduais.checked = this.checked
  toggleEscolasParticulares.checked = this.checked

  if (this.checked) {
    map.addLayer(escolasEstaduaisLayer)
    map.addLayer(escolasParticularesLayer)
  } else {
    map.removeLayer(escolasEstaduaisLayer)
    map.removeLayer(escolasParticularesLayer)
  }
})

// Função para dar zoom em Marcadores (toggle)
let estadoZoomAnterior = null;
let marcadorAtivo = null;

function aplicarZoomNoClick(marker, zoom = 17) {
  marker.on("click", function (e) {

    // Segundo clique no mesmo marcador → voltar ao estado anterior
    if (marcadorAtivo === marker && estadoZoomAnterior) {
      map.flyTo(estadoZoomAnterior.center, estadoZoomAnterior.zoom, {
        duration: 1
      });

      marcadorAtivo = null;
      estadoZoomAnterior = null;
      return;
    }

    // Primeiro clique ou clique em outro marcador
    estadoZoomAnterior = {
      center: map.getCenter(),
      zoom: map.getZoom()
    };

    map.flyTo(e.latlng, zoom, {
      duration: 1
    });

    marcadorAtivo = marker;
  });
}

// Criacao das camadas
const crechesLayer = criarClusterGroup('#d43c3c');
const escolasLayer = criarClusterGroup('#4ecdc4');
const escolasEstaduaisLayer = criarClusterGroup('#1e88e5');
const escolasParticularesLayer = criarClusterGroup('#9c27b0');
const novasConstrucoesLayer = criarClusterGroup('#ffa500');

// Camadas de Proximas Entregas - agrupadas por mes
const proximasEntregasLayers = {}
const nomesMeses = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

// Camadas de Saúde - agrupadas por tipo
const saudeLayers = {} 
const saudeLayerGroup = L.layerGroup()

// Camadas de Próximas Entregas Saúde - agrupadas por mês
const proximasEntregasSaudeLayers = {} 

// Ícones
const crecheIcon = L.icon({ iconUrl: "../Include/Img/creche-icon.png", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
const escolaIcon = L.icon({ iconUrl: "../Include/Img/escola-icon.png", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
const escolaEstadualIcon = L.icon({ iconUrl: "../Include/Img/escolaE-icon.png", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
const escolaParticularIcon = L.icon({ iconUrl: "../Include/Img/escolaP-icon.png", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })
const novaConstrucaoIcon = L.icon({ iconUrl: "../Include/Img/novasinstituicoes-icon.png", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] })

// Cores Saúde
const coresSaude = {
  "Emergência 24h": "#bd0704", "Hospital": "#faa2eb", "UPA": "#ca7b04",
  "Posto de Sáude": "#4caf50", "Unidade de Saúde da Familia": "#024780",
  "Secretaria Municipal de Súade": "#9c27b0", "Centro de Atenção Psicossocial": "#ffd000",
  "Programa de Saúde": "#00bcd4", "Residencia Terapêuticas": "#795548",
  "Orgãos Reguladores": "#607d8b", "Atenção Especializada": "#3f51b5",
  "default": "#9e9e9e",
}

// Cores Assistência Social
const coresAssistenciaSocial = {
  "CRAS": "#8e44ad",
  "CREAS": "#9b59b6", 
  "Centro POP": "#a569bd",
  "Casa de Passagem": "#bb8fce",
  "Conselho Tutelar": "#d2b4de",
  "Centro de Atendimento": "#e8daef",
  "Central": "#f4ecf7",
  "default": "#8e44ad",
}

// Cores Assistência Social
const coresCidadania = {
  "default": "#f1989f",
}

// Cores Cultura
const coresCultura = {
  "default": "#e67e22",
}

// Cores Praças
const coresPracas = {
  "default": "#27ae60",
}

// Cores Trabalho
const coresTrabalho = {
  "default": "#2980b9",
}

// Camadas de Assistência Social
const assistenciaSocialLayers = {}
const assistenciaSocialLayerGroup = L.layerGroup()

// Camadas de Cidadania
const cidadaniaLayers = {}
const cidadaniaLayerGroup = L.layerGroup()

// Camadas de Cultura
const culturaLayers = {}
const culturaLayerGroup = L.layerGroup()

// Camadas de Praças
const pracasLayers = {}
const pracasLayerGroup = L.layerGroup()

// Camadas de Trabalho
const trabalhoLayers = {}
const trabalhoLayerGroup = L.layerGroup()

function criarIconeSaude(tipo, nomeUnidade) {
  const cor = coresSaude[tipo.trim()] || coresSaude["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <path d="M11 7h2v2h2v2h-2v2h-2v-2H9V9h2V7z" fill="white" transform="translate(0, -0.5)"/>
        </svg>
        <span class="marker-label saude-label">${nomeUnidade}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Icone de saude amarelo para Proximas Entregas Saude
function criarIconeSaudeProximasEntregas(nomeUnidade) {
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffd000" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <path d="M11 7h2v2h2v2h-2v2h-2v-2H9V9h2V7z" fill="white" transform="translate(0, -0.5)"/>
        </svg>
        <span class="marker-label saude-label">${nomeUnidade}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Ícone Assistência Social (pessoas/mãos)
function criarIconeAssistenciaSocial(tipo, nome) {
  const cor = coresAssistenciaSocial[tipo] || coresAssistenciaSocial["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <circle cx="12" cy="8" r="2" fill="white"/>
          <path d="M12 11c-1.5 0-3 .5-3 1.5v.5h6v-.5c0-1-1.5-1.5-3-1.5z" fill="white"/>
        </svg>
        <span class="marker-label saude-label">${nome}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Ícone Cultura (teatro/música)
function criarIconeCultura(nome) {
  const cor = coresCultura["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <path d="M9 7h6l-1 2h-4l-1-2zm1 3h4v2H10v-2z" fill="white"/>
        </svg>
        <span class="marker-label saude-label">${nome}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Ícone Cultura (teatro/música)
function criarIconeCidadania(nome) {
  const cor = coresCidadania["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <path d="M9 7h6l-1 2h-4l-1-2zm1 3h4v2H10v-2z" fill="white"/>
        </svg>
        <span class="marker-label saude-label">${nome}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Ícone Praças (árvore/parque)
function criarIconePraca(nome) {
  const cor = coresPracas["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <path d="M12 5l-3 4h2v3h2v-3h2l-3-4z" fill="white"/>
        </svg>
        <span class="marker-label saude-label">${nome}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

// Ícone Trabalho (maleta/briefcase)
function criarIconeTrabalho(nome) {
  const cor = coresTrabalho["default"]
  return L.divIcon({
    className: "custom-saude-marker",
    html: `
      <div class="saude-marker-container">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${cor}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          <rect x="9" y="7" width="6" height="5" rx="1" fill="white"/>
          <rect x="10.5" y="6" width="3" height="1.5" fill="white"/>
        </svg>
        <span class="marker-label saude-label">${nome}</span>
      </div>
    `,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  })
}

function mostrarImagemPreview(urlImg, nome) {
  const imagePreview = document.getElementById("imagePreview")
  const previewImage = document.getElementById("previewImage")
  const previewTitle = document.getElementById("previewTitle")

  if (urlImg && urlImg !== "" && urlImg !== "null" && urlImg !== "undefined") {
    let urlFinal = urlImg
    if (urlImg.includes("drive.google.com")) {
      const match = urlImg.match(/[-\w]{25,}/)
      if (match) {
        urlFinal = `https://drive.google.com/uc?export=view&id=${match[0]}`
      }
    }
    previewImage.src = urlFinal
    previewTitle.textContent = nome || "Instituição"
    imagePreview.classList.remove("hidden")
  }
}

document.getElementById("closeImagePreview").addEventListener("click", () => document.getElementById("imagePreview").classList.add("hidden"))
document.getElementById("previewImage").addEventListener("click", () => {
  const previewImage = document.getElementById("previewImage")
  const fullscreenImage = document.getElementById("fullscreenImage")
  const imageFullscreen = document.getElementById("imageFullscreen")
  fullscreenImage.src = previewImage.src
  imageFullscreen.classList.remove("hidden")
})
document.getElementById("closeImageFullscreen").addEventListener("click", () => document.getElementById("imageFullscreen").classList.add("hidden"))

// Dados de Instituições
const todasInstituicoes = []
let filtroAtivoBairro = ""
let filtroAtivoPolo = ""
let filtroAtivoAlunos = 0

function atualizarContagemEducacao(tipo, count) {
  const mapIds = {
    Creches: "toggleCreches", Escolas: "toggleEscolas",
    "Escolas Estaduais": "toggleEscolasEstaduais", "Escolas Particulares": "toggleEscolasParticulares",
    "Novas Construções": "toggleNovasConstrucoes",
  }
  const id = mapIds[tipo]
  if (id) {
    const checkbox = document.getElementById(id)
    if (checkbox) {
      const labelName = checkbox.parentElement.querySelector(".layer-name")
      if (labelName) labelName.textContent = `${tipo} (${count})`
    }
  }
}

function carregarInstituicoes(url, layer, icon, tipo) {
  fetch(url).then(res => res.json()).then(data => {
      const escolasAgrupadas = {}
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) return
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const nomeEscola = props.Escola || props.escola || props.name || props.nome || props.ENDEREÇO || props.OBJETO
        if (!nomeEscola) return

        if (!escolasAgrupadas[nomeEscola]) {
          escolasAgrupadas[nomeEscola] = {
            coords: coords, nome: nomeEscola, totalAlunos: 0, polo: props.Polo || props.polo,
            endereco: props.endereco || props.endereço || props.Endereco || props.Endereço || props.ENDEREÇO,
            bairro: props.bairro || props.Bairro || props.BAIRRO, tipo: props.tipo || props.Tipo,
            urlImg: props.urlimg || props.urlImg || props.url_img || props.UrlImg || props.URLFotos,
            turmas: [],
          }
        }
        const alunosTurma = Number.parseInt(props["Alunos na turma"] || props.alunos || props.Alunos || 0)
        escolasAgrupadas[nomeEscola].totalAlunos += alunosTurma
        escolasAgrupadas[nomeEscola].turmas.push(props)
      })

      const count = Object.keys(escolasAgrupadas).length
      atualizarContagemEducacao(tipo, count)

      Object.values(escolasAgrupadas).forEach((escola) => {
        const iconUrl = icon.options.iconUrl
        const markerIcon = L.divIcon({
          className: "custom-marker-with-label",
          html: `<div class="marker-container"><img src="${iconUrl}" class="marker-icon" /><div class="marker-label">${escola.nome}</div></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
        })
        const marker = L.marker([escola.coords[1], escola.coords[0]], { icon: markerIcon })
        aplicarZoomNoClick(marker)
        let popupContent = ""
        if (tipo === "Novas Construções") {
          if (escola.nome) popupContent += `<b>Nome:</b> ${escola.nome}<br>`
          if (escola.endereco) popupContent += `<b>Endereço:</b> ${escola.endereco}<br>`
          if (escola.bairro) popupContent += `<b>Bairro:</b> ${escola.bairro}<br>`
        } else {
          if (escola.nome) popupContent += `<b>Nome:</b> ${escola.nome}<br>`
          popupContent += `<b>Total de Alunos:</b> ${escola.totalAlunos}<br>`
          popupContent += `<b>Turmas:</b> ${escola.turmas.length}<br>`
          if (escola.polo) popupContent += `<b>Polo:</b> ${escola.polo}<br>`
          if (escola.endereco) popupContent += `<b>Endereço:</b> ${escola.endereco}<br>`
          if (escola.bairro) popupContent += `<b>Bairro:</b> ${escola.bairro}<br>`
          if (escola.tipo) popupContent += `<b>Tipo:</b> ${escola.tipo}<br>`
        }
        marker.bindPopup(popupContent)
        if (escola.urlImg) marker.on("click", () => mostrarImagemPreview(escola.urlImg, escola.nome))
        
        layer.addLayer(marker)
        
        todasInstituicoes.push({
          nome: escola.nome, endereco: escola.endereco, polo: escola.polo, bairro: escola.bairro,
          tipo: tipo, totalAlunos: escola.totalAlunos, marker: marker, coords: [escola.coords[1], escola.coords[0]],
        })
      })
    }).catch(error => console.error(`[v0] Erro ao carregar ${tipo}:`, error))
}

function carregarEscolasEstaduais(url, layer, icon, tipo) {
  fetch(url).then(res => res.json()).then(data => {
      let count = 0
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) return
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const nomeEscola = props.NOMES || props.ESCOLA || props.escola || props.name || props.nome
        const endereco = props.ENDEREÇO || props.endereco || props.Endereco
        const bairro = props.BAIRRO || props.bairro || props.Bairro
        const municipio = props.MUNICÍPIO || props.municipio
        if (!nomeEscola) return
        count++

        const iconUrl = icon.options.iconUrl
        const markerIcon = L.divIcon({
          className: "custom-marker-with-label estadual-marker",
          html: `<div class="marker-container"><img src="${iconUrl}" class="marker-icon" /><div class="marker-label">${nomeEscola}</div></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
        })
        const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })
        aplicarZoomNoClick(marker)
        let popupContent = `<b>Nome:</b> ${nomeEscola}<br>`
        if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
        if (bairro) popupContent += `<b>Bairro:</b> ${bairro}<br>`
        if (municipio) popupContent += `<b>Município:</b> ${municipio}<br>`
        marker.bindPopup(popupContent)
        
        layer.addLayer(marker)
        
        todasInstituicoes.push({
          nome: nomeEscola, endereco: endereco, bairro: bairro, tipo: tipo,
          totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
        })
      })
      atualizarContagemEducacao(tipo, count)
    }).catch(error => console.error(`[v0] Erro ao carregar ${tipo}:`, error))
}

function carregarUnidadesSaude() {
  fetch("../Data/Processed/Saude/Aparelhos.geojson").then(res => res.json()).then(data => {
      const unidadesPorTipo = {}
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const tipo = (feature.properties.Tipo || "Outros").trim()
        if (!unidadesPorTipo[tipo]) unidadesPorTipo[tipo] = []
        unidadesPorTipo[tipo].push(feature)
      })

      const saudeContainer = document.getElementById("saudeContainer")
      // Preserva a seção "Próximas Entregas Saúde" removendo apenas os labels de tipos
      saudeContainer.querySelectorAll("label.layer-item").forEach((el) => el.remove())
      
      // Referência para inserir antes da seção "Próximas Entregas"
      const proximasEntregasSaudeSection = saudeContainer.querySelector(".submenu-section")

      Object.keys(unidadesPorTipo).sort().forEach((tipo) => {
        const cor = coresSaude[tipo] || coresSaude["default"]
        saudeLayers[tipo] = criarClusterGroup(cor)

        unidadesPorTipo[tipo].forEach((feature) => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nomeUnidade = props.UnidadeSaude || props.unidadeSaude || props.nome || "Unidade de Saúde"
          const endereco = props.Endereco || props.endereco || ""
          const marker = L.marker([coords[1], coords[0]], { icon: criarIconeSaude(tipo, nomeUnidade) })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>${nomeUnidade}</b><br><b>Tipo:</b> ${tipo}<br>`
          if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
          marker.bindPopup(popupContent)
          
          saudeLayers[tipo].addLayer(marker)
          todasInstituicoes.push({
            nome: nomeUnidade, endereco: endereco, tipo: `Saúde - ${tipo}`, bairro: "",
            totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
          })
        })

        const label = document.createElement("label")
        label.className = "layer-item"
        label.innerHTML = `
          <input type="checkbox" class="layer-checkbox saude-tipo" data-tipo="${tipo}">
          <span class="layer-symbol" style="background-color: ${cor};"></span>
          <span class="layer-name">${tipo} (${unidadesPorTipo[tipo].length})</span>
        `
        // Insere antes da seção "Próximas Entregas" se existir, senão adiciona ao final
        if (proximasEntregasSaudeSection) {
          saudeContainer.insertBefore(label, proximasEntregasSaudeSection)
        } else {
          saudeContainer.appendChild(label)
        }
      })

      saudeContainer.querySelectorAll("input.saude-tipo").forEach((cb) => {
        cb.addEventListener("change", function () {
          const tipo = this.dataset.tipo
          const layer = saudeLayers[tipo]
          if (this.checked) { map.addLayer(layer); atualizarToggleSaude(); }
          else { map.removeLayer(layer); atualizarToggleSaude(); }
        })
      })
    }).catch(error => console.error("[v0] Erro ao carregar unidades de saúde:", error))
}

function atualizarToggleSaude() {
  const toggleSaude = document.getElementById("toggleSaude")
  const checkboxesTipo = document.querySelectorAll("#saudeContainer input.saude-tipo")
  const todosAtivos = Array.from(checkboxesTipo).every((cb) => cb.checked)
  const algumAtivo = Array.from(checkboxesTipo).some((cb) => cb.checked)
  toggleSaude.checked = todosAtivos
  toggleSaude.indeterminate = algumAtivo && !todosAtivos
}

const toggleSaude = document.getElementById("toggleSaude")
toggleSaude.addEventListener("change", function () {
  const checkboxesTipo = document.querySelectorAll("#saudeContainer input.saude-tipo")
  checkboxesTipo.forEach((cb) => {
  cb.checked = this.checked
  const tipo = cb.dataset.tipo
  const layer = saudeLayers[tipo]
  if (this.checked) map.addLayer(layer)
  else map.removeLayer(layer)
  })
  
  // Atualizar Próximas Entregas Saúde
  const toggleProximasEntregasSaude = document.getElementById("toggleProximasEntregasSaude")
  if (toggleProximasEntregasSaude) {
    toggleProximasEntregasSaude.checked = this.checked
    const checkboxesMes = document.querySelectorAll("#proximasEntregasSaudeContainer input.proximas-saude-mes")
    checkboxesMes.forEach((cb) => {
      cb.checked = this.checked
      const mes = cb.dataset.mes
      const layer = proximasEntregasSaudeLayers[mes]
      if (layer) {
        if (this.checked) map.addLayer(layer)
        else map.removeLayer(layer)
      }
    })
  }
  })

// ============================================================
// ASSISTÊNCIA SOCIAL
// ============================================================
function carregarAssistenciaSocial() {
  fetch("../Data/Processed/AssistenciaSocial/AssistenciaSocial.geojson")
    .then(res => res.json())
    .then(data => {
      const unidadesPorTipo = {}
      
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const nome = feature.properties.Nome || "Unidade"
        // Extrair tipo do nome (CRAS, CREAS, etc.)
        let tipo = "Outros"
        if (nome.toUpperCase().includes("CRAS")) tipo = "CRAS"
        else if (nome.toUpperCase().includes("CREAS")) tipo = "CREAS"
        else if (nome.toUpperCase().includes("CENTRO POP")) tipo = "Centro POP"
        else if (nome.toUpperCase().includes("CASA DE PASSAGEM")) tipo = "Casa de Passagem"
        else if (nome.toUpperCase().includes("CONSELHO TUTELAR")) tipo = "Conselho Tutelar"
        else if (nome.toUpperCase().includes("CENTRO DE ATENDIMENTO")) tipo = "Centro de Atendimento"
        else if (nome.toUpperCase().includes("CENTRAL")) tipo = "Central"
        
        if (!unidadesPorTipo[tipo]) unidadesPorTipo[tipo] = []
        unidadesPorTipo[tipo].push(feature)
      })

      const container = document.getElementById("assistenciaSocialContainer")
      container.innerHTML = ""

      Object.keys(unidadesPorTipo).sort().forEach(tipo => {
        const cor = coresAssistenciaSocial[tipo] || coresAssistenciaSocial["default"]
        assistenciaSocialLayers[tipo] = criarClusterGroup(cor)

        unidadesPorTipo[tipo].forEach(feature => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.Nome || "Unidade"
          const endereco = props.Endereço || props.endereco || ""
          const bairro = props.Bairro || props.bairro || ""
          
          const marker = L.marker([coords[1], coords[0]], { icon: criarIconeAssistenciaSocial(tipo, nome) })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>${nome}</b><br><b>Tipo:</b> ${tipo}<br>`
          if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
          if (bairro) popupContent += `<b>Bairro:</b> ${bairro}<br>`
          marker.bindPopup(popupContent)
          
          assistenciaSocialLayers[tipo].addLayer(marker)
          todasInstituicoes.push({
            nome: nome, endereco: endereco, tipo: `Assistência Social - ${tipo}`, bairro: bairro,
            totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
          })
        })

        const label = document.createElement("label")
        label.className = "layer-item"
        label.innerHTML = `
          <input type="checkbox" class="layer-checkbox assistencia-tipo" data-tipo="${tipo}">
          <span class="layer-symbol" style="background-color: ${cor};"></span>
          <span class="layer-name">${tipo} (${unidadesPorTipo[tipo].length})</span>
        `
        container.appendChild(label)
      })

      container.querySelectorAll("input.assistencia-tipo").forEach(cb => {
        cb.addEventListener("change", function() {
          const tipo = this.dataset.tipo
          const layer = assistenciaSocialLayers[tipo]
          if (this.checked) { map.addLayer(layer); atualizarToggleAssistenciaSocial() }
          else { map.removeLayer(layer); atualizarToggleAssistenciaSocial() }
        })
      })
    })
    .catch(error => console.error("[v0] Erro ao carregar Assistência Social:", error))
}

function atualizarToggleAssistenciaSocial() {
  const toggle = document.getElementById("toggleAssistenciaSocial")
  const checkboxes = document.querySelectorAll("#assistenciaSocialContainer input.assistencia-tipo")
  const todosAtivos = Array.from(checkboxes).every(cb => cb.checked)
  const algumAtivo = Array.from(checkboxes).some(cb => cb.checked)
  toggle.checked = todosAtivos
  toggle.indeterminate = algumAtivo && !todosAtivos
}

const toggleAssistenciaSocial = document.getElementById("toggleAssistenciaSocial")
toggleAssistenciaSocial.addEventListener("change", function() {
  const checkboxes = document.querySelectorAll("#assistenciaSocialContainer input.assistencia-tipo")
  checkboxes.forEach(cb => {
    cb.checked = this.checked
    const tipo = cb.dataset.tipo
    const layer = assistenciaSocialLayers[tipo]
    if (this.checked) map.addLayer(layer)
    else map.removeLayer(layer)
  })
})

// ============================================================
// CULTURA
// ============================================================
function carregarCultura() {
  fetch("../Data/Processed/Cultura/Cultura.geojson")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("culturaContainer")
      container.innerHTML = ""
      
      const cor = coresCultura["default"]
      culturaLayers["Cultura"] = criarClusterGroup(cor)
      
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const nome = props.Nome || props.nome || props.Name || "Local Cultural"
        const endereco = props.Endereço || props.endereco || ""
        const bairro = props.Bairro || props.bairro || ""
        
        const marker = L.marker([coords[1], coords[0]], { icon: criarIconeCultura(nome) })
        aplicarZoomNoClick(marker)
        let popupContent = `<b>${nome}</b><br>`
        if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
        if (bairro) popupContent += `<b>Bairro:</b> ${bairro}<br>`
        marker.bindPopup(popupContent)
        
        culturaLayers["Cultura"].addLayer(marker)
        todasInstituicoes.push({
          nome: nome, endereco: endereco, tipo: "Cultura", bairro: bairro,
          totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
        })
      })

      const label = document.createElement("label")
      label.className = "layer-item"
      label.innerHTML = `
        <input type="checkbox" class="layer-checkbox cultura-tipo" data-tipo="Cultura">
        <span class="layer-symbol" style="background-color: ${cor};"></span>
        <span class="layer-name">Locais Culturais (${data.features.length})</span>
      `
      container.appendChild(label)

      container.querySelectorAll("input.cultura-tipo").forEach(cb => {
        cb.addEventListener("change", function() {
          const layer = culturaLayers["Cultura"]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleCultura()
        })
      })
    })
    .catch(error => console.error("[v0] Erro ao carregar Cultura:", error))
}

function atualizarToggleCultura() {
  const toggle = document.getElementById("toggleCultura")
  const checkboxes = document.querySelectorAll("#culturaContainer input.cultura-tipo")
  const todosAtivos = Array.from(checkboxes).every(cb => cb.checked)
  const algumAtivo = Array.from(checkboxes).some(cb => cb.checked)
  toggle.checked = todosAtivos
  toggle.indeterminate = algumAtivo && !todosAtivos
}

const toggleCultura = document.getElementById("toggleCultura")
toggleCultura.addEventListener("change", function() {
  const checkboxes = document.querySelectorAll("#culturaContainer input.cultura-tipo")
  checkboxes.forEach(cb => {
    cb.checked = this.checked
    const layer = culturaLayers["Cultura"]
    if (this.checked) map.addLayer(layer)
    else map.removeLayer(layer)
  })
})

// ============================================================
// CIDADANIA
// ============================================================

function carregarCidadania() {
  console.log("[v0] Iniciando carregarCidadania")
  fetch("../Data/Processed/Cidadania/Cidadania.geojson")
    .then(res => {
      console.log("[v0] Resposta do fetch Cidadania:", res.status, res.ok)
      return res.json()
    })
    .then(data => {
      console.log("[v0] Dados Cidadania carregados:", data)
      console.log("[v0] Quantidade de features:", data.features ? data.features.length : 0)
      const unidadesPorTipo = {}
      
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const nome = feature.properties.Nome || "Unidade"
        // Extrair tipo do nome (CRAS, CREAS, etc.)
        let tipo = "Outros"
        if (nome.toUpperCase().includes("CRAS")) tipo = "CRAS"
        else if (nome.toUpperCase().includes("CREAS")) tipo = "CREAS"
        else if (nome.toUpperCase().includes("CENTRO POP")) tipo = "Centro POP"
        else if (nome.toUpperCase().includes("CASA DE PASSAGEM")) tipo = "Casa de Passagem"
        else if (nome.toUpperCase().includes("CONSELHO TUTELAR")) tipo = "Conselho Tutelar"
        else if (nome.toUpperCase().includes("CENTRO DE ATENDIMENTO")) tipo = "Centro de Atendimento"
        else if (nome.toUpperCase().includes("CENTRAL")) tipo = "Central"
        
        if (!unidadesPorTipo[tipo]) unidadesPorTipo[tipo] = []
        unidadesPorTipo[tipo].push(feature)
      })

      const container = document.getElementById("cidadaniaContainer")
      container.innerHTML = ""

      Object.keys(unidadesPorTipo).sort().forEach(tipo => {
        const cor = coresCidadania[tipo] || coresCidadania["default"]
        cidadaniaLayers[tipo] = criarClusterGroup(cor)

        unidadesPorTipo[tipo].forEach(feature => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.Nome || "Unidade"
          const endereco = props.Endereço || props.endereco || ""
          const bairro = props.Bairro || props.bairro || ""
          
          const marker = L.marker([coords[1], coords[0]], { icon: criarIconeCidadania(nome) })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>${nome}</b><br><b>Tipo:</b> ${tipo}<br>`
          if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
          if (bairro) popupContent += `<b>Bairro:</b> ${bairro}<br>`
          marker.bindPopup(popupContent)
          
          cidadaniaLayers[tipo].addLayer(marker)
          todasInstituicoes.push({
            nome: nome, endereco: endereco, tipo: `Cidadania - ${tipo}`, bairro: bairro,
            totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
          })
        })

        const label = document.createElement("label")
        label.className = "layer-item"
        label.innerHTML = `
          <input type="checkbox" class="layer-checkbox cidadania-tipo" data-tipo="${tipo}">
          <span class="layer-symbol" style="background-color: ${cor};"></span>
          <span class="layer-name">${tipo} (${unidadesPorTipo[tipo].length})</span>
        `
        container.appendChild(label)
      })

      container.querySelectorAll("input.cidadania-tipo").forEach(cb => {
        cb.addEventListener("change", function() {
          const tipo = this.dataset.tipo
          const layer = cidadaniaLayers[tipo]
          if (this.checked) { map.addLayer(layer); atualizarToggleCidadania() }
          else { map.removeLayer(layer); atualizarToggleCidadania() }
        })
      })
    })
    .catch(error => console.error("[v0] Erro ao carregar Cidadania:", error))
}

function atualizarToggleCidadania() {
  const toggle = document.getElementById("toggleCidadania")
  const checkboxes = document.querySelectorAll("#cidadaniaContainer input.cidadania-tipo")
  const todosAtivos = Array.from(checkboxes).every(cb => cb.checked)
  const algumAtivo = Array.from(checkboxes).some(cb => cb.checked)
  toggle.checked = todosAtivos
  toggle.indeterminate = algumAtivo && !todosAtivos
}

const toggleCidadania = document.getElementById("toggleCidadania")
toggleCidadania.addEventListener("change", function() {
  const checkboxes = document.querySelectorAll("#cidadaniaContainer input.cidadania-tipo")
  checkboxes.forEach(cb => {
    cb.checked = this.checked
    const tipo = cb.dataset.tipo
    const layer = cidadaniaLayers[tipo]
    if (this.checked) map.addLayer(layer)
    else map.removeLayer(layer)
  })
})

// ============================================================
// PRAÇAS E ÁREAS DE LAZER
// ============================================================
function carregarPracas() {
  fetch("../Data/Processed/Pracas/Praças.geojson")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("pracasContainer")
      container.innerHTML = ""
      
      const cor = coresPracas["default"]
      pracasLayers["Pracas"] = criarClusterGroup(cor)
      
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const nome = props.Name || props.Nome || props.name || "Praça"
        const ruas = props.Ruas || props.ruas || ""
        
        const marker = L.marker([coords[1], coords[0]], { icon: criarIconePraca(nome) })
        aplicarZoomNoClick(marker)
        let popupContent = `<b>${nome}</b><br>`
        if (ruas) popupContent += `<b>Localização:</b> ${ruas}<br>`
        marker.bindPopup(popupContent)
        
        pracasLayers["Pracas"].addLayer(marker)
        todasInstituicoes.push({
          nome: nome, endereco: ruas, tipo: "Praça", bairro: "",
          totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
        })
      })

      const label = document.createElement("label")
      label.className = "layer-item"
      label.innerHTML = `
        <input type="checkbox" class="layer-checkbox praca-tipo" data-tipo="Pracas">
        <span class="layer-symbol" style="background-color: ${cor};"></span>
        <span class="layer-name">Praças e Quadras (${data.features.length})</span>
      `
      container.appendChild(label)

      container.querySelectorAll("input.praca-tipo").forEach(cb => {
        cb.addEventListener("change", function() {
          const layer = pracasLayers["Pracas"]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarTogglePracas()
        })
      })
    })
    .catch(error => console.error("[v0] Erro ao carregar Praças:", error))
}

function atualizarTogglePracas() {
  const toggle = document.getElementById("togglePracas")
  const checkboxes = document.querySelectorAll("#pracasContainer input.praca-tipo")
  const todosAtivos = Array.from(checkboxes).every(cb => cb.checked)
  const algumAtivo = Array.from(checkboxes).some(cb => cb.checked)
  toggle.checked = todosAtivos
  toggle.indeterminate = algumAtivo && !todosAtivos
}

const togglePracas = document.getElementById("togglePracas")
togglePracas.addEventListener("change", function() {
  const checkboxes = document.querySelectorAll("#pracasContainer input.praca-tipo")
  checkboxes.forEach(cb => {
    cb.checked = this.checked
    const layer = pracasLayers["Pracas"]
    if (this.checked) map.addLayer(layer)
    else map.removeLayer(layer)
  })
})

// ============================================================
// TRABALHO E EMPREGO (SETRAB)
// ============================================================
function carregarTrabalho() {
  fetch("../Data/Processed/Trab/SETRAB.geojson")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("trabalhoContainer")
      container.innerHTML = ""
      
      const cor = coresTrabalho["default"]
      trabalhoLayers["Trabalho"] = criarClusterGroup(cor)
      
      data.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const nome = props.Nome || props.nome || props.descrição || "SETRAB"
        const endereco = props.descrição || props.Endereço || props.endereco || ""
        const bairro = props.Bairro || props.bairro || ""
        
        const marker = L.marker([coords[1], coords[0]], { icon: criarIconeTrabalho(nome) })
        aplicarZoomNoClick(marker)
        let popupContent = `<b>SETRAB</b><br>`
        if (endereco) popupContent += `<b>Endereço:</b> ${endereco}<br>`
        if (bairro) popupContent += `<b>Bairro:</b> ${bairro}<br>`
        marker.bindPopup(popupContent)
        
        trabalhoLayers["Trabalho"].addLayer(marker)
        todasInstituicoes.push({
          nome: nome, endereco: endereco, tipo: "Trabalho", bairro: bairro,
          totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
        })
      })

      const label = document.createElement("label")
      label.className = "layer-item"
      label.innerHTML = `
        <input type="checkbox" class="layer-checkbox trabalho-tipo" data-tipo="Trabalho">
        <span class="layer-symbol" style="background-color: ${cor};"></span>
        <span class="layer-name">Unidades SETRAB (${data.features.length})</span>
      `
      container.appendChild(label)

      container.querySelectorAll("input.trabalho-tipo").forEach(cb => {
        cb.addEventListener("change", function() {
          const layer = trabalhoLayers["Trabalho"]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleTrabalho()
        })
      })
    })
    .catch(error => console.error("[v0] Erro ao carregar Trabalho:", error))
}

function atualizarToggleTrabalho() {
  const toggle = document.getElementById("toggleTrabalho")
  const checkboxes = document.querySelectorAll("#trabalhoContainer input.trabalho-tipo")
  const todosAtivos = Array.from(checkboxes).every(cb => cb.checked)
  const algumAtivo = Array.from(checkboxes).some(cb => cb.checked)
  toggle.checked = todosAtivos
  toggle.indeterminate = algumAtivo && !todosAtivos
}

const toggleTrabalho = document.getElementById("toggleTrabalho")
toggleTrabalho.addEventListener("change", function() {
  const checkboxes = document.querySelectorAll("#trabalhoContainer input.trabalho-tipo")
  checkboxes.forEach(cb => {
    cb.checked = this.checked
    const layer = trabalhoLayers["Trabalho"]
    if (this.checked) map.addLayer(layer)
    else map.removeLayer(layer)
  })
})

function aplicarFiltros() {
  todasInstituicoes.forEach((inst) => {
    let mostrar = true
    if (filtroAtivoBairro && inst.bairro) {
      const bairroInstNormalizado = normalizarNomeBairro(inst.bairro)
      const bairroFiltroNormalizado = normalizarNomeBairro(filtroAtivoBairro)
      if (bairroInstNormalizado !== bairroFiltroNormalizado) mostrar = false
    } else if (filtroAtivoBairro && !inst.bairro) mostrar = false
    if (filtroAtivoPolo && String(inst.polo) !== String(filtroAtivoPolo)) mostrar = false
    if (filtroAtivoAlunos > 0 && inst.totalAlunos < filtroAtivoAlunos) mostrar = false

    let targetLayer = null
    if (inst.tipo === "Creches") targetLayer = crechesLayer
    else if (inst.tipo === "Escolas") targetLayer = escolasLayer
    else if (inst.tipo === "Escolas Estaduais") targetLayer = escolasEstaduaisLayer
    else if (inst.tipo === "Escolas Particulares") targetLayer = escolasParticularesLayer
    else if (inst.tipo === "Novas Construções") targetLayer = novasConstrucoesLayer
    else if (inst.tipo.startsWith("Saúde")) {
       const subtipo = inst.tipo.replace("Saúde - ", "")
       targetLayer = saudeLayers[subtipo]
    }
    else if (inst.tipo.startsWith("Assistência Social")) {
       const subtipo = inst.tipo.replace("Assistência Social - ", "")
       targetLayer = assistenciaSocialLayers[subtipo]
    }
    else if (inst.tipo === "Cultura") targetLayer = culturaLayers["Cultura"]
    else if (inst.tipo === "Praça") targetLayer = pracasLayers["Pracas"]
    else if (inst.tipo === "Trabalho") targetLayer = trabalhoLayers["Trabalho"]

    if (targetLayer) {
       if (mostrar) { if (!targetLayer.hasLayer(inst.marker)) targetLayer.addLayer(inst.marker) }
       else { targetLayer.removeLayer(inst.marker) }
    }
  })
}

function popularFiltros() {
  const bairrosUnicos = new Set()
  const polosUnicos = new Set()
  todasInstituicoes.forEach((inst) => {
    if (inst.bairro) bairrosUnicos.add(normalizarNomeBairro(inst.bairro))
    if (inst.polo) polosUnicos.add(String(inst.polo))
  })
  const filterBairro = document.getElementById("filterBairro")
  Array.from(bairrosUnicos).sort().forEach((bairro) => {
    const option = document.createElement("option")
    option.value = bairro; option.textContent = bairro
    filterBairro.appendChild(option)
  })
  const filterPolo = document.getElementById("filterPolo")
  Array.from(polosUnicos).sort((a, b) => Number(a) - Number(b)).forEach((polo) => {
    const option = document.createElement("option")
    option.value = polo; option.textContent = `Polo ${polo}`
    filterPolo.appendChild(option)
  })
}

document.getElementById("toggleFilters").addEventListener("click", () => document.getElementById("filtersContainer").classList.toggle("hidden"))
document.getElementById("filterBairro").addEventListener("change", (e) => { filtroAtivoBairro = e.target.value; aplicarFiltros() })
document.getElementById("filterPolo").addEventListener("change", (e) => { filtroAtivoPolo = e.target.value; aplicarFiltros() })
document.getElementById("filterAlunos").addEventListener("input", (e) => { filtroAtivoAlunos = Number.parseInt(e.target.value) || 0; aplicarFiltros() })
document.getElementById("clearFilters").addEventListener("click", () => {
  filtroAtivoBairro = ""; filtroAtivoPolo = ""; filtroAtivoAlunos = 0
  document.getElementById("filterBairro").value = ""; document.getElementById("filterPolo").value = ""; document.getElementById("filterAlunos").value = ""
  aplicarFiltros()
})

carregarDadosCriancas()
carregarInstituicoes("../Data/Processed/Educação/NewCreches.geojson", crechesLayer, crecheIcon, "Creches")
carregarInstituicoes("../Data/Processed/Educação/NewEscolas.geojson", escolasLayer, escolaIcon, "Escolas")
carregarEscolasEstaduais("../Data/Processed/Educação/EscolasEstaduais.geojson", escolasEstaduaisLayer, escolaEstadualIcon, "Escolas Estaduais")
carregarEscolasEstaduais("../Data/Processed/Educação/EscolasParticulares.geojson", escolasParticularesLayer, escolaParticularIcon, "Escolas Particulares")
carregarProximasEntregas()
carregarUnidadesSaude()
carregarProximasEntregasSaude()
carregarAssistenciaSocial()
carregarCultura()
carregarCidadania()
carregarPracas()
carregarTrabalho()

// Event listeners para checkboxes individuais de Educacao
toggleCreches.addEventListener("change", function () {
  if (this.checked) map.addLayer(crechesLayer)
  else map.removeLayer(crechesLayer)
  atualizarToggleMunicipal()
})

toggleEscolas.addEventListener("change", function () {
  if (this.checked) map.addLayer(escolasLayer)
  else map.removeLayer(escolasLayer)
  atualizarToggleMunicipal()
})

toggleEscolasEstaduais.addEventListener("change", function () {
  if (this.checked) map.addLayer(escolasEstaduaisLayer)
  else map.removeLayer(escolasEstaduaisLayer)
  atualizarToggleOutros()
})

toggleEscolasParticulares.addEventListener("change", function () {
  if (this.checked) map.addLayer(escolasParticularesLayer)
  else map.removeLayer(escolasParticularesLayer)
  atualizarToggleOutros()
})

if (toggleNovasConstrucoes) {
  toggleNovasConstrucoes.addEventListener("change", function () {
    if (this.checked) map.addLayer(novasConstrucoesLayer)
    else map.removeLayer(novasConstrucoesLayer)
  })
}

// Funções para atualizar estado dos toggles Municipal e Outros
function atualizarToggleMunicipal() {
  const creches = toggleCreches.checked
  const escolas = toggleEscolas.checked
  toggleMunicipal.checked = creches && escolas
  toggleMunicipal.indeterminate = (creches || escolas) && !(creches && escolas)
}

function atualizarToggleOutros() {
  const estaduais = toggleEscolasEstaduais.checked
  const particulares = toggleEscolasParticulares.checked
  toggleOutros.checked = estaduais && particulares
  toggleOutros.indeterminate = (estaduais || particulares) && !(estaduais && particulares)
}

// Funcao para carregar Proximas Entregas agrupadas por mes
function carregarProximasEntregas() {
  fetch("../Data/Processed/Educação/NovasConstruçõesANDLocacao.geojson")
    .then((res) => res.json())
    .then((data) => {
      const porMes = {}
      const semPrazo = []

      data.features.forEach((feature) => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const props = feature.properties
        const prazoEntrega = props.PRAZO_ENTREGA || ""

        if (!prazoEntrega || prazoEntrega.trim() === "") {
          semPrazo.push(feature)
        } else {
          // Formato DD/MM/AAAA
          const partes = prazoEntrega.split("/")
          if (partes.length === 3) {
            const mes = Number.parseInt(partes[1], 10) - 1 // 0-indexed
            const nomeMes = nomesMeses[mes] || "Desconhecido"
            if (!porMes[nomeMes]) porMes[nomeMes] = []
            porMes[nomeMes].push({ feature, prazo: prazoEntrega })
          } else {
            semPrazo.push(feature)
          }
        }
      })

      const container = document.getElementById("proximasEntregasContainer")
      container.innerHTML = ""

      // Ordenar meses pela ordem do ano
      const mesesComDados = Object.keys(porMes).sort((a, b) => nomesMeses.indexOf(a) - nomesMeses.indexOf(b))

      // Criar subcamadas para cada mes
      mesesComDados.forEach((nomeMes) => {
        proximasEntregasLayers[nomeMes] = criarClusterGroup("#ffa500")

        const mesDiv = document.createElement("div")
        mesDiv.className = "submenu-section submenu-nested"
        mesDiv.innerHTML = `
          <div class="submenu-header" data-submenu="mes-${nomeMes}">
            <input type="checkbox" class="layer-checkbox proximas-mes" data-mes="${nomeMes}">
            <span class="submenu-title">${nomeMes}</span>
            <span class="submenu-icon">▼</span>
          </div>
          <div id="mes-${nomeMes}-container" class="submenu-content collapsed"></div>
        `
        container.appendChild(mesDiv)

        const mesContainer = mesDiv.querySelector(`#mes-${nomeMes}-container`)

        porMes[nomeMes].forEach(({ feature, prazo }) => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.OBJETO || props.ENDEREÇO || "Nova Construcao"
          const endereco = props.ENDEREÇO || ""

          const markerIcon = L.divIcon({
            className: "custom-marker-with-label",
            html: `<div class="marker-container"><img src="../Include/Img/novasinstituicoes-icon.png" class="marker-icon" /><div class="marker-label">${nome}</div></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          })

          const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>Nome:</b> ${nome}<br>`
          if (endereco) popupContent += `<b>Endereco:</b> ${endereco}<br>`
          popupContent += `<b>Prazo de Entrega:</b> ${prazo}<br>`
          marker.bindPopup(popupContent)
          proximasEntregasLayers[nomeMes].addLayer(marker)

          // Item na lista
          const item = document.createElement("label")
          item.className = "layer-item layer-item-small"
          item.innerHTML = `<span class="layer-name-small">${nome} (${prazo})</span>`
          mesContainer.appendChild(item)

          todasInstituicoes.push({
            nome: nome,
            endereco: endereco,
            tipo: "Proximas Entregas",
            bairro: "",
            totalAlunos: 0,
            marker: marker,
            coords: [coords[1], coords[0]],
          })
        })

        // Event listener para checkbox do mes
        mesDiv.querySelector("input.proximas-mes").addEventListener("change", function () {
          const mes = this.dataset.mes
          const layer = proximasEntregasLayers[mes]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleProximasEntregas()
        })

        // Accordion para o mes
        mesDiv.querySelector(".submenu-header").addEventListener("click", function (e) {
          if (e.target.type === "checkbox") return
          const content = mesDiv.querySelector(".submenu-content")
          content.classList.toggle("collapsed")
          this.classList.toggle("collapsed")
        })
      })

      // Criar subcamada "Sem Prazo"
      if (semPrazo.length > 0) {
        proximasEntregasLayers["Sem Prazo"] = criarClusterGroup("#999999")

        const semPrazoDiv = document.createElement("div")
        semPrazoDiv.className = "submenu-section submenu-nested"
        semPrazoDiv.innerHTML = `
          <div class="submenu-header" data-submenu="sem-prazo">
            <input type="checkbox" class="layer-checkbox proximas-mes" data-mes="Sem Prazo">
            <span class="submenu-title">Sem Prazo</span>
            <span class="submenu-icon">▼</span>
          </div>
          <div id="sem-prazo-container" class="submenu-content collapsed"></div>
        `
        container.appendChild(semPrazoDiv)

        const semPrazoContainer = semPrazoDiv.querySelector("#sem-prazo-container")

        semPrazo.forEach((feature) => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.OBJETO || props.ENDEREÇO || "Nova Construcao"
          const endereco = props.ENDEREÇO || ""

          const markerIcon = L.divIcon({
            className: "custom-marker-with-label",
            html: `<div class="marker-container"><img src="../Include/Img/novasinstituicoes-icon.png" class="marker-icon" /><div class="marker-label">${nome}</div></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          })

          const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>Nome:</b> ${nome}<br>`
          if (endereco) popupContent += `<b>Endereco:</b> ${endereco}<br>`
          popupContent += `<b>Prazo de Entrega:</b> Nao definido<br>`
          marker.bindPopup(popupContent)
          proximasEntregasLayers["Sem Prazo"].addLayer(marker)

          // Item na lista
          const item = document.createElement("label")
          item.className = "layer-item layer-item-small"
          item.innerHTML = `<span class="layer-name-small">${nome}</span>`
          semPrazoContainer.appendChild(item)

          todasInstituicoes.push({
            nome: nome,
            endereco: endereco,
            tipo: "Proximas Entregas",
            bairro: "",
            totalAlunos: 0,
            marker: marker,
            coords: [coords[1], coords[0]],
          })
        })

        semPrazoDiv.querySelector("input.proximas-mes").addEventListener("change", function () {
          const layer = proximasEntregasLayers["Sem Prazo"]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleProximasEntregas()
        })

        semPrazoDiv.querySelector(".submenu-header").addEventListener("click", function (e) {
          if (e.target.type === "checkbox") return
          const content = semPrazoDiv.querySelector(".submenu-content")
          content.classList.toggle("collapsed")
          this.classList.toggle("collapsed")
        })
      }

      // Toggle principal de Proximas Entregas
      const toggleProximasEntregas = document.getElementById("toggleProximasEntregas")
      toggleProximasEntregas.addEventListener("change", function () {
        const checkboxesMes = document.querySelectorAll("#proximasEntregasContainer input.proximas-mes")
        checkboxesMes.forEach((cb) => {
          cb.checked = this.checked
          const mes = cb.dataset.mes
          const layer = proximasEntregasLayers[mes]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
        })
      })

    })
    .catch((error) => console.error("[v0] Erro ao carregar proximas entregas:", error))
}

function atualizarToggleProximasEntregas() {
  const toggleProximasEntregas = document.getElementById("toggleProximasEntregas")
  const checkboxesMes = document.querySelectorAll("#proximasEntregasContainer input.proximas-mes")
  const todosAtivos = Array.from(checkboxesMes).every((cb) => cb.checked)
  const algumAtivo = Array.from(checkboxesMes).some((cb) => cb.checked)
  toggleProximasEntregas.checked = todosAtivos
  toggleProximasEntregas.indeterminate = algumAtivo && !todosAtivos
}

// ============================================================
// PRÓXIMAS ENTREGAS SAÚDE
// ============================================================
function carregarProximasEntregasSaude() {
  fetch("../Data/Processed/Saude/PrazoEntregaSaude.geojson")
    .then((res) => res.json())
    .then((data) => {
      const porMes = {}
      const semPrazo = []

      data.features.forEach((feature) => {
        if (!feature.geometry || !feature.geometry.coordinates) return
        const prazo = feature.properties.Prazo || ""
        
        if (prazo && prazo.trim() !== "") {
          // Parse da data no formato DD/MM/YYYY
          const partes = prazo.split("/")
          if (partes.length === 3) {
            const mesIndex = Number.parseInt(partes[1], 10) - 1
            const nomeMes = nomesMeses[mesIndex]
            if (nomeMes) {
              if (!porMes[nomeMes]) porMes[nomeMes] = []
              porMes[nomeMes].push(feature)
            } else {
              semPrazo.push(feature)
            }
          } else {
            semPrazo.push(feature)
          }
        } else {
          semPrazo.push(feature)
        }
      })

      const container = document.getElementById("proximasEntregasSaudeContainer")
      container.innerHTML = ""

      // Ordenar meses pela ordem do ano
      const mesesComDados = Object.keys(porMes).sort((a, b) => nomesMeses.indexOf(a) - nomesMeses.indexOf(b))

      // Criar subcamadas para cada mês
      mesesComDados.forEach((nomeMes) => {
        proximasEntregasSaudeLayers[nomeMes] = criarClusterGroup("#e6194b")

        const mesDiv = document.createElement("div")
        mesDiv.className = "submenu-section submenu-nested"
        mesDiv.innerHTML = `
          <div class="submenu-header" data-submenu="saude-mes-${nomeMes}">
            <input type="checkbox" class="layer-checkbox proximas-saude-mes" data-mes="${nomeMes}">
            <span class="submenu-title">${nomeMes} (${porMes[nomeMes].length})</span>
            <span class="submenu-icon">▼</span>
          </div>
          <div id="saudeMes${nomeMes}Container" class="submenu-content collapsed"></div>
        `
        container.appendChild(mesDiv)

        const mesContainer = mesDiv.querySelector(`#saudeMes${nomeMes}Container`)

        // Adicionar marcadores para este mês
        porMes[nomeMes].forEach((feature) => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.NAME || "Unidade de Saúde"
          const prazo = props.Prazo || ""
          const link = props.Link || ""

          const markerIcon = criarIconeSaudeProximasEntregas(nome)

          const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>Nome:</b> ${nome}<br>`
          popupContent += `<b>Prazo de Entrega:</b> ${prazo ? prazo : "Prazo de entrega não definido"}<br>`
          if (prazo && link) {
            popupContent += `<button class="popup-btn-acompanhamento" onclick="window.location.href='${link}'">Acompanhamento</button>`
          }
          marker.bindPopup(popupContent)
          proximasEntregasSaudeLayers[nomeMes].addLayer(marker)

          // Item na lista
          const item = document.createElement("label")
          item.className = "layer-item layer-item-small"
          item.innerHTML = `<span class="layer-name-small">${nome} (${prazo})</span>`
          item.style.cursor = "pointer"
          item.addEventListener("click", () => {
            map.setView([coords[1], coords[0]], 18, { animate: true })
            marker.openPopup()
          })
          mesContainer.appendChild(item)

          todasInstituicoes.push({
            nome: nome, endereco: "", tipo: "Saúde - Próximas Entregas", bairro: "",
            totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
          })
        })

        // Event listener para checkbox do mês
        mesDiv.querySelector("input.proximas-saude-mes").addEventListener("change", function () {
          const mes = this.dataset.mes
          const layer = proximasEntregasSaudeLayers[mes]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleProximasEntregasSaude()
        })

        // Accordion para expandir/recolher itens do mês
        mesDiv.querySelector(".submenu-header").addEventListener("click", function (e) {
          if (e.target.type === "checkbox") return
          const mesContent = mesDiv.querySelector(".submenu-content")
          mesContent.classList.toggle("collapsed")
          this.classList.toggle("collapsed")
        })
      })

      // Criar subcamada "Sem Prazo"
      if (semPrazo.length > 0) {
        proximasEntregasSaudeLayers["Sem Prazo Saude"] = criarClusterGroup("#999999")

        const semPrazoDiv = document.createElement("div")
        semPrazoDiv.className = "submenu-section submenu-nested"
        semPrazoDiv.innerHTML = `
          <div class="submenu-header" data-submenu="saude-sem-prazo">
            <input type="checkbox" class="layer-checkbox proximas-saude-mes" data-mes="Sem Prazo Saude">
            <span class="submenu-title">Sem Prazo (${semPrazo.length})</span>
            <span class="submenu-icon">▼</span>
          </div>
          <div id="saudeSemPrazoContainer" class="submenu-content collapsed"></div>
        `
        container.appendChild(semPrazoDiv)

        const semPrazoContainer = semPrazoDiv.querySelector("#saudeSemPrazoContainer")

        semPrazo.forEach((feature) => {
          const props = feature.properties
          const coords = feature.geometry.coordinates
          const nome = props.NAME || "Unidade de Saúde"

          const markerIcon = criarIconeSaudeProximasEntregas(nome)

          const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })
          aplicarZoomNoClick(marker)
          let popupContent = `<b>Nome:</b> ${nome}<br>`
          popupContent += `<b>Prazo de Entrega:</b> Prazo de entrega não definido<br>`
          marker.bindPopup(popupContent)
          proximasEntregasSaudeLayers["Sem Prazo Saude"].addLayer(marker)

          // Item na lista
          const item = document.createElement("label")
          item.className = "layer-item layer-item-small"
          item.innerHTML = `<span class="layer-name-small">${nome}</span>`
          item.style.cursor = "pointer"
          item.addEventListener("click", () => {
            map.setView([coords[1], coords[0]], 18, { animate: true })
            marker.openPopup()
          })
          semPrazoContainer.appendChild(item)

          todasInstituicoes.push({
            nome: nome, endereco: "", tipo: "Saúde - Próximas Entregas", bairro: "",
            totalAlunos: 0, marker: marker, coords: [coords[1], coords[0]],
          })
        })

        semPrazoDiv.querySelector("input.proximas-saude-mes").addEventListener("change", function () {
          const layer = proximasEntregasSaudeLayers["Sem Prazo Saude"]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
          atualizarToggleProximasEntregasSaude()
        })

        semPrazoDiv.querySelector(".submenu-header").addEventListener("click", function (e) {
          if (e.target.type === "checkbox") return
          const content = semPrazoDiv.querySelector(".submenu-content")
          content.classList.toggle("collapsed")
          this.classList.toggle("collapsed")
        })
      }

      // Toggle principal de Próximas Entregas Saúde
      const toggleProximasEntregasSaude = document.getElementById("toggleProximasEntregasSaude")
      toggleProximasEntregasSaude.addEventListener("change", function () {
        const checkboxesMes = document.querySelectorAll("#proximasEntregasSaudeContainer input.proximas-saude-mes")
        checkboxesMes.forEach((cb) => {
          cb.checked = this.checked
          const mes = cb.dataset.mes
          const layer = proximasEntregasSaudeLayers[mes]
          if (this.checked) map.addLayer(layer)
          else map.removeLayer(layer)
        })
      })

    })
    .catch((error) => console.error("[v0] Erro ao carregar proximas entregas saude:", error))
}

function atualizarToggleProximasEntregasSaude() {
  const toggleProximasEntregasSaude = document.getElementById("toggleProximasEntregasSaude")
  const checkboxesMes = document.querySelectorAll("#proximasEntregasSaudeContainer input.proximas-saude-mes")
  const todosAtivos = Array.from(checkboxesMes).every((cb) => cb.checked)
  const algumAtivo = Array.from(checkboxesMes).some((cb) => cb.checked)
  toggleProximasEntregasSaude.checked = todosAtivos
  toggleProximasEntregasSaude.indeterminate = algumAtivo && !todosAtivos
}

setTimeout(() => { popularFiltros(); console.log("[v0] Filtros populados") }, 2000)

/* =================================================================
   LÓGICA DO BOTÃO "AGRUPAR MARCADORES" (TOGGLE)
   ================================================================= */
const clusterToggle = document.getElementById('clusterToggle');

clusterToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    const newRadius = isEnabled ? 50 : 0;
    
const saudeLayerList = Object.values(saudeLayers);
  const assistenciaLayerList = Object.values(assistenciaSocialLayers);
  const culturaLayerList = Object.values(culturaLayers);
  const cidadaniaLayerList = Object.values(cidadaniaLayers);
  const pracasLayerList = Object.values(pracasLayers);
  const trabalhoLayerList = Object.values(trabalhoLayers);
  const allLayers = [
  crechesLayer, escolasLayer, escolasEstaduaisLayer, escolasParticularesLayer, novasConstrucoesLayer, 
  ...saudeLayerList, ...assistenciaLayerList, ...culturaLayerList, ...cidadaniaLayerList, ...pracasLayerList, ...trabalhoLayerList
  ];

    allLayers.forEach(layer => {
        const markers = layer.getLayers();
        layer.clearLayers();
        // AQUI ESTÁ A CORREÇÃO: Forçar raio 0 desabilita agrupamento visualmente
        layer.options.maxClusterRadius = newRadius; 
        layer.addLayers(markers);
    });
});

const searchInput = document.getElementById("searchInput")
const searchSuggestions = document.getElementById("searchSuggestions")
let searchCircle = null

document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase()
  if (query.length === 0) { searchSuggestions.classList.add("hidden"); searchSuggestions.innerHTML = ""; return }

  const resultados = todasInstituicoes.filter((inst) => 
    inst.nome.toLowerCase().includes(query) || (inst.endereco && inst.endereco.toLowerCase().includes(query)) || (inst.bairro && inst.bairro.toLowerCase().includes(query))
  )

  searchSuggestions.innerHTML = ""
  if (query.length >= 3) {
    const addressItem = document.createElement("div")
    addressItem.className = "search-suggestion-item search-address-item"
    addressItem.innerHTML = `<div class="suggestion-name">🔍 Buscar endereço: "<strong>${query}</strong>"</div><div class="suggestion-details">Pesquisar rua/endereço</div>`
    addressItem.addEventListener("click", () => buscarEndereco(query))
    searchSuggestions.appendChild(addressItem)
  }

  if (resultados.length === 0 && query.length < 3) { searchSuggestions.classList.add("hidden"); return }
  if (resultados.length > 0) {
    const separator = document.createElement("div"); separator.className = "search-separator"; separator.textContent = "Instituições"
    searchSuggestions.appendChild(separator)
  }

  resultados.slice(0, 10).forEach((inst) => {
    const item = document.createElement("div")
    item.className = "search-suggestion-item"
    item.innerHTML = `<div class="suggestion-name">${inst.nome}</div><div class="suggestion-details">${inst.tipo} • ${inst.bairro || ''}</div>`
    item.addEventListener("click", () => {
      if (searchCircle) map.removeLayer(searchCircle)
      
      let layerToActivate = null; let toggleToActivate = null
      if (inst.tipo === "Creches") { layerToActivate = crechesLayer; toggleToActivate = toggleCreches }
      else if (inst.tipo === "Escolas") { layerToActivate = escolasLayer; toggleToActivate = toggleEscolas }
      else if (inst.tipo === "Escolas Estaduais") { layerToActivate = escolasEstaduaisLayer; toggleToActivate = toggleEscolasEstaduais }
      else if (inst.tipo === "Escolas Particulares") { layerToActivate = escolasParticularesLayer; toggleToActivate = toggleEscolasParticulares }
      else if (inst.tipo === "Novas Construções") { layerToActivate = novasConstrucoesLayer; toggleToActivate = toggleNovasConstrucoes }
      else if (inst.tipo.startsWith("Saúde")) {
         const subtipo = inst.tipo.replace("Saúde - ", "")
         layerToActivate = saudeLayers[subtipo]
         const cb = document.querySelector(`input.saude-tipo[data-tipo="${subtipo}"]`); if(cb) cb.checked = true
      }
      else if (inst.tipo.startsWith("Assistência Social")) {
         const subtipo = inst.tipo.replace("Assistência Social - ", "")
         layerToActivate = assistenciaSocialLayers[subtipo]
         const cb = document.querySelector(`input.assistencia-tipo[data-tipo="${subtipo}"]`); if(cb) cb.checked = true
      }
      else if (inst.tipo.startsWith("Cidadania")) {
         const subtipo = inst.tipo.replace("Cidadania - ", "")
         layerToActivate = cidadaniaLayers[subtipo]
         const cb = document.querySelector(`input.cidadania-tipo[data-tipo="${subtipo}"]`); if(cb) cb.checked = true
      }
      else if (inst.tipo === "Cultura") {
         layerToActivate = culturaLayers["Cultura"]
         const cb = document.querySelector('input.cultura-tipo[data-tipo="Cultura"]'); if(cb) cb.checked = true
      }
      else if (inst.tipo === "Praça") {
         layerToActivate = pracasLayers["Pracas"]
         const cb = document.querySelector('input.praca-tipo[data-tipo="Pracas"]'); if(cb) cb.checked = true
      }
      else if (inst.tipo === "Trabalho") {
         layerToActivate = trabalhoLayers["Trabalho"]
         const cb = document.querySelector('input.trabalho-tipo[data-tipo="Trabalho"]'); if(cb) cb.checked = true
      }

      if (layerToActivate) {
         if (!map.hasLayer(layerToActivate)) { map.addLayer(layerToActivate); if(toggleToActivate) toggleToActivate.checked = true }
         if (layerToActivate.zoomToShowLayer) { layerToActivate.zoomToShowLayer(inst.marker, () => inst.marker.openPopup()) } 
         else { map.setView(inst.coords, 18, { animate: true }); inst.marker.openPopup() }
      }
      searchSuggestions.classList.add("hidden"); searchInput.value = inst.nome
    })
    searchSuggestions.appendChild(item)
  })
  searchSuggestions.classList.remove("hidden")
})

document.getElementById("searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); buscarEndereco(searchInput.value.trim()) } })
document.addEventListener("click", (e) => { if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) { searchSuggestions.classList.add("hidden"); if(searchCircle) map.removeLayer(searchCircle) } })
map.on("popupopen", () => { 
  const btn = document.querySelector(".ver-criancas-btn"); 
  if (btn) {
    btn.addEventListener("click", (e) => { 
      e.stopPropagation(); 
      mostrarDadosCriancas(btn.dataset.bairro) 
    }) 
  }
})
document.addEventListener("click", (e) => { 
  if (e.target.classList.contains("ver-criancas-btn")) { 
    e.stopPropagation(); 
    mostrarDadosCriancas(e.target.dataset.bairro) 
  } 
})

function normalizarNomeBairro(nome) { if (!nome) return ""; return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim() }
function buscarEndereco(query) { console.log("Buscando endereço:", query) }

// --- Lógica Corrigida para Abas "Municipal" e "Outros" ---

// Configuração da aba Municipal
const municipalHeader = document.querySelector('.submenu-header[data-submenu="municipal"]');
if (municipalHeader) {
  municipalHeader.addEventListener("click", function (e) {
    // Evita fechar/abrir se o clique foi no checkbox
    if (e.target.type === "checkbox") return;
    
    const content = document.getElementById("municipalContainer");
    if (content) {
      content.classList.toggle("collapsed");
      this.classList.toggle("collapsed");
    }
  });
}

// Configuração da aba Outros
const outrosHeader = document.querySelector('.submenu-header[data-submenu="outros"]');
if (outrosHeader) {
  outrosHeader.addEventListener("click", function (e) {
    // Evita fechar/abrir se o clique foi no checkbox
    if (e.target.type === "checkbox") return;
    
    const content = document.getElementById("outrosContainer");
    if (content) {
      content.classList.toggle("collapsed");
      this.classList.toggle("collapsed");
    }
  });
}
