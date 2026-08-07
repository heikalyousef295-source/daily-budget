const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// توجيه سيرفر Express للوصول لملفات فولدر public
app.use(express.static(path.join(__dirname, 'public')));

let expenses = [];

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
        note: note || '',
        date: new Date()
    };
    expenses.unshift(newExpense);
    res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    expenses = expenses.filter(exp => exp._id !== id);
    res.json({ message: 'تم حذف المصروف بنجاح' });
});

// إرجاع صفحة index.html لأي مسار رئيسي
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
