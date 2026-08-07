let monthlyBudget = 5000;
let expenses = [];
let chartInstance = null;

const remainingBudgetEl = document.getElementById('remaining-budget');
const dailyLimitEl = document.getElementById('daily-limit');
const progressBarEl = document.getElementById('progress-bar');
const spentTodayEl = document.getElementById('spent-today');
const totalBudgetDisplayEl = document.getElementById('total-budget-display');
const expenseForm = document.getElementById('expense-form');
const expenseListEl = document.getElementById('expense-list');

const modal = document.getElementById('budget-modal');
const budgetSettingsBtn = document.getElementById('budget-settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveBudgetBtn = document.getElementById('save-budget-btn');
const newBudgetInput = document.getElementById('new-budget-input');

async function initApp() {
  await fetchSettings();
  await fetchExpenses();
}

async function fetchSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    monthlyBudget = data.monthlyBudget || 5000;
  } catch (err) {
    console.error('فشل في جلب الميزانية:', err);
  }
}

async function fetchExpenses() {
  try {
    const res = await fetch('/api/expenses');
    expenses = await res.json();
    updateUI();
  } catch (err) {
    console.error('فشل في جلب المصاريف:', err);
  }
}

function updateUI() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = monthlyBudget - totalSpent;

  const todayStr = now.toDateString();
  const spentToday = expenses
    .filter(exp => new Date(exp.date).toDateString() === todayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = (daysInMonth - now.getDate()) + 1;
  const dailyLimit = remaining > 0 ? (remaining / daysRemaining) : 0;

  remainingBudgetEl.textContent = `${remaining.toLocaleString()} ج.م`;
  dailyLimitEl.textContent = `${dailyLimit.toFixed(0)} ج.م/يوم`;
  spentTodayEl.textContent = `صرفت النهاردة: ${spentToday.toLocaleString()} ج.م`;
  totalBudgetDisplayEl.textContent = `من أصل: ${monthlyBudget.toLocaleString()} ج.م`;

  const percentage = Math.min((totalSpent / monthlyBudget) * 100, 100);
  progressBarEl.style.width = `${percentage}%`;

  if (percentage > 90) {
    progressBarEl.style.backgroundColor = 'var(--danger)';
    remainingBudgetEl.style.color = 'var(--danger)';
  } else if (percentage > 70) {
    progressBarEl.style.backgroundColor = 'var(--warning)';
    remainingBudgetEl.style.color = 'var(--warning)';
  } else {
    progressBarEl.style.backgroundColor = 'var(--success)';
    remainingBudgetEl.style.color = 'var(--success)';
  }

  renderExpenseList();
  renderChart(currentMonthExpenses);
}

function renderExpenseList() {
  expenseListEl.innerHTML = '';
  if (expenses.length === 0) {
    expenseListEl.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:10px;">لا توجد مصاريف مسجلة</li>';
    return;
  }

  expenses.slice(0, 10).forEach(exp => {
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.innerHTML = `
      <div class="expense-details">
        <span class="cat">${exp.category}</span>
        <span class="note">${exp.note || 'بدون ملاحظة'} • ${new Date(exp.date).toLocaleDateString('ar-EG')}</span>
      </div>
      <div class="expense-amount">
        -${exp.amount} ج.م
        <button class="delete-btn" onclick="deleteExpense('${exp._id}')">🗑️</button>
      </div>
    `;
    expenseListEl.appendChild(li);
  });
}

function renderChart(monthExpenses) {
  const ctx = document.getElementById('expensesChart').getContext('2d');
  
  const categories = {};
  monthExpenses.forEach(exp => {
    categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['لا يوجد مصاريف'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#f8fafc' } }
      }
    }
  });
}

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const note = document.getElementById('note').value;

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, note })
    });

    if (res.ok) {
      expenseForm.reset();
      await fetchExpenses();
    }
  } catch (err) {
    console.error('خطأ أثناء إضافة المصروف:', err);
  }
});

async function deleteExpense(id) {
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchExpenses();
    }
  } catch (err) {
    console.error('خطأ أثناء الحذف:', err);
  }
}

budgetSettingsBtn.onclick = () => {
  newBudgetInput.value = monthlyBudget;
  modal.style.display = 'flex';
};
closeModalBtn.onclick = () => modal.style.display = 'none';

saveBudgetBtn.onclick = async () => {
  const val = parseFloat(newBudgetInput.value);
  if (val && val > 0) {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget: val })
      });
      if (res.ok) {
        monthlyBudget = val;
        modal.style.display = 'none';
        updateUI();
      }
    } catch (err) {
      console.error('فشل في حفظ الميزانية:', err);
    }
  }
};

initApp();