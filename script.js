let trackedAssets = JSON.parse(localStorage.getItem('trackedAssetsObjects')) || [
  { id: 'avalanche-2', type: 'crypto' },
  { id: 'bitcoin', type: 'crypto' },
  { id: 'solana', type: 'crypto' },
  { id: 'dogecoin', type: 'crypto' },
  { id: 'tesla-xstock', type: 'stock' },
  { id: 'anvil', type: 'stock' }
];

function getAssetId(asset) {
  return typeof asset === 'string' ? asset : asset.id;
}

let firstAsset = trackedAssets[0];
let selectedAssetForChart = firstAsset ? getAssetId(firstAsset) : 'solana';

let chartInstance = null;
let currentDays = 1;
let preferredCurrency = 'brl'; 
let currentCategory = 'all'; 

let priceCache = { data: {} };
let chartCache = {}; 
let isSearching = false;

const FALLBACK_USD_BRL = 5.5;

// Mock inicial com preços base fixos e isolados por moeda
const mockPrices = {
  'bitcoin': { usd: 65000, brl: 357500, usd_24h_change: 2.5, brl_24h_change: 2.5 },
  'ethereum': { usd: 2300, brl: 12650, usd_24h_change: 1.8, brl_24h_change: 1.8 },
  'binancecoin': { usd: 580, brl: 3190, usd_24h_change: 1.5, brl_24h_change: 1.5 },
  'solana': { usd: 140, brl: 770, usd_24h_change: 4.8, brl_24h_change: 4.8 },
  'dogecoin': { usd: 0.12, brl: 0.66, usd_24h_change: 1.2, brl_24h_change: 1.2 },
  'tesla-xstock': { usd: 220, brl: 1210, usd_24h_change: -0.5, brl_24h_change: -0.5 },
  'shiba-inu': { usd: 0.000018, brl: 0.000099, usd_24h_change: 0.9, brl_24h_change: 0.9 },
  'avalanche-2': { usd: 25, brl: 137.5, usd_24h_change: 1.1, brl_24h_change: 1.1 },
  'cardano': { usd: 0.35, brl: 1.92, usd_24h_change: 0.4, brl_24h_change: 0.4 },
  'apple-xstock': { usd: 225, brl: 1237.5, usd_24h_change: 0.8, brl_24h_change: 0.8 },
  'nvidia-xstock': { usd: 128, brl: 704, usd_24h_change: 1.5, brl_24h_change: 1.5 },
  'microsoft-ondo-tokenized-stock': { usd: 440, brl: 2420, usd_24h_change: 0.3, brl_24h_change: 0.3 },
  'netflix-xstock': { usd: 680, brl: 3740, usd_24h_change: 1.2, brl_24h_change: 1.2 },
  'amazon-xstock': { usd: 180, brl: 990, usd_24h_change: -0.2, brl_24h_change: -0.2 },
  'alphabet-xstock': { usd: 165, brl: 907.5, usd_24h_change: 0.6, brl_24h_change: 0.6 }
};

const fallbackCoins = [
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', type: 'crypto' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto' },
  { id: 'binancecoin', name: 'BNB / Binance Coin', symbol: 'BNB', type: 'crypto' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', type: 'crypto' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', type: 'crypto' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', type: 'crypto' },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', type: 'crypto' },
  { id: 'tesla-xstock', name: 'Tesla Stock Token', symbol: 'TSLA', type: 'stock' },
  { id: 'apple-xstock', name: 'Apple Stock Token', symbol: 'AAPL', type: 'stock' },
  { id: 'nvidia-xstock', name: 'NVIDIA Stock Token', symbol: 'NVDA', type: 'stock' },
  { id: 'microsoft-ondo-tokenized-stock', name: 'Microsoft Stock Token', symbol: 'MSFT', type: 'stock' },
  { id: 'netflix-xstock', name: 'Netflix Stock Token', symbol: 'NFLX', type: 'stock' },
  { id: 'amazon-xstock', name: 'Amazon Stock Token', symbol: 'AMZN', type: 'stock' },
  { id: 'alphabet-xstock', name: 'Google (Alphabet) Token', symbol: 'GOOGL', type: 'stock' }
];

// Elementos do DOM
const cardsGrid = document.getElementById('cards-grid');
const assetSelect = document.getElementById('asset-select');
const assetAmountInput = document.getElementById('asset-amount');
const updatePortfolioBtn = document.getElementById('update-portfolio-btn');
const portfolioTotal = document.getElementById('portfolio-total');
const currencySelectSidebar = document.getElementById('currency-select-sidebar');

// Elementos do Modal
const assetModal = document.getElementById('asset-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

document.addEventListener('DOMContentLoaded', () => {
  if (currencySelectSidebar) {
    sanitizeAndSetCurrency(currencySelectSidebar.value);
  }

  setupChart();
  populateAssetSelect();
  loadMarketData();
  setupEvents();
});

function sanitizeAndSetCurrency(val) {
  if (!val) {
    preferredCurrency = 'usd';
    return;
  }
  const clean = val.toLowerCase();
  if (clean.includes('brl')) preferredCurrency = 'brl';
  else preferredCurrency = 'usd';
}

function populateAssetSelect() {
  if (!assetSelect) return;
  assetSelect.innerHTML = '';

  if (!trackedAssets || trackedAssets.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nenhum ativo';
    assetSelect.appendChild(opt);
    return;
  }

  trackedAssets.forEach(asset => {
    const coinId = getAssetId(asset);
    const option = document.createElement('option');
    option.value = coinId;
    option.textContent = coinId.toUpperCase();
    assetSelect.appendChild(option);
  });

  const ids = trackedAssets.map(getAssetId);
  if (!ids.includes(selectedAssetForChart)) {
    selectedAssetForChart = ids[0] || '';
  }
  assetSelect.value = selectedAssetForChart;
}

// Retorna dados isolados por moeda sem corromper o cache local
function getFallbackAssetData(coinId) {
  if (mockPrices[coinId]) {
    const base = mockPrices[coinId];
    return {
      usd: base.usd,
      brl: base.brl || base.usd * FALLBACK_USD_BRL,
      usd_24h_change: base.usd_24h_change || 0,
      brl_24h_change: base.brl_24h_change || 0
    };
  }

  let baseUsd = 100;
  if (coinId.includes('bitcoin')) baseUsd = 65000;
  else if (coinId.includes('ethereum')) baseUsd = 2300;
  else if (coinId.includes('binancecoin') || coinId.includes('bnb')) baseUsd = 580;
  else if (coinId.includes('solana')) baseUsd = 140;
  else if (coinId.includes('netflix')) baseUsd = 680;
  else if (coinId.includes('microsoft')) baseUsd = 440;
  else if (coinId.includes('apple')) baseUsd = 225;
  else if (coinId.includes('nvidia')) baseUsd = 128;
  else if (coinId.includes('amazon')) baseUsd = 180;
  else if (coinId.includes('alphabet') || coinId.includes('google')) baseUsd = 165;

  return {
    usd: baseUsd,
    brl: baseUsd * FALLBACK_USD_BRL,
    usd_24h_change: 1.5,
    brl_24h_change: 1.5
  };
}

async function loadMarketData() {
  if (!trackedAssets || trackedAssets.length === 0) {
    if (cardsGrid) cardsGrid.innerHTML = '<p style="color:#94a3b8;">Nenhum ativo selecionado.</p>';
    return;
  }

  const ids = trackedAssets.map(getAssetId).join(',');

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${preferredCurrency}&include_24hr_change=true`);
    
    if (res.status === 429) {
      renderCards(priceCache.data);
      updatePortfolioTotal(priceCache.data);
      updateChartData();
      return;
    }

    const data = await res.json();
    priceCache.data = data;

    renderCards(data);
    updatePortfolioTotal(data);
    updateChartData();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    renderCards(priceCache.data);
    updatePortfolioTotal(priceCache.data);
    updateChartData();
  }
}

function renderCards(marketData) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  const symbol = preferredCurrency === 'brl' ? 'R$' : '$';
  const locale = preferredCurrency === 'brl' ? 'pt-BR' : 'en-US';

  const filteredAssets = trackedAssets.filter(asset => {
    if (currentCategory === 'all') return true;
    const assetType = typeof asset === 'string' ? 'crypto' : asset.type;
    return assetType === currentCategory;
  });

  if (filteredAssets.length === 0) {
    cardsGrid.innerHTML = '<p style="color:#94a3b8; grid-column: 1/-1;">Nenhum ativo nesta categoria.</p>';
    return;
  }

  filteredAssets.forEach(asset => {
    const coinId = getAssetId(asset);
    
    let info = marketData ? marketData[coinId] : null;
    if (!info || info[preferredCurrency] === undefined || info[preferredCurrency] === 0) {
      info = getFallbackAssetData(coinId);
    }
    
    const rawPrice = info && info[preferredCurrency] !== undefined ? info[preferredCurrency] : 0;
    const priceFormatted = `${symbol} ${rawPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const changeKey = `${preferredCurrency}_24h_change`;
    const change = info && info[changeKey] !== undefined ? info[changeKey].toFixed(2) : '0.00';
    const isPositive = parseFloat(change) >= 0;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', coinId);

    if (coinId === selectedAssetForChart) {
      card.style.borderColor = '#38bdf8';
      card.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.3)';
    }

    card.innerHTML = `
      <button class="remove-card-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #64748b; font-size: 16px; cursor: pointer; z-index: 10;">&times;</button>
      <span class="asset-name">${coinId.toUpperCase()}</span>
      <h3 class="asset-price">${priceFormatted}</h3>
      <span class="asset-change ${isPositive ? 'positive' : 'negative'}">
        ${isPositive ? '+' : ''}${change}%
      </span>
    `;

    const removeBtn = card.querySelector('.remove-card-btn');
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeAsset(coinId, card);
    };

    card.onclick = () => {
      selectedAssetForChart = coinId;
      renderCards(priceCache.data);
      if (assetSelect) assetSelect.value = coinId;
      updateChartData();
    };

    cardsGrid.appendChild(card);
  });
}

function removeAsset(coinId, cardElement) {
  if (cardElement) cardElement.remove();

  trackedAssets = trackedAssets.filter(a => getAssetId(a) !== coinId);
  localStorage.setItem('trackedAssetsObjects', JSON.stringify(trackedAssets));
  
  if (selectedAssetForChart === coinId) {
    const firstRemaining = trackedAssets[0];
    selectedAssetForChart = firstRemaining ? getAssetId(firstRemaining) : '';
  }
  
  populateAssetSelect();
  updatePortfolioTotal(priceCache.data);
  if (selectedAssetForChart) updateChartData();
}

function setupChart() {
  const canvas = document.getElementById('marketChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#f8fafc' } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
      }
    }
  });
}

async function updateChartData() {
  if (!selectedAssetForChart) return;

  const cacheKey = `${selectedAssetForChart}_${preferredCurrency}_${currentDays}`;

  if (chartCache[cacheKey]) {
    renderChartFromPrices(chartCache[cacheKey]);
    return;
  }

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedAssetForChart}/market_chart?vs_currency=${preferredCurrency}&days=${currentDays}`);
    
    if (res.status === 429) {
      renderMockChart();
      return;
    }

    const data = await res.json();
    if (!data || !data.prices) {
      renderMockChart();
      return;
    }

    chartCache[cacheKey] = data.prices;
    renderChartFromPrices(data.prices);

  } catch (err) {
    console.error('Erro no gráfico:', err);
    renderMockChart();
  }
}

function renderMockChart() {
  const now = Date.now();
  const mockPoints = [];
  const assetInfo = getFallbackAssetData(selectedAssetForChart);
  const basePrice = assetInfo[preferredCurrency] || 100;

  for (let i = 20; i >= 0; i--) {
    const time = now - (i * 3600 * 1000);
    const variation = (Math.random() - 0.48) * (basePrice * 0.05);
    mockPoints.push([time, basePrice + variation]);
  }

  renderChartFromPrices(mockPoints);
}

function renderChartFromPrices(prices) {
  if (!chartInstance) setupChart();

  const labels = prices.map(p => {
    const date = new Date(p[0]);
    return currentDays === 1 ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
  });

  chartInstance.data.labels = labels;
  chartInstance.data.datasets = [{
    label: `${selectedAssetForChart.toUpperCase()} (${preferredCurrency.toUpperCase()})`,
    data: prices.map(p => p[1]),
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    fill: true,
    tension: 0.3
  }];

  chartInstance.update();
}

function setupEvents() {
  if (currencySelectSidebar) {
    currencySelectSidebar.onchange = (e) => {
      sanitizeAndSetCurrency(e.target.value);
      chartCache = {}; 
      loadMarketData();
    };
  }

  if (updatePortfolioBtn) {
    updatePortfolioBtn.onclick = () => {
      updatePortfolioTotal(priceCache.data);
    };
  }

  if (assetSelect) {
    assetSelect.onchange = (e) => {
      selectedAssetForChart = e.target.value;
      renderCards(priceCache.data);
      updateChartData();
    };
  }

  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const attrDays = e.target.getAttribute('data-days');
      if (attrDays) {
        currentDays = parseInt(attrDays);
      } else {
        const text = e.target.textContent.trim().toLowerCase();
        if (text.includes('30')) currentDays = 30;
        else if (text.includes('7')) currentDays = 7;
        else currentDays = 1;
      }

      updateChartData();
    };
  });

  const navItems = document.querySelectorAll('.sidebar-nav li:not(.settings-item)');
  navItems.forEach(item => {
    item.onclick = () => {
      navItems.forEach(i => {
        i.classList.remove('active');
        i.style.background = 'transparent';
        i.style.color = '#94a3b8';
      });

      item.classList.add('active');
      item.style.background = '#1e293b';
      item.style.color = '#38bdf8';

      const text = item.textContent.trim().toLowerCase();
      if (text.includes('visão geral')) {
        currentCategory = 'all';
      } else if (text.includes('criptos')) {
        currentCategory = 'crypto';
      } else if (text.includes('ações')) {
        currentCategory = 'stock';
      }

      renderCards(priceCache.data);
    };
  });

  if (openModalBtn) {
    openModalBtn.onclick = () => {
      assetModal.style.display = 'flex';
    };
  }

  if (closeModalBtn) {
    closeModalBtn.onclick = () => {
      assetModal.style.display = 'none';
      if (searchResults) searchResults.innerHTML = '';
      if (searchInput) searchInput.value = '';
    };
  }

  if (searchBtn && searchInput) {
    searchBtn.onclick = handleSearchClick;
    searchInput.onkeyup = (e) => {
      if (e.key === 'Enter') handleSearchClick();
    };
  }
}

function handleSearchClick() {
  if (isSearching) return;
  isSearching = true;
  if (searchBtn) searchBtn.disabled = true;

  performSearch().finally(() => {
    setTimeout(() => {
      isSearching = false;
      if (searchBtn) searchBtn.disabled = false;
    }, 1000);
  });
}

async function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  searchResults.innerHTML = '<p style="color:#94a3b8;">Buscando...</p>';

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
    let coinsToRender = [];

    if (res.status === 429) {
      coinsToRender = fallbackCoins.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.symbol.toLowerCase().includes(query) || 
        c.id.toLowerCase().includes(query)
      );
    } else {
      const data = await res.json();
      coinsToRender = (data.coins || []).slice(0, 5);
      
      if (coinsToRender.length === 0) {
        coinsToRender = fallbackCoins.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.symbol.toLowerCase().includes(query) || 
          c.id.toLowerCase().includes(query)
        );
      }
    }

    if (coinsToRender.length === 0) {
      searchResults.innerHTML = '<p style="color:#94a3b8;">Nenhum ativo encontrado.</p>';
      return;
    }

    searchResults.innerHTML = '';
    coinsToRender.forEach(coin => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #334155;';
      item.innerHTML = `
        <span style="color:#ffffff;">${coin.name} (${coin.symbol.toUpperCase()})</span>
        <button class="add-coin-btn" style="background:#10b981; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Adicionar</button>
      `;

      item.querySelector('.add-coin-btn').onclick = () => {
        const coinId = coin.id;
        const exists = trackedAssets.some(a => getAssetId(a) === coinId);
        if (!exists) {
          const isStock = coin.type === 'stock' || coinId.includes('stock') || coin.symbol.toLowerCase().includes('stock');
          trackedAssets.push({ id: coinId, type: isStock ? 'stock' : 'crypto' });
          localStorage.setItem('trackedAssetsObjects', JSON.stringify(trackedAssets));
          
          priceCache = { data: {} };
          selectedAssetForChart = coinId;
          
          populateAssetSelect();
          loadMarketData();
        }
        assetModal.style.display = 'none';
        searchInput.value = '';
        searchResults.innerHTML = '';
      };

      searchResults.appendChild(item);
    });
  } catch (err) {
    console.error('Erro na busca:', err);
    const matched = fallbackCoins.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.symbol.toLowerCase().includes(query) || 
      c.id.toLowerCase().includes(query)
    );

    if (matched.length > 0) {
      searchResults.innerHTML = '';
      matched.forEach(coin => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #334155;';
        item.innerHTML = `
          <span style="color:#ffffff;">${coin.name} (${coin.symbol.toUpperCase()})</span>
          <button class="add-coin-btn" style="background:#10b981; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Adicionar</button>
        `;

        item.querySelector('.add-coin-btn').onclick = () => {
          const exists = trackedAssets.some(a => getAssetId(a) === coin.id);
          if (!exists) {
            trackedAssets.push({ id: coin.id, type: coin.type });
            localStorage.setItem('trackedAssetsObjects', JSON.stringify(trackedAssets));
            priceCache = { data: {} };
            selectedAssetForChart = coin.id;
            populateAssetSelect();
            loadMarketData();
          }
          assetModal.style.display = 'none';
          searchInput.value = '';
          searchResults.innerHTML = '';
        };

        searchResults.appendChild(item);
      });
    } else {
      searchResults.innerHTML = '<p style="color:#ef4444;">Erro na conexão com a API.</p>';
    }
  }
}

function updatePortfolioTotal(marketPrices) {
  if (!portfolioTotal || !assetSelect || !assetAmountInput) return;

  const selectedCoin = assetSelect.value;
  const amount = parseFloat(assetAmountInput.value) || 0;
  const symbol = preferredCurrency === 'brl' ? 'R$' : '$';
  const locale = preferredCurrency === 'brl' ? 'pt-BR' : 'en-US';

  let info = marketPrices ? marketPrices[selectedCoin] : null;
  if (!info || info[preferredCurrency] === undefined || info[preferredCurrency] === 0) {
    info = getFallbackAssetData(selectedCoin);
  }

  const price = info[preferredCurrency] || 0;
  const total = price * amount;
  portfolioTotal.textContent = `${symbol} ${total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}