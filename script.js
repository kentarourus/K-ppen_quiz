let climateData = [];
let currentQuestion = null;
let chartInstance = null;

const koppenDescriptions = {
    'Af': '熱帯雨林気候',
    'Am': '熱帯モンスーン気候',
    'Aw': 'サバナ気候',
    'BWh': '砂漠気候 (高温)',
    'BWk': '砂漠気候 (低温)',
    'BSh': 'ステップ気候 (高温)',
    'BSk': 'ステップ気候 (低温)',
    'Cfa': '温暖湿潤気候',
    'Cfb': '西岸海洋性気候',
    'Cfc': '西岸海洋性気候 (短夏)',
    'Csa': '地中海性気候 (高温)',
    'Csb': '地中海性気候 (温和)',
    'Cwa': '温暖冬季少雨気候',
    'Cwb': '温暖冬季少雨気候 (温和)',
    'Dfa': '亜寒帯湿潤気候 (高温)',
    'Dfb': '亜寒帯湿潤気候 (温和)',
    'Dfc': '亜寒帯湿潤気候 (短夏)',
    'Dwa': '亜寒帯冬季少雨気候 (高温)',
    'Dwb': '亜寒帯冬季少雨気候 (温和)',
    'Dwc': '亜寒帯冬季少雨気候 (短夏)',
    'Dsa': '亜寒帯夏乾燥気候',
    'Dsb': '亜寒帯夏乾燥気候',
    'Dsc': '亜寒帯夏乾燥気候',
    'Dsd': '亜寒帯夏乾燥気候 (極寒)',
    'ET': 'ツンドラ気候',
    'EF': '氷雪気候'
};

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-next').addEventListener('click', nextQuestion);
});

async function fetchData() {
    try {
        const response = await fetch('climate_data.json');
        climateData = await response.json();
        
        // Remove 'Unknown' types
        climateData = climateData.filter(d => d.koppen !== 'Unknown');

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');
        
        nextQuestion();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('loading').innerHTML = '<p class="error">データの読み込みに失敗しました。</p>';
    }
}

function nextQuestion() {
    // Reset UI
    document.getElementById('hint-section').classList.add('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    document.getElementById('btn-hint').classList.remove('hidden');
    document.getElementById('result-message').classList.add('hidden');
    
    // Select random station
    const randomIndex = Math.floor(Math.random() * climateData.length);
    currentQuestion = climateData[randomIndex];

    // Render Chart
    renderChart(currentQuestion);

    // Generate Options
    generateOptions();
}

function renderChart(data) {
    const ctx = document.getElementById('climograph').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '気温 (℃)',
                    data: data.temperature,
                    type: 'line',
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    borderWidth: 3,
                    pointRadius: 4,
                    yAxisID: 'y-temp',
                    tension: 0.3
                },
                {
                    label: '降水量 (mm)',
                    data: data.precipitation,
                    type: 'bar',
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    yAxisID: 'y-precip'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: '#f8fafc' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                'y-temp': {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: '気温 (℃)', color: '#ef4444' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#ef4444' },
                    suggestedMin: -30,
                    suggestedMax: 40
                },
                'y-precip': {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: '降水量 (mm)', color: '#3b82f6' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#3b82f6' },
                    suggestedMin: 0,
                    suggestedMax: 400
                }
            }
        }
    });
}

function generateOptions() {
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    const correctType = currentQuestion.koppen;
    const options = new Set([correctType]);

    // Get all possible unique types from data
    const allTypes = [...new Set(climateData.map(d => d.koppen))];

    // Add 3 random incorrect options
    while(options.size < 4) {
        const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
        options.add(randomType);
    }

    // Shuffle options
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = type;
        btn.onclick = () => checkAnswer(type, btn);
        grid.appendChild(btn);
    });
}

function checkAnswer(selectedType, btnElement) {
    const correctType = currentQuestion.koppen;
    const isCorrect = selectedType === correctType;
    
    // Disable all buttons
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => {
        b.disabled = true;
        if (b.textContent === correctType) {
            b.classList.add('correct');
        }
    });

    if (!isCorrect) {
        btnElement.classList.add('wrong');
    }

    // Show result message
    const msgElement = document.getElementById('result-message');
    msgElement.classList.remove('hidden', 'success', 'error');
    
    const desc = koppenDescriptions[correctType] || '';
    
    if (isCorrect) {
        msgElement.classList.add('success');
        msgElement.innerHTML = `正解！<br>ここは <strong>${currentQuestion.station} (${currentQuestion.country})</strong> です。<br>気候区分は <strong>${correctType} (${desc})</strong> です。`;
    } else {
        msgElement.classList.add('error');
        msgElement.innerHTML = `残念！<br>ここは <strong>${currentQuestion.station} (${currentQuestion.country})</strong> です。<br>正解は <strong>${correctType} (${desc})</strong> でした。`;
    }

    // Show hint section and update controls
    document.getElementById('hint-section').classList.remove('hidden');
    document.getElementById('location-hint').textContent = `${currentQuestion.station}, ${currentQuestion.country}`;
    document.getElementById('btn-hint').classList.add('hidden');
    document.getElementById('btn-next').classList.remove('hidden');
}

function showHint() {
    document.getElementById('hint-section').classList.remove('hidden');
    document.getElementById('location-hint').textContent = `${currentQuestion.station}, ${currentQuestion.country}`;
    document.getElementById('btn-hint').classList.add('hidden');
}
