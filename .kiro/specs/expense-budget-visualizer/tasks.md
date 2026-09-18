# Implementation Tasks — Expense & Budget Visualizer

Tasks are ordered so each one builds on the previous. Complete them in sequence.

---

## Task 1 — Project Scaffold

**Goal:** Create the folder structure and bare-bones files so the app can be opened in a browser.

Steps:
- Create `index.html` at the project root with the full HTML skeleton from `design.md §5`.
  - Include `<meta charset>`, `<meta viewport>`, `<title>`, and the link to `css/style.css`.
  - Add the Chart.js CDN `<script>` tag before `js/app.js`.
  - Include all section elements with their IDs exactly as specified in the design.
- Create `css/style.css` as an empty file (or with a minimal reset comment).
- Create `js/app.js` as an empty file (or with a `// app.js` comment).

Acceptance criteria:
- Opening `index.html` in a browser shows a blank page without console errors.
- `css/` contains exactly one file; `js/` contains exactly one file.

---

## Task 2 — Local Storage Layer

**Goal:** Implement all read/write helpers for Local Storage so every other task can use them.

In `js/app.js`, implement:

```
loadTransactions()   → reads `expense_transactions`, returns [] on missing/invalid JSON
saveTransactions()   → writes current `transactions[]` to `expense_transactions`
loadCategories()     → reads `expense_categories`, returns [] on missing/invalid JSON
saveCategories()     → writes current `categories[]` to `expense_categories`
loadTheme()          → reads `expense_theme`, returns "light" if absent
saveTheme(theme)     → writes the given theme string
```

All `load*` functions must use a `try/catch` around `JSON.parse` and return a safe default on any error.

Acceptance criteria:
- Calling `saveTransactions()` after pushing a test object results in that object appearing when `loadTransactions()` is called.
- No errors thrown when Local Storage keys are absent (fresh browser).

---

## Task 3 — Initialisation & State Bootstrap

**Goal:** Wire up the `init()` function so the app loads its saved state on startup.

In `js/app.js`:
- Declare module-level state variables: `transactions`, `categories`, `chartInstance`, `sortOrder`.
- Implement `init()`:
  1. Call `loadTheme()` → apply `data-theme` attribute to `<html>`.
  2. Call `loadCategories()` → populate `categories` (merge with `["Food","Transport","Fun"]` defaults ensuring no duplicates).
  3. Call `loadTransactions()` → populate `transactions`.
  4. Call `renderCategoryOptions()` (stub for now).
  5. Call `renderBalance()` (stub for now).
  6. Call `renderTransactionList()` (stub for now).
  7. Call `renderChart()` (stub for now).
  8. Attach all event listeners.
- Register `init` on `DOMContentLoaded`.

Acceptance criteria:
- Page loads without errors.
- Console log of `transactions` shows previously saved data after a refresh.

---

## Task 4 — Balance Display

**Goal:** Implement `renderBalance()` so the total spending always reflects the current dataset.

- Sum all `transaction.amount` values in `transactions[]`.
- Format the number as Indonesian Rupiah: `Rp ${amount.toLocaleString("id-ID")}`.
- Update the text content of `#balance-amount`.

Acceptance criteria:
- With an empty list, `#balance-amount` shows `Rp 0`.
- Adding a transaction with amount 25000 shows `Rp 25.000`.

---

## Task 5 — Input Form & Validation

**Goal:** Implement the Add Expense form with client-side validation.

In `handleFormSubmit(e)`:
1. Call `e.preventDefault()`.
2. Clear all existing error messages (`#name-error`, `#amount-error`, `#category-error`).
3. Read and trim values from `#item-name`, `#item-amount`, `#item-category`.
4. Validate:
   - Name empty → set `#name-error` text to `"Item name is required."`, set `hasError = true`.
   - Amount empty, non-numeric, ≤ 0 → set `#amount-error` text to `"Enter a valid positive amount."`, set `hasError = true`.
   - Category not selected → set `#category-error` text to `"Please select a category."`, set `hasError = true`.
5. If `hasError`, return early without creating a transaction.
6. Create a `Transaction` object: `{ id: Date.now().toString(), name, amount: parseFloat(amount), category }`.
7. Push to `transactions[]`.
8. Call `saveTransactions()`.
9. Call `renderBalance()`, `renderTransactionList()`, `renderChart()`.
10. Reset the form (`form.reset()`).

Acceptance criteria:
- Submitting an empty form shows all three error messages simultaneously.
- Submitting `-100` as amount shows the amount error.
- A valid submission adds a transaction, resets the form, and clears all errors.

---

## Task 6 — Transaction List Rendering

**Goal:** Implement `renderTransactionList()` to display transactions and manage the empty state.

- Call `getSortedTransactions()` to get the display-ordered list.
- If the list is empty:
  - Show `#empty-state`.
  - Clear `#transaction-list` innerHTML.
  - Return.
- Hide `#empty-state`.
- For each transaction, create an `<li>` element containing:
  - Item name in a `<span class="tx-name">`.
  - Formatted amount in a `<span class="tx-amount">` (use `toLocaleString("id-ID")`).
  - Category badge in a `<span class="tx-category">`.
  - A `<button class="delete-btn" aria-label="Delete [name]">` that calls `handleDeleteTransaction(id)` on click.
- Set `#transaction-list` innerHTML to the generated list items.

Acceptance criteria:
- Adding three transactions shows three list items.
- Each item shows the correct name, amount, and category.
- The empty-state message appears when the list is empty.

---

## Task 7 — Delete Transaction

**Goal:** Implement `handleDeleteTransaction(id)` with a confirmation prompt.

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

Acceptance criteria:
- Clicking Cancel in the confirm dialog leaves the transaction intact.
- Clicking OK removes the transaction; balance, list, and chart all update.
- Deleting the last transaction shows the empty state.

---

## Task 8 — Pie Chart

**Goal:** Implement `renderChart()` using Chart.js with a single persistent instance.

Steps:
1. Implement `aggregateByCategory(transactions)` → returns an object like `{ Food: 50000, Transport: 20000 }`.
2. Implement `getCategoryColor(category, index)` → looks up `CATEGORY_COLORS`, falls back to `EXTRA_COLORS[index % EXTRA_COLORS.length]`.
3. In `renderChart()`:
   - If `transactions.length === 0`: hide `<canvas>`, show `#chart-empty`, return.
   - Otherwise: show `<canvas>`, hide `#chart-empty`.
   - Build `labels` and `data` arrays from `aggregateByCategory` result.
   - If `chartInstance === null`: create a new `Chart` and assign to `chartInstance`.
   - Otherwise: update `chartInstance.data.labels`, `chartInstance.data.datasets[0].data`, `chartInstance.data.datasets[0].backgroundColor`, then call `chartInstance.update()`.

Acceptance criteria:
- A pie chart appears after the first transaction is added.
- Adding a second transaction in a different category adds a new segment without creating a duplicate chart.
- Deleting all transactions hides the canvas and shows the empty message.

---

## Task 9 — CSS Styling

**Goal:** Style the application so it is clean, readable, and mobile-friendly.

In `css/style.css`, implement:

1. **CSS custom properties** for both `light` and `dark` themes (see `design.md §6`).
2. **Base reset**: `box-sizing: border-box`, remove default margins on `body`.
3. **Typography**: use a system font stack; readable base font size (16 px+).
4. **`#balance-section`**: centred, prominent balance display; distinct background using `--accent`.
5. **`#app-grid`**: two-column CSS Grid on ≥ 600 px; single-column stacked on < 600 px.
6. **Cards**: `#form-section`, `#list-section`, `#chart-section` each get `background: var(--bg-card)`, `border-radius`, and `box-shadow: var(--shadow)`.
7. **Form elements**: full-width inputs and selects; clear focus states; styled submit button using `--accent`.
8. **Error messages** (`.error-msg`): red text, small font, hidden by default (visible when non-empty).
9. **Transaction list** (`#transaction-list`): `max-height: 400px; overflow-y: auto`; each `<li>` has a flex layout with name/amount/category on the left and delete button on the right.
10. **Delete button** (`.delete-btn`): uses `--danger` colour; subtle on normal state, bold on hover.
11. **Category badge** (`.tx-category`): small pill-shaped badge with category-appropriate background colour.
12. **Empty state** (`#empty-state`, `#chart-empty`): centred, muted colour, friendly icon or emoji.
13. **Theme toggle button** (`#theme-toggle`): fixed to bottom-right corner, circular or pill-shaped, high contrast.
14. **Responsive breakpoint** at 600 px: switch grid to single column.
15. **Chart container** (`#chart-container`): `max-width: 320px; margin: 0 auto` to prevent oversized chart on large screens.

Acceptance criteria:
- The app looks clean and readable in both light and dark mode.
- No horizontal scroll on a 375 px viewport.
- All interactive elements have visible focus styles.

---

## Task 10 — Optional: Custom Categories

**Goal:** Allow users to add new categories from the form.

In `handleAddCategory()`:
1. Read and trim `#new-category` value.
2. If empty, show an inline message and return.
3. If the value already exists in `categories[]` (case-insensitive), show a duplicate warning and return.
4. Push the new category to `categories[]`.
5. Call `saveCategories()`.
6. Call `renderCategoryOptions()` to rebuild the `<select>` options.
7. Set `#item-category` value to the new category (auto-select it).
8. Clear `#new-category` input.

In `renderCategoryOptions()`:
- Rebuild the `<option>` elements in `#item-category` from `categories[]`.
- Preserve the current selection if possible.

Acceptance criteria:
- Adding "Health" creates a new option in the category select.
- Duplicate categories are rejected with a message.
- Custom categories survive a page refresh.

---

## Task 11 — Optional: Sort Transactions

**Goal:** Let users sort the transaction list without altering stored data.

- Implement `getSortedTransactions()` as described in `design.md §7`.
- Attach a `change` listener to `#sort-select` that updates `sortOrder` and calls `renderTransactionList()`.

Acceptance criteria:
- Selecting "Amount ↑" reorders the list from cheapest to most expensive.
- Sorting does not change what is stored in Local Storage (verified by refreshing).

---

## Task 12 — Optional: Dark/Light Mode Toggle

**Goal:** Implement the theme toggle button.

In `handleThemeToggle()`:
1. Read current theme from `document.documentElement.dataset.theme`.
2. Toggle to the opposite value.
3. Update button text/icon.
4. Apply the new `data-theme` to `<html>`.
5. Call `saveTheme(newTheme)`.

In `loadTheme()` (already stubbed in Task 2):
- Read saved theme, apply to `<html>`, update button label accordingly.

Acceptance criteria:
- Clicking the toggle switches all CSS custom property values immediately.
- Refreshing the page restores the last chosen theme.
- The button label reflects the mode that will be activated (e.g. "🌙 Dark Mode" when in light mode).

---

## Task 13 — Final Review & Polish

**Goal:** Verify the complete application against all requirements before delivery.

Checklist:
- [ ] `index.html`, `css/style.css`, `js/app.js` are the only three files in the project root structure (`css/` has one file, `js/` has one file).
- [ ] All MVP features (FR-1 through FR-5) work correctly.
- [ ] All three optional features (FR-6, FR-7, FR-8) work correctly.
- [ ] Form resets after successful submission.
- [ ] Balance updates on add and delete.
- [ ] Chart updates on add and delete with no duplicate instances.
- [ ] Data survives a page refresh.
- [ ] Empty/corrupted Local Storage does not cause errors.
- [ ] App is usable at 375 px viewport width with no horizontal scroll.
- [ ] Both light and dark modes have readable contrast.
- [ ] No JavaScript framework imports present.
- [ ] Code is commented and readable.
- [ ] No console errors in Chrome, Firefox, Edge, or Safari.
