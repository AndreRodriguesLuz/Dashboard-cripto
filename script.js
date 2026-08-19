// Aguarda o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById('mainChart').getContext('2d');

    // Configuração do Gráfico Principal
    const mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [
                {
                    label: 'Bitcoin (BTC)',
                    data: [62100, 62800, 62400, 63900, 63500, 64100, 64250],
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'NVIDIA (NVDA)',
                    data: [123.00, 124.20, 123.80, 126.00, 125.50, 127.80, 128.50],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Segoe UI', size: 12 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: '#232936' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: '#232936' },
                    ticks: { color: '#94a3b8' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Simulação de alteração nos botões de período (24h, 7D, 1M)
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});