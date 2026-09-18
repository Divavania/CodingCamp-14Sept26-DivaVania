// =============================================================
// app.js — Expense & Budget Visualizer
// Application logic is implemented incrementally across Tasks 2–12.
// =============================================================


// -------------------------------------------------------------
// STORAGE KEYS
// All Local Storage entries use a consistent prefix to avoid
// colliding with other apps on the same origin.
// -------------------------------------------------------------

const STORAGE_KEYS = {
  transactions: 'expense_transactions', // Transaction[]  — array of transaction objects
  categories:   'expense_categories',   // string[]       — custom category names
  theme:        'expense_theme',        // "light"|"dark" — UI theme preference
};


// -------------------------------------------------------------
// TASK 2 — LOCAL STORAGE LAYER
//
// Transaction object shape (defined in design.md §2):
// {
//   id:       string   — unique identifier (Date.now().toString())
//   name:     string   — item name entered by the user
//   amount:   number   — positive float, e.g. 25000
//   category: string   — e.g. "Food", "Transport", "Fun", or custom
// }
//
// BUG-FIX NOTE (Task 7 investigation):
// If stale test data from manual console testing appears as
// phantom transactions that cannot be deleted, run this once
// in the browser DevTools console and then refresh the page:
//
//   clearAllAppData();
//
// This wipes only the three keys used by this application and
// leaves all other browser data untouched.
// -------------------------------------------------------------


/**
 * clearAllAppData  (diagnostic utility — not called automatically)
 * Removes all Local Storage keys belonging to this application.
 * Use this from the DevTools console to reset a browser that has
 * stale test data from manual Task 2 / Task 4 verification steps.
 *
 * Safe to call: it only touches the three `expense_*` keys and
 * does NOT clear any other site data.
 */
function clearAllAppData() {
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.categories);
  localStorage.removeItem(STORAGE_KEYS.theme);
  console.log('clearAllAppData: all expense_* keys removed. Refresh the page.');
}


/**
 * loadTransactions
 * Reads the saved transactions array from Local Storage.
 * Returns an empty array if the key is absent or the stored
 * value cannot be parsed as valid JSON.
 *
 * @returns {Array} Array of transaction objects (may be empty).
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);

    // Key does not exist yet — first visit or cleared storage
    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);

    // Guard: stored value must be an array; reject anything else
    if (!Array.isArray(parsed)) {
      console.warn('loadTransactions: stored value is not an array. Resetting to [].');
      return [];
    }

    return parsed;

  } catch (error) {
    // JSON.parse failed — data is corrupted
    console.warn('loadTransactions: failed to parse stored data. Resetting to [].', error);
    return [];
  }
}


/**
 * saveTransactions
 * Serialises the given array and writes it to Local Storage,
 * replacing any previously stored value.
 *
 * NOTE: The parameter is named `txArray` (not `transactions`) to
 * avoid shadowing the module-level `transactions` variable.
 * Both the call sites inside this file and external console calls
 * always pass the current global array explicitly.
 *
 * @param {Array} txArray - The transaction array to persist.
 */
function saveTransactions(txArray) {
  try {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(txArray));
  } catch (error) {
    // Storage quota exceeded or access denied (e.g. private browsing limits)
    console.error('saveTransactions: could not write to Local Storage.', error);
  }
}


/**
 * loadCategories
 * Reads the saved custom categories array from Local Storage.
 * Returns an empty array if the key is absent or the data is invalid.
 *
 * @returns {Array} Array of category name strings (may be empty).
 */
function loadCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.categories);

    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn('loadCategories: stored value is not an array. Resetting to [].');
      return [];
    }

    return parsed;

  } catch (error) {
    console.warn('loadCategories: failed to parse stored data. Resetting to [].', error);
    return [];
  }
}


/**
 * saveCategories
 * Serialises the given array and writes it to Local Storage.
 *
 * NOTE: parameter named `catArray` to avoid shadowing the module-level
 * `categories` variable.
 *
 * @param {Array} catArray - The category array to persist.
 */
function saveCategories(catArray) {
  try {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(catArray));
  } catch (error) {
    console.error('saveCategories: could not write to Local Storage.', error);
  }
}


/**
 * loadTheme
 * Reads the saved theme preference from Local Storage.
 * Returns "light" as the safe default if nothing is stored.
 *
 * @returns {string} "light" or "dark".
 */
function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);

    // Accept only the two known values; fall back to "light" for anything else
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return 'light';

  } catch (error) {
    console.warn('loadTheme: could not read from Local Storage. Defaulting to "light".', error);
    return 'light';
  }
}


/**
 * saveTheme
 * Writes the given theme string to Local Storage.
 *
 * @param {string} theme - "light" or "dark".
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch (error) {
    console.error('saveTheme: could not write to Local Storage.', error);
  }
}


// -------------------------------------------------------------
// TASK 3 — APPLICATION STATE & INITIALISATION
// -------------------------------------------------------------

// -- Module-level state variables (design.md §2) --------------
// These are the single source of truth for the entire app.
// Every render function reads from these; every mutation writes
// back to Local Storage immediately afterwards.

let transactions  = [];      // Array of Transaction objects currently loaded
let categories    = [];      // Full category list: defaults + any custom ones
let chartInstance = null;    // Holds the single Chart.js instance (Task 8)
let sortOrder     = 'default'; // Active sort selection (Task 11)

// The three built-in categories that are always present
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];


/**
 * calculateTotal
 * Adds up the amount field of every transaction in the global
 * transactions array and returns the sum as a number.
 *
 * Returns 0 when the array is empty so the caller never gets NaN.
 *
 * @returns {number} Total spending amount.
 */
function calculateTotal() {
  // Array.reduce walks every transaction and accumulates the sum.
  // The second argument (0) is the starting value, which also
  // handles the empty-array case cleanly.
  return transactions.reduce(function (sum, transaction) {
    return sum + transaction.amount;
  }, 0);
}


/**
 * formatRupiah
 * Formats a plain number into a human-readable Indonesian Rupiah
 * string, e.g. 25000 → "Rp 25.000".
 *
 * Uses the built-in Intl / toLocaleString API with the "id-ID"
 * locale so the browser handles thousand separators (periods in
 * Indonesian convention) automatically.
 *
 * @param {number} amount - The numeric amount to format.
 * @returns {string} Formatted string, e.g. "Rp 25.000".
 */
function formatRupiah(amount) {
  // toLocaleString("id-ID") uses a period as the thousands separator
  // and a comma as the decimal separator, matching Indonesian convention.
  return 'Rp ' + amount.toLocaleString('id-ID');
}


/**
 * renderBalance  (Task 4)
 * Calculates the current total spending and updates the
 * #balance-amount element in the DOM.
 *
 * Called on init() and after every add / delete operation.
 */
function renderBalance() {
  const total = calculateTotal();

  const balanceAmountEl = document.getElementById('balance-amount');
  if (balanceAmountEl) {
    balanceAmountEl.textContent = formatRupiah(total);
  }
}

// -------------------------------------------------------------
// TASK 6 — TRANSACTION LIST RENDERING
// -------------------------------------------------------------

/**
 * getSortedTransactions
 * Returns a display-ordered copy of the transactions array.
 * The sort logic is expanded in Task 11. For now it returns
 * a shallow copy in insertion order so Task 6 works independently.
 *
 * IMPORTANT: always works on a copy — the source array is never mutated.
 *
 * @returns {Array} Ordered array of transaction objects.
 */
function getSortedTransactions() {
  var list = transactions.slice(); // shallow copy preserves original order

  switch (sortOrder) {
    case 'amount-asc':
      list.sort(function (a, b) { return a.amount - b.amount; });
      break;
    case 'amount-desc':
      list.sort(function (a, b) { return b.amount - a.amount; });
      break;
    case 'category-az':
      list.sort(function (a, b) { return a.category.localeCompare(b.category); });
      break;
    default:
      // "default" — keep insertion order, no sort needed
      break;
  }

  return list;
}


/**
 * renderTransactionList  (Task 6)
 * Clears and rebuilds the #transaction-list <ul> from the current
 * transactions array. Manages the empty-state paragraph visibility.
 *
 * Called by:
 *   • init()            — on page load
 *   • handleFormSubmit  — after a new transaction is added
 *   • handleDeleteTransaction (Task 7) — after a transaction is removed
 *   • handleSortChange  (Task 11) — when the sort order changes
 *
 * DOM APIs used are safe against XSS:
 *   textContent is used for all user-supplied values so special
 *   characters in item names cannot be interpreted as HTML.
 */
function renderTransactionList() {
  var listEl      = document.getElementById('transaction-list');
  var emptyStateEl = document.getElementById('empty-state');

  // Guard: bail out if the container elements are missing
  if (!listEl || !emptyStateEl) { return; }

  // Get the display-ordered list (sort logic lives in getSortedTransactions)
  var sorted = getSortedTransactions();

  // ── Empty state ───────────────────────────────────────────
  if (sorted.length === 0) {
    listEl.innerHTML    = '';   // clear any leftover items
    emptyStateEl.style.display = 'block';
    return;
  }

  // At least one transaction — hide the empty-state message
  emptyStateEl.style.display = 'none';

  // ── Build list items using safe DOM APIs ──────────────────
  // We use a DocumentFragment so all items are inserted in a
  // single DOM operation, which is more efficient than appending
  // one node at a time.
  var fragment = document.createDocumentFragment();

  sorted.forEach(function (transaction) {

    // <li class="transaction-item">
    var li = document.createElement('li');
    li.className = 'transaction-item';
    // Store the id as a data attribute so the delete button (Task 7)
    // can reference it without a closure lookup.
    li.dataset.id = transaction.id;

    // Left side — name, category badge, amount
    var infoDiv = document.createElement('div');
    infoDiv.className = 'tx-info';

    //   <span class="tx-name">Lunch</span>
    var nameSpan = document.createElement('span');
    nameSpan.className   = 'tx-name';
    nameSpan.textContent = transaction.name; // safe: textContent, not innerHTML

    //   <span class="tx-category">Food</span>
    var categorySpan = document.createElement('span');
    categorySpan.className   = 'tx-category';
    categorySpan.textContent = transaction.category;
    // Store category on the element so CSS can colour-code badges (Task 9)
    categorySpan.dataset.category = transaction.category;

    //   <span class="tx-amount">Rp 25.000</span>
    var amountSpan = document.createElement('span');
    amountSpan.className   = 'tx-amount';
    amountSpan.textContent = formatRupiah(transaction.amount);

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(categorySpan);
    infoDiv.appendChild(amountSpan);

    // Right side — delete button placeholder (wired up in Task 7)
    var deleteBtn = document.createElement('button');
    deleteBtn.className  = 'delete-btn';
    deleteBtn.type       = 'button';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', 'Delete ' + transaction.name);
    // Task 7 will attach the real handler; store the id for easy access
    deleteBtn.dataset.id = transaction.id;

    li.appendChild(infoDiv);
    li.appendChild(deleteBtn);
    fragment.appendChild(li);
  });

  // Replace the list contents in one operation
  listEl.innerHTML = '';
  listEl.appendChild(fragment);
}

/**
 * renderChart (stub — implemented in Task 8)
 * Will draw / update the Chart.js pie chart.
 */
function aggregateByCategory(transactionList) {
  const totals = {};

  transactionList.forEach(function (transaction) {
    if (!totals[transaction.category]) {
      totals[transaction.category] = 0;
    }

    totals[transaction.category] += transaction.amount;
  });

  return totals;
}

const CATEGORY_COLORS = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Fun: '#a855f7'
};

const EXTRA_COLORS = [
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16'
];

function getCategoryColor(category, index) {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }

  return EXTRA_COLORS[index % EXTRA_COLORS.length];
}

function renderChart() {
  const canvas = document.getElementById('expense-chart');
  const emptyMessage = document.getElementById('chart-empty');

  if (!canvas || !emptyMessage) {
    return;
  }

  // Tidak ada transaksi
  if (transactions.length === 0) {
    canvas.style.display = 'none';
    emptyMessage.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  emptyMessage.style.display = 'none';

  const categoryTotals = aggregateByCategory(transactions);
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const backgroundColors = labels.map(function (category, index) {
    return getCategoryColor(category, index);
  });

  // Buat Chart hanya jika belum ada
  if (!chartInstance) {
    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                return context.label + ': ' + formatRupiah(value);
              }
            }
          }
        }
      }
    });

    return;
  }

  // Kalau Chart sudah ada, cukup update datanya
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = data;
  chartInstance.data.datasets[0].backgroundColor = backgroundColors;

  chartInstance.update();
}


// -------------------------------------------------------------
// TASK 7 — DELETE TRANSACTION
// -------------------------------------------------------------

/**
 * handleDeleteTransaction  (Task 7)
 * Removes a single transaction from the transactions array after
 * asking the user for confirmation.
 *
 * Steps (design.md §7 — Delete Flow):
 *   1. Show window.confirm — bail out immediately if the user cancels.
 *   2. Filter the transaction out of the in-memory array.
 *   3. Persist the updated array to Local Storage.
 *   4. Re-render the balance, list, and chart.
 *
 * @param {string} id - The unique ID of the transaction to delete.
 */
function handleDeleteTransaction(id) {
  // ── Step 1: Ask for confirmation before doing anything ────
  // window.confirm is synchronous and beginner-friendly.
  // If the user clicks Cancel the function returns immediately
  // and the data is left completely unchanged.
  var confirmed = window.confirm('Delete this transaction?');
  if (!confirmed) {
    return;
  }

  // ── Step 2: Remove the transaction from in-memory state ───
  // Array.filter creates a NEW array that contains every
  // transaction EXCEPT the one with the matching id.
  // The original array is replaced, not mutated in place.
  transactions = transactions.filter(function (transaction) {
    return transaction.id !== id;
  });

  // ── Step 3: Persist the updated array to Local Storage ────
  saveTransactions(transactions);

  // ── Step 4: Refresh the UI to reflect the deletion ────────
  renderBalance();          // recalculate and display the new total
  renderTransactionList();  // rebuild the list (shows empty state if now empty)
  renderChart();            // update the pie chart (stub until Task 8)
}


/**
 * handleListClick  (Task 7)
 * Event-delegation handler attached to the static #transaction-list
 * container. Listens for clicks on any .delete-btn inside it.
 *
 * Why delegation instead of per-button listeners?
 * renderTransactionList() replaces the entire list contents on
 * every render, so any listeners attached directly to individual
 * buttons would be lost. A single listener on the stable parent
 * element works regardless of how many times the list is rebuilt.
 *
 * @param {MouseEvent} e - The click event bubbled up from the list.
 */
function handleListClick(e) {
  // Check whether the clicked element is (or is inside) a delete button
  var btn = e.target.closest('.delete-btn');
  if (!btn) {
    return; // click was on something else in the list — ignore it
  }

  // Retrieve the transaction id stored as a data attribute in Task 6
  var id = btn.dataset.id;
  if (!id) {
    return; // safety guard — should never happen in normal use
  }

  handleDeleteTransaction(id);
}


// -------------------------------------------------------------
// TASK 5 — INPUT FORM & VALIDATION
// -------------------------------------------------------------

/**
 * clearErrors
 * Resets all three inline validation error messages to empty.
 * Called at the start of every submit attempt so stale messages
 * from a previous attempt don't linger on screen.
 */
function clearErrors() {
  document.getElementById('name-error').textContent     = '';
  document.getElementById('amount-error').textContent   = '';
  document.getElementById('category-error').textContent = '';
}


/**
 * handleFormSubmit  (Task 5)
 * Handles the Add Expense form submission.
 *
 * Validation rules (design.md §7 — Form Validation):
 *   • Item Name  — must not be empty after trimming whitespace
 *   • Amount     — must be a number greater than 0
 *   • Category   — must have a non-empty value selected
 *
 * On success:
 *   • Creates a Transaction object and pushes it to transactions[].
 *   • Persists the updated array with saveTransactions().
 *   • Calls renderBalance() so the header total updates immediately.
 *   • Calls renderTransactionList() and renderChart() (stubs for now).
 *   • Resets the form to its default empty state.
 *
 * @param {Event} e - The form submit event.
 */
function handleFormSubmit(e) {
  // Always prevent the default browser form submission (page reload).
  e.preventDefault();

  // ── Clear any errors shown from the previous attempt ──────
  clearErrors();

  // ── Read and normalise the field values ───────────────────
  const nameInput     = document.getElementById('item-name');
  const amountInput   = document.getElementById('item-amount');
  const categoryInput = document.getElementById('item-category');

  const name     = nameInput.value.trim();
  const amountRaw = amountInput.value.trim();
  const category = categoryInput.value;

  // ── Validate — collect all errors before returning ────────
  // We check all fields in one pass so the user sees every
  // problem at once instead of one error at a time.
  let hasError = false;

  // 1. Item Name must not be blank
  if (name === '') {
    document.getElementById('name-error').textContent = 'Item name is required.';
    hasError = true;
  }

  // 2. Amount must be a valid number greater than 0
  const amount = parseFloat(amountRaw);
  if (amountRaw === '' || isNaN(amount) || amount <= 0) {
    document.getElementById('amount-error').textContent = 'Enter a valid positive amount.';
    hasError = true;
  }

  // 3. A category must be selected (not the placeholder option)
  if (category === '') {
    document.getElementById('category-error').textContent = 'Please select a category.';
    hasError = true;
  }

  // Stop here if any field failed validation
  if (hasError) {
    return;
  }

  // ── Build the new Transaction object (design.md §2) ───────
  // Date.now() gives milliseconds since epoch — unique enough
  // for single-user Local Storage data.
  const newTransaction = {
    id:       Date.now().toString(),
    name:     name,
    amount:   amount,
    category: category,
  };

  // ── Update application state ───────────────────────────────
  transactions.push(newTransaction);

  // ── Persist to Local Storage immediately ──────────────────
  saveTransactions(transactions);

  // ── Update the UI ─────────────────────────────────────────
  renderBalance();          // Task 4 — recalculates and displays new total
  renderTransactionList();  // Task 6 stub — will show the new item in the list
  renderChart();            // Task 8 stub — will update the pie chart

  // ── Reset the form so it is ready for the next entry ──────
  e.target.reset();
}

/**
 * handleAddCategory (stub — implemented in Task 10)
 */
function renderCategoryOptions() {
  const categorySelect = document.getElementById('item-category');

  if (!categorySelect) {
    return;
  }

  // Keep the placeholder option
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';

  categories.forEach(function (category) {
    const option = document.createElement('option');

    option.value = category;
    option.textContent = category;

    categorySelect.appendChild(option);
  });
}

function handleAddCategory() {
  const input = document.getElementById('new-category');
  const error = document.getElementById('new-category-error');

  if (!input || !error) {
    return;
  }

  const newCategory = input.value.trim();

  // Clear previous error
  error.textContent = '';

  // Validate empty input
  if (newCategory === '') {
    error.textContent = 'Category name is required.';
    return;
  }

  // Check for duplicate category (case-insensitive)
  const alreadyExists = categories.some(function (category) {
    return category.toLowerCase() === newCategory.toLowerCase();
  });

  if (alreadyExists) {
    error.textContent = 'This category already exists.';
    return;
  }

  // Add the new category
  categories.push(newCategory);

  // Save only custom categories to Local Storage
  const customCategories = categories.filter(function (category) {
    return !DEFAULT_CATEGORIES.some(function (defaultCategory) {
      return defaultCategory.toLowerCase() === category.toLowerCase();
    });
  });

  saveCategories(customCategories);

  // Refresh the category dropdown
  renderCategoryOptions();

  // Automatically select the new category
  document.getElementById('item-category').value = newCategory;

  // Clear input
  input.value = '';
}

/**
 * handleSortChange (stub — implemented in Task 11)
 */
function handleSortChange() {
  const sortSelect = document.getElementById('sort-select');

  if (!sortSelect) {
    return;
  }

  sortOrder = sortSelect.value;

  renderTransactionList();
}

/**
 * handleThemeToggle (stub — implemented in Task 12)
 */
function handleThemeToggle() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  saveTheme(newTheme);

  const themeToggleBtn = document.getElementById('theme-toggle');

  if (themeToggleBtn) {
    themeToggleBtn.textContent =
      newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}


// -- Initialisation -------------------------------------------

/**
 * init
 * Entry point for the application. Called once the DOM is ready.
 *
 * Steps (design.md §7 — Initialisation):
 *   1. Load and apply the saved theme.
 *   2. Load and merge categories (defaults + custom).
 *   3. Load saved transactions.
 *   4–7. Call render functions (stubs for now).
 *   8. Attach event listeners.
 */
function init() {
  // ── Step 1: Apply saved theme to <html data-theme="..."> ──
  // This must happen before any rendering so colours are correct.
  const savedTheme = loadTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Keep the theme-toggle button label in sync (Task 12 will expand this)
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // ── Step 2: Build the full category list ──────────────────
  // Start with the three defaults, then append any custom ones
  // that were saved previously, skipping duplicates.
  const savedCustomCategories = loadCategories();
  categories = [...DEFAULT_CATEGORIES]; // always start fresh with defaults

  savedCustomCategories.forEach(function (cat) {
    // Case-insensitive duplicate check
    const alreadyExists = categories.some(function (existing) {
      return existing.toLowerCase() === cat.toLowerCase();
    });
    if (!alreadyExists) {
      categories.push(cat);
    }
  });

  // ── Step 3: Load saved transactions ───────────────────────
  transactions = loadTransactions();

  // Debug: confirm loaded data is visible in the console
  console.log('init: loaded', transactions.length, 'transaction(s)', transactions);
  console.log('init: categories', categories);
  console.log('init: theme', savedTheme);

  // ── Steps 4–7: Call render functions (stubs until later tasks) ──
  renderCategoryOptions();
  renderBalance();
  renderTransactionList();
  renderChart();

  // ── Step 8: Attach event listeners ────────────────────────
  const expenseForm     = document.getElementById('expense-form');
  const addCategoryBtn  = document.getElementById('add-category-btn');
  const sortSelect      = document.getElementById('sort-select');
  const transactionList = document.getElementById('transaction-list');

  if (expenseForm)      expenseForm.addEventListener('submit', handleFormSubmit);
  if (addCategoryBtn)   addCategoryBtn.addEventListener('click', handleAddCategory);
  if (sortSelect)       sortSelect.addEventListener('change', handleSortChange);
  if (themeToggleBtn)   themeToggleBtn.addEventListener('click', handleThemeToggle);

  // Delegation listener for delete buttons (Task 7).
  // Attached once to the stable parent; works for all dynamically
  // rendered buttons regardless of how often the list is rebuilt.
  if (transactionList)  transactionList.addEventListener('click', handleListClick);
}


// -- Bootstrap ------------------------------------------------
// Wait for the HTML to be fully parsed before running init().
document.addEventListener('DOMContentLoaded', init);
