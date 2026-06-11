const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let selectedTradeType = 'CALL';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  
  if (token) {
    loadMainScreen();
  } else {
    loadAuthScreen();
  }
});

// Event Listeners
function setupEventListeners() {
  // Auth tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Auth buttons
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Menu buttons
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMenu(btn.dataset.menu));
  });

  // Trade direction buttons
  document.querySelectorAll('.btn-direction').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-direction').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTradeType = btn.dataset.type;
    });
  });

  // Action buttons
  document.getElementById('placeTradeBtn').addEventListener('click', placeTrade);
  document.getElementById('depositBtn').addEventListener('click', makeDeposit);
  document.getElementById('updateProfileBtn').addEventListener('click', updateProfile);
}

// Auth Functions
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('loginError').textContent = data.message;
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    loadMainScreen();
  } catch (error) {
    document.getElementById('loginError').textContent = 'Connection error';
  }
}

async function register() {
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const firstName = document.getElementById('regFirstName').value;
  const lastName = document.getElementById('regLastName').value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, firstName, lastName })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('registerError').textContent = data.message;
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    loadMainScreen();
  } catch (error) {
    document.getElementById('registerError').textContent = 'Connection error';
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  loadAuthScreen();
}

// Screen Management
function loadAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('mainScreen').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('userDisplay').textContent = '';
}

async function loadMainScreen() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'block';

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await response.json();
    currentUser = user;

    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('userDisplay').textContent = `Welcome, ${user.username}!`;
    
    loadDashboard();
  } catch (error) {
    console.error('Failed to load user:', error);
    logout();
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName + 'Form').classList.add('active');
  event.target.classList.add('active');
}

function switchMenu(menuName) {
  document.querySelectorAll('.menu-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(menuName).classList.add('active');
  event.target.classList.add('active');

  if (menuName === 'trades') loadTrades();
  if (menuName === 'deposits') loadDeposits();
  if (menuName === 'account') loadAccountSettings();
}

// Dashboard
async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/accounts/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await response.json();

    document.getElementById('balanceDisplay').textContent = `$${stats.accountBalance.toFixed(2)}`;
    document.getElementById('totalTradesDisplay').textContent = stats.totalTrades;
    document.getElementById('winRateDisplay').textContent = `${stats.winRate}%`;
    document.getElementById('totalProfitDisplay').textContent = `$${stats.totalProfit.toFixed(2)}`;
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Trading Functions
async function placeTrade() {
  const pair = document.getElementById('tradePair').value;
  const amount = parseFloat(document.getElementById('tradeAmount').value);
  const duration = document.getElementById('tradeDuration').value;
  const returnPercentage = parseFloat(document.getElementById('returnPercentage').value);

  if (!amount || amount < 1) {
    document.getElementById('tradeError').textContent = 'Enter a valid amount';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/trades/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pair,
        type: selectedTradeType,
        amount,
        duration,
        returnPercentage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('tradeError').textContent = data.message;
      return;
    }

    alert('Trade placed successfully!');
    document.getElementById('tradeAmount').value = '';
    loadDashboard();
    document.getElementById('tradeError').textContent = '';
  } catch (error) {
    document.getElementById('tradeError').textContent = 'Failed to place trade';
  }
}

async function loadTrades() {
  try {
    const response = await fetch(`${API_URL}/trades`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const trades = await response.json();

    let html = '';
    if (trades.length === 0) {
      html = '<p>No trades yet</p>';
    } else {
      trades.forEach(trade => {
        html += `
          <div class="trade-item ${trade.result ? trade.result.toLowerCase() : ''}">
            <div class="trade-header">
              <span class="trade-pair">${trade.pair}</span>
              <span class="trade-status ${trade.status.toLowerCase()}">${trade.status}</span>
            </div>
            <div class="trade-details">
              <div><strong>Type:</strong> ${trade.type}</div>
              <div><strong>Amount:</strong> $${trade.amount}</div>
              <div><strong>Entry:</strong> ${trade.entryPrice.toFixed(4)}</div>
              <div><strong>Exit:</strong> ${trade.exitPrice ? trade.exitPrice.toFixed(4) : 'N/A'}</div>
              <div><strong>Result:</strong> ${trade.result || 'Pending'}</div>
              <div><strong>P/L:</strong> $${trade.profitLoss ? trade.profitLoss.toFixed(2) : '0.00'}</div>
            </div>
            ${trade.status === 'OPEN' ? `<button onclick="closeTrade('${trade._id}')" class="btn btn-primary" style="margin-top: 1rem;">Close Trade</button>` : ''}
          </div>
        `;
      });
    }

    document.getElementById('tradesContainer').innerHTML = html;
  } catch (error) {
    console.error('Failed to load trades:', error);
  }
}

async function closeTrade(tradeId) {
  try {
    const response = await fetch(`${API_URL}/trades/${tradeId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert(`Trade closed! ${data.trade.result}: $${data.trade.profitLoss.toFixed(2)}`);
    loadTrades();
    loadDashboard();
  } catch (error) {
    alert('Failed to close trade');
  }
}

// Deposit Functions
async function makeDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const method = document.getElementById('depositMethod').value;

  if (!amount || amount < 10) {
    document.getElementById('depositError').textContent = 'Minimum deposit is $10';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/deposits/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, method })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('depositError').textContent = data.message;
      return;
    }

    if (data.clientSecret) {
      alert('Proceeding to Stripe payment (demo mode)');
    } else if (data.reference) {
      alert(`Deposit reference: ${data.reference}\nPlease confirm your payment to complete the deposit.`);
      await confirmDeposit(data.deposit._id);
    }

    document.getElementById('depositAmount').value = '';
    document.getElementById('depositError').textContent = '';
  } catch (error) {
    document.getElementById('depositError').textContent = 'Failed to create deposit';
  }
}

async function confirmDeposit(depositId) {
  try {
    const response = await fetch(`${API_URL}/deposits/${depositId}/confirm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
      alert('Deposit confirmed! Balance updated.');
      loadDashboard();
      loadDeposits();
    }
  } catch (error) {
    console.error('Failed to confirm deposit:', error);
  }
}

async function loadDeposits() {
  try {
    const response = await fetch(`${API_URL}/deposits`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deposits = await response.json();

    let html = '';
    if (deposits.length === 0) {
      html = '<p>No deposits yet</p>';
    } else {
      deposits.forEach(deposit => {
        html += `
          <div class="deposit-item">
            <div class="trade-header">
              <span><strong>$${deposit.amount}</strong></span>
              <span class="trade-status ${deposit.status.toLowerCase()}">${deposit.status}</span>
            </div>
            <div class="trade-details">
              <div><strong>Method:</strong> ${deposit.method}</div>
              <div><strong>Reference:</strong> ${deposit.reference || deposit.transactionId || 'N/A'}</div>
              <div><strong>Date:</strong> ${new Date(deposit.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      });
    }

    document.getElementById('depositsContainer').innerHTML = html;
  } catch (error) {
    console.error('Failed to load deposits:', error);
  }
}

// Account Functions
async function loadAccountSettings() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await response.json();

    document.getElementById('accountFirstName').value = user.firstName || '';
    document.getElementById('accountLastName').value = user.lastName || '';
    document.getElementById('accountPhone').value = user.phone || '';
    document.getElementById('accountCountry').value = user.country || '';
  } catch (error) {
    console.error('Failed to load account settings:', error);
  }
}

async function updateProfile() {
  const firstName = document.getElementById('accountFirstName').value;
  const lastName = document.getElementById('accountLastName').value;
  const phone = document.getElementById('accountPhone').value;
  const country = document.getElementById('accountCountry').value;

  try {
    const response = await fetch(`${API_URL}/accounts/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ firstName, lastName, phone, country })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Profile updated successfully!');
      currentUser = data.user;
    } else {
      document.getElementById('profileError').textContent = data.message;
    }
  } catch (error) {
    document.getElementById('profileError').textContent = 'Failed to update profile';
  }
}
