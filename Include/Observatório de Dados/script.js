/* =======================================================================
   SCRIPT: INTERATIVIDADE + API IBGE (CONEXÃO REAL)
   ======================================================================= */

// DADOS DE BACKUP (Caso o IBGE esteja fora do ar)
let appData = {
    populacao: { 2010: 458673, 2022: 440962 }, // Queda real
    salario: 1.7,
    pib: 18935.50,
    densidade: 12521.64
};

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimation();
    initCounterAnimation(); // Inicia com dados de backup
    initCardLoaders();      // Carrega loaders e busca API
    initSlider();
});

/* --- 1. BUSCA DADOS NO IBGE (CORRIGIDO: ANOS FIXOS) --- */
async function fetchIBGEData() {
    console.log("📡 Conectando ao IBGE...");
    const codSJM = '3305109'; 

    // URLs Oficiais (SIDRA) - Ajustadas para anos específicos (Mais estável)
    const urls = {
        // População (Censo 2022) - Tabela 4714
        pop2022: `https://apisidra.ibge.gov.br/values/t/4714/n6/${codSJM}/v/93/p/2022?formato=json`,
        
        // PIB (Ano 2021 - O mais recente consolidado) - Tabela 5938
        pib: `https://apisidra.ibge.gov.br/values/t/5938/n6/${codSJM}/v/37/p/2021?formato=json`,
        
        // Salário (Ano 2021 - CEMPRE) - Tabela 1685
        salario: `https://apisidra.ibge.gov.br/values/t/1685/n6/${codSJM}/v/2079/p/2021?formato=json`
    };

    try {
        // Dispara as requisições
        const [resPop, resPib, resSal] = await Promise.all([
            fetch(urls.pop2022),
            fetch(urls.pib),
            fetch(urls.salario)
        ]);

        // Verifica se o IBGE respondeu "OK" (Status 200) antes de tentar ler
        if (!resPop.ok || !resPib.ok || !resSal.ok) {
            throw new Error("IBGE retornou erro na requisição (400/404/500)");
        }

        const jsonPop = await resPop.json();
        const jsonPib = await resPib.json();
        const jsonSal = await resSal.json();

        // Atualiza a Variável Global APENAS se o dado existir
        if (jsonPop[0] && jsonPop[1]) appData.populacao[2022] = parseInt(jsonPop[1].V);
        if (jsonPib[0] && jsonPib[1]) appData.pib = parseFloat(jsonPib[1].V);
        if (jsonSal[0] && jsonSal[1]) appData.salario = parseFloat(jsonSal[1].V);

        console.log("✅ Dados Atualizados do IBGE com Sucesso:", appData);
        
        // Atualiza os textos dos KPIs
        updateKpiNumbers();

    } catch (error) {
        // Se der erro, o site continua rodando com os dados de backup definidos no topo do arquivo
        console.warn("⚠️ Usando dados de backup (Erro na API):", error.message);
    }
}

/* Atualiza os números do topo se a API trouxe novidades */
function updateKpiNumbers() {
    // Procura elementos com IDs específicos (Você precisa adicionar IDs no HTML para funcionar 100%)
    // Se não achar, não faz nada (segurança)
    const elPop = document.querySelector('.kpi-card:nth-child(1) .kpi-number');
    if(elPop) elPop.innerText = appData.populacao[2022].toLocaleString('pt-BR');
    
    // Você pode expandir para os outros KPIs aqui
}

/* --- 2. SISTEMA DE LOADERS (Gatilho da API) --- */
function initCardLoaders() {
    const cards = document.querySelectorAll('.analise-card');
    let chartsInitialized = false;

    // AQUI: Chamamos a API assim que a página carrega
    fetchIBGEData().then(() => {
        // Quando a API responder (ou falhar), os dados em 'appData' estarão prontos
        // O código continua normalmente abaixo...
    });

    cards.forEach(card => {
        card.classList.add('is-loading');
        card.style.position = 'relative'; 
        
        const loaderHTML = `<div class="loader-container"><div class="tech-loader"></div></div>`;
        card.insertAdjacentHTML('beforeend', loaderHTML);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const loader = card.querySelector('.loader-container');
                observer.unobserve(card);

                // Espera 3 segundos (Simulação de processamento)
                setTimeout(() => {
                    if(loader) loader.style.opacity = '0';
                    card.classList.remove('is-loading');
                    card.classList.add('is-loaded');
                    setTimeout(() => { if(loader) loader.remove(); }, 500);

                    if (!chartsInitialized) {
                        initCharts(); // Desenha gráficos com os dados do appData
                        chartsInitialized = true;
                    }
                }, 3000); 
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}

/* --- 3. GRÁFICOS DINÂMICOS (Usam appData) --- */
function initCharts() {
    
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#AAA';
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
    
    const colorGreen = '#009039';  
    const colorYellow = '#FDC806'; 
    const colorBlue = '#0056b3';   

        /* --- ADICIONE ISTO DENTRO DA FUNÇÃO initCharts() NO SEU SCRIPT.JS --- */

    // MINI GRÁFICO HOME: Educação (Evolução de Matrículas)
    const ctxMiniEdu = document.getElementById('miniChartEduHome');
    if (ctxMiniEdu) {
        new Chart(ctxMiniEdu, {
            type: 'line',
            data: {
                labels: ['2021', '2022', '2023', '2024'], // Anos
                datasets: [{
                    label: 'Alunos Matriculados',
                    data: [38800, 39100, 39350, 39500], // Dados de crescimento constante
                    borderColor: '#FDC806', // Amarelo Oficial SJM
                    borderWidth: 3,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, 'rgba(253, 200, 6, 0.4)'); // Amarelo forte no topo
                        gradient.addColorStop(1, 'rgba(253, 200, 6, 0.0)'); // Transparente na base
                        return gradient;
                    },
                    fill: true,          // Preenche a área abaixo da linha
                    tension: 0.4,        // Curva suave
                    pointRadius: 0,      // Sem bolinhas (visual limpo)
                    pointHoverRadius: 6  // Bolinha aparece só ao passar o mouse
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false }, // Sem legenda
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return context.raw.toLocaleString('pt-BR') + ' alunos';
                            }
                        }
                    }
                },
                scales: {
                    x: { display: false }, // Esconde eixo X
                    y: { display: false, min: 38000 } // Esconde eixo Y (mas foca na variação)
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // 1. POPULAÇÃO (Usa dados da API)
    const ctxPop = document.getElementById('chartPop');
    if (ctxPop) {
        new Chart(ctxPop, {
            type: 'bar',
            data: {
                labels: ['Censo 2010', 'Censo 2022'],
                datasets: [{
                    label: 'População',
                    // AQUI: Usa a variável appData atualizada pela API
                    data: [appData.populacao[2010], appData.populacao[2022]],
                    backgroundColor: [colorBlue, colorGreen],
                    borderRadius: 6,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false, min: 400000 } }
            }
        });
    }

    // 2. TRABALHO (Usa Salário da API)
    const ctxTrab = document.getElementById('chartTrab');
    if (ctxTrab) {
        new Chart(ctxTrab, {
            type: 'bar',
            data: {
                labels: ['São João de Meriti', 'Estado RJ', 'Brasil'],
                datasets: [{
                    label: 'Salários Mínimos',
                    // AQUI: Usa appData.salario
                    data: [appData.salario, 2.4, 2.2], 
                    backgroundColor: [colorYellow, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)'],
                    borderRadius: 4,
                    barThickness: 30
                }]
            },
            options: {
                indexAxis: 'y', 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // 3. EDUCAÇÃO (Estático por complexidade da série histórica)
    const ctxEdu = document.getElementById('chartEdu');
    if (ctxEdu) {
        new Chart(ctxEdu, {
            type: 'line',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023'],
                datasets: [{
                    label: 'Matrículas',
                    data: [38500, 39100, 38800, 39500, 40100],
                    borderColor: colorGreen,
                    backgroundColor: 'rgba(0, 144, 57, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { display: false } } 
            }
        });
    }

    // 4. ECONOMIA (Usa PIB da API no contexto)
    // Nota: O gráfico é rosca (porcentagem), então mantemos fixo, 
    // mas poderíamos usar o valor total num tooltip.
    const ctxEcon = document.getElementById('chartEcon');
    if (ctxEcon) {
        new Chart(ctxEcon, {
            type: 'doughnut',
            data: {
                labels: ['Serviços', 'Indústria', 'Adm. Pública', 'Agropecuária'],
                datasets: [{
                    data: [65, 15, 19.9, 0.1],
                    backgroundColor: [colorYellow, colorBlue, colorGreen, '#999'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%', 
                plugins: { 
                    legend: { position: 'right', labels: { boxWidth: 10, color: '#DDD' } } 
                }
            }
        });
    }

    // 5. SAÚDE
    const ctxSaude = document.getElementById('chartSaude');
    if (ctxSaude) {
        new Chart(ctxSaude, {
            type: 'line',
            data: {
                labels: ['2018', '2019', '2020', '2021'],
                datasets: [{
                    label: 'Óbitos por mil',
                    data: [15.2, 14.9, 14.88, 14.1],
                    borderColor: '#FF4444',
                    borderDash: [5, 5], 
                    pointBackgroundColor: '#FF4444',
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // 6. MEIO AMBIENTE
    const ctxAmb = document.getElementById('chartAmb');
    if (ctxAmb) {
        new Chart(ctxAmb, {
            type: 'bar',
            data: {
                labels: ['Coleta Lixo', 'Água', 'Esgoto'],
                datasets: [{
                    label: 'Cobertura (%)',
                    data: [98.7, 91.2, 64.1],
                    backgroundColor: [colorGreen, colorBlue, '#555'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { max: 100 } }
            }
        });
    }

    // 7. TERRITÓRIO
    const ctxTerr = document.getElementById('chartTerr');
    if (ctxTerr) {
        new Chart(ctxTerr, {
            type: 'bar',
            data: {
                labels: ['SJM', 'Estado RJ'],
                datasets: [{
                    label: 'Hab/km²',
                    data: [12521, 365], 
                    backgroundColor: [colorYellow, '#444'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { type: 'logarithmic' } } 
            }
        });
    }
}

/* --- 4. CARROSSEL / SLIDER --- */
function initSlider() {
    const container = document.querySelector('.paineis-grid');
    const btnLeft = document.querySelector('.slider-arrow.left');
    const btnRight = document.querySelector('.slider-arrow.right');
    const scrollAmount = 350; 

    if (!container || !btnLeft || !btnRight) return;

    btnRight.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    btnLeft.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
}

/* --- 5. ANIMAÇÃO DE SCROLL --- */
function initScrollAnimation() {
    const elements = document.querySelectorAll('.kpi-card, .painel-card, .section-title');
    elements.forEach(el => el.classList.add('js-scroll'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 }); 
    elements.forEach(el => observer.observe(el));
}

/* --- 6. CONTADOR --- */
function initCounterAnimation() {
    const numbers = document.querySelectorAll('.kpi-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const finalValueText = el.innerText;
                const isDecimal = finalValueText.includes(',');
                const endValue = parseFloat(finalValueText.replace(/\./g, '').replace(',', '.'));
                if (!el.classList.contains('counted')) {
                    animateValue(el, 0, endValue, 2000, isDecimal, finalValueText);
                    el.classList.add('counted');
                }
            }
        });
    }, { threshold: 0.5 });
    numbers.forEach(el => observer.observe(el));
}

function animateValue(obj, start, end, duration, isDecimal, originalText) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress === 1 ? end : (1 - Math.pow(1 - progress, 3)) * end;

        if (isDecimal) {
            obj.innerHTML = currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            obj.innerHTML = Math.floor(currentVal).toLocaleString('pt-BR');
        }

        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = originalText;
    };
    window.requestAnimationFrame(step);
}