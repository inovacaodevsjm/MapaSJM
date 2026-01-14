// Importa a biblioteca Leaflet
const L = window.L

console.log("[v0] Inicializando mapa...")

var map = L.map("map", { zoomControl: false }).setView([-22.805, -43.372], 13)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map)

document.getElementById("zoomIn").addEventListener("click", () => {
  map.zoomIn()
})

document.getElementById("zoomOut").addEventListener("click", () => {
  map.zoomOut()
})

const fullscreenBtn = document.getElementById("fullscreenBtn")

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    // Entrar em fullscreen
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("[v0] Erro ao entrar em fullscreen:", err)
    })
  } else {
    // Sair de fullscreen
    document.exitFullscreen()
  }
})

// Atualizar ícone do botão quando o estado de fullscreen mudar
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenBtn.textContent = "⛶" // Ícone para sair de fullscreen
    fullscreenBtn.title = "Sair da tela cheia"
  } else {
    fullscreenBtn.textContent = "⛶" // Ícone para entrar em fullscreen
    fullscreenBtn.title = "Tela cheia"
  }
})

console.log("[v0] Mapa inicializado com sucesso")

const menuToggle = document.getElementById("menuToggle")
const menu = document.getElementById("menu")

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("collapsed")
})

document.querySelectorAll(".section-header[data-section]").forEach((header) => {
  const sectionName = header.dataset.section
  const content = document.getElementById(`${sectionName}Container`)
  const icon = header.querySelector(".section-icon")

  header.addEventListener("click", (e) => {
    // Não colapsar se clicar no checkbox
    if (e.target.type === "checkbox") return

    content.classList.toggle("collapsed")
    header.classList.toggle("collapsed")
  })
})

// Array de cores para bairros
const coresBairros = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
]

let corIndex = 0
const bairroLayers = {} // Armazena cada camada por nome do bairro

let childrenDataCache = null

function carregarDadosCriancas() {
  fetch("../Data/Processed/Educação/faixaetaria_criancas_sjm.geojson")
    .then((res) => {
      console.log("[v0] Carregando dados de crianças:", res.status)
      if (!res.ok) {
        throw new Error(`Erro ao carregar dados de crianças: ${res.status}`)
      }
      return res.json()
    })
    .then((data) => {
      console.log("[v0] Dados de crianças carregados:", data.features.length, "bairros")
      // Create a map for quick lookup by neighborhood name
      childrenDataCache = {}
      data.features.forEach((feature) => {
        const nomeBairro = feature.properties["Crianças de 0 a 5 anos por bairro"]
        childrenDataCache[nomeBairro] = feature.properties
      })
    })
    .catch((error) => {
      console.error("[v0] Erro ao carregar dados de crianças:", error)
    })
}

function mostrarDadosCriancas(nomeBairro) {
  const normalizar = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  }

  const nomeBairroNormalizado = normalizar(nomeBairro)
  let dadosEncontrados = null

  // Procurar os dados normalizando ambos os nomes
  if (childrenDataCache) {
    for (const [nomeCache, dados] of Object.entries(childrenDataCache)) {
      if (normalizar(nomeCache) === nomeBairroNormalizado) {
        dadosEncontrados = dados
        break
      }
    }
  }

  if (!dadosEncontrados) {
    console.warn("[v0] Dados não encontrados para bairro:", nomeBairro)
    return
  }

  const dados = dadosEncontrados
  const modal = document.getElementById("childrenDataModal")
  const title = document.getElementById("childrenDataTitle")
  const container = document.getElementById("childrenDataTableContainer")

  title.textContent = `Sumário de Crianças - ${nomeBairro}`

  // Create table with age group data
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

document.getElementById("childrenDataModal").addEventListener("click", (e) => {
  if (e.target.id === "childrenDataModal") {
    document.getElementById("childrenDataModal").classList.add("hidden")
  }
})

// Carrega os bairros
fetch("../Data/Processed/Bairros/bairros_clean.geojson")
  .then((res) => {
    console.log("[v0] Resposta do fetch:", res.status)
    if (!res.ok) {
      throw new Error(`Erro ao carregar GeoJSON: ${res.status}`)
    }
    return res.json()
  })
  .then((data) => {
    console.log("[v0] GeoJSON carregado:", data.features.length, "bairros")
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
        <span class="layer-icon" style="background-color: ${cor};"></span>
        <span class="layer-name">${feature.properties.name}</span>
      `
      bairrosContainer.appendChild(label)
    })

    console.log("[v0] Todos os bairros foram adicionados ao mapa")

    bairrosContainer.querySelectorAll("input.bairro").forEach((cb) => {
      cb.addEventListener("change", function () {
        const bairro = this.dataset.bairro
        const layer = bairroLayers[bairro]
        if (this.checked) {
          layer.addTo(map)
        } else {
          map.removeLayer(layer)
        }
      })
    })
  })
  .catch((error) => {
    console.error("[v0] Erro ao carregar bairros:", error)
    alert("Erro ao carregar o arquivo de bairros. Verifique o caminho: Data/Processed/Bairros/bairros_clean.geojson")
  })

const toggleBairros = document.getElementById("toggleBairros")
const bairrosContainer = document.getElementById("bairrosContainer")

toggleBairros.addEventListener("change", function () {
  if (!this.checked) {
    bairrosContainer.querySelectorAll("input.bairro").forEach((cb) => {
      cb.checked = false
      const bairro = cb.dataset.bairro
      map.removeLayer(bairroLayers[bairro])
    })
  } else {
    bairrosContainer.querySelectorAll("input.bairro").forEach((cb) => {
      cb.checked = true
      const bairro = cb.dataset.bairro
      bairroLayers[bairro].addTo(map)
    })
  }
})

const toggleEducacao = document.getElementById("toggleEducacao")
const toggleCreches = document.getElementById("toggleCreches")
const toggleEscolas = document.getElementById("toggleEscolas")
const toggleEscolasEstaduais = document.getElementById("toggleEscolasEstaduais")
const toggleEscolasParticulares = document.getElementById("toggleEscolasParticulares")
const toggleNovasConstrucoes = document.getElementById("toggleNovasConstrucoes")

toggleEducacao.addEventListener("change", function () {
  toggleCreches.checked = this.checked
  toggleEscolas.checked = this.checked
  toggleEscolasEstaduais.checked = this.checked
  toggleEscolasParticulares.checked = this.checked
  toggleNovasConstrucoes.checked = this.checked

  if (this.checked) {
    crechesLayer.addTo(map)
    escolasLayer.addTo(map)
    escolasEstaduaisLayer.addTo(map)
    escolasParticularesLayer.addTo(map)
    novasConstrucoesLayer.addTo(map)
  } else {
    map.removeLayer(crechesLayer)
    map.removeLayer(escolasLayer)
    map.removeLayer(escolasEstaduaisLayer)
    map.removeLayer(escolasParticularesLayer)
    map.removeLayer(novasConstrucoesLayer)
  }
})

const crechesLayer = L.layerGroup()
const escolasLayer = L.layerGroup()
const escolasEstaduaisLayer = L.layerGroup()
const escolasParticularesLayer = L.layerGroup()
const novasConstrucoesLayer = L.layerGroup()

const crecheIcon = L.icon({
  iconUrl: "../Include/Img/creche-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const escolaIcon = L.icon({
  iconUrl: "../Include/Img/escola-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const escolaEstadualIcon = L.icon({
  iconUrl: "../Include/Img/escolaE-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const escolaParticularIcon = L.icon({
  iconUrl: "../Include/Img/escolaP-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const novaConstrucaoIcon = L.icon({
  iconUrl: "../Include/Img/novasinstituicoes-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

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

document.getElementById("closeImagePreview").addEventListener("click", () => {
  document.getElementById("imagePreview").classList.add("hidden")
})

document.getElementById("previewImage").addEventListener("click", () => {
  const previewImage = document.getElementById("previewImage")
  const fullscreenImage = document.getElementById("fullscreenImage")
  const imageFullscreen = document.getElementById("imageFullscreen")

  fullscreenImage.src = previewImage.src
  imageFullscreen.classList.remove("hidden")
})

document.getElementById("closeImageFullscreen").addEventListener("click", () => {
  document.getElementById("imageFullscreen").classList.add("hidden")
})

document.getElementById("imageFullscreen").addEventListener("click", (e) => {
  if (e.target.id === "imageFullscreen") {
    document.getElementById("imageFullscreen").classList.add("hidden")
  }
})

function calcularDistancia(coords1, coords2) {
  const latlng1 = L.latLng(coords1[0], coords1[1])
  const latlng2 = L.latLng(coords2[0], coords2[1])
  const distanciaMetros = latlng1.distanceTo(latlng2)

  // Converter para km se for maior que 1000m
  if (distanciaMetros >= 1000) {
    return `${(distanciaMetros / 1000).toFixed(2)} km`
  } else {
    return `${distanciaMetros.toFixed(0)} m`
  }
}

function mostrarCalculadoraDistancia(instituicaoAtual) {
  // Criar modal de seleção
  const modal = document.createElement("div")
  modal.className = "distance-modal"
  modal.innerHTML = `
    <div class="distance-modal-content">
      <div class="distance-modal-header">
        <h3>Calcular Distância</h3>
        <button class="distance-modal-close">×</button>
      </div>
      <div class="distance-modal-body">
        <p class="distance-from">De: <strong>${instituicaoAtual.nome}</strong></p>
        <p class="distance-instruction">Selecione uma instituição de destino:</p>
        <div class="distance-search">
          <input type="text" placeholder="Buscar instituição..." class="distance-search-input" />
        </div>
        <div class="distance-list"></div>
      </div>
      <div class="distance-result hidden">
        <div class="distance-result-content"></div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  const closeBtn = modal.querySelector(".distance-modal-close")
  const searchInput = modal.querySelector(".distance-search-input")
  const distanceList = modal.querySelector(".distance-list")
  const distanceResult = modal.querySelector(".distance-result")
  const distanceResultContent = modal.querySelector(".distance-result-content")

  // Filtrar outras instituições (excluir a atual)
  const outrasInstituicoes = todasInstituicoes.filter((inst) => inst.nome !== instituicaoAtual.nome)

  // Função para renderizar lista de instituições
  function renderizarLista(instituicoes) {
    distanceList.innerHTML = ""

    if (instituicoes.length === 0) {
      distanceList.innerHTML = '<p class="no-results">Nenhuma instituição encontrada</p>'
      return
    }

    instituicoes.forEach((inst) => {
      const item = document.createElement("div")
      item.className = "distance-list-item"
      item.innerHTML = `
        <div class="distance-item-info">
          <div class="distance-item-name">${inst.nome}</div>
          <div class="distance-item-details">${inst.tipo}${inst.bairro ? " • " + inst.bairro : ""}</div>
        </div>
      `

      item.addEventListener("click", () => {
        const distancia = calcularDistancia(instituicaoAtual.coords, inst.coords)
        distanceResultContent.innerHTML = `
          <p><strong>De:</strong> ${instituicaoAtual.nome}</p>
          <p><strong>Para:</strong> ${inst.nome}</p>
          <p class="distance-value">Distância: <strong>${distancia}</strong></p>
        `
        distanceResult.classList.remove("hidden")

        // Destacar item selecionado
        distanceList.querySelectorAll(".distance-list-item").forEach((i) => i.classList.remove("selected"))
        item.classList.add("selected")
      })

      distanceList.appendChild(item)
    })
  }

  // Renderizar lista inicial
  renderizarLista(outrasInstituicoes)

  // Busca em tempo real
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim()

    if (query === "") {
      renderizarLista(outrasInstituicoes)
      return
    }

    const filtradas = outrasInstituicoes.filter(
      (inst) =>
        inst.nome.toLowerCase().includes(query) ||
        (inst.bairro && inst.bairro.toLowerCase().includes(query)) ||
        (inst.tipo && inst.tipo.toLowerCase().includes(query)),
    )

    renderizarLista(filtradas)
  })

  // Fechar modal
  function fecharModal() {
    modal.remove()
  }

  closeBtn.addEventListener("click", fecharModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModal()
    }
  })
}

// Array para armazenar todas as instituições para pesquisa
const todasInstituicoes = []

let filtroAtivoBairro = ""
let filtroAtivoPolo = ""
let filtroAtivoAlunos = 0

function carregarInstituicoes(url, layer, icon, tipo) {
  fetch(url)
    .then((res) => {
      console.log(`[v0] Carregando ${tipo}:`, res.status)
      if (!res.ok) {
        throw new Error(`Erro ao carregar ${tipo}: ${res.status}`)
      }
      return res.json()
    })
    .then((data) => {
      console.log(`[v0] ${tipo} carregadas:`, data.features.length, "turmas")

      const escolasAgrupadas = {}

      data.features.forEach((feature) => {
        if (!feature.geometry) {
          console.warn(`[v0] Feature sem geometria ignorada:`, feature.properties?.Escola || "Desconhecida")
          return
        }

        if (
          !feature.geometry.coordinates ||
          !Array.isArray(feature.geometry.coordinates) ||
          feature.geometry.coordinates.length < 2
        ) {
          console.warn(`[v0] Feature com coordenadas inválidas ignorada:`, feature.properties?.Escola || "Desconhecida")
          return
        }

        const props = feature.properties
        const coords = feature.geometry.coordinates

        const nomeEscola = props.Escola || props.escola || props.name || props.nome || props.ENDEREÇO || props.OBJETO

        if (!nomeEscola) {
          console.warn(`[v0] Feature sem nome de escola ignorada`)
          return
        }

        if (!escolasAgrupadas[nomeEscola]) {
          escolasAgrupadas[nomeEscola] = {
            coords: coords,
            nome: nomeEscola,
            totalAlunos: 0,
            polo: props.Polo || props.polo,
            endereco: props.endereco || props.endereço || props.Endereco || props.Endereço || props.ENDEREÇO,
            bairro: props.bairro || props.Bairro || props.BAIRRO,
            tipo: props.tipo || props.Tipo,
            urlImg: props.urlimg || props.urlImg || props.url_img || props.UrlImg || props.URLFotos,
            turmas: [],
          }
        }

        const alunosTurma = Number.parseInt(props["Alunos na turma"] || props.alunos || props.Alunos || 0)
        escolasAgrupadas[nomeEscola].totalAlunos += alunosTurma
        escolasAgrupadas[nomeEscola].turmas.push(props)
      })

      console.log(`[v0] ${tipo} agrupadas:`, Object.keys(escolasAgrupadas).length, "unidades")

      if (Object.keys(escolasAgrupadas).length === 0) {
        console.warn(`[v0] Nenhuma escola válida encontrada em ${tipo}`)
        return
      }

      Object.values(escolasAgrupadas).forEach((escola) => {
        const iconUrl = icon.options.iconUrl
        const markerIcon = L.divIcon({
          className: "custom-marker-with-label",
          html: `
            <div class="marker-container">
              <img src="${iconUrl}" class="marker-icon" />
              <div class="marker-label">${escola.nome}</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

        const marker = L.marker([escola.coords[1], escola.coords[0]], { icon: markerIcon })

        let popupContent = ""

        if (tipo === "Novas Construções") {
          if (escola.nome) {
            popupContent += `<b>Nome:</b> ${escola.nome}<br>`
          }
          if (escola.endereco) {
            popupContent += `<b>Endereço:</b> ${escola.endereco}<br>`
          }
          if (escola.bairro) {
            popupContent += `<b>Bairro:</b> ${escola.bairro}<br>`
          }
        } else {
          if (escola.nome) {
            popupContent += `<b>Nome:</b> ${escola.nome}<br>`
          }

          popupContent += `<b>Total de Alunos:</b> ${escola.totalAlunos}<br>`
          popupContent += `<b>Turmas:</b> ${escola.turmas.length}<br>`

          if (escola.polo) {
            popupContent += `<b>Polo:</b> ${escola.polo}<br>`
          }

          if (escola.endereco) {
            popupContent += `<b>Endereço:</b> ${escola.endereco}<br>`
          }

          if (escola.bairro) {
            popupContent += `<b>Bairro:</b> ${escola.bairro}<br>`
          }

          if (escola.tipo) {
            popupContent += `<b>Tipo:</b> ${escola.tipo}<br>`
          }
        }

        popupContent += `<button class="calcular-distancia-btn" data-instituicao="${escola.nome}">Calcular Distância</button>`

        marker.bindPopup(popupContent)

        if (tipo === "Novas Construções" && escola.urlImg) {
          marker.on("click", () => {
            mostrarImagemPreview(escola.urlImg, escola.nome)
          })
        } else if (tipo !== "Novas Construções") {
          marker.on("click", () => {
            mostrarImagemPreview(escola.urlImg, escola.nome)
          })
        }

        marker.on("popupopen", () => {
          const btn = document.querySelector(".calcular-distancia-btn")
          if (btn) {
            btn.addEventListener("click", (e) => {
              e.stopPropagation()
              const instituicaoNome = btn.dataset.instituicao
              const instituicao = todasInstituicoes.find((inst) => inst.nome === instituicaoNome)
              if (instituicao) {
                mostrarCalculadoraDistancia(instituicao)
              }
            })
          }
        })

        marker.addTo(layer)

        todasInstituicoes.push({
          nome: escola.nome,
          endereco: escola.endereco,
          polo: escola.polo,
          bairro: escola.bairro,
          tipo: tipo,
          totalAlunos: escola.totalAlunos,
          marker: marker,
          coords: [escola.coords[1], escola.coords[0]],
        })
      })

      console.log(`[v0] ${tipo} adicionadas ao mapa`)
    })
    .catch((error) => {
      console.error(`[v0] Erro ao carregar ${tipo}:`, error)
    })
}

function carregarEscolasEstaduais(url, layer, icon, tipo) {
  fetch(url)
    .then((res) => {
      console.log(`[v0] Carregando ${tipo}:`, res.status)
      if (!res.ok) {
        throw new Error(`Erro ao carregar ${tipo}: ${res.status}`)
      }
      return res.json()
    })
    .then((data) => {
      console.log(`[v0] ${tipo} carregadas:`, data.features.length, "escolas")

      data.features.forEach((feature) => {
        if (!feature.geometry) {
          console.warn(`[v0] Feature sem geometria ignorada:`, feature.properties?.ESCOLA || "Desconhecida")
          return
        }

        if (
          !feature.geometry.coordinates ||
          !Array.isArray(feature.geometry.coordinates) ||
          feature.geometry.coordinates.length < 2
        ) {
          console.warn(`[v0] Feature com coordenadas inválidas ignorada:`, feature.properties?.ESCOLA || "Desconhecida")
          return
        }

        const props = feature.properties
        const coords = feature.geometry.coordinates

        const nomeEscola = props.NOMES || props.ESCOLA || props.escola || props.name || props.nome
        const endereco = props.ENDEREÇO || props.endereco || props.Endereco
        const bairro = props.BAIRRO || props.bairro || props.Bairro
        const municipio = props.MUNICÍPIO || props.municipio

        if (!nomeEscola) {
          console.warn(`[v0] Feature sem nome de escola ignorada`)
          return
        }

        const iconUrl = icon.options.iconUrl
        const markerIcon = L.divIcon({
          className: "custom-marker-with-label estadual-marker",
          html: `
            <div class="marker-container">
              <img src="${iconUrl}" class="marker-icon" />
              <div class="marker-label">${nomeEscola}</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

        const marker = L.marker([coords[1], coords[0]], { icon: markerIcon })

        let popupContent = `<b>Nome:</b> ${nomeEscola}<br>`

        if (endereco) {
          popupContent += `<b>Endereço:</b> ${endereco}<br>`
        }

        if (bairro) {
          popupContent += `<b>Bairro:</b> ${bairro}<br>`
        }

        if (municipio) {
          popupContent += `<b>Município:</b> ${municipio}<br>`
        }

        popupContent += `<button class="calcular-distancia-btn" data-instituicao="${nomeEscola}">Calcular Distância</button>`

        marker.bindPopup(popupContent)

        marker.on("popupopen", () => {
          const btn = document.querySelector(".calcular-distancia-btn")
          if (btn) {
            btn.addEventListener("click", (e) => {
              e.stopPropagation()
              const instituicaoNome = btn.dataset.instituicao
              const instituicao = todasInstituicoes.find((inst) => inst.nome === instituicaoNome)
              if (instituicao) {
                mostrarCalculadoraDistancia(instituicao)
              }
            })
          }
        })

        marker.addTo(layer)

        todasInstituicoes.push({
          nome: nomeEscola,
          endereco: endereco,
          bairro: bairro,
          tipo: tipo,
          totalAlunos: 0,
          marker: marker,
          coords: [coords[1], coords[0]],
        })
      })

      console.log(`[v0] ${tipo} adicionadas ao mapa`)
    })
    .catch((error) => {
      console.error(`[v0] Erro ao carregar ${tipo}:`, error)
    })
}

function aplicarFiltros() {
  todasInstituicoes.forEach((inst) => {
    let mostrar = true

    if (filtroAtivoBairro && inst.bairro) {
      const bairroInstNormalizado = normalizarNomeBairro(inst.bairro)
      const bairroFiltroNormalizado = normalizarNomeBairro(filtroAtivoBairro)

      if (bairroInstNormalizado !== bairroFiltroNormalizado) {
        mostrar = false
      }
    } else if (filtroAtivoBairro && !inst.bairro) {
      // Se tem filtro ativo mas a instituição não tem bairro, não mostrar
      mostrar = false
    }

    // Verificar se a instituição passa no filtro de polo
    if (filtroAtivoPolo && String(inst.polo) !== String(filtroAtivoPolo)) {
      mostrar = false
    }

    // Verificar se a instituição passa no filtro de alunos (quantidade mínima)
    if (filtroAtivoAlunos > 0 && inst.totalAlunos < filtroAtivoAlunos) {
      mostrar = false
    }

    // Mostrar ou ocultar o marcador
    if (mostrar) {
      // Adicionar à layer correspondente se estiver ativa
      if (inst.tipo === "Creches" && map.hasLayer(crechesLayer)) {
        if (!crechesLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(crechesLayer)
        }
      } else if (inst.tipo === "Escolas" && map.hasLayer(escolasLayer)) {
        if (!escolasLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(escolasLayer)
        }
      } else if (inst.tipo === "Escolas Estaduais" && map.hasLayer(escolasEstaduaisLayer)) {
        if (!escolasEstaduaisLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(escolasEstaduaisLayer)
        }
      } else if (inst.tipo === "Escolas Particulares" && map.hasLayer(escolasParticularesLayer)) {
        if (!escolasParticularesLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(escolasParticularesLayer)
        }
      } else if (inst.tipo === "Novas Construções" && map.hasLayer(novasConstrucoesLayer)) {
        if (!novasConstrucoesLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(novasConstrucoesLayer)
        }
      }
    } else {
      // Remover o marcador de todas as layers
      crechesLayer.removeLayer(inst.marker)
      escolasLayer.removeLayer(inst.marker)
      escolasEstaduaisLayer.removeLayer(inst.marker)
      escolasParticularesLayer.removeLayer(inst.marker)
      novasConstrucoesLayer.removeLayer(inst.marker)
    }
  })
}

function popularFiltros() {
  const bairrosUnicos = new Set()
  const polosUnicos = new Set()

  todasInstituicoes.forEach((inst) => {
    if (inst.bairro) {
      const bairroNormalizado = normalizarNomeBairro(inst.bairro)
      bairrosUnicos.add(bairroNormalizado)
    }
    if (inst.polo) {
      polosUnicos.add(String(inst.polo))
    }
  })

  // Popular dropdown de Bairros
  const filterBairro = document.getElementById("filterBairro")
  Array.from(bairrosUnicos)
    .sort()
    .forEach((bairro) => {
      const option = document.createElement("option")
      option.value = bairro
      option.textContent = bairro
      filterBairro.appendChild(option)
    })

  // Popular dropdown de Polos
  const filterPolo = document.getElementById("filterPolo")
  Array.from(polosUnicos)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((polo) => {
      const option = document.createElement("option")
      option.value = polo
      option.textContent = `Polo ${polo}`
      filterPolo.appendChild(option)
    })

  console.log("[v0] Filtros populados:", bairrosUnicos.size, "bairros e", polosUnicos.size, "polos")
}

document.getElementById("toggleFilters").addEventListener("click", () => {
  const filtersContainer = document.getElementById("filtersContainer")
  filtersContainer.classList.toggle("hidden")
})

document.getElementById("filterBairro").addEventListener("change", (e) => {
  filtroAtivoBairro = e.target.value
  aplicarFiltros()
})

document.getElementById("filterPolo").addEventListener("change", (e) => {
  filtroAtivoPolo = e.target.value
  aplicarFiltros()
})

document.getElementById("filterAlunos").addEventListener("input", (e) => {
  filtroAtivoAlunos = Number.parseInt(e.target.value) || 0
  aplicarFiltros()
})

document.getElementById("clearFilters").addEventListener("click", () => {
  filtroAtivoBairro = ""
  filtroAtivoPolo = ""
  filtroAtivoAlunos = 0
  document.getElementById("filterBairro").value = ""
  document.getElementById("filterPolo").value = ""
  document.getElementById("filterAlunos").value = ""
  aplicarFiltros()
})

carregarInstituicoes("../Data/Processed/Educação/NewCreches.geojson", crechesLayer, crecheIcon, "Creches")
carregarInstituicoes("../Data/Processed/Educação/NewEscolas.geojson", escolasLayer, escolaIcon, "Escolas")
carregarEscolasEstaduais(
  "../Data/Processed/Educação/EscolasEstaduais.geojson",
  escolasEstaduaisLayer,
  escolaEstadualIcon,
  "Escolas Estaduais",
)
carregarEscolasEstaduais(
  "../Data/Processed/Educação/EscolasParticulares.geojson",
  escolasParticularesLayer,
  escolaParticularIcon,
  "Escolas Particulares",
)
carregarInstituicoes(
  "../Data/Processed/Educação/NovasConstruçõesANDLocacao.geojson",
  novasConstrucoesLayer,
  novaConstrucaoIcon,
  "Novas Construções",
)

setTimeout(() => {
  popularFiltros()
  console.log("[v0] Filtros populados com sucesso")
}, 2000)

toggleCreches.addEventListener("change", function () {
  if (this.checked) {
    crechesLayer.addTo(map)
  } else {
    map.removeLayer(crechesLayer)
  }
})

toggleEscolas.addEventListener("change", function () {
  if (this.checked) {
    escolasLayer.addTo(map)
  } else {
    map.removeLayer(escolasLayer)
  }
})

toggleEscolasEstaduais.addEventListener("change", function () {
  if (this.checked) {
    escolasEstaduaisLayer.addTo(map)
  } else {
    map.removeLayer(escolasEstaduaisLayer)
  }
})

toggleEscolasParticulares.addEventListener("change", function () {
  if (this.checked) {
    escolasParticularesLayer.addTo(map)
  } else {
    map.removeLayer(escolasParticularesLayer)
  }
})

toggleNovasConstrucoes.addEventListener("change", function () {
  if (this.checked) {
    novasConstrucoesLayer.addTo(map)
  } else {
    map.removeLayer(novasConstrucoesLayer)
  }
})

const searchInput = document.getElementById("searchInput")
const searchSuggestions = document.getElementById("searchSuggestions")
const searchCircle = null

document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase()

  if (query.length === 0) {
    searchSuggestions.classList.add("hidden")
    searchSuggestions.innerHTML = ""
    return
  }

  // Filtrar instituições que correspondem à pesquisa
  const resultados = todasInstituicoes.filter((inst) => {
    return (
      inst.nome.toLowerCase().includes(query) ||
      (inst.endereco && inst.endereco.toLowerCase().includes(query)) ||
      (inst.bairro && inst.bairro.toLowerCase().includes(query))
    )
  })

  searchSuggestions.innerHTML = ""

  if (query.length >= 3) {
    const addressItem = document.createElement("div")
    addressItem.className = "search-suggestion-item search-address-item"

    const nome = document.createElement("div")
    nome.className = "suggestion-name"
    nome.innerHTML = `🔍 Buscar endereço: "<strong>${query}</strong>"`

    const detalhes = document.createElement("div")
    detalhes.className = "suggestion-details"
    detalhes.textContent = "Pesquisar rua/endereço e mostrar instituições próximas"

    addressItem.appendChild(nome)
    addressItem.appendChild(detalhes)

    addressItem.addEventListener("click", () => {
      buscarEndereco(query)
    })

    searchSuggestions.appendChild(addressItem)
  }

  if (resultados.length === 0 && query.length < 3) {
    searchSuggestions.classList.add("hidden")
    return
  }

  // Mostrar sugestões de instituições (limitar a 10 resultados)
  if (resultados.length > 0) {
    const separator = document.createElement("div")
    separator.className = "search-separator"
    separator.textContent = "Instituições"
    searchSuggestions.appendChild(separator)
  }

  resultados.slice(0, 10).forEach((inst) => {
    const item = document.createElement("div")
    item.className = "search-suggestion-item"

    const nome = document.createElement("div")
    nome.className = "suggestion-name"
    nome.textContent = inst.nome

    const detalhes = document.createElement("div")
    detalhes.className = "suggestion-details"
    const detalhesTexto = []
    if (inst.tipo) detalhesTexto.push(inst.tipo)
    if (inst.bairro) detalhesTexto.push(inst.bairro)
    detalhes.textContent = detalhesTexto.join(" • ")

    item.appendChild(nome)
    item.appendChild(detalhes)

    item.addEventListener("click", () => {
      // Remove círculo de busca anterior
      if (searchCircle) {
        map.removeLayer(searchCircle)
      }

      // Ativar a layer correspondente ao tipo da instituição
      if (inst.tipo === "Creches") {
        if (!map.hasLayer(crechesLayer)) {
          crechesLayer.addTo(map)
          toggleCreches.checked = true
        }
      } else if (inst.tipo === "Escolas") {
        if (!map.hasLayer(escolasLayer)) {
          escolasLayer.addTo(map)
          toggleEscolas.checked = true
        }
      } else if (inst.tipo === "Escolas Estaduais") {
        if (!map.hasLayer(escolasEstaduaisLayer)) {
          escolasEstaduaisLayer.addTo(map)
          toggleEscolasEstaduais.checked = true
        }
      } else if (inst.tipo === "Escolas Particulares") {
        if (!map.hasLayer(escolasParticularesLayer)) {
          escolasParticularesLayer.addTo(map)
          toggleEscolasParticulares.checked = true
        }
      } else if (inst.tipo === "Novas Construções") {
        if (!map.hasLayer(novasConstrucoesLayer)) {
          novasConstrucoesLayer.addTo(map)
          toggleNovasConstrucoes.checked = true
        }
      }

      // Dar zoom e abrir popup
      map.setView(inst.coords, 18, { animate: true })
      inst.marker.openPopup()
      searchSuggestions.classList.add("hidden")
      searchInput.value = inst.nome
    })

    searchSuggestions.appendChild(item)
  })

  searchSuggestions.classList.remove("hidden")
})

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault()
    const query = searchInput.value.trim()

    if (query.length === 0) {
      return
    }

    if (query.length < 3) {
      alert("Digite pelo menos 3 caracteres para buscar um endereço.")
      return
    }

    // Verificar se há uma correspondência exata com uma instituição
    const instituicaoExata = todasInstituicoes.find((inst) => inst.nome.toLowerCase() === query.toLowerCase())

    if (instituicaoExata) {
      // Se encontrou uma instituição exata, ir para ela
      if (searchCircle) {
        map.removeLayer(searchCircle)
      }

      // Ativar a layer correspondente
      if (instituicaoExata.tipo === "Creches") {
        if (!map.hasLayer(crechesLayer)) {
          crechesLayer.addTo(map)
          toggleCreches.checked = true
        }
      } else if (instituicaoExata.tipo === "Escolas") {
        if (!map.hasLayer(escolasLayer)) {
          escolasLayer.addTo(map)
          toggleEscolas.checked = true
        }
      } else if (instituicaoExata.tipo === "Escolas Estaduais") {
        if (!map.hasLayer(escolasEstaduaisLayer)) {
          escolasEstaduaisLayer.addTo(map)
          toggleEscolasEstaduais.checked = true
        }
      } else if (instituicaoExata.tipo === "Escolas Particulares") {
        if (!map.hasLayer(escolasParticularesLayer)) {
          escolasParticularesLayer.addTo(map)
          toggleEscolasParticulares.checked = true
        }
      } else if (instituicaoExata.tipo === "Novas Construções") {
        if (!map.hasLayer(novasConstrucoesLayer)) {
          novasConstrucoesLayer.addTo(map)
          toggleNovasConstrucoes.checked = true
        }
      }

      map.setView(instituicaoExata.coords, 18, { animate: true })
      instituicaoExata.marker.openPopup()
      searchSuggestions.classList.add("hidden")
    } else {
      buscarEndereco(query)
    }
  }
})

// Fechar sugestões ao clicar fora
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
    searchSuggestions.classList.add("hidden")
    map.removeLayer(searchCircle)
  }
})

map.on("popupopen", () => {
  const btn = document.querySelector(".ver-criancas-btn")
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const nomeBairro = btn.dataset.bairro
      mostrarDadosCriancas(nomeBairro)
    })
  }
})

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ver-criancas-btn")) {
    e.stopPropagation()
    const nomeBairro = e.target.dataset.bairro
    mostrarDadosCriancas(nomeBairro)
  }
})

carregarDadosCriancas()

function normalizarNomeBairro(nome) {
  if (!nome) return ""
  return nome
    .normalize("NFD") // Decompor caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remover marcas diacríticas (acentos)
    .toUpperCase() // Converter para maiúsculo
    .trim() // Remover espaços extras
}

function buscarEndereco(query) {
  // Implementação da função buscarEndereco aqui
  console.log("Buscando endereço:", query)
}
