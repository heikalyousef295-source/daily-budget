const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database
let settings = { monthlyBudget: 5000, startDay: 1 };
let expenses = [];

// --- API Routes ---

app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { monthlyBudget } = req.body;
  if (monthlyBudget) settings.monthlyBudget = Number(monthlyBudget);
  res.json(settings);
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
    note: note || '',
    date: new Date()
  };
  expenses.unshift(newExpense);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  expenses = expenses.filter(exp => exp._id !== req.params.id);
  res.json({ message: 'تم حذف المصروف بنجاح' });
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل الآن على الرابط: http://localhost:${PORT}`);
});