# Requirements — Expense & Budget Visualizer

## Overview

A mobile-friendly, single-page web application that helps users track daily expenses. Users can add transactions, view a running total balance, browse a scrollable transaction history, and see a live pie chart of spending by category. All data persists in browser Local Storage.

---

## Functional Requirements

### FR-1: Input Form

- **FR-1.1** The form must contain three fields: Item Name (text), Amount (number), and Category (select).
- **FR-1.2** Default category options must be: Food, Transport, Fun.
- **FR-1.3** All three fields are required; the form must not submit if any field is empty.
- **FR-1.4** Amount must be a valid positive number (greater than 0). Non-numeric or zero/negative values must be rejected with a clear validation message shown near the field.
- **FR-1.5** On successful submission, the transaction is appended to the transaction list, the total balance is updated, and the pie chart is updated.
- **FR-1.6** After successful submission, the form is reset to its default/empty state.

### FR-2: Transaction List

- **FR-2.1** All stored transactions must be displayed in a list.
- **FR-2.2** Each transaction entry must display: item name, formatted amount, and category.
- **FR-2.3** The transaction list area must be scrollable when its contents overflow.
- **FR-2.4** Each transaction entry must include a delete button.
- **FR-2.5** Clicking delete must show a confirmation prompt before removing the transaction.
- **FR-2.6** After deletion, the list, total balance, and pie chart must update immediately.
- **FR-2.7** When no transactions exist, the list must display a friendly empty-state message (e.g., "No transactions yet. Add one above!").

### FR-3: Total Balance

- **FR-3.1** The total spending must be displayed prominently at the top of the application.
- **FR-3.2** The total must recalculate and re-render whenever a transaction is added or deleted.
- **FR-3.3** The total is the sum of all transaction amounts in the current dataset.

### FR-4: Pie Chart

- **FR-4.1** A pie chart must display the spending distribution across categories.
- **FR-4.2** Default chart segments correspond to the default categories: Food, Transport, Fun. Custom categories are also shown if present.
- **FR-4.3** The chart must update automatically whenever the transaction dataset changes (add or delete).
- **FR-4.4** Chart.js must be loaded via CDN (no local bundling required).
- **FR-4.5** Only one Chart.js instance must exist at a time; the existing instance is updated in place rather than destroyed and recreated on every change.
- **FR-4.6** When there are no transactions, the chart should either be hidden or display a neutral placeholder state.

### FR-5: Data Persistence

- **FR-5.1** All transactions must be stored in browser Local Storage under a consistent key (e.g., `expense_transactions`).
- **FR-5.2** On application load, saved transactions must be read from Local Storage and rendered.
- **FR-5.3** Any add or delete operation must immediately write the updated dataset back to Local Storage.
- **FR-5.4** The application must handle missing, empty, or malformed Local Storage data gracefully (default to an empty array without throwing errors).

### FR-6: Optional Feature — Custom Categories

- **FR-6.1** Users must be able to type a new category name and add it to the category list.
- **FR-6.2** Custom categories must appear in the category select alongside the three defaults.
- **FR-6.3** Custom categories must persist in Local Storage and be available after page refresh.

### FR-7: Optional Feature — Sort Transactions

- **FR-7.1** Users must be able to sort the transaction list by Amount (ascending/descending) or by Category (A–Z).
- **FR-7.2** Sorting only affects the visual display order; it does not alter the stored data.
- **FR-7.3** A sort control (e.g., a `<select>` or button group) must be visible above the transaction list.

### FR-8: Optional Feature — Dark/Light Mode Toggle

- **FR-8.1** A toggle button must allow the user to switch between light and dark themes.
- **FR-8.2** The chosen theme must persist in Local Storage and be applied on page load.
- **FR-8.3** The toggle button must provide a clear visual indicator of the current mode.

---

## Non-Functional Requirements

### NFR-1: Technology Stack

- **NFR-1.1** Structure: HTML5 only.
- **NFR-1.2** Styling: A single CSS file located at `css/style.css`.
- **NFR-1.3** Behaviour: A single JavaScript file located at `js/app.js`.
- **NFR-1.4** No JavaScript frameworks (React, Vue, Angular, etc.) are permitted.
- **NFR-1.5** No backend server. The app runs entirely in the browser.
- **NFR-1.6** Chart.js loaded via CDN link in `index.html`.

### NFR-2: Compatibility

- **NFR-2.1** Must work correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
- **NFR-2.2** Must not rely on experimental or vendor-prefixed browser APIs without fallbacks.

### NFR-3: Responsiveness & Mobile-Friendliness

- **NFR-3.1** The layout must be usable on screens as narrow as 320 px.
- **NFR-3.2** Touch targets (buttons, inputs) must be large enough for comfortable mobile use (minimum 44 × 44 px recommended).
- **NFR-3.3** No horizontal scrolling on mobile viewport widths.

### NFR-4: Code Quality

- **NFR-4.1** Code must be clean, well-commented, and beginner-readable.
- **NFR-4.2** Functions must be small and have a single responsibility where practical.
- **NFR-4.3** No minification or obfuscation is required or desired.

### NFR-5: UX & Accessibility

- **NFR-5.1** Validation messages must be visible and descriptive enough for a beginner user to understand what went wrong.
- **NFR-5.2** The UI must have clear visual hierarchy (balance → form → list → chart).
- **NFR-5.3** Colour contrast must be sufficient for readability in both light and dark modes.
- **NFR-5.4** Interactive elements must have appropriate `aria-label` or visible labels.

### NFR-6: Project Structure

- **NFR-6.1** Exactly one CSS file in `css/`.
- **NFR-6.2** Exactly one JavaScript file in `js/`.
- **NFR-6.3** One `index.html` at the project root.
- **NFR-6.4** No test framework, build tool, or package manager configuration files are required.
