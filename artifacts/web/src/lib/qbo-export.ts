/**
 * QBO (QuickBooks OFX) export for the artifact UI layer.
 *
 * All expenses are emitted as TRNTYPE=DEBIT with negative TRNAMT
 * so QuickBooks correctly imports them as outflows (money going out).
 */

import { getCategoryName } from './categories';

interface ExportableExpense {
  date: string | Date;
  description: string;
  amount: number;
  category: string;
  month?: string;
}

/** Format a date as an OFX datetime string (YYYYMMDDHHMMSS). */
function toOFXDate(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${mo}${d}120000`;
}

/** Convert a date value (string or Date) to a Date object safely. */
function toDate(val: string | Date): Date {
  if (val instanceof Date) return val;
  const [y, m, d] = val.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Strip characters that break OFX parsing, truncate to 32 chars. */
function sanitize(str: string): string {
  return (str || '').replace(/[&<>]/g, ' ').substring(0, 32);
}

/** Build a single OFX STMTTRN block for an expense. */
function buildTransaction(expense: ExportableExpense, index: number): string {
  const trnType = 'DEBIT';
  const dtPosted = toOFXDate(toDate(expense.date));
  const fitId = `${dtPosted}${String(index + 1).padStart(4, '0')}`;
  const amount = (-Math.abs(expense.amount)).toFixed(2);
  const name = sanitize(expense.description);
  const memo = sanitize(getCategoryName(expense.category));

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
}

/** Generate a full QBO (OFX) file string from expenses. */
export function generateQBOFile(expenses: ExportableExpense[]): { content: string; filename: string } {
  const sorted = [...expenses].sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());

  const dtStart = sorted.length > 0 ? toOFXDate(toDate(sorted[0].date)) : toOFXDate(new Date());
  const dtEnd = sorted.length > 0 ? toOFXDate(toDate(sorted[sorted.length - 1].date)) : toOFXDate(new Date());
  const dtNow = toOFXDate(new Date());

  const transactions = sorted.map((exp, i) => buildTransaction(exp, i)).join('\n');

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

  const filename = `transactions_${new Date().toISOString().split('T')[0]}.qbo`;
  return { content: ofx, filename };
}

/** Trigger a browser download of the QBO file. */
export function downloadQBO(expenses: ExportableExpense[]): string {
  const { content, filename } = generateQBOFile(expenses);

  const blob = new Blob([content], { type: 'application/x-ofx' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}
