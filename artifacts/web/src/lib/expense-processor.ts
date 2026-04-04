import { categorizeExpense } from "./categories";

export interface ParsedExpense {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  originalCategory: string;
  category: string;
  filename: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      if (current.trim()) rows.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) rows.push(current);
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; } // fixed: was `text` (undefined), now `line`
        else { inQuotes = false; }
      } else { current += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
  }
  result.push(current.trim());
  return result;
}

/** Parse a date string robustly without timezone shift */
function parseDateToISOString(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // MM/DD/YYYY or M/D/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // MM-DD-YYYY
  const mdyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyDash) {
    const [, m, d, y] = mdyDash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // YYYY/MM/DD
  const ymd = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m}-${d}`;
  }
  
  // Try Date.UTC fallback (parse parts manually)
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    // Use UTC to avoid off-by-one due to timezone
    const ts = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const dd = new Date(ts);
    return `${dd.getUTCFullYear()}-${String(dd.getUTCMonth() + 1).padStart(2, '0')}-${String(dd.getUTCDate()).padStart(2, '0')}`;
  }

  return null;
}

/** Max reasonable single transaction amount — protects against balance column mis-detection */
const MAX_AMOUNT = 999_999.99;

export function parseCSV(csvText: string, filename: string): ParsedExpense[] {
  const rows = splitCSVRows(csvText);
  if (rows.length < 2) throw new Error("CSV must have headers and data");
  
  const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());
  
  let dateIdx = -1, descIdx = -1, amtIdx = -1, typeIdx = -1, origCatIdx = -1;
  
  headers.forEach((h, i) => {
    if (h.includes('date') || h === 'posted' || h === 'transaction date') dateIdx = i;
    if (h.includes('description') || h === 'name' || h.includes('payee') || h === 'memo') descIdx = i;
    if (h === 'amount' || h === 'debit' || h === 'withdrawal') amtIdx = i;
    if (h === 'type' || h === 'transaction type') typeIdx = i;
    if (h === 'category') origCatIdx = i;
  });

  if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) {
    throw new Error(
      `Could not detect required columns (Date, Description, Amount). ` +
      `Found headers: ${headers.join(', ')}`
    );
  }

  const expenses: ParsedExpense[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const cols = parseCSVLine(rows[i]);
    if (cols.length < 3) continue;

    try {
      const rawDate = cols[dateIdx];
      const parsedDateStr = parseDateToISOString(rawDate);
      if (!parsedDateStr) continue;

      const rawAmt = (cols[amtIdx] || '').replace(/[$, ]+/g, '').trim();
      let amount = parseFloat(rawAmt);
      if (isNaN(amount) || amount === 0) continue;

      // Skip credits/income (negative in debit-style exports = incoming money)
      if (typeIdx !== -1 && cols[typeIdx].toLowerCase().includes('credit')) continue;

      amount = Math.abs(amount);

      // Skip unreasonably large amounts — these are likely balance or account number columns
      if (amount > MAX_AMOUNT) {
        console.warn(`Skipping row ${i}: amount ${amount} exceeds max $${MAX_AMOUNT}`);
        continue;
      }

      const description = (cols[descIdx] || '').trim();
      if (!description) continue;

      const originalCategory = origCatIdx !== -1 ? (cols[origCatIdx] || '') : '';
      
      expenses.push({
        date: parsedDateStr,
        description,
        amount,
        originalCategory,
        category: categorizeExpense(description),
        filename
      });
    } catch (e) {
      console.warn("Skipping row", i, e);
    }
  }
  
  if (expenses.length === 0) {
    throw new Error("No valid expenses found in the file. Check the date, description, and amount columns.");
  }

  return expenses;
}
