// Main Application Module

const App = {
    expenses: [],
    categorizedExpenses: [],
    aggregation: {},
    summary: {},

    init: () => {
        App.setupFileUpload();
        App.setupEventListeners();
    },

    setupFileUpload: () => {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                App.handleFiles(files);
            }
        });

        // Click to upload
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                App.handleFiles(e.target.files);
            }
        });
    },

    setupEventListeners: () => {
        // Export buttons
        document.getElementById('export-excel-btn')?.addEventListener('click', () => App.exportTo('excel'));
        document.getElementById('export-csv-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            App.exportTo('csv');
        });
        document.getElementById('export-qbo-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            App.exportTo('qbo');
        });

        // Category filter
        document.getElementById('category-filter')?.addEventListener('change', App.filterExpenses);

        // Month filter
        document.getElementById('month-filter')?.addEventListener('change', App.filterExpenses);

        // File filter
        document.getElementById('file-filter')?.addEventListener('change', App.filterExpenses);

        // Breakdown month filter
        document.getElementById('breakdown-month-filter')?.addEventListener('change', App.filterCategoryBreakdown);

        // Try sample data button
        document.getElementById('try-sample-btn')?.addEventListener('click', App.loadSampleData);
    },

    handleFiles: async (files) => {
        App.showAIAgent();
        const allExpenses = [];

        for (const file of files) {
            if (!file.name.endsWith('.csv')) {
                App.showNotification('Please upload CSV files only', 'error');
                continue;
            }

            try {
                const text = await App.readFile(file);
                const expenses = ExpenseProcessor.parseCSV(text, file.name);
                allExpenses.push(...expenses);
                App.showNotification(`Loaded ${expenses.length} transactions from ${file.name}`, 'success');
            } catch (error) {
                App.showNotification(`Error reading ${file.name}: ${error.message}`, 'error');
            }
        }

        if (allExpenses.length > 0) {
            setTimeout(() => {
                App.processExpenses(allExpenses);
                App.hideAIAgent();
            }, 2000);
        } else {
            App.hideAIAgent();
        }
    },

    readFile: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    processExpenses: (expenses) => {
        // Categorize expenses
        App.categorizedExpenses = ExpenseProcessor.categorizeAll(expenses);

        // Aggregate by month and category
        App.aggregation = ExpenseProcessor.aggregateByMonthAndCategory(App.categorizedExpenses);

        // Get summary
        App.summary = ExpenseProcessor.getSummary(App.categorizedExpenses);

        // Update UI
        App.renderSummary();
        App.renderCategoryBreakdown();
        App.renderMonthlyChart();
        App.renderSuspectedPersonalCharges();
        App.renderExpenseTable();
        App.populateFilters();

        // Show results section
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('upload-section').classList.add('minimized');
    },

    renderSummary: () => {
        const container = document.getElementById('summary-cards');
        const { totalExpenses, expenseCount, uniqueMonths, byCategory } = App.summary;

        // Find top category
        const topCategory = Object.entries(byCategory)
            .filter(([id]) => id !== 'uncategorized')
            .sort((a, b) => b[1].total - a[1].total)[0];

        container.innerHTML = `
            <div class="summary-card">
                <div class="summary-icon">💰</div>
                <div class="summary-content">
                    <span class="summary-value">${ExpenseProcessor.formatCurrency(totalExpenses)}</span>
                    <span class="summary-label">Total Expenses</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">📊</div>
                <div class="summary-content">
                    <span class="summary-value">${expenseCount}</span>
                    <span class="summary-label">Transactions</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">📅</div>
                <div class="summary-content">
                    <span class="summary-value">${uniqueMonths.length}</span>
                    <span class="summary-label">Months</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">🏷️</div>
                <div class="summary-content">
                    <span class="summary-value">${topCategory ? getCategoryName(topCategory[0]) : 'N/A'}</span>
                    <span class="summary-label">Top Category</span>
                </div>
            </div>
        `;
    },

    renderCategoryBreakdown: (filterMonth = null) => {
        const container = document.getElementById('category-breakdown');

        // Filter expenses by month if specified
        let expenses = App.categorizedExpenses;
        if (filterMonth) {
            expenses = expenses.filter(e => e.month === filterMonth);
        }

        // Calculate summary for filtered expenses
        const summary = ExpenseProcessor.getSummary(expenses);
        const { byCategory, totalExpenses } = summary;

        if (expenses.length === 0) {
            container.innerHTML = '<p class="no-data">No expenses for this period</p>';
            return;
        }

        const sorted = Object.entries(byCategory)
            .sort((a, b) => b[1].total - a[1].total);

        container.innerHTML = sorted.map(([categoryId, data]) => {
            const percentage = totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0;
            const isUncategorized = categoryId === 'uncategorized';
            return `
                <div class="category-row ${isUncategorized ? 'highlight-uncategorized' : ''}"
                     onclick="App.showCategoryTransactions('${categoryId}', '${filterMonth || ''}')">
                    <div class="category-info">
                        <span class="category-name">${getCategoryName(categoryId)}</span>
                        <span class="category-count">${data.count} transactions</span>
                    </div>
                    <div class="category-bar-container">
                        <div class="category-bar ${isUncategorized ? 'uncategorized-bar' : ''}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-amount">
                        <span class="amount">${ExpenseProcessor.formatCurrency(data.total)}</span>
                        <span class="percentage">${percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    showCategoryTransactions: (categoryId, filterMonth = '') => {
        // Filter the transactions table to show this category
        document.getElementById('category-filter').value = categoryId;
        if (filterMonth) {
            document.getElementById('month-filter').value = filterMonth;
        }
        App.filterExpenses();

        // Scroll to transactions table
        document.querySelector('.expense-table').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderMonthlyChart: () => {
        const container = document.getElementById('monthly-chart');
        const months = Object.keys(App.aggregation).sort();

        if (months.length === 0) {
            container.innerHTML = '<p class="no-data">No monthly data available</p>';
            return;
        }

        // Calculate monthly totals
        const monthlyTotals = months.map(month => {
            return Object.values(App.aggregation[month])
                .reduce((sum, cat) => sum + cat.total, 0);
        });

        const maxTotal = Math.max(...monthlyTotals);

        // Create nice Y-axis scale
        const yAxisSteps = 5;
        const stepValue = Math.ceil(maxTotal / yAxisSteps / 100) * 100; // Round to nearest 100
        const yAxisMax = stepValue * yAxisSteps;
        const yAxisLabels = [];
        for (let i = yAxisSteps; i >= 0; i--) {
            yAxisLabels.push(stepValue * i);
        }

        const svgWidth = container.clientWidth;
        const svgHeight = 280;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = svgWidth - padding.left - padding.right;
        const chartHeight = svgHeight - padding.top - padding.bottom;

        const points = monthlyTotals.map((total, i) => {
            const x = padding.left + (i / (months.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - (total / yAxisMax) * chartHeight;
            return `${x},${y}`;
        }).join(' ');

        const monthLabels = months.map((month, i) => {
            const x = padding.left + (i / (months.length - 1)) * chartWidth;
            return `<text x="${x}" y="${svgHeight - 10}" text-anchor="middle" fill="var(--text-secondary)" font-size="12">${ExpenseProcessor.formatMonth(month).split(' ')[0].substring(0, 3)}</text>`;
        }).join('');

        const yAxis = yAxisLabels.map(label => {
            const y = padding.top + chartHeight - (label / yAxisMax) * chartHeight;
            return `<g>
                        <text x="40" y="${y + 5}" text-anchor="end" fill="var(--text-secondary)" font-size="12">${label >= 1000 ? '$' + (label/1000).toFixed(0) + 'k' : '$' + label}</text>
                        <line x1="${padding.left}" y1="${y}" x2="${svgWidth - padding.right}" y2="${y}" stroke="var(--border-primary)" stroke-dasharray="2"></line>
                    </g>`;
        }).join('');

        container.innerHTML = `
            <svg width="100%" height="${svgHeight}" viewbox="0 0 ${svgWidth} ${svgHeight}">
                ${yAxis}
                <polyline fill="none" stroke="var(--accent-primary)" stroke-width="2" points="${points}"></polyline>
                ${monthlyTotals.map((total, i) => {
                    const x = padding.left + (i / (months.length - 1)) * chartWidth;
                    const y = padding.top + chartHeight - (total / yAxisMax) * chartHeight;
                    return `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent-primary)" stroke="var(--bg-secondary)" stroke-width="2"></circle>`;
                }).join('')}
                ${monthLabels}
            </svg>
        `;
    },

    renderSuspectedPersonalCharges: () => {
        const container = document.getElementById('personal-charges-breakdown');
        const personalExpenses = App.categorizedExpenses.filter(e => e.category === 'suspected_personal');

        if (personalExpenses.length === 0) {
            container.innerHTML = '<p class="no-data">No suspected personal charges found.</p>';
            return;
        }

        const byMonth = {};
        personalExpenses.forEach(expense => {
            const month = expense.month;
            if (!byMonth[month]) {
                byMonth[month] = { total: 0, count: 0, expenses: [] };
            }
            byMonth[month].total += expense.amount;
            byMonth[month].count++;
            byMonth[month].expenses.push(expense);
        });

        const sortedMonths = Object.keys(byMonth).sort();

        container.innerHTML = sortedMonths.map(month => {
            const monthData = byMonth[month];
            return `
                <div class="category-row">
                    <div class="category-info">
                        <span class="category-name">${ExpenseProcessor.formatMonth(month)}</span>
                        <span class="category-count">${monthData.count} transactions</span>
                    </div>
                    <div class="category-amount">
                        <span class="amount">${ExpenseProcessor.formatCurrency(monthData.total)}</span>
                    </div>
                </div>
                <div class="personal-expense-details">
                    ${monthData.expenses.map(exp => `
                        <div class="personal-expense-row">
                            <span class="personal-expense-desc">${exp.description}</span>
                            <span class="personal-expense-amount">${ExpenseProcessor.formatCurrency(exp.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    },
		
    renderExpenseTable: (filteredExpenses = null) => {
        const container = document.getElementById('expense-table-body');
        const expenses = filteredExpenses || App.categorizedExpenses;

        // Sort by date descending
        const sorted = [...expenses].sort((a, b) => b.date - a.date);

        container.innerHTML = sorted.map(expense => `
            <tr data-id="${expense.id}">
                <td>${ExpenseProcessor.formatDate(expense.date)}</td>
                <td class="description-cell" title="${expense.description}">${expense.description}</td>
                <td class="amount-cell">${ExpenseProcessor.formatCurrency(expense.amount)}</td>
                <td>
                    <select class="category-select" onchange="App.updateCategory('${expense.id}', this.value)">
                        ${getAllCategories().map(cat =>
                            `<option value="${cat.id}" ${cat.id === expense.category ? 'selected' : ''}>${cat.name}</option>`
                        ).join('')}
                    </select>
                </td>
            </tr>
        `).join('');

        // Update count
        document.getElementById('expense-count').textContent = `${expenses.length} transactions`;
    },

    populateFilters: () => {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        const categories = getAllCategories();
        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
        `;

        // Month filter (for transactions table)
        const monthFilter = document.getElementById('month-filter');
        const months = App.summary.uniqueMonths;
        monthFilter.innerHTML = `
            <option value="">All Months</option>
            ${months.map(m => `<option value="${m}">${ExpenseProcessor.formatMonth(m)}</option>`).join('')}
        `;

        // File filter
        const fileFilter = document.getElementById('file-filter');
        const filenames = App.summary.uniqueFilenames;
        fileFilter.innerHTML = `
            <option value="">All Files</option>
            ${filenames.map(f => `<option value="${f}">${f}</option>`).join('')}
        `;

        // Breakdown month filter (for category breakdown)
        const breakdownMonthFilter = document.getElementById('breakdown-month-filter');
        if (breakdownMonthFilter) {
            breakdownMonthFilter.innerHTML = `
                <option value="">All Months</option>
                ${months.map(m => `<option value="${m}">${ExpenseProcessor.formatMonth(m)}</option>`).join('')}
            `;
        }
    },

    filterExpenses: () => {
        const categoryFilter = document.getElementById('category-filter').value;
        const monthFilter = document.getElementById('month-filter').value;
        const fileFilter = document.getElementById('file-filter').value;

        let filtered = App.categorizedExpenses;

        if (categoryFilter) {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }

        if (monthFilter) {
            filtered = filtered.filter(e => e.month === monthFilter);
        }

        if (fileFilter) {
            filtered = filtered.filter(e => e.filename === fileFilter);
        }

        App.renderExpenseTable(filtered);
    },

    filterCategoryBreakdown: () => {
        const selectedMonth = document.getElementById('breakdown-month-filter').value;
        App.renderCategoryBreakdown(selectedMonth);
    },

    showMonthDetail: (month) => {
        const section = document.getElementById('month-detail-section');
        const title = document.getElementById('month-detail-title');
        const content = document.getElementById('month-detail-content');

        title.textContent = ExpenseProcessor.formatMonth(month) + ' Breakdown';
        section.style.display = 'block';

        // Get expenses for this month
        const monthExpenses = App.categorizedExpenses.filter(e => e.month === month);
        const monthSummary = ExpenseProcessor.getSummary(monthExpenses);

        // Build category breakdown for this month
        const sorted = Object.entries(monthSummary.byCategory)
            .sort((a, b) => b[1].total - a[1].total);

        content.innerHTML = `
            <div class="month-summary">
                <div class="month-stat">
                    <span class="stat-value">${ExpenseProcessor.formatCurrency(monthSummary.totalExpenses)}</span>
                    <span class="stat-label">Total for ${ExpenseProcessor.formatMonth(month)}</span>
                </div>
                <div class="month-stat">
                    <span class="stat-value">${monthSummary.expenseCount}</span>
                    <span class="stat-label">Transactions</span>
                </div>
            </div>
            <div class="month-categories">
                ${sorted.map(([categoryId, data]) => {
                    const percentage = monthSummary.totalExpenses > 0 ? (data.total / monthSummary.totalExpenses) * 100 : 0;
                    const categoryExpenses = monthExpenses.filter(e => e.category === categoryId);
                    return `
                        <div class="month-category-card ${categoryId === 'uncategorized' ? 'uncategorized' : ''}">
                            <div class="category-header">
                                <span class="category-name">${getCategoryName(categoryId)}</span>
                                <span class="category-total">${ExpenseProcessor.formatCurrency(data.total)}</span>
                            </div>
                            <div class="category-bar-mini">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="category-transactions">
                                ${categoryExpenses.slice(0, 5).map(exp => `
                                    <div class="mini-transaction">
                                        <span class="trans-desc">${exp.description}</span>
                                        <span class="trans-amount">${ExpenseProcessor.formatCurrency(exp.amount)}</span>
                                    </div>
                                `).join('')}
                                ${categoryExpenses.length > 5 ? `<div class="more-transactions">+${categoryExpenses.length - 5} more</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Scroll to the section
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    closeMonthDetail: () => {
        document.getElementById('month-detail-section').style.display = 'none';
    },

    updateCategory: (expenseId, newCategory) => {
        const expense = App.categorizedExpenses.find(e => e.id.toString() === expenseId);
        if (expense) {
            expense.category = newCategory;

            // Recalculate aggregation and summary
            App.aggregation = ExpenseProcessor.aggregateByMonthAndCategory(App.categorizedExpenses);
            App.summary = ExpenseProcessor.getSummary(App.categorizedExpenses);

            // Update UI
            App.renderSummary();
            App.renderCategoryBreakdown();
            App.renderMonthlyChart();
        }
    },

    exportTo: (format) => {
        if (App.categorizedExpenses.length === 0) {
            App.showNotification('No expenses to export', 'error');
            return;
        }

        try {
            let filename;
            let content;
            let mimeType;

            switch (format) {
                case 'excel':
                    filename = Export.generateExcelReport(App.categorizedExpenses, App.aggregation, App.summary);
                    App.showNotification(`Report exported: ${filename}`, 'success');
                    return;
                case 'csv':
                    content = Export.generateCSV(App.categorizedExpenses);
                    filename = 'expenses.csv';
                    mimeType = 'text/csv';
                    break;
                case 'qbo':
                    content = Export.generateQBO(App.categorizedExpenses);
                    filename = 'expenses.qbo';
                    mimeType = 'application/vnd.intu.qbo';
                    break;
                default:
                    return;
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            App.showNotification(`Report exported: ${filename}`, 'success');

        } catch (error) {
            App.showNotification(`Error exporting report: ${error.message}`, 'error');
        }
    },

    loadSampleData: () => {
        App.showAIAgent();
        try {
            // Generate sample data
            const sampleCSV = App.generateSampleCSV();
            console.log('Sample CSV:', sampleCSV);
            const expenses = ExpenseProcessor.parseCSV(sampleCSV, 'sample_data.csv');
            console.log('Parsed expenses:', expenses);

            if (expenses.length === 0) {
                App.showNotification('No expenses were parsed from sample data', 'error');
                App.hideAIAgent();
                return;
            }

            App.showNotification(`Loaded ${expenses.length} sample transactions`, 'success');
            setTimeout(() => {
                App.processExpenses(expenses);
                App.hideAIAgent();
            }, 2000);
        } catch (error) {
            console.error('Error loading sample data:', error);
            App.showNotification('Error loading sample data: ' + error.message, 'error');
            App.hideAIAgent();
        }
    },

    generateSampleCSV: () => {
        const transactions = [
            { date: '01/05/2024', desc: 'STARBUCKS STORE 12345', amount: -6.75 },
            { date: '01/07/2024', desc: 'AMAZON WEB SERVICES', amount: -149.99 },
            { date: '01/10/2024', desc: 'OFFICE DEPOT #1234', amount: -87.50 },
            { date: '01/12/2024', desc: 'UBER TRIP', amount: -24.50 },
            { date: '01/15/2024', desc: 'ZOOM VIDEO COMMUNICATIONS', amount: -14.99 },
            { date: '01/18/2024', desc: 'DELTA AIRLINES', amount: -425.00 },
            { date: '01/20/2024', desc: 'MARRIOTT HOTEL SF', amount: -289.00 },
            { date: '01/22/2024', desc: 'SHELL OIL 12345', amount: -52.30 },
            { date: '01/25/2024', desc: 'GOOGLE ADS', amount: -500.00 },
            { date: '01/28/2024', desc: 'CHIPOTLE MEXICAN GRILL', amount: -15.45 },
            { date: '02/01/2024', desc: 'WEWORK MEMBERSHIP', amount: -450.00 },
            { date: '02/03/2024', desc: 'STRIPE PROCESSING FEE', amount: -45.00 },
            { date: '02/05/2024', desc: 'ADOBE CREATIVE CLOUD', amount: -54.99 },
            { date: '02/08/2024', desc: 'FEDEX SHIPPING', amount: -28.50 },
            { date: '02/10/2024', desc: 'DOORDASH ORDER', amount: -32.00 },
            { date: '02/12/2024', desc: 'VERIZON WIRELESS', amount: -120.00 },
            { date: '02/15/2024', desc: 'QUICKBOOKS SUBSCRIPTION', amount: -25.00 },
            { date: '02/18/2024', desc: 'STAPLES OFFICE SUPPLIES', amount: -145.00 },
            { date: '02/20/2024', desc: 'UNITED AIRLINES', amount: -380.00 },
            { date: '02/22/2024', desc: 'HILTON HOTELS', amount: -199.00 },
            { date: '02/25/2024', desc: 'PARKING LOT FEE', amount: -15.00 },
            { date: '02/28/2024', desc: 'LINKEDIN LEARNING', amount: -29.99 },
            { date: '03/02/2024', desc: 'SLACK TECHNOLOGIES', amount: -12.50 },
            { date: '03/05/2024', desc: 'CHEVRON GAS STATION', amount: -48.75 },
            { date: '03/08/2024', desc: 'COMCAST BUSINESS', amount: -150.00 },
            { date: '03/10/2024', desc: 'FACEBOOK ADS', amount: -350.00 },
            { date: '03/12/2024', desc: 'PANERA BREAD', amount: -18.50 },
            { date: '03/15/2024', desc: 'UPWORK FREELANCER', amount: -250.00 },
            { date: '03/18/2024', desc: 'HERTZ CAR RENTAL', amount: -185.00 },
            { date: '03/20/2024', desc: 'BUSINESS LICENSE RENEWAL', amount: -150.00 }
        ];

        let csv = 'Date,Description,Amount\n';
        transactions.forEach(t => {
            csv += `${t.date},"${t.desc}",${t.amount}\n`;
        });

        return csv;
    },

    showAIAgent: () => {
        document.getElementById('ai-overlay').classList.add('visible');
    },

    hideAIAgent: () => {
        document.getElementById('ai-overlay').classList.remove('visible');
    },

    showNotification: (message, type = 'info') => {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
