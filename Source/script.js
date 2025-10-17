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

      layer.bindPopup(
        `<b>${feature.properties.name}</b><br>População: ${feature.properties.população || "Não Informado"}<br>Domicílios: ${feature.properties.domicílios || "Não Informado"}<br>Dom. Ocupados: ${feature.properties.domOcupados || "Não Informado"}`,
      )

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

// Checkbox mestre "Bairros"
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
const toggleNovasConstrucoes = document.getElementById("toggleNovasConstrucoes")

const toggleDensidade = document.getElementById("toggleDensidade")
const densidadeLayer = L.layerGroup()

toggleEducacao.addEventListener("change", function () {
  toggleCreches.checked = this.checked
  toggleEscolas.checked = this.checked
  toggleNovasConstrucoes.checked = this.checked

  if (this.checked) {
    crechesLayer.addTo(map)
    escolasLayer.addTo(map)
    novasConstrucoesLayer.addTo(map)
  } else {
    map.removeLayer(crechesLayer)
    map.removeLayer(escolasLayer)
    map.removeLayer(novasConstrucoesLayer)
  }
})

toggleDensidade.addEventListener("change", function () {
  const legend = document.getElementById("densidadeLegend")

  if (this.checked) {
    densidadeLayer.addTo(map)
    legend.classList.remove("hidden")
  } else {
    map.removeLayer(densidadeLayer)
    legend.classList.add("hidden")
  }
})

const crechesLayer = L.layerGroup()
const escolasLayer = L.layerGroup()
const novasConstrucoesLayer = L.layerGroup()

function getColorByDensity(density) {
  // Color scale from light yellow to dark red based on density (hab/km²)
  return density > 15000
    ? "#800026"
    : density > 12000
      ? "#BD0026"
      : density > 9000
        ? "#E31A1C"
        : density > 6000
          ? "#FC4E2A"
          : density > 4000
            ? "#FD8D3C"
            : density > 2000
              ? "#FEB24C"
              : density > 1000
                ? "#FED976"
                : "#FFEDA0"
}

function carregarDensidadeDemografica() {
  fetch("../Data/Processed/Bairros/dens-demo-sjm.geojson")
    .then((res) => {
      console.log("[v0] Carregando densidade demográfica:", res.status)
      if (!res.ok) {
        throw new Error(`Erro ao carregar densidade demográfica: ${res.status}`)
      }
      return res.json()
    })
    .then((data) => {
      console.log("[v0] GeoJSON de densidade carregado:", data.features.length, "polígonos")

      if (!data.features || data.features.length === 0) {
        console.warn("[v0] Nenhum polígono encontrado no GeoJSON")
        alert("O arquivo GeoJSON de densidade demográfica está vazio ou não contém features.")
        return
      }

      const densityValues = []

      // Process each feature in the GeoJSON
      data.features.forEach((feature) => {
        const props = feature.properties

        // Try to find density property (check multiple possible names)
        const density =
          props.densidade ||
          props.Densidade ||
          props.density ||
          props.Density ||
          props.dens_demo ||
          props.densidade_demografica ||
          0

        const name = props.name || props.Name || props.nome || props.Nome || props.bairro || props.Bairro || "Sem nome"

        if (!feature.geometry) {
          console.warn("[v0] Feature sem geometria ignorada:", name)
          return
        }

        const densityValue = Number.parseFloat(density)

        if (isNaN(densityValue)) {
          console.warn("[v0] Densidade inválida para:", name, "valor:", density)
          return
        }

        densityValues.push(densityValue)

        // Create polygon with density styling
        const densityPolygon = L.geoJSON(feature, {
          style: {
            color: "#333",
            weight: 2,
            fillColor: getColorByDensity(densityValue),
            fillOpacity: 0.7,
          },
        })

        // Create popup with density information
        densityPolygon.bindPopup(
          `<b>${name}</b><br><b>Densidade Demográfica:</b> ${densityValue.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} hab/km²`,
        )

        densityPolygon.addTo(densidadeLayer)

        console.log("[v0] Polígono de densidade adicionado:", name, densityValue, "hab/km²")
      })

      // Create legend if we have data
      if (densityValues.length > 0) {
        createDensityLegend()
        console.log("[v0] Densidade demográfica carregada com sucesso:", densityValues.length, "polígonos")
        console.log("[v0] Densidade mínima:", Math.min(...densityValues).toFixed(2), "hab/km²")
        console.log("[v0] Densidade máxima:", Math.max(...densityValues).toFixed(2), "hab/km²")
      } else {
        console.warn("[v0] Nenhum polígono válido foi processado")
        alert("Nenhum dado de densidade válido foi encontrado no arquivo GeoJSON.")
      }
    })
    .catch((error) => {
      console.error("[v0] Erro ao carregar densidade demográfica:", error)
      alert(
        `Erro ao carregar o arquivo de densidade demográfica.\n\nVerifique se o arquivo existe em:\n../Data/Processed/Bairros/dens-demo-sjm.geojson\n\nErro: ${error.message}`,
      )
    })
}

function createDensityLegend() {
  const legendItems = document.querySelector(".legend-items")
  const densityRanges = [
    { min: 15000, color: "#800026", label: "> 15.000 hab/km²" },
    { min: 12000, max: 15000, color: "#BD0026", label: "12.000 - 15.000" },
    { min: 9000, max: 12000, color: "#E31A1C", label: "9.000 - 12.000" },
    { min: 6000, max: 9000, color: "#FC4E2A", label: "6.000 - 9.000" },
    { min: 4000, max: 6000, color: "#FD8D3C", label: "4.000 - 6.000" },
    { min: 2000, max: 4000, color: "#FEB24C", label: "2.000 - 4.000" },
    { min: 1000, max: 2000, color: "#FED976", label: "1.000 - 2.000" },
    { max: 1000, color: "#FFEDA0", label: "< 1.000 hab/km²" },
  ]

  legendItems.innerHTML = ""

  densityRanges.forEach((range) => {
    const item = document.createElement("div")
    item.className = "legend-item"
    item.innerHTML = `
      <div class="legend-color" style="background-color: ${range.color};"></div>
      <div class="legend-label">${range.label}</div>
    `
    legendItems.appendChild(item)
  })
}

setTimeout(() => {
  carregarDensidadeDemografica()
}, 1500)

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
    previewImage.src = urlImg
    previewTitle.textContent = nome || "Instituição"
    imagePreview.classList.remove("hidden")
  }
}

document.getElementById("closeImagePreview").addEventListener("click", () => {
  document.getElementById("imagePreview").classList.add("hidden")
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

        const nomeEscola = props.Escola || props.escola || props.name || props.nome

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
            endereco: props.endereco || props.endereço || props.Endereco || props.Endereço,
            bairro: props.bairro || props.Bairro,
            tipo: props.tipo || props.Tipo,
            urlImg: props.urlimg || props.urlImg || props.url_img || props.UrlImg,
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

        if (tipo !== "Novas Construções") {
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
      alert(`Erro ao carregar ${tipo}. Verifique se os arquivos GeoJSON existem em: ${url}`)
    })
}

function aplicarFiltros() {
  todasInstituicoes.forEach((inst) => {
    let mostrar = true

    // Verificar se a instituição passa no filtro de bairro
    if (filtroAtivoBairro && inst.bairro !== filtroAtivoBairro) {
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
      } else if (inst.tipo === "Novas Construções" && map.hasLayer(novasConstrucoesLayer)) {
        if (!novasConstrucoesLayer.hasLayer(inst.marker)) {
          inst.marker.addTo(novasConstrucoesLayer)
        }
      }
    } else {
      // Remover o marcador de todas as layers
      crechesLayer.removeLayer(inst.marker)
      escolasLayer.removeLayer(inst.marker)
      novasConstrucoesLayer.removeLayer(inst.marker)
    }
  })
}

function popularFiltros() {
  const bairrosUnicos = new Set()
  const polosUnicos = new Set()

  todasInstituicoes.forEach((inst) => {
    if (inst.bairro) {
      bairrosUnicos.add(inst.bairro)
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
carregarInstituicoes(
  "../Data/Processed/Educação/NovasInstituicoes.geojson",
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

toggleNovasConstrucoes.addEventListener("change", function () {
  if (this.checked) {
    novasConstrucoesLayer.addTo(map)
  } else {
    map.removeLayer(novasConstrucoesLayer)
  }
})

const searchInput = document.getElementById("searchInput")
const searchSuggestions = document.getElementById("searchSuggestions")

const searchCircle = null // Circle to show 500m radius

const saoJoaoMeritiBounds = {
  north: -22.74,
  south: -22.84,
  east: -43.32,
  west: -43.42,
}

function isWithinSaoJoaoMeriti(lat, lon) {
  return (
    lat >= saoJoaoMeritiBounds.south &&
    lat <= saoJoaoMeritiBounds.north &&
    lon >= saoJoaoMeritiBounds.west &&
    lon <= saoJoaoMeritiBounds.east
  )
}

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim()

  if (query.length < 2) {
    searchSuggestions.classList.add("hidden")
    return
  }

  const resultados = todasInstituicoes.filter(
    (inst) =>
      inst.nome.toLowerCase().includes(query.toLowerCase()) ||
      (inst.bairro && inst.bairro.toLowerCase().includes(query.toLowerCase())) ||
      (inst.endereco && inst.endereco.toLowerCase().includes(query.toLowerCase())),
  )

  if (resultados.length === 0) {
    searchSuggestions.classList.add("hidden")
    return
  }

  searchSuggestions.innerHTML = ""
  resultados.slice(0, 5).forEach((inst) => {
    const item = document.createElement("div")
    item.className = "search-suggestion-item"
    item.innerHTML = `
      <div class="suggestion-name">${inst.nome}</div>
      <div class="suggestion-details">${inst.tipo}${inst.bairro ? " • " + inst.bairro : ""}</div>
    `

    item.addEventListener("click", () => {
      map.setView(inst.coords, 17)
      inst.marker.openPopup()
      searchSuggestions.classList.add("hidden")
      searchInput.value = ""
    })

    searchSuggestions.appendChild(item)
  })

  searchSuggestions.classList.remove("hidden")
})

document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
    searchSuggestions.classList.add("hidden")
  }
})
