const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let expenses = [];

// مسار صريح وثابت للـ favicon لمنع ظهور أي إيرور 404
app.get('/favicon.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.png'));
});

app.get('/api/expenses', (req, res) => {
    res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
    const { amount, category, note } = req.body;
    if (!amount || !category) {
        return res.status(400).json({ error: 'المبلغ والفئة مطلوبان' });
    }
    const newExpense = {
        _id: Date.now().toString(),
        amount: Number(amount),
        category,
        note: note || ''
    };
    expenses.push(newExpense);
    res.status(201).json(newExpense);
});

module.exports = app;
