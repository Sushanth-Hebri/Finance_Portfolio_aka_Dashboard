document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial finance data
    getwalletstatus();
    const showTransactionsButton = document.getElementById('showTransactionsBtn');
showTransactionsButton.addEventListener('click', async () => {
    // Fetch finance data
     fetchFinanceData();
    

    // Make sure the transactions list is visible
});


    // Handle form submission for adding a transaction
    const transactionForm = document.getElementById('transactionForm');
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        // Get form data
        const formData = new FormData(transactionForm);
        const data = {
            amount: formData.get('amount'),
            type: formData.get('type'),
            category: formData.get('category'),
            paymentMode: formData.get('paymentMode'),
            date: formData.get('date'),
            description: formData.get('description')
        };

        // Send a POST request to the server to add the transaction
        try {
            const response = await fetch('http://localhost:5000/add-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            // If the transaction was successfully added, update the finance data
            if (result.success) {
                alert('Transaction added successfully');
                fetchFinanceData(); // Re-fetch the finance data after adding the transaction
                transactionForm.reset(); // Reset the form
                getwalletstatus();
            } else {
                alert('Failed to add transaction');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error adding the transaction');
        }
    });

   
});



async function getwalletstatus(){
    try{
        const response =await fetch('http://localhost:5000/getwalletstatus');
        const data = await response.json();
        if(data.success){
            // Update the balance, income, and expenses fields
            document.getElementById('totalBalance').textContent = `₹${data.wallet.balance}`;
            document.getElementById('totalIncome').textContent = `₹${data.wallet.income}`;
            document.getElementById('totalExpenses').textContent = `₹${data.wallet.expenses}`;
        }
    }
    catch{
        console.error('Error fetching wallet status');
        alert('Failed to fetch wallet status');
    }
}






// Function to fetch the finance data and update the HTML content
async function fetchFinanceData() {
    try {
        const response = await fetch('http://localhost:5000/getmyfinance');
        const data = await response.json();

        if (data.success) {
            // Render the recent transactions list
            const transactionsList = document.getElementById('transactionsList');
            transactionsList.innerHTML = '';
            data.transactions.forEach((transaction) => {
                const transactionItem = document.createElement('div');
                transactionItem.classList.add('transaction-item');
                transactionItem.innerHTML = `
                    <p><strong>Amount:</strong> ₹${transaction.amount}</p>
                    <p><strong>Type:</strong> ${transaction.type}</p>
                    <p><strong>Category:</strong> ${transaction.category}</p>
                    <p><strong>Payment Mode:</strong> ${transaction.paymentMode}</p>
                    <p><strong>Date:</strong> ${transaction.date}</p>
                    <p><strong>Description:</strong> ${transaction.description}</p>
                `;
                transactionsList.appendChild(transactionItem);
            });

        } else {
            alert('Failed to fetch finance data');
        }
    } catch (error) {
        console.error('Error fetching finance data:', error);
        alert('There was an error fetching finance data');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const toggleBalanceButton = document.getElementById('toggleBalanceButton');
    const totalBalanceElement = document.getElementById('totalBalance');
    const eyeIcon = document.getElementById('eyeIcon');

    toggleBalanceButton.addEventListener('click', () => {
        if (totalBalanceElement.style.visibility === 'hidden') {
            // Show the balance
            totalBalanceElement.style.visibility = 'visible';
            eyeIcon.textContent = '👁️'; // Open eye icon
        } else {
            // Hide the balance
            totalBalanceElement.style.visibility = 'hidden';
            eyeIcon.textContent = '🙈'; // Closed eye icon
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
document.getElementById('showSpendingGraph').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:5000/spending-analysis');
        const result = await response.json();

        if (result.success) {
            // Extract labels (day and date) and data for the chart
            const labels = result.data.map(item => item.dayDate);
            const data = result.data.map(item => item.amount);

            // Update the chart
            const ctx = document.getElementById('expenseChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#FF6347', '#4CAF50', '#FFD700', '#00BFFF', '#FF69B4'],
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: (tooltipItem) => `${tooltipItem.label}: ₹${tooltipItem.raw}`,
                            },
                        }
                    }
                }
            });
        } else {
            alert('Failed to fetch spending analysis');
        }
    } catch (error) {
        console.error('Error fetching spending analysis:', error);
        alert('There was an error fetching the spending analysis');
    }
});
});

// Dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved user preference, first in localStorage, then in system preferences
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  
    darkModeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  
    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    });
  }

  function displayCurrentDay() {
    // Array of days for mapping
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
    // Get the current day
    const today = new Date();
    const currentDay = days[today.getDay()];
  
    // Add the day to the div
    const dayDiv = document.getElementById("day-display");
    dayDiv.textContent = `${currentDay}`;
  }
  
  // Call the function
  displayCurrentDay();
  