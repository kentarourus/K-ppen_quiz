let climateData = [];
let answerMode = 'choice';
let currentQuestion = null;
let chartInstance = null;
let quizScope = localStorage.getItem('quizScope') || 'highschool';

const highSchoolKoppenMap = {
    'Af': 'Af', 'Am': 'Am', 'Aw': 'Aw', 'As': 'Aw',
    'BWh': 'BW', 'BWk': 'BW', 'BSh': 'BS', 'BSk': 'BS',
    'Cfa': 'Cfa', 'Cfb': 'Cfb', 'Cfc': 'Cfb',
    'Csa': 'Cs', 'Csb': 'Cs', 'Csc': 'Cs',
    'Cwa': 'Cw', 'Cwb': 'Cw', 'Cwc': 'Cw',
    'Dfa': 'Df', 'Dfb': 'Df', 'Dfc': 'Df', 'Dfd': 'Df',
    'Dwa': 'Dw', 'Dwb': 'Dw', 'Dwc': 'Dw', 'Dwd': 'Dw',
    'Dsa': 'Df', 'Dsb': 'Df', 'Dsc': 'Df', 'Dsd': 'Df',
    'ET': 'ET', 'EF': 'EF'
};

const koppenDescriptions = {
    'Af': '熱帯雨林気候',
    'Am': '熱帯モンスーン気候',
    'Aw': 'サバナ気候',
    'BW': '砂漠気候',
    'BS': 'ステップ気候',
    'BWh': '砂漠気候 (高温)',
    'BWk': '砂漠気候 (低温)',
    'BSh': 'ステップ気候 (高温)',
    'BSk': 'ステップ気候 (低温)',
    'Cfa': '温暖湿潤気候',
    'Cfb': '西岸海洋性気候',
    'Cfc': '西岸海洋性気候 (短夏)',
    'Cs': '地中海性気候',
    'Cw': '温暖冬季少雨気候',
    'Csa': '地中海性気候 (高温)',
    'Csb': '地中海性気候 (温和)',
    'Cwa': '温暖冬季少雨気候 (高温)',
    'Cwb': '温暖冬季少雨気候 (温和)',
    'Df': '亜寒帯湿潤気候',
    'Dw': '亜寒帯冬季少雨気候',
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

    // Initialize scope select value
    const scopeSelect = document.getElementById('scope-select');
    if (scopeSelect) {
        scopeSelect.value = quizScope;
    }

    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-next').addEventListener('click', nextQuestion);
    
    // Input mode events
    document.getElementById('btn-submit-answer').addEventListener('click', submitInputAnswer);
    document.getElementById('answer-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitInputAnswer();
        }
    });

    // Close settings dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const trigger = document.querySelector('.settings-trigger');
        const dropdown = document.getElementById('settings-dropdown');
        if (trigger && dropdown && !trigger.contains(e.target) && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    });
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
    document.getElementById('explanation-container').classList.add('hidden');
    
    // Reset input field styling
    const inputField = document.getElementById('answer-input');
    inputField.value = '';
    inputField.disabled = false;
    inputField.style.borderColor = 'var(--glass-border)';
    inputField.style.background = 'rgba(15, 23, 42, 0.5)';
    document.getElementById('btn-submit-answer').disabled = false;
    
    // Select random station
    const randomIndex = Math.floor(Math.random() * climateData.length);
    currentQuestion = climateData[randomIndex];

    // Render Chart
    renderChart(currentQuestion);

    // Generate Options
    generateOptions();
    
    if (answerMode === 'input') {
        setTimeout(() => inputField.focus(), 10);
    }
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

    const correctType = getDisplayKoppen(currentQuestion.koppen);
    const options = new Set([correctType]);

    // Get all possible unique types from data, mapped to current scope
    const allTypes = [...new Set(climateData.map(d => getDisplayKoppen(d.koppen)))];

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
    const correctType = getDisplayKoppen(currentQuestion.koppen);
    const isCorrect = selectedType.toUpperCase() === correctType.toUpperCase();
    
    // Disable all buttons
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => {
        b.disabled = true;
        if (b.textContent.toUpperCase() === correctType.toUpperCase()) {
            b.classList.add('correct');
        }
    });

    if (btnElement) {
        if (!isCorrect) {
            btnElement.classList.add('wrong');
        }
    } else {
        const inputField = document.getElementById('answer-input');
        if (isCorrect) {
            inputField.style.borderColor = 'var(--success)';
            inputField.style.background = 'rgba(16, 185, 129, 0.15)';
        } else {
            inputField.style.borderColor = 'var(--error)';
            inputField.style.background = 'rgba(239, 68, 68, 0.15)';
        }
    }
    
    // Show result message
    const msgElement = document.getElementById('result-message');
    msgElement.classList.remove('hidden', 'success', 'error');
    
    const desc = koppenDescriptions[correctType] || '';
    
    if (isCorrect) {
        msgElement.classList.add('success');
        msgElement.innerHTML = "正解！<br>ここは <strong>" + currentQuestion.station + " (" + currentQuestion.country + ")</strong> です。<br>気候区分は <strong>" + correctType + " (" + desc + ")</strong> です。";
    } else {
        msgElement.classList.add('error');
        const typedPart = btnElement ? "" : " あなたの回答: <strong>" + selectedType.toUpperCase() + "</strong><br>";
        msgElement.innerHTML = "残念！<br>" + typedPart + "ここは <strong>" + currentQuestion.station + " (" + currentQuestion.country + ")</strong> です。<br>正解は <strong>" + correctType + " (" + desc + ")</strong> でした。";
    }

    // Show hint section and update controls
    document.getElementById('hint-section').classList.remove('hidden');
    document.getElementById('location-hint').textContent = currentQuestion.station + ", " + currentQuestion.country;
    document.getElementById('btn-hint').classList.add('hidden');
    document.getElementById('btn-next').classList.remove('hidden');

    // Show explanation
    const explanationContainer = document.getElementById('explanation-container');
    const explanationContent = document.getElementById('explanation-content');
    explanationContent.innerHTML = getKoppenExplanation(currentQuestion);
    explanationContainer.classList.remove('hidden');
}

function showHint() {
    document.getElementById('hint-section').classList.remove('hidden');
    document.getElementById('location-hint').textContent = `${currentQuestion.station}, ${currentQuestion.country}`;
    document.getElementById('btn-hint').classList.add('hidden');
}

function getKoppenExplanation(data) {
    const temps = data.temperature.map(Number);
    const precips = data.precipitation.map(Number);
    
    const t_mean = temps.reduce((a, b) => a + b, 0) / 12;
    const p_ann = precips.reduce((a, b) => a + b, 0);
    
    const maxTemp = Math.max(...temps);
    const maxTempMonth = temps.indexOf(maxTemp) + 1;
    const minTemp = Math.min(...temps);
    const minTempMonth = temps.indexOf(minTemp) + 1;
    
    // Determine hemisphere based on warm half-year
    const temp_h1 = temps.slice(3, 9).reduce((a, b) => a + b, 0); // Apr-Sep
    const temp_h2 = temps.slice(0, 3).concat(temps.slice(9, 12)).reduce((a, b) => a + b, 0); // Oct-Mar
    
    const isNH = temp_h1 > temp_h2;
    const hemisphere = isNH ? '北半球' : '南半球';
    
    let summer_precip, winter_precip, p_wmax, p_wmin, p_smax, p_smin;
    let summer_months_text, winter_months_text;
    
    if (isNH) {
        summer_precip = precips.slice(3, 9).reduce((a, b) => a + b, 0);
        winter_precip = precips.slice(0, 3).concat(precips.slice(9, 12)).reduce((a, b) => a + b, 0);
        p_wmax = Math.max(...precips.slice(0, 3).concat(precips.slice(9, 12)));
        p_wmin = Math.min(...precips.slice(0, 3).concat(precips.slice(9, 12)));
        p_smax = Math.max(...precips.slice(3, 9));
        p_smin = Math.min(...precips.slice(3, 9));
        summer_months_text = '4月〜9月';
        winter_months_text = '10月〜3月';
    } else {
        summer_precip = precips.slice(0, 3).concat(precips.slice(9, 12)).reduce((a, b) => a + b, 0);
        winter_precip = precips.slice(3, 9).reduce((a, b) => a + b, 0);
        p_smax = Math.max(...precips.slice(0, 3).concat(precips.slice(9, 12)));
        p_smin = Math.min(...precips.slice(0, 3).concat(precips.slice(9, 12)));
        p_wmax = Math.max(...precips.slice(3, 9));
        p_wmin = Math.min(...precips.slice(3, 9));
        summer_months_text = '10月〜3月';
        winter_months_text = '4月〜9月';
    }
    
    const summer_ratio = (summer_precip / p_ann) * 100;
    const winter_ratio = (winter_precip / p_ann) * 100;
    
    let p_th;
    let threshold_type = "";
    if (summer_precip >= 0.7 * p_ann) {
        p_th = 20 * t_mean + 280;
        threshold_type = "夏に雨が多い（夏雨型：" + summer_months_text + "の降水量が年間の70%以上）ため、乾燥限界値 = 20 × 年平均気温 + 280";
    } else if (winter_precip >= 0.7 * p_ann) {
        p_th = 20 * t_mean;
        threshold_type = "冬に雨が多い（冬雨型：" + winter_months_text + "の降水量が年間の70%以上）ため、乾燥限界値 = 20 × 年平均気温";
    } else {
        p_th = 20 * t_mean + 140;
        threshold_type = "降水量が年中平均している（年中湿潤・平均型）ため、乾燥限界値 = 20 × 年平均気温 + 140";
    }
    
    let explanationSteps = [];
    
    explanationSteps.push(
        "<div class=\"stat-summary\">" +
            "<h4>観測データのまとめ</h4>" +
            "<div class=\"stat-grid\">" +
                "<div><span>年平均気温:</span> <strong>" + t_mean.toFixed(1) + " ℃</strong></div>" +
                "<div><span>年降水量:</span> <strong>" + p_ann.toFixed(1) + " mm</strong></div>" +
                "<div><span>最暖月気温:</span> <strong>" + maxTemp.toFixed(1) + " ℃</strong> (" + maxTempMonth + "月)</div>" +
                "<div><span>最寒月気温:</span> <strong>" + minTemp.toFixed(1) + " ℃</strong> (" + minTempMonth + "月)</div>" +
            "</div>" +
        "</div>"
    );

    let stepNumber = 1;
    
    // Check E (Polar)
    if (maxTemp < 10) {
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>寒帯 (E) の判定</h5>" +
                "<p>最暖月の平均気温が <strong>" + maxTemp.toFixed(1) + " ℃</strong> で、10℃未満です。</p>" +
                "<p class=\"decision-met\">➔ <strong>寒帯 (E)</strong> に分類されます。</p>" +
            "</div>"
        );
        
        if (maxTemp < 0) {
            explanationSteps.push(
                "<div class=\"step-card\">" +
                    "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                    "<h5>気候区分の決定</h5>" +
                    "<p>最暖月の平均気温が <strong>" + maxTemp.toFixed(1) + " ℃</strong> で、0℃未満です。</p>" +
                    "<p class=\"decision-met\">➔ <strong>氷雪気候 (EF)</strong> となります。</p>" +
                "</div>"
            );
        } else {
            explanationSteps.push(
                "<div class=\"step-card\">" +
                    "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                    "<h5>気候区分の決定</h5>" +
                    "<p>最暖月の平均気温が <strong>" + maxTemp.toFixed(1) + " ℃</strong> で、0℃以上10℃未満です。</p>" +
                    "<p class=\"decision-met\">➔ <strong>ツンドラ気候 (ET)</strong> となります。</p>" +
                "</div>"
            );
        }
        return explanationSteps.join("");
    } else {
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>寒帯 (E) の判定</h5>" +
                "<p>最暖月の平均気温が <strong>" + maxTemp.toFixed(1) + " ℃</strong> で、10℃以上あります。</p>" +
                "<p class=\"decision-not-met\">➔ 寒帯 (E) ではありません。</p>" +
            "</div>"
        );
    }
    
    // Check B (Dry)
    const isDry = p_ann < p_th;
    explanationSteps.push(
        "<div class=\"step-card\">" +
            "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
            "<h5>乾燥帯 (B) の判定</h5>" +
            "<p>半球判定: 気温の推移から <strong>" + hemisphere + "</strong> と判定されます。</p>" +
            "<p>降水パターン判定: " + threshold_type + " = <strong>" + p_th.toFixed(1) + " mm</strong> となります。</p>" +
            "<p>年降水量 <strong>" + p_ann.toFixed(1) + " mm</strong> と乾燥限界値 <strong>" + p_th.toFixed(1) + " mm</strong> を比較します。</p>" +
            (isDry ? 
                "<p class=\"decision-met\">➔ 年降水量が乾燥限界値未満であるため、<strong>乾燥帯 (B)</strong> に分類されます。</p>" : 
                "<p class=\"decision-not-met\">➔ 年降水量が乾燥限界値以上であるため、乾燥帯 (B) ではありません。</p>"
            ) +
        "</div>"
    );
    
    if (isDry) {
        const isDesert = p_ann < 0.5 * p_th;
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>砂漠 (BW) / ステップ (BS) の判定</h5>" +
                "<p>年降水量が乾燥限界値の半分 (0.5 × P_th = <strong>" + (0.5 * p_th).toFixed(1) + " mm</strong>) 未満かどうかを判定します。</p>" +
                (isDesert ?
                    "<p class=\"decision-met\">➔ 限界値の半分未満のため、<strong>砂漠気候 (BW)</strong> です。</p>" :
                    "<p class=\"decision-met\">➔ 限界値の半分以上のため、<strong>ステップ気候 (BS)</strong> です。</p>"
                ) +
            "</div>"
        );
        
        const isHot = t_mean >= 18;
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>温度区分の判定 (h/k)</h5>" +
                "<p>年平均気温が <strong>" + t_mean.toFixed(1) + " ℃</strong> です。18℃以上かどうかを判定します。</p>" +
                (isHot ?
                    "<p class=\"decision-met\">➔ 18℃以上のため、高温型の <strong>h</strong> です。</p>" :
                    "<p class=\"decision-met\">➔ 18℃未満のため、低温型の <strong>k</strong> です。</p>"
                ) +
                (quizScope === 'highschool' ?
                    "<p class=\"decision-met\" style=\"color: var(--primary) !important;\">➔ 高校地理の範囲では h/k は区別しないため、<strong>" + (isDesert ? 'BW' : 'BS') + " (" + (koppenDescriptions[isDesert ? 'BW' : 'BS'] || '') + ")</strong> となります。</p>" :
                    "<p class=\"decision-met\">➔ 結論: <strong>" + (isDesert ? 'BW' : 'BS') + (isHot ? 'h' : 'k') + " (" + (koppenDescriptions[(isDesert ? 'BW' : 'BS') + (isHot ? 'h' : 'k')] || '') + ")</strong> となります。</p>"
                ) +
            "</div>"
        );
        return explanationSteps.join("");
    }
    
    // Check A, C, D
    let climateZone = "";
    if (minTemp >= 18) {
        climateZone = "A";
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>熱帯・温帯・亜寒帯の判定</h5>" +
                "<p>最寒月の平均気温が <strong>" + minTemp.toFixed(1) + " ℃</strong> です。これが18℃以上であるかを判定します。</p>" +
                "<p class=\"decision-met\">➔ 18℃以上のため、<strong>熱帯 (A)</strong> に分類されます。</p>" +
            "</div>"
        );
        
        const p_min = Math.min(...precips);
        const p_min_month = precips.indexOf(p_min) + 1;
        const isAf = p_min >= 60;
        
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>熱帯の細分判定</h5>" +
                "<p>最少雨月の降水量 (<strong>" + p_min.toFixed(1) + " mm</strong>, " + p_min_month + "月) を確認します。</p>" +
                (isAf ?
                    "<p class=\"decision-met\">➔ 最少雨月降水量が60mm以上のため、<strong>熱帯雨林気候 (Af)</strong> です。</p>" :
                    "<p>最少雨月降水量が60mm未満です。モンスーン気候の閾値 (100 - 年降水量 / 25 = <strong>" + (100 - p_ann/25).toFixed(1) + " mm</strong>) と比較します。</p>" +
                     (p_min >= 100 - p_ann / 25 ?
                        "<p class=\"decision-met\">➔ 最少雨月降水量が閾値以上のため、<strong>熱帯モンスーン気候 (Am)</strong> です。</p>" :
                        "<p class=\"decision-met\">➔ 最少雨月降水量が閾値未満のため、<strong>サバナ気候 (Aw)</strong> です。</p>"
                     )
                ) +
            "</div>"
        );
        return explanationSteps.join("");
    } else if (minTemp >= -3) {
        climateZone = "C";
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>熱帯・温帯・亜寒帯の判定</h5>" +
                "<p>最寒月の平均気温が <strong>" + minTemp.toFixed(1) + " ℃</strong> です。これが -3℃以上18℃未満 の範囲にあるかを判定します。</p>" +
                "<p class=\"decision-met\">➔ 範囲内のため、<strong>温帯 (C)</strong> に分類されます。</p>" +
            "</div>"
        );
    } else {
        climateZone = "D";
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>熱帯・温帯・亜寒帯の判定</h5>" +
                "<p>最寒月の平均気温が <strong>" + minTemp.toFixed(1) + " ℃</strong> です。これが -3℃未満かつ 最暖月平均気温が 10℃以上 であるかを判定します。</p>" +
                "<p class=\"decision-met\">➔ 条件を満たすため、<strong>亜寒帯/冷帯 (D)</strong> に分類されます。</p>" +
            "</div>"
        );
    }
    
    // Now determine 2nd letter (s/w/f) for C and D
    let precipLetter = "f";
    let precipExplanation = "";
    
    const isS = p_smin < 40 && p_smin < p_wmax / 3;
    const isW = p_wmin < p_smax / 10;
    
    if (isS) {
        precipLetter = "s";
        precipExplanation = "夏期最少雨月の降水量 (<strong>" + p_smin.toFixed(1) + " mm</strong>) が40mm未満かつ冬期最多雨月の3分の1未満であるため、夏季乾燥の <strong>s</strong> となります。";
    } else if (isW) {
        precipLetter = "w";
        precipExplanation = "冬期最少雨月の降水量 (<strong>" + p_wmin.toFixed(1) + " mm</strong>) が夏期最多雨月の10分の1未満であるため、冬季乾燥の <strong>w</strong> となります。";
    } else {
        precipLetter = "f";
        precipExplanation = "乾燥条件（夏季乾燥 s、冬季乾燥 w）のどちらも満たさないため、湿潤の <strong>f</strong> となります。";
    }
    
    explanationSteps.push(
        "<div class=\"step-card\">" +
            "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
            "<h5>降水パターンの判定 (s/w/f)</h5>" +
            "<p>夏期（温暖な半年）の最少雨月降水量: <strong>" + p_smin.toFixed(1) + " mm</strong>, 冬期最多雨月: <strong>" + p_wmax.toFixed(1) + " mm</strong></p>" +
            "<p>冬期（寒冷な半年）の最少雨月降水量: <strong>" + p_wmin.toFixed(1) + " mm</strong>, 夏期最多雨月: <strong>" + p_smax.toFixed(1) + " mm</strong></p>" +
            "<p class=\"decision-met\">➔ " + precipExplanation + "</p>" +
        "</div>"
    );
    
    // Now determine 3rd letter (a/b/c/d)
    let tempLetter = "c";
    let tempExplanation = "";
    const monthsAbove10 = temps.filter(t => t >= 10).length;
    
    if (maxTemp >= 22) {
        tempLetter = "a";
        tempExplanation = "最暖月の平均気温が <strong>" + maxTemp.toFixed(1) + " ℃</strong> で、22℃以上であるため <strong>a</strong> です。";
    } else if (monthsAbove10 >= 4) {
        tempLetter = "b";
        tempExplanation = "最暖月が22℃未満ですが、10℃以上の月が <strong>" + monthsAbove10 + "ヶ月</strong> あり、4ヶ月以上であるため <strong>b</strong> です。";
    } else {
        if (climateZone === "D" && minTemp < -38) {
            tempLetter = "d";
            tempExplanation = "最暖月が22℃未満で10℃以上の月が <strong>" + monthsAbove10 + "ヶ月</strong> (4ヶ月未満) であり、さらに最寒月が -38℃未満 (<strong>" + minTemp.toFixed(1) + " ℃</strong>) であるため厳寒の <strong>d</strong> です。";
        } else {
            tempLetter = "c";
            tempExplanation = "最暖月が22℃未満で10℃以上の月が <strong>" + monthsAbove10 + "ヶ月</strong> (4ヶ月未満) であるため <strong>c</strong> です。";
        }
    }

    const showStep5 = !(quizScope === 'highschool' && (climateZone === 'D' || precipLetter === 's' || precipLetter === 'w'));
    
    if (showStep5) {
        explanationSteps.push(
            "<div class=\"step-card\">" +
                "<span class=\"step-badge\">ステップ " + (stepNumber++) + "</span>" +
                "<h5>気温による細分判定 (a/b/c/d)</h5>" +
                "<p>最暖月平均気温: <strong>" + maxTemp.toFixed(1) + " ℃</strong>、10℃以上の月数: <strong>" + monthsAbove10 + "ヶ月</strong>" + (climateZone === "D" ? "、最寒月平均気温: <strong>" + minTemp.toFixed(1) + " ℃</strong>" : "") + "</p>" +
                "<p class=\"decision-met\">➔ " + tempExplanation + "</p>" +
            "</div>"
        );
    }
    
    const finalCode = climateZone + precipLetter + tempLetter;
    const displayCode = getDisplayKoppen(finalCode);
    let explanationText = "➔ 結論: <strong>" + finalCode + " (" + (koppenDescriptions[finalCode] || '') + ")</strong> となります。";
    if (quizScope === 'highschool' && finalCode !== displayCode) {
        explanationText += "<br><span style='color: var(--primary); font-weight: bold;'>※高校地理の範囲では、簡略化して <strong>" + displayCode + " (" + (koppenDescriptions[displayCode] || '') + ")</strong> として扱います。</span>";
    }

    explanationSteps.push(
        "<div class='step-card final-decision'>" +
            "<span class='step-badge success'>判定結果</span>" +
            "<h5>気候区分の確定</h5>" +
            "<p class='decision-met'>" + explanationText + "</p>" +
        "</div>"
    );
    
    return explanationSteps.join("");
}


function setAnswerMode(mode) {
    answerMode = mode;
    
    // Toggle active classes on buttons
    document.getElementById('mode-choice').classList.toggle('active', mode === 'choice');
    document.getElementById('mode-input').classList.toggle('active', mode === 'input');
    
    // Show/hide sections
    const optionsGrid = document.getElementById('options-grid');
    const inputSection = document.getElementById('input-section');
    
    if (mode === 'choice') {
        optionsGrid.classList.remove('hidden');
        inputSection.classList.add('hidden');
    } else {
        optionsGrid.classList.add('hidden');
        inputSection.classList.remove('hidden');
        
        // Reset and focus input field
        const inputField = document.getElementById('answer-input');
        inputField.value = '';
        inputField.disabled = false;
        inputField.style.borderColor = 'var(--glass-border)';
        inputField.style.background = 'rgba(15, 23, 42, 0.5)';
        document.getElementById('btn-submit-answer').disabled = false;
        inputField.focus();
    }
}

function submitInputAnswer() {
    const inputField = document.getElementById('answer-input');
    const selectedType = inputField.value.trim();
    if (!selectedType) return;
    
    inputField.disabled = true;
    document.getElementById('btn-submit-answer').disabled = true;
    
    checkAnswer(selectedType, null);
}

function toggleSettingsDropdown() {
    const dropdown = document.getElementById('settings-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function setScope(scope) {
    quizScope = scope;
    localStorage.setItem('quizScope', scope);
    nextQuestion();
}

function getDisplayKoppen(code) {
    if (quizScope === 'highschool') {
        return highSchoolKoppenMap[code] || code;
    }
    return code;
}
