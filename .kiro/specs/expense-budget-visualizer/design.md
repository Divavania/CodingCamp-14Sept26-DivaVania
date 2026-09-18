# Design — Expense & Budget Visualizer

## 1. Project Structure

```
expense-budget-visualizer/
├── index.html          # Single HTML entry point
├── css/
│   └── style.css       # All styles (only file in this directory)
└── js/
    └── app.js          # All application logic (only file in this directory)
```

No build tools, no package.json, no node_modules. The app opens directly in a browser.

---

## 2. Data Model

### Transaction Object

```js
{
  id: string,        // Unique ID — Date.now().toString() is sufficient
  name: string,      // Item name entered by the user
  amount: number,    // Positive float, e.g. 12500
  category: string   // e.g. "Food", "Transport", "Fun", or a custom value
}
```

### Local Storage Keys

| Key                      | Value                                | Description                          |
|--------------------------|--------------------------------------|--------------------------------------|
| `expense_transactions`   | JSON string — `Transaction[]`        | All transactions                     |
| `expense_categories`     | JSON string — `string[]`             | Custom categories added by the user  |
| `expense_theme`          | `"light"` \| `"dark"`               | Current UI theme preference          |

### In-Memory State (module-level variables in `app.js`)

```js
let transactions = [];     // Array of Transaction objects
let categories = [];       // Full category list (defaults + custom)
let chartInstance = null;  // Reference to the single Chart.js instance
let sortOrder = "default"; // Current sort setting
```

---

## 3. Application Architecture

The entire application is a single JavaScript module in `app.js`. There is no framework, no component tree — just plain functions organised by concern.

```
app.js
├── Storage layer
│   ├── loadTransactions()
│   ├── saveTransactions()
│   ├── loadCategories()
│   ├── saveCategories()
│   ├── loadTheme()
│   └── saveTheme()
│
├── Render layer
│   ├── renderBalance()
│   ├── renderTransactionList()
│   ├── renderChart()
│   └── renderCategoryOptions()
│
├── Event handlers
│   ├── handleFormSubmit(e)
│   ├── handleDeleteTransaction(id)
│   ├── handleAddCategory()
│   ├── handleSortChange()
│   └── handleThemeToggle()
│
└── Init
    └── init()   ← called on DOMContentLoaded
```

### Data Flow

```
User Action
    │
    ▼
Event Handler
    │  mutates `transactions[]` or `categories[]`
    │  calls saveTransactions() / saveCategories()
    ▼
Render Functions
    ├── renderBalance()
    ├── renderTransactionList()
    └── renderChart()
```

Every mutation is immediately persisted to Local Storage and every render function reads directly from the in-memory arrays, so state is always consistent.

---

## 4. UI Layout

### Desktop (≥ 600 px) — Two-Column Grid

```
┌─────────────────────────────────────────────────┐
│              💰 Total Spending: Rp 0             │  ← #balance-display
├──────────────────────┬──────────────────────────┤
│  ┌────────────────┐  │  ┌────────────────────┐  │
│  │   Add Expense  │  │  │   Spending Chart   │  │
│  │  ─────────── │  │  │   (Pie Chart.js)   │  │
│  │  Item Name    │  │  │                    │  │
│  │  Amount       │  │  └────────────────────┘  │
│  │  Category     │  │                          │
│  │  [+ Add Cat.] │  │                          │
│  │  [Add Expense]│  │                          │
│  └────────────────┘  │                          │
│                      │                          │
│  Sort: [──────────]  │                          │
│  ┌────────────────┐  │                          │
│  │ Transaction    │  │                          │
│  │ List (scroll)  │  │                          │
│  └────────────────┘  │                          │
├──────────────────────┴──────────────────────────┤
│                  [🌙 Dark Mode]                  │  ← theme toggle (fixed or footer)
└─────────────────────────────────────────────────┘
```

### Mobile (< 600 px) — Single Column

All sections stack vertically:
1. Balance display
2. Add Expense form
3. Sort control + Transaction list
4. Spending chart
5. Theme toggle

---

## 5. HTML Structure (`index.html`)

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense & Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- ① Balance -->
  <header id="balance-section">
    <h1>Expense & Budget Visualizer</h1>
    <div id="balance-display">Total Spending: <span id="balance-amount">Rp 0</span></div>
  </header>

  <main id="app-grid">

    <!-- ② Left / Top column -->
    <section id="left-panel">

      <!-- Form -->
      <section id="form-section">
        <h2>Add Expense</h2>
        <form id="expense-form" novalidate>
          <div class="form-group">
            <label for="item-name">Item Name</label>
            <input type="text" id="item-name" placeholder="e.g. Lunch" required />
            <span class="error-msg" id="name-error"></span>
          </div>
          <div class="form-group">
            <label for="item-amount">Amount (Rp)</label>
            <input type="number" id="item-amount" placeholder="e.g. 25000" min="1" required />
            <span class="error-msg" id="amount-error"></span>
          </div>
          <div class="form-group">
            <label for="item-category">Category</label>
            <select id="item-category" required>
              <option value="">-- Select Category --</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Fun">Fun</option>
            </select>
            <span class="error-msg" id="category-error"></span>
          </div>

          <!-- Optional: Add custom category -->
          <div class="form-group custom-category-group">
            <label for="new-category">New Category (optional)</label>
            <div class="inline-group">
              <input type="text" id="new-category" placeholder="e.g. Health" />
              <button type="button" id="add-category-btn">Add</button>
            </div>
          </div>

          <button type="submit" id="submit-btn">Add Expense</button>
        </form>
      </section>

      <!-- Sort + Transaction list -->
      <section id="list-section">
        <div id="list-header">
          <h2>Transactions</h2>
          <div class="sort-control">
            <label for="sort-select">Sort by:</label>
            <select id="sort-select">
              <option value="default">Date Added</option>
              <option value="amount-asc">Amount ↑</option>
              <option value="amount-desc">Amount ↓</option>
              <option value="category-az">Category A–Z</option>
            </select>
          </div>
        </div>
        <ul id="transaction-list">
          <!-- populated by JS -->
        </ul>
        <p id="empty-state">No transactions yet. Add one above!</p>
      </section>

    </section>

    <!-- ③ Right / Bottom column -->
    <section id="right-panel">
      <section id="chart-section">
        <h2>Spending by Category</h2>
        <div id="chart-container">
          <canvas id="expense-chart"></canvas>
          <p id="chart-empty">Add transactions to see your spending chart.</p>
        </div>
      </section>
    </section>

  </main>

  <!-- Theme toggle -->
  <button id="theme-toggle" aria-label="Toggle dark/light mode">🌙 Dark Mode</button>

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- App logic -->
  <script src="js/app.js"></script>
</body>
</html>
```

---

## 6. CSS Design (`css/style.css`)

### Theming — CSS Custom Properties

```css
:root {
  --bg-primary: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --accent: #4f46e5;
  --accent-hover: #4338ca;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --border: #e0e0e0;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent: #818cf8;
  --accent-hover: #6366f1;
  --danger: #f87171;
  --danger-hover: #ef4444;
  --border: #334155;
  --shadow: 0 2px 8px rgba(0,0,0,0.4);
}
```

Theme switching is done by toggling `data-theme="dark"` on `<html>` via JavaScript.

### Layout

- `#app-grid` uses CSS Grid: `grid-template-columns: 1fr 1fr` on desktop, `1fr` on mobile.
- `#transaction-list` has `max-height: 400px; overflow-y: auto` to create a scrollable area.
- `#chart-container` constrains the canvas to prevent the pie chart from growing too large.

### Category Colour Map

Used by Chart.js and optionally by category badge styling:

| Category  | Colour        |
|-----------|---------------|
| Food      | `#f97316`     |
| Transport | `#3b82f6`     |
| Fun       | `#a855f7`     |
| Others    | auto-assigned from a fallback palette |

---

## 7. JavaScript Logic (`js/app.js`)

### Initialisation

```
DOMContentLoaded
  → loadTheme()          apply saved theme to <html>
  → loadCategories()     populate `categories[]`, update <select>
  → loadTransactions()   populate `transactions[]`
  → renderBalance()
  → renderTransactionList()
  → renderChart()
  → attach event listeners
```

### Form Validation

Inline validation runs on submit (not on blur, to keep it simple):
1. `name.trim() === ""` → show name error
2. `isNaN(amount) || amount <= 0` → show amount error
3. `category === ""` → show category error

All errors are cleared at the start of each submit attempt. The form is only processed if there are zero errors.

### Chart Management

```js
function renderChart() {
  const data = aggregateByCategory(transactions); // { Food: 50000, Transport: 20000, ... }

  if (transactions.length === 0) {
    // show #chart-empty, hide canvas
    return;
  }

  if (chartInstance === null) {
    // create new Chart instance, store in chartInstance
  } else {
    // update chartInstance.data.labels and .datasets[0].data
    chartInstance.update();
  }
}
```

This pattern ensures exactly one Chart.js instance exists for the lifetime of the page.

### Delete Flow

```js
function handleDeleteTransaction(id) {
  const confirmed = window.confirm("Delete this transaction?");
  if (!confirmed) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderBalance();
  renderTransactionList();
  renderChart();
}
```

### Sort Logic

```js
function getSortedTransactions() {
  const list = [...transactions]; // shallow copy — never mutate source
  switch (sortOrder) {
    case "amount-asc":  return list.sort((a, b) => a.amount - b.amount);
    case "amount-desc": return list.sort((a, b) => b.amount - a.amount);
    case "category-az": return list.sort((a, b) => a.category.localeCompare(b.category));
    default:            return list; // insertion order
  }
}
```

### Custom Category Flow

1. User types in `#new-category` and clicks the Add button.
2. Value is trimmed; duplicates and empty strings are rejected with an inline message.
3. New category is pushed to `categories[]`, saved to Local Storage, and an `<option>` is appended to `#item-category`.

---

## 8. Colour Palette for Chart.js

A fixed palette is used for the three default categories. Additional custom categories cycle through an extended palette:

```js
const CATEGORY_COLORS = {
  Food:      "#f97316",
  Transport: "#3b82f6",
  Fun:       "#a855f7",
};

const EXTRA_COLORS = [
  "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16",
];
```

When building the chart dataset, each category is looked up in `CATEGORY_COLORS`; if not found, the next colour from `EXTRA_COLORS` (cycling with modulo) is used.

---

## 9. Responsive Breakpoints

| Breakpoint | Layout                                    |
|------------|-------------------------------------------|
| ≥ 600 px   | Two-column grid (form+list | chart)       |
| < 600 px   | Single column, chart moves below the list |

The theme toggle button is fixed to the bottom-right corner on all screen sizes so it is always accessible.
