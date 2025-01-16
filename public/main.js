import Chart from 'chart.js/auto';

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let expenseChart;

function updateSummary() {
  const totalIncome = transactions
    .filter(t => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'spent')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  document.getElementById('totalBalance').textContent = `₹${totalBalance.toLocaleString()}`;
  document.getElementById('totalIncome').textContent = `₹${totalIncome.toLocaleString()}`;
  document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toLocaleString()}`;

  updateChart();
}

function updateChart() {
  const expensesByCategory = {};
  const spentTransactions = transactions.filter(t => t.type === 'spent');

  spentTransactions.forEach(transaction => {
    expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + transaction.amount;
  });

  const data = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      data: Object.values(expensesByCategory),
      backgroundColor: [
        '#4f46e5',
        '#22c55e',
        '#ef4444',
        '#eab308',
        '#3b82f6',
        '#ec4899',
        '#8b5cf6'
      ],
      borderWidth: 1
    }]
  };

  if (expenseChart) {
    expenseChart.destroy();
  }

  const ctx = document.getElementById('expenseChart').getContext('2d');
  expenseChart = new Chart(ctx, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        }
      }
    }
  });
}

function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    amount: Number(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    paymentMode: document.getElementById('paymentMode').value,
    date: document.getElementById('date').value,
    description: document.getElementById('description').value
  };

  transactions.unshift(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));

  updateSummary();
  displayTransactions();
  e.target.reset();
  document.getElementById('date').valueAsDate = new Date();
}

function displayTransactions() {
  const transactionsList = document.getElementById('transactionsList');
  transactionsList.innerHTML = '';

  transactions.forEach(transaction => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    div.innerHTML = `
      <div class="amount ${transaction.type}">
        ${transaction.type === 'received' ? '+' : '-'}₹${transaction.amount.toLocaleString()}
      </div>
      <div class="transaction-details">
        ${transaction.description}<br>
        <small>${transaction.category} • ${transaction.paymentMode}</small>
      </div>
      <div class="transaction-date">
        ${new Date(transaction.date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </div>
      <button onclick="deleteTransaction(${transaction.id})" style="width: auto;">
        Delete
      </button>
    `;

    transactionsList.appendChild(div);
  });
}

window.deleteTransaction = function(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateSummary();
  displayTransactions();
}

document.getElementById('transactionForm').addEventListener('submit', addTransaction);

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Initial render
updateSummary();
displayTransactions();