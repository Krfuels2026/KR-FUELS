
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { formatCurrency, formatDateToDDMMYYYY } from '../utils';
import { Filter, TrendingUp, History, Calendar, FileSpreadsheet, FileText, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface CashReportProps {
  accounts: Account[];
  vouchers: Voucher[];
  onDeleteVoucher: (id: string) => void;
}

type FilterType = 'daily' | 'monthly' | 'ytd' | 'financial_year' | 'custom';

const CashReport: React.FC<CashReportProps> = ({ accounts, vouchers, onDeleteVoucher }) => {
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [customRange, setCustomRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const dailyInputRef = useRef<HTMLInputElement>(null);
  const customFromRef = useRef<HTMLInputElement>(null);
  const customToRef = useRef<HTMLInputElement>(null);

  const getFilterLabel = () => {
    switch (filterType) {
      case 'daily': return `Date: ${formatDateToDDMMYYYY(range.from)}`;
      case 'monthly': {
        const [y, m] = selectedMonth.split('-').map(Number);
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return `Month: ${months[m-1]} ${y}`;
      }
      case 'ytd': return `Year to Date: ${new Date().getFullYear()}`;
      case 'financial_year': return `Financial Year: FY ${selectedYear}-${selectedYear+1}`;
      case 'custom': return `Period: ${formatDateToDDMMYYYY(range.from)} to ${formatDateToDDMMYYYY(range.to)}`;
      default: return '';
    }
  };

  const handleGeneratePDF = () => {
    const filterLabel = getFilterLabel();
    const txRows = reportData.periodVouchers.map(v => {
      const acct = accountNameMap[v.accountId] || '—';
      const parentName = getParentName(v.accountId);
      const cr = v.credit > 0 ? `<span style="color:#059669;font-weight:900;">${formatCurrency(v.credit)}</span>` : '<span style="color:#94a3b8;">—</span>';
      const dr = v.debit > 0 ? `<span style="color:#e11d48;font-weight:900;">${formatCurrency(v.debit)}</span>` : '<span style="color:#94a3b8;">—</span>';
      return `<tr>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:11px;white-space:nowrap;">${formatDateToDDMMYYYY(v.date)}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;font-size:11px;color:#64748b;text-transform:uppercase;">${parentName}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;font-size:11px;color:#16a34a;text-transform:uppercase;">${acct}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:900;font-size:12px;color:#0f172a;text-transform:uppercase;">${v.description}</div>
        </td>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:monospace;font-size:13px;">${cr}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:monospace;font-size:13px;">${dr}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Cash Statement — ${filterLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; }
    body { background:#fff; color:#0f172a; padding:32px 40px; font-size:13px; }
    @media print { body { padding:20px 28px; } }
    .header { border-bottom:3px solid #16a34a; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end; }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-logo { width:44px; height:44px; background:#16a34a; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#f0fdf4; font-weight:900; font-size:13px; }
    .brand-name { font-size:18px; font-weight:900; text-transform:uppercase; color:#0f172a; letter-spacing:-0.5px; }
    .brand-sub { font-size:10px; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:2px; }
    .report-title { text-align:right; }
    .report-title h2 { font-size:16px; font-weight:900; text-transform:uppercase; color:#0f172a; letter-spacing:1px; }
    .report-title p { font-size:11px; color:#64748b; font-weight:600; margin-top:3px; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .summary-card { border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; border-left:5px solid #e2e8f0; }
    .summary-card.opening { border-left-color:#f59e0b; }
    .summary-card.inflow  { border-left-color:#10b981; }
    .summary-card.outflow { border-left-color:#f43f5e; }
    .summary-card.closing { border-left-color:#3b82f6; }
    .summary-card .lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:5px; }
    .summary-card.opening .lbl { color:#b45309; }
    .summary-card.inflow  .lbl { color:#059669; }
    .summary-card.outflow .lbl { color:#e11d48; }
    .summary-card.closing .lbl { color:#2563eb; }
    .summary-card .val { font-size:16px; font-weight:900; font-family:monospace; color:#0f172a; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#f8fafc; }
    thead th { padding:10px 14px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; border-bottom:2px solid #e2e8f0; }
    thead th:nth-child(5), thead th:nth-child(6) { text-align:right; }
    tfoot tr { background:#f8fafc; }
    tfoot td { padding:12px 14px; font-weight:900; font-family:monospace; font-size:15px; border-top:2px solid #e2e8f0; }
    tfoot td:nth-child(5) { text-align:right; color:#059669; }
    tfoot td:nth-child(6) { text-align:right; color:#e11d48; }
    .note { margin-top:20px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; font-size:12px; color:#92400e; }
    .footer { margin-top:28px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-logo">KR</div>
      <div>
        <div class="brand-name">KR Fuels</div>
        <div class="brand-sub">Management System</div>
      </div>
    </div>
    <div class="report-title">
      <h2>Statement of Cash</h2>
      <p>${filterLabel}</p>
      <p style="margin-top:2px;">Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card opening">
      <div class="lbl">Opening Balance</div>
      <div class="val">${formatCurrency(Math.abs(reportData.openingBalance))} <small style="font-size:10px;color:#94a3b8;">${reportData.openingBalance >= 0 ? 'DR' : 'CR'}</small></div>
    </div>
    <div class="summary-card inflow">
      <div class="lbl">Total Inflow</div>
      <div class="val" style="color:#059669;">+${formatCurrency(reportData.totalCr)}</div>
    </div>
    <div class="summary-card outflow">
      <div class="lbl">Total Outflow</div>
      <div class="val" style="color:#e11d48;">-${formatCurrency(reportData.totalDr)}</div>
    </div>
    <div class="summary-card closing">
      <div class="lbl">Closing Balance</div>
      <div class="val">${formatCurrency(Math.abs(reportData.closingBalance))} <small style="font-size:10px;color:#94a3b8;">${reportData.closingBalance >= 0 ? 'DR' : 'CR'}</small></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:100px;">Date</th>
        <th>Account</th>
        <th>Ledger</th>
        <th>Description</th>
        <th style="width:130px;">Credit (CR)</th>
        <th style="width:130px;">Debit (DR)</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#fffbeb;">
        <td style="padding:8px 14px;font-size:11px;color:#92400e;font-weight:700;">${formatDateToDDMMYYYY(range.from)}</td>
        <td style="padding:8px 14px;font-weight:900;font-size:13px;text-transform:uppercase;" colspan="5">Opening Balance B/F &nbsp; <span style="font-family:monospace;">${formatCurrency(Math.abs(reportData.openingBalance))} ${reportData.openingBalance >= 0 ? 'DR' : 'CR'}</span></td>
      </tr>
      ${txRows || `<tr><td colspan="6" style="padding:40px;text-align:center;color:#94a3b8;font-style:italic;">No transactions in this period.</td></tr>`}
    </tbody>
    ${reportData.periodVouchers.length > 0 ? `
    <tfoot>
      <tr>
        <td colspan="4" style="padding:12px 14px;text-align:right;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Total</td>
        <td style="text-align:right;color:#059669;">${formatCurrency(reportData.totalCr)}</td>
        <td style="text-align:right;color:#e11d48;">${formatCurrency(reportData.totalDr)}</td>
      </tr>
    </tfoot>` : ''}
  </table>

  <div class="footer">KR Fuels Management System &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; ${new Date().toLocaleString('en-IN')}</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 400);
    }
  };

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    const fyBase = new Date().getMonth() < 3 ? currentYear - 1 : currentYear;
    for (let i = 0; i < 5; i++) {
      years.push(fyBase - i);
    }
    return years;
  }, []);

  const getEffectiveRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    switch (filterType) {
      case 'daily':
        return { from: customRange.from, to: customRange.from };
      case 'monthly': {
        const [y, m] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
      }
      case 'ytd':
        return { from: `${currentYear}-01-01`, to: today.toISOString().split('T')[0] };
      case 'financial_year':
        return { from: `${selectedYear}-04-01`, to: `${selectedYear + 1}-03-31` };
      case 'custom':
        return customRange;
      default:
        return { from: customRange.from, to: customRange.from };
    }
  };

  const range = getEffectiveRange();

  const accountNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [accounts]);

  const getParentName = (accountId: string): string => {
    const acct = accounts.find(a => a.id === accountId);
    if (!acct || !acct.parentId) return '—';
    return accountNameMap[acct.parentId] || '—';
  };

  const handleOpenPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          (ref.current as any).showPicker();
        } else {
          ref.current.focus();
        }
      } catch (e) {
        ref.current.focus();
      }
    }
  };

  const reportData = useMemo(() => {
    const periodVouchers = vouchers.filter(v => v.date >= range.from && v.date <= range.to);
    
    // Include ALL accounts (root + child) in opening balance
    const openingBalancesSum = accounts.reduce((sum, a) => sum + (a.openingDebit - a.openingCredit), 0);
    const pastVouchers = vouchers.filter(v => v.date < range.from);
    // Past CR entries grew the CR balance (subtract), past DR entries reduced it (add)
    const pastVouchersSum = pastVouchers.reduce((sum, v) => sum + (v.debit - v.credit), 0);

    const openingBalance = openingBalancesSum + pastVouchersSum;
    const totalDr = periodVouchers.reduce((sum, v) => sum + v.debit, 0);
    const totalCr = periodVouchers.reduce((sum, v) => sum + v.credit, 0);
    // Opening + Inflow − Outflow
    // CR entries grow the CR balance (subtract from internal signed value)
    // DR entries reduce the CR balance (add to internal signed value)
    const closingBalance = openingBalance - totalCr + totalDr;

    return {
      openingBalance,
      periodVouchers: periodVouchers.sort((a, b) => a.date.localeCompare(b.date)),
      totalDr,
      totalCr,
      closingBalance
    };
  }, [range, vouchers, accounts]);

  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cash Report');
    const colCount = 6;

    ws.columns = [
      { width: 16 }, { width: 22 }, { width: 22 },
      { width: 32 }, { width: 20 }, { width: 20 },
    ];

    const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: '166534' } };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } },
    };

    // Title
    const titleRow = ws.addRow(['KR-FUELS ACCOUNTING']);
    ws.mergeCells(1, 1, 1, colCount);
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: '0F172A' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;

    // Subtitle
    const subtitleRow = ws.addRow(['CASH REPORT']);
    ws.mergeCells(2, 1, 2, colCount);
    subtitleRow.getCell(1).font = { bold: true, size: 13, color: { argb: '166534' } };
    subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleRow.height = 24;

    // Period
    const periodRow = ws.addRow([`Period: ${formatDateToDDMMYYYY(range.from)} to ${formatDateToDDMMYYYY(range.to)}`]);
    ws.mergeCells(3, 1, 3, colCount);
    periodRow.getCell(1).font = { size: 10, color: { argb: '64748B' } };
    periodRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);

    // Summary row
    const summaryRow = ws.addRow([
      'Opening Balance', `${formatCurrency(Math.abs(reportData.openingBalance))} ${reportData.openingBalance >= 0 ? 'DR' : 'CR'}`,
      'Total Inflow', `+${formatCurrency(reportData.totalCr)}`,
      'Total Outflow', `-${formatCurrency(reportData.totalDr)}`
    ]);
    summaryRow.getCell(1).font = { bold: true, size: 12, color: { argb: '0F172A' } };
    summaryRow.getCell(2).font = { bold: true, size: 13, color: { argb: '0F172A' } };
    summaryRow.getCell(3).font = { bold: true, size: 12, color: { argb: '059669' } };
    summaryRow.getCell(4).font = { bold: true, size: 13, color: { argb: '059669' } };
    summaryRow.getCell(5).font = { bold: true, size: 12, color: { argb: 'E11D48' } };
    summaryRow.getCell(6).font = { bold: true, size: 13, color: { argb: 'E11D48' } };
    summaryRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    summaryRow.height = 26;

    // Closing balance row
    const closingRow = ws.addRow([
      'Closing Balance', `${formatCurrency(Math.abs(reportData.closingBalance))} ${reportData.closingBalance >= 0 ? 'DR' : 'CR'}`,
      '', '', '', ''
    ]);
    closingRow.getCell(1).font = { bold: true, size: 12, color: { argb: '0F172A' } };
    closingRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    closingRow.getCell(2).font = { bold: true, size: 13, color: { argb: '0F172A' } };
    closingRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);

    // Column headers
    const headers = ['DATE', 'ACCOUNT', 'LEDGER', 'DESCRIPTION', 'CREDIT (CR)', 'DEBIT (DR)'];
    const hRow = ws.addRow(headers);
    hRow.height = 28;
    hRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderThin;
    });

    // Data rows
    const altFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    reportData.periodVouchers.forEach((v, idx) => {
      const row = ws.addRow([
        formatDateToDDMMYYYY(v.date),
        getParentName(v.accountId).toUpperCase(),
        (accountNameMap[v.accountId] || '—').toUpperCase(),
        v.description.toUpperCase(),
        v.credit > 0 ? v.credit : '',
        v.debit > 0 ? v.debit : '',
      ]);
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = borderThin;
        cell.font = { size: 10, bold: colNum <= 4 };
        if (idx % 2 === 1) cell.fill = altFill;
        if (colNum <= 4) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        }
        if (colNum === 5 && v.credit > 0) cell.font = { size: 10, bold: true, color: { argb: '059669' } };
        if (colNum === 6 && v.debit > 0) cell.font = { size: 10, bold: true, color: { argb: 'E11D48' } };
      });
    });

    // Total row
    if (reportData.periodVouchers.length > 0) {
      const totalRow = ws.addRow(['', '', '', 'TOTAL', reportData.totalCr, reportData.totalDr]);
      totalRow.height = 28;
      const totalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = {
          top: { style: 'medium', color: { argb: '94A3B8' } },
          bottom: { style: 'medium', color: { argb: '94A3B8' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        cell.fill = totalFill;
        cell.font = { bold: true, size: 12, color: { argb: '0F172A' } };
        if (colNum === 4) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colNum >= 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        }
        if (colNum === 5) cell.font = { bold: true, size: 12, color: { argb: '059669' } };
        if (colNum === 6) cell.font = { bold: true, size: 12, color: { argb: 'E11D48' } };
      });
    }

    // Footer
    ws.addRow([]);
    const footerRow = ws.addRow([`Generated: ${new Date().toLocaleString('en-IN')}  |  KR Fuels Management System  |  Confidential`]);
    ws.mergeCells(footerRow.number, 1, footerRow.number, colCount);
    footerRow.getCell(1).font = { size: 8, italic: true, color: { argb: '94A3B8' } };
    footerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Freeze header pane
    ws.views = [{ state: 'frozen', ySplit: 8, xSplit: 0 }];

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `CASH_STATEMENT_${range.from}_TO_${range.to}.xlsx`);
  };

  return (
    <div className="w-full mx-auto pb-10 max-w-[1400px]">
      <div className="sticky top-0 -mx-5 px-5 pt-4 pb-6 bg-[#f8fafc] z-10 no-print space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col">
            <h1 className="text-[14px] md:text-[18px] font-black text-slate-900 tracking-tight uppercase">Cash Report</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              className="px-3 py-2 md:px-6 md:py-2.5 bg-emerald-700 text-white rounded-full font-bold text-[9px] md:text-[11px] flex items-center gap-1.5 md:gap-2 hover:bg-emerald-800 transition-all shadow-md shadow-emerald-100 uppercase tracking-widest active:scale-95"
            >
              <FileSpreadsheet size={14} className="md:w-4 md:h-4" /> Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="px-3 py-2 md:px-6 md:py-2.5 bg-brand text-white rounded-full font-bold text-[9px] md:text-[11px] flex items-center gap-1.5 md:gap-2 hover:bg-brand-hover transition-all shadow-md shadow-green-100 uppercase tracking-widest active:scale-95"
            >
              <FileText size={14} className="md:w-4 md:h-4" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1 md:p-1.5 flex border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
            {[
              { id: 'daily', label: 'Daily', icon: Calendar },
              { id: 'monthly', label: 'Monthly', icon: CalendarDays },
              { id: 'ytd', label: 'YTD', icon: TrendingUp },
              { id: 'financial_year', label: 'Financial Year', icon: History },
              { id: 'custom', label: 'Custom', icon: Filter },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => {
                  setFilterType(btn.id as FilterType);
                  if (['daily', 'monthly', 'financial_year', 'custom'].includes(btn.id)) {
                    setShowFilterPopup(true);
                  } else {
                    setShowFilterPopup(false);
                  }
                }}
                className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 md:gap-2.5 px-2 md:px-3 py-2 md:py-3 rounded-xl text-[9px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-widest transition-all ${filterType === btn.id ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <btn.icon size={13} className="md:w-[15px] md:h-[15px] flex-shrink-0" /> <span className="whitespace-nowrap">{btn.label}</span>
              </button>
            ))}
          </div>

        </div>

        {showFilterPopup && (filterType === 'daily' || filterType === 'monthly' || filterType === 'financial_year' || filterType === 'custom') && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFilterPopup(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md">
                    {filterType === 'daily' && <Calendar size={16} />}
                    {filterType === 'monthly' && <CalendarDays size={16} />}
                    {filterType === 'financial_year' && <History size={16} />}
                    {filterType === 'custom' && <Filter size={16} />}
                  </div>
                  <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
                    {filterType === 'daily' && 'Select Date'}
                    {filterType === 'monthly' && 'Select Month'}
                    {filterType === 'financial_year' && 'Select Financial Year'}
                    {filterType === 'custom' && 'Custom Date Range'}
                  </h2>
                </div>
                <button onClick={() => setShowFilterPopup(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {filterType === 'daily' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Statement Date</label>
                    <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(dailyInputRef)}>
                      <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                        {formatDateToDDMMYYYY(customRange.from)}
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                        <Calendar size={16} />
                      </div>
                      <input
                        ref={dailyInputRef}
                        type="date"
                        className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                        value={customRange.from}
                        onChange={e => setCustomRange({ from: e.target.value, to: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {filterType === 'monthly' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Month & Year</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[48px]">
                      <button
                        onClick={() => {
                          const [y, m] = selectedMonth.split('-').map(Number);
                          const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                          setSelectedMonth(prev);
                        }}
                        className="p-3 hover:bg-slate-50 text-slate-500 border-r border-slate-100 transition-colors"
                      >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                      </button>
                      <div className="flex items-center justify-center gap-2.5 flex-1 px-4 cursor-default">
                        <CalendarDays size={16} className="text-slate-500" />
                        <span className="text-slate-900 font-bold text-[13px] uppercase tracking-widest tabular-nums">
                          {(() => {
                            const [y, m] = selectedMonth.split('-').map(Number);
                            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                            return `${monthNames[m - 1]} ${y}`;
                          })()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const [y, m] = selectedMonth.split('-').map(Number);
                          const now = new Date();
                          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                          const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                          if (next <= currentMonth) setSelectedMonth(next);
                        }}
                        className={`p-3 border-l border-slate-100 text-slate-500 transition-colors ${
                          (() => {
                            const [y, m] = selectedMonth.split('-').map(Number);
                            const now = new Date();
                            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                            return next > currentMonth ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50';
                          })()
                        }`}
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}

                {filterType === 'financial_year' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Financial Year</label>
                    <div className="relative h-[48px]">
                      <select
                        className="w-full px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 uppercase outline-none focus:border-brand focus:bg-white appearance-none transition-all pr-12 h-full shadow-inner"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>FY {year}-{year + 1}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {filterType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">From Date</label>
                      <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customFromRef)}>
                        <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                          {formatDateToDDMMYYYY(customRange.from)}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                          <Calendar size={16} />
                        </div>
                        <input
                          ref={customFromRef}
                          type="date"
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                          value={customRange.from}
                          onChange={e => setCustomRange({ ...customRange, from: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">To Date</label>
                      <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customToRef)}>
                        <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                          {formatDateToDDMMYYYY(customRange.to)}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                          <Calendar size={16} />
                        </div>
                        <input
                          ref={customToRef}
                          type="date"
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                          value={customRange.to}
                          onChange={e => setCustomRange({ ...customRange, to: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setShowFilterPopup(false)}
                    className="w-full px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4">
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-amber-500 transition-all hover:shadow-md">
            <p className="text-[8px] md:text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Opening Balance</p>
            <p className="text-[13px] md:text-[15px] font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCurrency(Math.abs(reportData.openingBalance))} 
              <span className="ml-1 md:ml-1.5 text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{reportData.openingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-emerald-500 transition-all hover:shadow-md">
            <p className="text-[8px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Inflow</p>
            <p className="text-[13px] md:text-[15px] font-black text-emerald-600 font-mono tracking-tight tabular-nums">+{formatCurrency(reportData.totalCr)}</p>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-rose-500 transition-all hover:shadow-md">
            <p className="text-[8px] md:text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Total Outflow</p>
            <p className="text-[13px] md:text-[15px] font-black text-rose-600 font-mono tracking-tight tabular-nums">-{formatCurrency(reportData.totalDr)}</p>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-blue-600 transition-all hover:shadow-md">
            <p className="text-[8px] md:text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Closing Cash</p>
            <p className="text-[13px] md:text-[15px] font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCurrency(Math.abs(reportData.closingBalance))} 
              <span className="ml-1 md:ml-1.5 text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{reportData.closingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none print:rounded-none mt-4">
        <div className="hidden print:block print-header">
          <h1>KR-FUELS ACCOUNTING</h1>
          <p>CASH REPORT</p>
          <p>Period: {formatDateToDDMMYYYY(range.from)} to {formatDateToDDMMYYYY(range.to)}</p>
          <div style={{ marginTop: 8, fontWeight: 900, fontFamily: 'monospace' }} className="mt-2">
            <div>Opening Balance: {formatCurrency(Math.abs(reportData.openingBalance))} {reportData.openingBalance >= 0 ? 'DR' : 'CR'}</div>
            <div>Closing Balance: {formatCurrency(Math.abs(reportData.closingBalance))} {reportData.closingBalance >= 0 ? 'DR' : 'CR'}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Account</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ledger</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Credit (CR)</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Debit (DR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">

              {reportData.periodVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-[12px] text-slate-400 font-bold tabular-nums whitespace-nowrap uppercase">{formatDateToDDMMYYYY(v.date)}</td>
                  <td className="px-8 py-5 text-[12px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                    {getParentName(v.accountId)}
                  </td>
                  <td className="px-8 py-5 text-[12px] font-bold text-slate-800 uppercase tracking-tight whitespace-nowrap">
                    {accountNameMap[v.accountId] || '—'}
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[12px] font-bold text-slate-800 uppercase tracking-tight leading-tight">{v.description}</p>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-emerald-600 tabular-nums text-[12px] font-mono tracking-tight">
                    {v.credit > 0 ? formatCurrency(v.credit) : '—'}
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-rose-500 tabular-nums text-[12px] font-mono tracking-tight">
                    {v.debit > 0 ? formatCurrency(v.debit) : '—'}
                  </td>
                </tr>
              ))}
              {reportData.periodVouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-300 font-bold uppercase text-[12px] tracking-widest">No transaction records found in this period.</td>
                </tr>
              )}
            </tbody>
            {reportData.periodVouchers.length > 0 && (
              <tfoot className="bg-slate-50 font-bold print:bg-slate-100">
                <tr>
                  <td colSpan={4} className="px-8 py-6 text-right text-slate-800 text-[11px] font-bold tracking-widest uppercase">Summary:</td>
                  <td className="px-8 py-6 text-right text-emerald-600 font-black text-[16px] tabular-nums font-mono">{formatCurrency(reportData.totalCr)}</td>
                  <td className="px-8 py-6 text-right text-rose-600 font-black text-[16px] tabular-nums font-mono">{formatCurrency(reportData.totalDr)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashReport;
