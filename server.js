require('dotenv').config(); // Load environment variables from the .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
const port = 5000;

// Initialize Firebase using the environment variables
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Handle newline characters in private key
};

// Initialize Firebase Admin SDK with the environment credentials
admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});

// Firestore instance
const db = admin.firestore();

// Enable CORS for all routes
app.use(cors());

// Use built-in express middleware to parse JSON data
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if the password is correct
    if (password === '123') {
        // Send a success response if login is successful
        res.json({ success: true, message: 'Login successful' });
    } else {
        // Send a failure response if credentials are incorrect
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Serve the login page initially
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the dashboard page
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Handle form submission to add transaction
app.post('/add-transaction', async (req, res) => {
    const { amount, type, category, paymentMode, date, description } = req.body;

    try {
        // Get a reference to the 'wallet' collection
        const walletRef = db.collection('wallet').doc('current_balance');

        // Get the current values of balance, income, and expenses
        const walletDoc = await walletRef.get();
        let balance = 0;
        let income = 0;
        let expenses = 0;

        if (walletDoc.exists) {
            const data = walletDoc.data();
            balance = data.balance || 0;
            income = data.income || 0;
            expenses = data.expenses || 0;
        }

        // Determine how to update the balance, income, and expense
        if (type === 'received') {
            income += parseFloat(amount);  // Add to income
            balance += parseFloat(amount); // Add to balance
        } else if (type === 'spent') {
            expenses += parseFloat(amount); // Add to expenses
            balance -= parseFloat(amount);  // Subtract from balance
        }

        // Create a new transaction document in Firestore
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
            amount,
            type,
            category,
            paymentMode,
            date,
            description,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update the wallet collection with new values
        await walletRef.set({
            balance,
            income,
            expenses,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send a success response
        res.json({ success: true, message: 'Transaction added and wallet updated successfully' });
    } catch (error) {
        // Send an error response if something goes wrong
        res.status(500).json({ success: false, message: 'Error adding transaction', error: error.message });
    }
});


// Get all transactions from Firestore
app.get('/getmyfinance', async (req, res) => {
    try {
        const transactionsSnapshot = await db.collection('transactions').orderBy('createdAt', 'desc').get();
        const transactions = transactionsSnapshot.docs.map(doc => doc.data());
        res.json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
    }
});

app.get('/getwalletstatus',async(req,res)=>{
    try{
        const walletRef = db.collection('wallet').doc('current_balance');
        const walletDoc = await walletRef.get();
        if (walletDoc.exists) {
            const data = walletDoc.data();
            res.json({ success: true, wallet: data });
        } else {
            res.status(404).json({ success: false, message: 'Wallet not found' });
        }
    }
    catch{
        res.status(500).json({ success: false, message: 'Error fetching wallet status', error: error.message });
    }
})

app.get('/spending-analysis', async (req, res) => {
    try {
        const now = new Date(); // Current date and time
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7); // Calculate the date 7 days ago

        // Convert dates to Firestore Timestamps
        const oneWeekAgoTimestamp = admin.firestore.Timestamp.fromDate(oneWeekAgo);

        // Fetch transactions from the last 7 days
        const transactionsSnapshot = await db
            .collection('transactions')
            .where('createdAt', '>=', oneWeekAgoTimestamp)
            .get();

        const transactions = transactionsSnapshot.docs.map(doc => doc.data());

        // Initialize an object to store spending per day and date
        const spendingData = {};

        transactions.forEach(transaction => {
            const transactionDate = transaction.createdAt.toDate();
            const day = transactionDate.toLocaleDateString('en-US', { weekday: 'long' }); // Get the day of the week
            const date = transactionDate.toLocaleDateString('en-US'); // Get the specific date

            // Combine day and date as the key (e.g., "Monday, Jan 15")
            const dayDateKey = `${day}, ${date}`;

            if (!spendingData[dayDateKey]) {
                spendingData[dayDateKey] = 0; // Initialize if the key doesn't exist
            }

            spendingData[dayDateKey] += transaction.amount; // Add the transaction amount
        });

        // Convert the object into an array for easy processing on the front end
        const pieChartData = Object.entries(spendingData).map(([dayDate, amount]) => ({
            dayDate,
            amount
        }));

        res.json({ success: true, data: pieChartData });
    } catch (error) {
        console.error('Error fetching spending analysis:', error);
        res.status(500).json({ success: false, message: 'Error generating spending analysis', error: error.message });
    }
});
















// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
