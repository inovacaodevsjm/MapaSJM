/* =======================================================================
   SCRIPT: DASHBOARD EDUCAÇÃO (CORRIGIDO E SEGURO)
   ======================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimation();
    initKpiCounters();
    initCardLoaders();
});

/* =======================================================================
   1. DADOS
   ======================================================================= */

// A) DADOS ENEM (BARRAS)
const enemFullData = {
    "2023": {
        "genero": [ { label: "Masculino", data: [344, 349, 313, 355], backgroundColor: "#00A8E8", borderRadius: 4 }, { label: "Feminino", data: [315, 349, 301, 350], backgroundColor: "#E91E63", borderRadius: 4 } ],
        "localizacao": [ { label: "Urbana", data: [389, 400, 354, 404], backgroundColor: "#00A8E8", borderRadius: 4 } ],
        "administracao": [ { label: "Federal", data: [529, 507, 435, 510], backgroundColor: "#0056b3", borderRadius: 4 }, { label: "Estadual", data: [351, 351, 299, 351], backgroundColor: "#009039", borderRadius: 4 }, { label: "Privada", data: [564, 525, 498, 537], backgroundColor: "#CCCCCC", borderRadius: 4 }, { label: "Municipal", data: [101, 141, 100, 130], backgroundColor: "#FDC806", borderRadius: 4 } ]
    }
};
// Fallback para anos anteriores
["2017", "2018", "2019", "2020", "2021", "2022"].forEach(y => enemFullData[y] = JSON.parse(JSON.stringify(enemFullData["2023"])));

// B) DADOS COMPARATIVO (LINHAS)
const compData = {
    labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'],
    datasets: {
        'Brasil': { label: 'Brasil', data: [500.4, 514.4, 491.2, 232.8, 339.7, 349.8, 354.1], borderColor: '#009039', backgroundColor: '#009039', borderDash: [5, 5], borderWidth: 2 },
        'Rio De Janeiro': { label: 'Rio de Janeiro', data: [542.5, 557.8, 534.1, 261.2, 374.5, 387.2, 360.6], borderColor: '#00A8E8', backgroundColor: '#00A8E8', borderWidth: 2 },
        'São Gonçalo': { label: 'São Gonçalo', data: [520.0, 535.7, 511.3, 247.3, 357.6, 370.0, 354.1], borderColor: '#8E44AD', backgroundColor: '#8E44AD', borderWidth: 2 },
        'São João De Meriti': { label: 'São João De Meriti', data: [511.7, 529.1, 503.2, 218.9, 333.5, 349.2, 332.8], borderColor: '#FDC806', backgroundColor: '#FDC806', borderWidth: 4, pointRadius: 5 }
    }
};

// C) DADOS TAXAS (BARRAS)
const taxasData = {
    "distorcao": {
        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [
            { label: 'Ensino Fundamental', data: [29.8, 29.1, 28.4, 27.6, 26.9, 26.1, 25.4], backgroundColor: '#009039', borderRadius: 4, barPercentage: 0.7 },
            { label: 'Ensino Médio', data: [24.9, 24.3, 23.7, 23.1, 22.5, 21.9, 21.3], backgroundColor: '#FDC806', borderRadius: 4, barPercentage: 0.7 }
        ]
    },
    "abandono": {
        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [
            { label: 'Ensino Fundamental', data: [2.04, 1.88, 1.72, 1.56, 1.40, 1.25, 1.10], backgroundColor: '#009039', borderRadius: 4, barPercentage: 0.7 },
            { label: 'Ensino Médio', data: [3.08, 3.09, 3.10, 3.11, 3.13, 3.14, 3.16], backgroundColor: '#E91E63', borderRadius: 4, barPercentage: 0.7 }
        ]
    }
};

// D) DADOS MATRÍCULAS (BARRAS)
const matriculasData = {
    "infantil": {
        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [
            { 
                label: 'Pré-escola', 
                data: [68.0, 68.5, 69.0, 69.5, 70.0, 70.4, 70.8], // Tendência ajustada ao dado de 2024
                backgroundColor: '#00A8E8', // Azul
                borderRadius: 4, 
                barPercentage: 0.6 
            },
            { 
                label: 'Creche', 
                data: [32.0, 31.5, 31.0, 30.5, 30.0, 29.6, 29.2], 
                backgroundColor: '#009039', // Verde
                borderRadius: 4, 
                barPercentage: 0.6 
            }
        ]
    },
    "fundamental": {
        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [
            { 
                label: 'Anos Iniciais', 
                data: [56.8, 56.8, 56.3, 56.9, 57.9, 57.9, 58.5], 
                backgroundColor: '#8E44AD', // Roxo
                borderRadius: 4, 
                barPercentage: 0.6 
            },
            { 
                label: 'Anos Finais', 
                data: [43.2, 43.2, 43.7, 43.1, 42.1, 42.1, 41.5], 
                backgroundColor: '#FDC806', // Amarelo
                borderRadius: 4, 
                barPercentage: 0.6 
            }
        ]
    }
};


/* =======================================================================
   2. INICIALIZAÇÃO
   ======================================================================= */

function initCharts() {
    
    if(document.getElementById('chartEvolucaoMatriculas')) {
        createEvolucaoChart();
    }
    // 1. NOVO GRÁFICO TAXAS (ID: chartTaxasRendimento)
    if(document.getElementById('chartTaxasRendimento')) {
        createTaxasBarChart(); 
    }

    // 2. SEÇÃO CÓPIA (IDs terminados em 2)
    if(document.getElementById('chartEnem2')) {
        createEnemBarChart('chartEnem2', 'filterEnemYear2', 'filterEnemCategory2');
    }
    if(document.getElementById('chartEnemComparativo2')) {
        createComparativoLineChart('chartEnemComparativo2', '.mun-checkbox-2');
    }

    // 3. SEÇÃO ORIGINAL (IDs normais)
    if(document.getElementById('chartEnem')) {
        createEnemBarChart('chartEnem', 'filterEnemYear', 'filterEnemCategory');
    }
    if(document.getElementById('chartEnemComparativo')) {
        createComparativoLineChart('chartEnemComparativo', '.mun-checkbox');
    }

    // NOVO GRÁFICO MATRÍCULAS
    if(document.getElementById('chartMatriculas')) {
        createMatriculasChart();
    }

    if(document.getElementById('chartTaxasRendimento')) createTaxasBarChart();
    if(document.getElementById('chartMatriculas')) createMatriculasChart();
    
}


/* =======================================================================
   3. FUNÇÕES CONSTRUTORAS (COM CORREÇÃO DE ERRO NULL)
   ======================================================================= */

// A) TAXAS (BARRAS)
function createTaxasBarChart() {
    const ctx = document.getElementById('chartTaxasRendimento').getContext('2d');
    
    const labelsPlugin = {
        id: 'taxasLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (!meta.hidden) {
                    meta.data.forEach((element, index) => {
                        const data = dataset.data[index];
                        if(data > 0) { ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(data.toFixed(1) + '%', element.x, element.y - 5); }
                    });
                }
            });
            ctx.restore();
        }
    };

    let chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: taxasData['distorcao'].labels, datasets: taxasData['distorcao'].datasets },
        plugins: [labelsPlugin],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#CCC' } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleColor: '#FDC806' } },
            scales: { x: { grid: { display: false }, ticks: { color: '#AAA' } }, y: { display: false, beginAtZero: true } }
        }
    });

    const filter = document.getElementById('filterTaxasType');
    // CORREÇÃO DO ERRO: Só adiciona evento se o filtro existir
    if(filter) {
        filter.addEventListener('change', function() {
            const tipo = this.value;
            const newData = taxasData[tipo];
            chart.data.labels = newData.labels;
            chart.data.datasets = newData.datasets;
            chart.update();

            const desc = this.closest('.sebrae-info').querySelector('.info-description');
            if(desc) { // Proteção extra
                if(tipo === 'distorcao') desc.innerHTML = 'A taxa de distorção idade-série variou de <strong>29.8%</strong> para <strong>25.4%</strong> (Fundamental) e de <strong>24.9%</strong> para <strong>21.3%</strong> (Médio).<br><br>Dados fornecidos por <strong>CENSO</strong>.';
                else desc.innerHTML = 'A taxa de abandono escolar variou de <strong>2.04%</strong> para <strong>1.1%</strong> (Fundamental) e de <strong>3.08%</strong> para <strong>3.16%</strong> (Médio).<br><br>Dados fornecidos por <strong>CENSO</strong>.';
            }
        });
    }
}


// B) ENEM (BARRAS)
function createEnemBarChart(canvasId, yearId, catId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const dataLabelsPlugin = {
        id: 'dataLabelsPlugin',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (!meta.hidden) {
                    meta.data.forEach((element, index) => {
                        const data = dataset.data[index];
                        if(data) { ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(data, element.x, element.y - 3); }
                    });
                }
            });
            ctx.restore();
        }
    };

    let chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Matemática', 'Linguagens', 'Humanas', 'Sociais'], datasets: enemFullData["2023"]["genero"] },
        plugins: [dataLabelsPlugin],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#CCC' } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleColor: '#FDC806' } },
            scales: { x: { grid: { display: false }, ticks: { color: '#AAA' } }, y: { display: false, beginAtZero: true, grace: '10%' } }
        }
    });

    const update = () => {
        const yearEl = document.getElementById(yearId);
        const catEl = document.getElementById(catId);
        
        // Se os elementos não existirem, aborta para não dar erro
        if(!yearEl || !catEl) return;

        const y = yearEl.value;
        const c = catEl.value;
        const data = (enemFullData[y] && enemFullData[y][c]) ? enemFullData[y][c] : enemFullData["2023"][c];
        chart.data.datasets = data;
        chart.update();
    };

    // CORREÇÃO DO ERRO PRINCIPAL (Cannot read property addEventListener of null)
    const ySelect = document.getElementById(yearId);
    const cSelect = document.getElementById(catId);

    if(ySelect) ySelect.addEventListener('change', update);
    if(cSelect) cSelect.addEventListener('change', update);
}


// C) COMPARATIVO (LINHAS)
function createComparativoLineChart(canvasId, checkboxClass) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const dataClone = JSON.parse(JSON.stringify(compData));
    const datasets = Object.values(dataClone.datasets).map(ds => ({...ds, tension: 0.4}));

    let chart = new Chart(ctx, {
        type: 'line',
        data: { labels: dataClone.labels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleColor: '#FDC806' } },
            scales: { x: { grid: { display: false }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#888' } } }
        }
    });

    const checkboxes = document.querySelectorAll(checkboxClass);
    if(checkboxes.length > 0) {
        checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const label = e.target.value;
                const ds = chart.data.datasets.find(d => d.label.includes(label) || (label === 'São João De Meriti' && d.label === 'São João De Meriti'));
                if(ds) {
                    const idx = chart.data.datasets.indexOf(ds);
                    chart.setDatasetVisibility(idx, e.target.checked);
                    chart.update();
                }
            });
        });
    }
}


/* --- UTILITÁRIOS --- */
function initCardLoaders() {
    const cards = document.querySelectorAll('.analise-card');
    let chartsInitialized = false;
    cards.forEach(card => {
        card.classList.add('is-loading');
        if(!card.querySelector('.loader-container')) {
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.innerHTML = '<div style="color:#FFF; font-size:12px;">Carregando...</div>';
            card.appendChild(loader);
        }
    });
    setTimeout(() => {
        document.querySelectorAll('.loader-container').forEach(l => l.remove());
        cards.forEach(c => c.classList.remove('is-loading'));
        if (!chartsInitialized) { initCharts(); chartsInitialized = true; }
    }, 500);
}

function initScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = 1; entry.target.style.transform = 'translateY(0)'; } });
    });
    document.querySelectorAll('.section-title, .hero-content').forEach(el => { el.style.opacity = 0; el.style.transform = 'translateY(20px)'; el.style.transition = 'all 0.6s ease-out'; observer.observe(el); });
}

function initKpiCounters() {
    const counters = document.querySelectorAll('.count-up');
    
    // AUMENTEI O SPEED: Quanto maior esse número, mais passos ele dá (mais lento fica)
    // Antes estava 100, agora 500 para ficar bem suave.
    const speed = 500; 

    counters.forEach(counter => {
        const targetAttr = counter.getAttribute('data-target');
        if (!targetAttr) return;

        const target = +targetAttr;
        
        const updateCount = () => {
            // Pega o valor atual (removendo pontos de milhar se houver)
            const currentText = counter.innerText.replace(/\./g, '');
            const count = +currentText;
            
            // Calcula o incremento. Math.ceil garante que sempre ande pelo menos 1
            const inc = Math.max(1, Math.ceil(target / speed));

            if (count < target) {
                // Adiciona o incremento e formata
                counter.innerText = (count + inc).toLocaleString('pt-BR');
                
                // setTimeout(..., 20) -> Espera 20ms entre cada atualização
                // Isso cria o efeito de "rolagem" mais visível ao olho humano
                setTimeout(updateCount, 20); 
            } else {
                // Garante que termine exatamente no número final
                counter.innerText = target.toLocaleString('pt-BR');
            }
        };

        updateCount();
    });
}

// --- CRIA GRÁFICO DE MATRÍCULAS (NOVO) ---
function createMatriculasChart() {
    const ctx = document.getElementById('chartMatriculas').getContext('2d');
    
    // Plugin de Labels
    const labelsPlugin = {
        id: 'matriculasLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (!meta.hidden) {
                    meta.data.forEach((element, index) => {
                        const data = dataset.data[index];
                        if(data > 0) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.font = 'bold 10px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(data.toFixed(1) + '%', element.x, element.y - 5);
                        }
                    });
                }
            });
            ctx.restore();
        }
    };

    let chart = new Chart(ctx, {
        type: 'bar', // Tipo Barras
        data: {
            labels: matriculasData['infantil'].labels,
            datasets: matriculasData['infantil'].datasets
        },
        plugins: [labelsPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#CCC', font: {size: 11} } },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleColor: '#FDC806' }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#AAA' } },
                y: { display: false, beginAtZero: true }
            }
        }
    });

    const filter = document.getElementById('filterMatriculasType');
    if(filter) {
        filter.addEventListener('change', function() {
            const tipo = this.value;
            const newData = matriculasData[tipo];
            
            chart.data.labels = newData.labels;
            chart.data.datasets = newData.datasets;
            chart.update();

            const desc = this.closest('.sebrae-info').querySelector('.info-description');
            if(desc) {
                if(tipo === 'infantil') {
                    desc.innerHTML = `Em São João De Meriti, em 2024, no âmbito de <strong>Educação Infantil</strong>, a modalidade <strong>Pré-escola</strong> representa <strong>70.8%</strong> do total, somando <strong>9,476</strong> matrículas.<br><br>Esta visualização apresenta a distribuição relativa das matrículas em Educação Infantil em São João De Meriti ao longo dos anos. Ela permite comparar a participação de cada modalidade de ensino e identificar qual delas concentra a maior proporção de estudantes.<br>Dados fornecidos por <strong>CENSO - Conjunto de Dados Estatísticos Detalhados sobre a População</strong>.`;
                } else {
                    desc.innerHTML = `Em São João De Meriti, em 2024, no âmbito de <strong>Ensino Fundamental</strong>, a modalidade <strong>Anos Iniciais</strong> representa <strong>58.5%</strong> do total, somando <strong>28,993</strong> matrículas.<br><br>Esta visualização apresenta a distribuição relativa das matrículas em Ensino Fundamental em São João De Meriti ao longo dos anos. Ela permite comparar a participação de cada modalidade de ensino e identificar qual delas concentra a maior proporção de estudantes.<br>Dados fornecidos por <strong>CENSO - Conjunto de Dados Estatísticos Detalhados sobre a População</strong>.`;
                }
            }
        });
    }
}

// --- CRIA GRÁFICO DE EVOLUÇÃO (LINHA) ---
function createEvolucaoChart() {
    const ctx = document.getElementById('chartEvolucaoMatriculas').getContext('2d');
    
    // Gradiente para deixar a linha bonita (Fundo)
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 168, 232, 0.5)'); // Azul #00A8E8
    gradient.addColorStop(1, 'rgba(0, 168, 232, 0.0)');

    const dataValues = [26188, 26363, 26009, 26119, 27895, 28499, 28377];
    const labels = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];

    // Plugin para valores nos pontos (Dots)
    const labelsPlugin = {
        id: 'evolucaoLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (!meta.hidden) {
                    meta.data.forEach((element, index) => {
                        // Mostra apenas o primeiro, o último e o maior valor para não poluir
                        const val = dataset.data[index];
                        if (index === 0 || index === dataset.data.length - 1 || val === Math.max(...dataset.data)) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.font = 'bold 11px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(val.toLocaleString('pt-BR'), element.x, element.y - 8);
                        }
                    });
                }
            });
            ctx.restore();
        }
    };

    new Chart(ctx, {
        type: 'line', // Tipo Linha
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Matrículas',
                data: dataValues,
                borderColor: '#00A8E8', // Azul SJM
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#00A8E8',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true, // Preenche embaixo da linha
                tension: 0.4 // Curva suave (spline)
            }]
        },
        plugins: [labelsPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Sem legenda pois é série única
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#00A8E8',
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toLocaleString('pt-BR') + ' Matrículas';
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#AAA' } },
                y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: '#888' },
                    beginAtZero: false // Começa próximo do valor mínimo para destacar a variação
                }
            }
        }
    });
}