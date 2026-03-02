// QBO Export Module (OFX/QuickBooks format)

const QBOExport = {
    // Generate and download QBO file
    generateQBO: (expenses) => {
        const sorted = [...expenses].sort((a, b) => a.date - b.date);

        const dtStart = sorted.length > 0 ? QBOExport.toOFXDate(sorted[0].date) : QBOExport.toOFXDate(new Date());
        const dtEnd   = sorted.length > 0 ? QBOExport.toOFXDate(sorted[sorted.length - 1].date) : QBOExport.toOFXDate(new Date());
        const dtNow   = QBOExport.toOFXDate(new Date());

        const transactions = sorted.map((exp, i) => QBOExport.buildTransaction(exp, i)).join('\n');

        const ofx = [
            'OFXHEADER:100',
            'DATA:OFXSGML',
            'VERSION:102',
            'SECURITY:NONE',
            'ENCODING:USASCII',
            'CHARSET:1252',
            'COMPRESSION:NONE',
            'OLDFILEUID:NONE',
            'NEWFILEUID:NONE',
            '',
            '<OFX>',
            '<SIGNONMSGSRSV1>',
            '<SONRS>',
            '<STATUS>',
            '<CODE>0',
            '<SEVERITY>INFO',
            '</STATUS>',
            `<DTSERVER>${dtNow}`,
            '<LANGUAGE>ENG',
            '</SONRS>',
            '</SIGNONMSGSRSV1>',
            '<BANKMSGSRSV1>',
            '<STMTTRNRS>',
            '<TRNUID>1001',
            '<STATUS>',
            '<CODE>0',
            '<SEVERITY>INFO',
            '</STATUS>',
            '<STMTRS>',
            '<CURDEF>USD',
            '<BANKACCTFROM>',
            '<BANKID>000000000',
            '<ACCTID>000000000000',
            '<ACCTTYPE>CHECKING',
            '</BANKACCTFROM>',
            '<BANKTRANLIST>',
            `<DTSTART>${dtStart}`,
            `<DTEND>${dtEnd}`,
            transactions,
            '</BANKTRANLIST>',
            '<LEDGERBAL>',
            '<BALAMT>0.00',
            `<DTASOF>${dtEnd}`,
            '</LEDGERBAL>',
            '</STMTRS>',
            '</STMTTRNRS>',
            '</BANKMSGSRSV1>',
            '</OFX>'
        ].join('\n');

        const months = [...new Set(sorted.map(e => e.month))].sort();
        const dateRange = months.length > 0
            ? `${months[0]}_to_${months[months.length - 1]}`
            : new Date().toISOString().split('T')[0];
        const filename = `transactions_${dateRange}.qbo`;

        QBOExport.download(ofx, filename);
        return filename;
    },

    buildTransaction: (expense, index) => {
        const trnType = expense.amount < 0 ? 'DEBIT' : 'CREDIT';
        const dtPosted = QBOExport.toOFXDate(expense.date);
        const fitId = `${dtPosted}${String(index + 1).padStart(4, '0')}`;
        const amount = expense.amount.toFixed(2);
        const name = QBOExport.sanitize(expense.description);
        const memo = QBOExport.sanitize(getCategoryName(expense.category));

        return [
            '<STMTTRN>',
            `<TRNTYPE>${trnType}`,
            `<DTPOSTED>${dtPosted}`,
            `<TRNAMT>${amount}`,
            `<FITID>${fitId}`,
            `<NAME>${name}`,
            `<MEMO>${memo}`,
            '</STMTTRN>'
        ].join('\n');
    },

    // Format date as OFX datetime string (YYYYMMDDHHMMSS)
    toOFXDate: (date) => {
        const y  = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        const d  = String(date.getDate()).padStart(2, '0');
        return `${y}${mo}${d}120000`;
    },

    // Strip characters that break OFX parsing
    sanitize: (str) => {
        return (str || '').replace(/[&<>]/g, ' ').substring(0, 32);
    },

    download: (content, filename) => {
        const blob = new Blob([content], { type: 'application/x-ofx' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
