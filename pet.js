/* =========================================================
   PERSONAL FINANCE TRACKER
   =========================================================

   This JavaScript file handles:

   1. Adding transactions
   2. Editing transactions
   3. Deleting transactions
   4. Filtering transactions
   5. Searching transactions
   6. Filtering by month
   7. Calculating income
   8. Calculating expenses
   9. Calculating balance
   10. Financial statistics
   11. localStorage
   12. Dark/light mode
   13. CSV export
   14. Charts
   ========================================================= */

/* =========================================================
   SELECT HTML ELEMENTS
========================================================= */

// Form
const transactionForm = document.querySelector("#transaction-form");

// Form inputs
const transactionName = document.querySelector("#transaction-name");

const amountInput = document.querySelector("#amount");

const typeInput = document.querySelector("#type");

const categoryInput = document.querySelector("#category");

const dateInput = document.querySelector("#date");

// Form buttons
const submitButton = document.querySelector("#submit-btn");

const cancelEditButton = document.querySelector("#cancel-edit-btn");

// Dashboard
const transactionList = document.querySelector("#transaction-list");

// Summary cards
const incomeTotal = document.querySelector("#income-total");

const expenseTotal = document.querySelector("#expense-total");

const balanceTotal = document.querySelector("#balance-total");

// Filters
const filterButtons = document.querySelectorAll(".filter");

// Search and month filter
const searchInput = document.querySelector("#search-input");

const monthFilter = document.querySelector("#month-filter");

const clearMonthButton = document.querySelector("#clear-month-btn");

// Other buttons
const clearAllButton = document.querySelector("#clear-all-btn");

const exportButton = document.querySelector("#export-btn");

// Theme buttons
const lightButton = document.querySelector("#light-btn");

const darkButton = document.querySelector("#dark-btn");

// Form heading
const formTitle = document.querySelector("#form-title");

// Statistics
const transactionCount = document.querySelector("#transaction-count");

const averageExpense = document.querySelector("#average-expense");

const biggestExpense = document.querySelector("#biggest-expense");

const biggestIncome = document.querySelector("#biggest-income");

// Canvas elements used for charts
const incomeExpenseCanvas = document.querySelector("#income-expense-chart");

const categoryCanvas = document.querySelector("#category-chart");

/* =========================================================
   APPLICATION STATE
========================================================= */

/*
    We retrieve previously saved transactions from
    localStorage.

    If nothing has been saved before, we use an empty array.
*/

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

/*
    currentFilter controls:

    all
    income
    expense
*/

let currentFilter = "all";

/*
    editingId stores the ID of the transaction
    currently being edited.

    null means we are not editing anything.
*/

let editingId = null;

/* =========================================================
   DEFAULT DATE
========================================================= */

/*
    Automatically put today's date into the date input
    when the application loads.
*/

setTodayDate();

function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];

  dateInput.value = today;
}

/* =========================================================
   FORM SUBMISSION
========================================================= */

transactionForm.addEventListener("submit", function (event) {
  /*
            Prevent the browser from refreshing the page.
        */

  event.preventDefault();

  /*
            Get values from the form.
        */

  const name = transactionName.value.trim();

  const amount = Number(amountInput.value);

  const type = typeInput.value;

  const category = categoryInput.value;

  const date = dateInput.value;

  /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

  if (!name) {
    alert("Please enter a transaction name.");

    transactionName.focus();

    return;
  }

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");

    amountInput.focus();

    return;
  }

  if (!type) {
    alert("Please select a transaction type.");

    typeInput.focus();

    return;
  }

  if (!category) {
    alert("Please select a category.");

    categoryInput.focus();

    return;
  }

  if (!date) {
    alert("Please select a date.");

    dateInput.focus();

    return;
  }

  /* =================================================
           EDIT EXISTING TRANSACTION
        ================================================== */

  if (editingId !== null) {
    /*
                Find the transaction being edited.
            */

    const transaction = transactions.find((item) => item.id === editingId);

    /*
                Update its values.
            */

    transaction.name = name;

    transaction.amount = amount;

    transaction.type = type;

    transaction.category = category;

    transaction.date = date;

    /*
                Return the form to normal add mode.
            */

    editingId = null;

    formTitle.textContent = "Add Transaction";

    submitButton.textContent = "Add Transaction";

    cancelEditButton.classList.add("hidden");
  } else {

  /* =================================================
           ADD NEW TRANSACTION
        ================================================== */
    /*
                Create a new transaction object.
            */

    const transaction = {
      /*
                    Date.now() gives each transaction
                    a unique ID.
                */

      id: Date.now(),

      name: name,

      amount: amount,

      type: type,

      category: category,

      date: date,
    };

    /*
                Add the transaction to our array.
            */

    transactions.push(transaction);
  }

  /* =================================================
           SAVE AND UPDATE UI
        ================================================== */

  saveTransactions();

  renderTransactions();

  updateSummary();

  updateStatistics();

  drawCharts();

  /*
            Reset the form after adding/editing.
        */

  transactionForm.reset();

  setTodayDate();
});

/* =========================================================
   SAVE TRANSACTIONS
========================================================= */

function saveTransactions() {
  /*
        localStorage can only store strings.

        JSON.stringify converts our array into a string.
    */

  localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* =========================================================
   GET FILTERED TRANSACTIONS
========================================================= */

function getFilteredTransactions() {
  /*
        Start with all transactions.
    */

  let result = [...transactions];

  /* ---------------------------------------------
       TYPE FILTER
    --------------------------------------------- */

  if (currentFilter !== "all") {
    result = result.filter((transaction) => transaction.type === currentFilter);
  }

  /* ---------------------------------------------
       SEARCH FILTER
    --------------------------------------------- */

  const searchText = searchInput.value.trim().toLowerCase();

  if (searchText) {
    result = result.filter((transaction) => {
      /*
                Search both transaction name
                and category.
            */

      return (
        transaction.name.toLowerCase().includes(searchText) ||
        transaction.category.toLowerCase().includes(searchText)
      );
    });
  }

  /* ---------------------------------------------
       MONTH FILTER
    --------------------------------------------- */

  const selectedMonth = monthFilter.value;

  if (selectedMonth) {
    result = result.filter((transaction) => {
      /*
                A date looks like:

                2026-08-21

                The first 7 characters give us:

                2026-08
            */

      return transaction.date.startsWith(selectedMonth);
    });
  }

  return result;
}

/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {
  /*
        Empty the current transaction list.
    */

  transactionList.innerHTML = "";

  /*
        Get transactions according to the active filters.
    */

  const filteredTransactions = getFilteredTransactions();

  /* ---------------------------------------------
       EMPTY STATE
    --------------------------------------------- */

  if (filteredTransactions.length === 0) {
    transactionList.innerHTML = `
            <p class="empty-message">
                No transactions found.
            </p>
        `;

    return;
  }

  /* ---------------------------------------------
       DISPLAY TRANSACTIONS
    --------------------------------------------- */

  /*
        Reverse creates a newest-first display.
    */

  filteredTransactions
    .slice()
    .reverse()
    .forEach((transaction) => {
      /*
                Create a new DIV for each transaction.
            */

      const transactionElement = document.createElement("div");

      /*
                Add either:

                transaction income

                OR

                transaction expense
            */

      transactionElement.className = `transaction ${transaction.type}`;

      /*
                Income gets +

                Expense gets -
            */

      const sign = transaction.type === "income" ? "+" : "-";

      /*
                Create the transaction HTML.

                escapeHTML protects the page from
                accidentally interpreting user text as HTML.
            */

      transactionElement.innerHTML = `

                <div class="transaction-info">

                    <span class="transaction-name">

                        ${escapeHTML(transaction.name)}

                    </span>


                    <span class="transaction-details">

                        ${capitalize(escapeHTML(transaction.category))}

                        •

                        ${transaction.date}

                    </span>

                </div>


                <div class="transaction-right">

                    <strong
                        class="transaction-amount
                        ${transaction.type}">

                        ${sign}₦${formatMoney(transaction.amount)}

                    </strong>


                    <button
                        class="edit-btn"
                        onclick="editTransaction(${transaction.id})">

                        ✏️ Edit

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})">

                        🗑️

                    </button>

                </div>

            `;

      transactionList.appendChild(transactionElement);
    });
}

/* =========================================================
   EDIT TRANSACTION
========================================================= */

function editTransaction(id) {
  /*
        Find the selected transaction.
    */

  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  /*
        Store the ID so the submit button knows
        we are editing instead of adding.
    */

  editingId = id;

  /*
        Put the transaction values into the form.
    */

  transactionName.value = transaction.name;

  amountInput.value = transaction.amount;

  typeInput.value = transaction.type;

  categoryInput.value = transaction.category;

  dateInput.value = transaction.date;

  /*
        Change the form's appearance.
    */

  formTitle.textContent = "Edit Transaction";

  submitButton.textContent = "Save Changes";

  cancelEditButton.classList.remove("hidden");

  /*
        Scroll back to the form on smaller screens.
    */

  document.querySelector(".form-section").scrollIntoView({
    behavior: "smooth",
  });
}

/* =========================================================
   CANCEL EDIT
========================================================= */

cancelEditButton.addEventListener("click", cancelEdit);

function cancelEdit() {
  /*
        Return to normal mode.
    */

  editingId = null;

  formTitle.textContent = "Add Transaction";

  submitButton.textContent = "Add Transaction";

  cancelEditButton.classList.add("hidden");

  /*
        Clear the form.
    */

  transactionForm.reset();

  setTodayDate();
}

/* =========================================================
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(id) {
  /*
        Find the transaction so we can show
        its name in the confirmation message.
    */

  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  /*
        Ask the user for confirmation before deleting.
    */

  const confirmed = confirm(`Delete "${transaction.name}"?`);

  if (!confirmed) {
    return;
  }

  /*
        Remove the transaction from the array.
    */

  transactions = transactions.filter((item) => item.id !== id);

  /*
        Save the updated array.
    */

  saveTransactions();

  /*
        Refresh everything.
    */

  renderTransactions();

  updateSummary();

  updateStatistics();

  drawCharts();
}

/* =========================================================
   CLEAR ALL TRANSACTIONS
========================================================= */

clearAllButton.addEventListener("click", function () {
  /*
            Don't do anything if there are no transactions.
        */

  if (transactions.length === 0) {
    alert("There are no transactions to clear.");

    return;
  }

  /*
            Confirmation prevents accidental deletion.
        */

  const confirmed = confirm(
    "Are you sure you want to delete ALL transactions?",
  );

  if (!confirmed) {
    return;
  }

  /*
            Empty the transactions array.
        */

  transactions = [];

  /*
            Save the empty array.
        */

  saveTransactions();

  /*
            Update the interface.
        */

  renderTransactions();

  updateSummary();

  updateStatistics();

  drawCharts();
});

/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary() {
  let income = 0;

  let expenses = 0;

  /*
        Go through every transaction.
    */

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else {
      expenses += transaction.amount;
    }
  });

  /*
        Balance = Income - Expenses
    */

  const balance = income - expenses;

  /*
        Display the results.
    */

  incomeTotal.textContent = `₦${formatMoney(income)}`;

  expenseTotal.textContent = `₦${formatMoney(expenses)}`;

  balanceTotal.textContent = `₦${formatMoney(balance)}`;
}

/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {
  /*
        Number of transactions.
    */

  transactionCount.textContent = transactions.length;

  /*
        Get all expenses.
    */

  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  /*
        Get all income.
    */

  const income = transactions.filter(
    (transaction) => transaction.type === "income",
  );

  /* ---------------------------------------------
       AVERAGE EXPENSE
    --------------------------------------------- */

  const expenseSum = expenses.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  const average = expenses.length ? expenseSum / expenses.length : 0;

  averageExpense.textContent = `₦${formatMoney(average)}`;

  /* ---------------------------------------------
       BIGGEST EXPENSE
    --------------------------------------------- */

  const largestExpense = expenses.length
    ? Math.max(...expenses.map((transaction) => transaction.amount))
    : 0;

  biggestExpense.textContent = `₦${formatMoney(largestExpense)}`;

  /* ---------------------------------------------
       BIGGEST INCOME
    --------------------------------------------- */

  const largestIncome = income.length
    ? Math.max(...income.map((transaction) => transaction.amount))
    : 0;

  biggestIncome.textContent = `₦${formatMoney(largestIncome)}`;
}

/* =========================================================
   FILTER BUTTONS
========================================================= */

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    /*
                Remove active class from every button.
            */

    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    /*
                Make the clicked button active.
            */

    this.classList.add("active");

    /*
                Store the selected filter.
            */

    currentFilter = this.dataset.filter;

    /*
                Render filtered transactions.
            */

    renderTransactions();
  });
});

/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener("input", renderTransactions);

/* =========================================================
   MONTH FILTER
========================================================= */

monthFilter.addEventListener("change", renderTransactions);

/* =========================================================
   CLEAR MONTH FILTER
========================================================= */

clearMonthButton.addEventListener("click", function () {
  monthFilter.value = "";

  renderTransactions();
});

/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(amount) {
  /*
        Convert numbers into readable Nigerian
        currency-style formatting.

        Example:

        1500000

        becomes:

        1,500,000
    */

  return Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   CAPITALIZE TEXT
========================================================= */

function capitalize(text) {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* =========================================================
   ESCAPE USER TEXT
========================================================= */

function escapeHTML(text) {
  /*
        Prevents user-entered text from being interpreted
        as HTML.

        This is a small but important security practice.
    */

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

/* =========================================================
   CSV EXPORT
========================================================= */

exportButton.addEventListener("click", exportCSV);

function exportCSV() {
  /*
        Don't export an empty file.
    */

  if (transactions.length === 0) {
    alert("There are no transactions to export.");

    return;
  }

  /*
        CSV column headings.
    */

  let csv = "Name,Amount,Type,Category,Date\n";

  /*
        Add each transaction as a CSV row.
    */

  transactions.forEach((transaction) => {
    /*
            Replace quotation marks so they
            don't break the CSV structure.
        */

    const name = transaction.name.replace(/"/g, '""');

    csv +=
      `"${name}",` +
      `"${transaction.amount}",` +
      `"${transaction.type}",` +
      `"${transaction.category}",` +
      `"${transaction.date}"\n`;
  });

  /*
        Convert the CSV string into a file.
    */

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  /*
        Create a temporary download link.
    */

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "personal-finance-transactions.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  /*
        Free the temporary URL.
    */

  URL.revokeObjectURL(url);
}

/* =========================================================
   DARK / LIGHT MODE
========================================================= */

lightButton.addEventListener("click", function () {
  document.body.classList.remove("dark");

  localStorage.setItem("theme", "light");
});

darkButton.addEventListener("click", function () {
  document.body.classList.add("dark");

  localStorage.setItem("theme", "dark");
});

/* =========================================================
   LOAD SAVED THEME
========================================================= */

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

/* =========================================================
   CHARTS
========================================================= */

/*
    This function draws the Income vs Expenses chart.

    We are using the HTML Canvas API instead of an external
    chart library, so you don't need to install anything.
*/

function drawIncomeExpenseChart() {
  const canvas = incomeExpenseCanvas;

  const ctx = canvas.getContext("2d");

  /*
        Canvas dimensions.
    */

  const width = (canvas.width = canvas.offsetWidth * 2);

  const height = (canvas.height = 250 * 2);

  /*
        Clear previous chart.
    */

  ctx.clearRect(0, 0, width, height);

  /*
        Calculate totals.
    */

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  /*
        Find the largest value so we know
        how tall the bars should be.
    */

  const max = Math.max(income, expenses, 1);

  /*
        Chart positioning.
    */

  const center = width / 2;

  const barWidth = 120;

  /*
        Calculate heights.

        We leave space for labels.
    */

  const incomeHeight = (income / max) * 150;

  const expenseHeight = (expenses / max) * 150;

  /*
        Draw income bar.
    */

  ctx.fillStyle = "#20e82c";

  ctx.fillRect(
    center - barWidth - 20,
    height - incomeHeight - 50,
    barWidth,
    incomeHeight,
  );

  /*
        Draw expense bar.
    */

  ctx.fillStyle = "#ff2020";

  ctx.fillRect(
    center + 20,
    height - expenseHeight - 50,
    barWidth,
    expenseHeight,
  );

  /*
        Draw labels.
    */

  ctx.fillStyle = document.body.classList.contains("dark")
    ? "#ffffff"
    : "#111111";

  ctx.font = "bold 26px Arial";

  ctx.textAlign = "center";

  ctx.fillText("Income", center - barWidth / 2 - 20, height - 15);

  ctx.fillText("Expenses", center + barWidth / 2 + 20, height - 15);

  /*
        Draw amounts.
    */

  ctx.font = "bold 20px Arial";

  ctx.fillText(
    `₦${formatMoney(income)}`,
    center - barWidth / 2 - 20,
    height - incomeHeight - 65,
  );

  ctx.fillText(
    `₦${formatMoney(expenses)}`,
    center + barWidth / 2 + 20,
    height - expenseHeight - 65,
  );
}

/* =========================================================
   CATEGORY CHART
========================================================= */

function drawCategoryChart() {
  const canvas = categoryCanvas;

  const ctx = canvas.getContext("2d");

  const width = (canvas.width = canvas.offsetWidth * 2);

  const height = (canvas.height = 300 * 2);

  ctx.clearRect(0, 0, width, height);

  /*
        Create an object containing total expenses
        for every category.
    */

  const categories = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = 0;
      }

      categories[transaction.category] += transaction.amount;
    });

  const categoryNames = Object.keys(categories);

  /*
        If there are no expenses, show a message.
    */

  if (categoryNames.length === 0) {
    ctx.fillStyle = document.body.classList.contains("dark")
      ? "#ffffff"
      : "#777777";

    ctx.font = "20px Arial";

    ctx.textAlign = "center";

    ctx.fillText("No expense data available", width / 2, height / 2);

    return;
  }

  /*
        Find the largest category amount.
    */

  const max = Math.max(...Object.values(categories));

  /*
        Draw horizontal bars.
    */

  const barHeight = 30;

  const gap = 20;

  let y = 35;

  categoryNames.forEach((category) => {
    const amount = categories[category];

    /*
            Calculate bar width according to
            the largest category.
        */

    const barWidth = (amount / max) * (width - 250);

    /*
            Category name.
        */

    ctx.fillStyle = document.body.classList.contains("dark")
      ? "#ffffff"
      : "#111111";

    ctx.font = "16px Arial";

    ctx.textAlign = "left";

    ctx.fillText(capitalize(category), 10, y + 22);

    /*
            Category bar.
        */

    ctx.fillStyle = "lightblue";

    ctx.fillRect(130, y, Math.max(barWidth, 5), barHeight);

    /*
            Category amount.
        */

    ctx.fillStyle = document.body.classList.contains("dark")
      ? "#ffffff"
      : "#111111";

    ctx.textAlign = "right";

    ctx.fillText(`₦${formatMoney(amount)}`, width - 10, y + 22);

    y += barHeight + gap;

    /*
            Prevent bars from going outside
            the canvas.
        */

    if (y > height - 30) {
      return;
    }
  });
}

/* =========================================================
   DRAW BOTH CHARTS
========================================================= */

function drawCharts() {
  drawIncomeExpenseChart();

  drawCategoryChart();
}

/* =========================================================
   REDRAW CHARTS WHEN WINDOW RESIZES
========================================================= */

window.addEventListener("resize", drawCharts);

/* =========================================================
   INITIAL APPLICATION LOAD
========================================================= */

/*
    Render everything when the page first opens.
*/

renderTransactions();

updateSummary();

updateStatistics();

drawCharts();
