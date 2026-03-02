// Export Module

const Export = {
    // Generate and download Excel report
    generateExcelReport: (expenses, aggregation, summary) => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary by Category
        const summaryData = Export.createSummarySheet(summary);
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        Export.styleSheet(summaryWs, summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

        // Sheet 2: Monthly Breakdown
        const monthlyData = Export.createMonthlySheet(aggregation, summary);
        const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
        Export.styleSheet(monthlyWs, monthlyData);
        XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Breakdown");

        // Sheet 3: All Transactions
        const transactionsData = Export.createTransactionsSheet(expenses);
        const transactionsWs = XLSX.utils.aoa_to_sheet(transactionsData);
        Export.styleSheet(transactionsWs, transactionsData);
        XLSX.utils.book_append_sheet(wb, transactionsWs, "All Transactions");

        // Sheet 4: Category Details (one sheet per category with expenses)
        const categoriesWithExpenses = Object.entries(summary.byCategory)
            .filter(([_, data]) => data.count > 0)
            .sort((a, b) => b[1].total - a[1].total);

        // Create a combined category detail sheet
        const categoryDetailData = Export.createCategoryDetailSheet(expenses);
        const categoryDetailWs = XLSX.utils.aoa_to_sheet(categoryDetailData);
        Export.styleSheet(categoryDetailWs, categoryDetailData);
        XLSX.utils.book_append_sheet(wb, categoryDetailWs, "By Category");

        // Generate filename with date range
        const months = summary.uniqueMonths;
        const dateRange = months.length > 0
            ? `${months[0]}_to_${months[months.length - 1]}`
            : new Date().toISOString().split('T')[0];

        const filename = `expense_report_${dateRange}.xlsx`;

        // Download
        XLSX.writeFile(wb, filename);

        return filename;
    },

    // Create summary sheet data
    createSummarySheet: (summary) => {
        const data = [];

        // Header
        data.push(["EXPENSE SUMMARY REPORT"]);
        data.push(["Generated:", new Date().toLocaleDateString()]);
        data.push([]);

        // Overview
        data.push(["OVERVIEW"]);
        data.push(["Total Expenses:", ExpenseProcessor.formatCurrency(summary.totalExpenses)]);
        data.push(["Number of Transactions:", summary.expenseCount]);
        data.push(["Period:", summary.uniqueMonths.length > 0
            ? `${ExpenseProcessor.formatMonth(summary.uniqueMonths[0])} - ${ExpenseProcessor.formatMonth(summary.uniqueMonths[summary.uniqueMonths.length - 1])}`
            : "N/A"]);
        data.push([]);

        // Category breakdown
        data.push(["EXPENSES BY IRS CATEGORY"]);
        data.push(["Category", "Amount", "# Transactions", "% of Total"]);

        const sortedCategories = Object.entries(summary.byCategory)
            .sort((a, b) => b[1].total - a[1].total);

        sortedCategories.forEach(([categoryId, catData]) => {
            const percentage = summary.totalExpenses > 0
                ? ((catData.total / summary.totalExpenses) * 100).toFixed(1) + '%'
                : '0%';
            data.push([
                getCategoryName(categoryId),
                ExpenseProcessor.formatCurrency(catData.total),
                catData.count,
                percentage
            ]);
        });

        data.push([]);
        data.push(["TOTAL", ExpenseProcessor.formatCurrency(summary.totalExpenses), summary.expenseCount, "100%"]);

        return data;
    },

    // Create monthly breakdown sheet
    createMonthlySheet: (aggregation, summary) => {
        const data = [];
        const months = Object.keys(aggregation).sort();
        const categories = Object.keys(IRS_EXPENSE_CATEGORIES);

        // Header
        data.push(["MONTHLY EXPENSE BREAKDOWN"]);
        data.push([]);

        // Column headers
        const headerRow = ["Category", ...months.map(m => ExpenseProcessor.formatMonth(m)), "Total"];
        data.push(headerRow);

        // Data rows
        categories.forEach(categoryId => {
            if (!summary.byCategory[categoryId] || summary.byCategory[categoryId].count === 0) return;

            const row = [getCategoryName(categoryId)];
            let categoryTotal = 0;

            months.forEach(month => {
                const amount = aggregation[month]?.[categoryId]?.total || 0;
                row.push(amount > 0 ? ExpenseProcessor.formatCurrency(amount) : '-');
                categoryTotal += amount;
            });

            row.push(ExpenseProcessor.formatCurrency(categoryTotal));
            data.push(row);
        });

        // Monthly totals row
        data.push([]);
        const totalRow = ["MONTHLY TOTAL"];
        months.forEach(month => {
            const monthTotal = Object.values(aggregation[month] || {})
                .reduce((sum, cat) => sum + cat.total, 0);
            totalRow.push(ExpenseProcessor.formatCurrency(monthTotal));
        });
        totalRow.push(ExpenseProcessor.formatCurrency(summary.totalExpenses));
        data.push(totalRow);

        return data;
    },

    // Create transactions sheet
    createTransactionsSheet: (expenses) => {
        const data = [];

        // Header
        data.push(["ALL TRANSACTIONS"]);
        data.push([]);
        data.push(["Date", "Description", "Amount", "IRS Category", "Month"]);

        // Sort by date
        const sorted = [...expenses].sort((a, b) => a.date - b.date);

        sorted.forEach(expense => {
            data.push([
                ExpenseProcessor.formatDate(expense.date),
                expense.description,
                ExpenseProcessor.formatCurrency(expense.amount),
                getCategoryName(expense.category),
                ExpenseProcessor.formatMonth(expense.month)
            ]);
        });

        return data;
    },

    // Create category detail sheet
    createCategoryDetailSheet: (expenses) => {
        const data = [];

        // Group expenses by category
        const byCategory = {};
        expenses.forEach(expense => {
            if (!byCategory[expense.category]) {
                byCategory[expense.category] = [];
            }
            byCategory[expense.category].push(expense);
        });

        // Sort categories by total amount
        const sortedCategories = Object.entries(byCategory)
            .map(([cat, exps]) => ({
                category: cat,
                expenses: exps,
                total: exps.reduce((sum, e) => sum + e.amount, 0)
            }))
            .sort((a, b) => b.total - a.total);

        sortedCategories.forEach(({ category, expenses: catExpenses, total }) => {
            data.push([getCategoryName(category).toUpperCase()]);
            data.push(["Total:", ExpenseProcessor.formatCurrency(total), "Transactions:", catExpenses.length]);
            data.push(["Date", "Description", "Amount"]);

            catExpenses
                .sort((a, b) => a.date - b.date)
                .forEach(expense => {
                    data.push([
                        ExpenseProcessor.formatDate(expense.date),
                        expense.description,
                        ExpenseProcessor.formatCurrency(expense.amount)
                    ]);
                });

            data.push([]);
            data.push([]);
        });

        return data;
    },

    // Apply basic styling (column widths)
    styleSheet: (ws, data) => {
        // Calculate column widths
        const colWidths = [];
        data.forEach(row => {
            row.forEach((cell, i) => {
                const cellLength = cell ? cell.toString().length : 0;
                colWidths[i] = Math.max(colWidths[i] || 10, Math.min(cellLength + 2, 50));
            });
        });

        ws['!cols'] = colWidths.map(w => ({ wch: w }));
    },

    generateCSV: (expenses) => {
        const header = ["Date", "Description", "Amount", "Category"];
        const rows = expenses.map(e => [
            e.date.toISOString().split('T')[0],
            `"${e.description.replace(/"/g, '""')}"`,
            e.amount,
            getCategoryName(e.category)
        ].join(','));
        return [header.join(','), ...rows].join('\n');
    },

    generateQBO: (expenses) => {
        const bankId = "12345"; // Should be a valid bank ID
        const acctId = "123456789"; // User's account number
        const acctType = "CHECKING"; // Or "CREDITCARD"
        const currency = "USD";
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        let transactions = '';
        expenses.forEach(e => {
            const expenseDate = `${e.date.getFullYear()}${String(e.date.getMonth() + 1).padStart(2, '0')}${String(e.date.getDate()).padStart(2, '0')}`;
            transactions += `
<STMTTRN>
    <TRNTYPE>CREDIT</TRNTYPE>
    <DTPOSTED>${expenseDate}</DTPOSTED>
    <TRNAMT>${-e.amount}</TRNAMT>
    <FITID>${e.id}</FITID>
    <NAME>${e.description.substring(0, 32)}</NAME>
    <MEMO>${getCategoryName(e.category)}</MEMO>
</STMTTRN>
`;
        });

        return `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
    <SIGNONMSGSRSV1>
        <SONRS>
            <STATUS>
                <CODE>0</CODE>
                <SEVERITY>INFO</SEVERITY>
            </STATUS>
            <DTSERVER>${dateStr}</DTSERVER>
            <LANGUAGE>ENG</LANGUAGE>
        </SONRS>
    </SIGNONMSGSRSV1>
    <BANKMSGSRSV1>
        <STMTTRNRS>
            <TRNUID>1</TRNUID>
            <STATUS>
                <CODE>0</CODE>
                <SEVERITY>INFO</SEVERITY>
            </STATUS>
            <STMTRS>
                <CURDEF>${currency}</CURDEF>
                <BANKACCTFROM>
                    <BANKID>${bankId}</BANKID>
                    <ACCTID>${acctId}</ACCTID>
                    <ACCTTYPE>${acctType}</ACCTTYPE>
                </BANKACCTFROM>
                <BANKTRANLIST>
                    <DTSTART>${dateStr}</DTSTART>
                    <DTEND>${dateStr}</DTEND>
                    ${transactions}
                </BANKTRANLIST>
            </STMTRS>
        </STMTTRNRS>
    </BANKMSGSRSV1>
</OFX>
        `.trim();
    }
};
