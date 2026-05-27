
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { calculateLedger, formatCurrency, formatDateToDDMMYYYY } from '../utils';
import LedgerModalSelector, { ALL_ACCOUNTS_ID } from '../components/LedgerModalSelector';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface LedgerReportProps {
  accounts: Account[];
  vouchers: Voucher[];
}

const LedgerReport: React.FC<LedgerReportProps> = ({ accounts, vouchers }) => {
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const getLocalDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      accountId: '',
      fromDate: getLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
      toDate: getLocalDateStr(now),
    };
  });



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

  const selectedAccount = filters.accountId === ALL_ACCOUNTS_ID
    ? { id: ALL_ACCOUNTS_ID, name: 'All Accounts', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: 0, bunkId: '' } as Account
    : accounts.find(a => a.id === filters.accountId);

  const isParentAccount = useMemo(() => {
    if (!selectedAccount) return false;
    if (filters.accountId === ALL_ACCOUNTS_ID) return true;
    return accounts.some(a => a.parentId === selectedAccount.id);
  }, [selectedAccount, accounts, filters.accountId]);

  const accountNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [accounts]);

  const showAccountColumn = false;

  const groupedReportData = useMemo(() => {
    if (!isParentAccount || !filters.accountId) return null;

    const getLeafIds = (accId: string): string[] => {
      const children = accounts.filter(a => a.parentId === accId);
      if (children.length === 0) return [accId];
      return children.flatMap(c => getLeafIds(c.id));
    };

    const leafIds =
      filters.accountId === ALL_ACCOUNTS_ID
        ? accounts.filter(a => !accounts.some(b => b.parentId === a.id)).map(a => a.id)
        : getLeafIds(filters.accountId);

    const getHierarchyPath = (accId: string): string => {
      const acc = accounts.find(a => a.id === accId);
      if (!acc) return '';
      return acc.parentId
        ? getHierarchyPath(acc.parentId) + '/' + acc.name.toLowerCase()
        : acc.name.toLowerCase();
    };

    return [...leafIds]
      .sort((a, b) => getHierarchyPath(a).localeCompare(getHierarchyPath(b)))
      .map(accId => {
        const account = accounts.find(a => a.id === accId);
        if (!account) return null;
        const accVouchers = vouchers.filter(v => v.accountId === accId);
        const entries = calculateLedger(account, accVouchers, filters.fromDate, filters.toDate);
        if (entries.length === 0) return null;
        const periodOpeningBalance = (account.openingDebit - account.openingCredit)
          + accVouchers.filter(v => v.date < filters.fromDate).reduce((s, v) => s + (v.debit - v.credit), 0);
        const grpDr = entries.reduce((s, e) => s + e.debit, 0);
        const grpCr = entries.reduce((s, e) => s + e.credit, 0);
        const last = entries[entries.length - 1];
        return { account, entries, grpDr, grpCr, closingBalance: last.balance, closingBalanceType: last.balanceType, periodOpeningBalance };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [isParentAccount, filters, accounts, vouchers]);

  const reportData = useMemo(() => {
    if (!selectedAccount) return [];

    if (filters.accountId === ALL_ACCOUNTS_ID) {
      const allLeafAccounts = accounts.filter(a => !accounts.some(b => b.parentId === a.id));
      const allOpeningNet = allLeafAccounts.reduce((s, a) => s + (a.openingDebit - a.openingCredit), 0);
      const allAccountsObj: Account = {
        id: ALL_ACCOUNTS_ID,
        name: 'All Accounts',
        parentId: null,
        openingDebit: allOpeningNet > 0 ? allOpeningNet : 0,
        openingCredit: allOpeningNet < 0 ? Math.abs(allOpeningNet) : 0,
        createdAt: 0,
        bunkId: '',
      };
      return calculateLedger(allAccountsObj, vouchers, filters.fromDate, filters.toDate);
    }

    const getDescendantIds = (accId: string): string[] => {
      let ids = [accId];
      const children = accounts.filter(a => a.parentId === accId);
      children.forEach(child => {
        ids = [...ids, ...getDescendantIds(child.id)];
      });
      return ids;
    };

    const targetAccountIds = getDescendantIds(filters.accountId);
    const targetAccounts = accounts.filter(a => targetAccountIds.includes(a.id));

    const leafAccounts = targetAccounts.filter(a => !accounts.some(b => b.parentId === a.id));
    const leafOpeningNet = leafAccounts.reduce((s, a) => s + (a.openingDebit - a.openingCredit), 0);
    const consolidatedAccount: Account = {
      ...selectedAccount,
      openingDebit: leafOpeningNet > 0 ? leafOpeningNet : 0,
      openingCredit: leafOpeningNet < 0 ? Math.abs(leafOpeningNet) : 0,
    };

    const filteredVouchers = vouchers.filter(v => targetAccountIds.includes(v.accountId));
    return calculateLedger(consolidatedAccount, filteredVouchers, filters.fromDate, filters.toDate);
  }, [selectedAccount, vouchers, filters, accounts]);

  const totalDr = reportData.reduce((sum, e) => sum + e.debit, 0);
  const totalCr = reportData.reduce((sum, e) => sum + e.credit, 0);

  const reportPeriodOpening = useMemo(() => {
    if (!selectedAccount || isParentAccount || !filters.accountId || filters.accountId === ALL_ACCOUNTS_ID) return null;
    const accVouchers = vouchers.filter(v => v.accountId === filters.accountId);
    return (selectedAccount.openingDebit - selectedAccount.openingCredit)
      + accVouchers.filter(v => v.date < filters.fromDate).reduce((s, v) => s + (v.debit - v.credit), 0);
  }, [selectedAccount, isParentAccount, vouchers, filters]);

  const handleExportExcel = async () => {
    const hasData = groupedReportData ? groupedReportData.length > 0 : reportData.length > 0;
    if (!hasData) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ledger Report');
    // Columns: DATE | DESCRIPTION | CREDIT (CR) | DEBIT (DR) | BALANCE
    const colCount = 5;
    ws.columns = [
      { width: 16 }, { width: 36 },
      { width: 18 }, { width: 18 }, { width: 22 },
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
    const subtitleRow = ws.addRow(['LEDGER REPORT']);
    ws.mergeCells(2, 1, 2, colCount);
    subtitleRow.getCell(1).font = { bold: true, size: 13, color: { argb: '166534' } };
    subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleRow.height = 24;

    // Account name
    const acctRow = ws.addRow([selectedAccount?.name?.toUpperCase() || '']);
    ws.mergeCells(3, 1, 3, colCount);
    acctRow.getCell(1).font = { bold: true, size: 12, color: { argb: '0F172A' } };
    acctRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    const periodRow = ws.addRow([`Period: ${formatDateToDDMMYYYY(filters.fromDate)} to ${formatDateToDDMMYYYY(filters.toDate)}`]);
    ws.mergeCells(4, 1, 4, colCount);
    periodRow.getCell(1).font = { size: 10, color: { argb: '64748B' } };
    periodRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);

    // Column headers
    const headers = ['DATE', 'DESCRIPTION', 'CREDIT (CR)', 'DEBIT (DR)', 'BALANCE'];
    const hRow = ws.addRow(headers);
    hRow.height = 28;
    hRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderThin;
    });

    // Column index constants (1-based)
    const crColIdx = 3;
    const drColIdx = 4;
    const balColIdx = 5;

    const altFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    const groupFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
    const subtotalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    const borderMedium: Partial<ExcelJS.Borders> = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'medium', color: { argb: '94A3B8' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } },
    };

    const applyDataCell = (cell: ExcelJS.Cell, colNum: number, entry: { debit: number; credit: number; balance: number; balanceType: string }, rowIdx: number) => {
      cell.border = borderThin;
      cell.font = { size: 10 };
      if (rowIdx % 2 === 1) cell.fill = altFill;
      if (colNum <= 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { size: 10, bold: true };
      }
      if (colNum === crColIdx) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
        if (entry.credit > 0) cell.font = { size: 10, bold: true, color: { argb: '059669' } };
      }
      if (colNum === drColIdx) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
        if (entry.debit > 0) cell.font = { size: 10, bold: true, color: { argb: 'E11D48' } };
      }
      if (colNum === balColIdx) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
        cell.font = { size: 10, bold: true, color: { argb: '0F172A' } };
      }
    };

    if (groupedReportData) {
      // Grouped export: subaccount header → opening balance → rows → subtotal → period net
      groupedReportData.forEach(({ account, entries, grpDr, grpCr, closingBalance, closingBalanceType, periodOpeningBalance }) => {
        // Sub-account header row
        const grpHeaderRow = ws.addRow([account.name.toUpperCase(), '', '', '', '']);
        ws.mergeCells(grpHeaderRow.number, 1, grpHeaderRow.number, colCount);
        grpHeaderRow.height = 20;
        grpHeaderRow.getCell(1).fill = groupFill;
        grpHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: '166534' } };
        grpHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        grpHeaderRow.getCell(1).border = { top: { style: 'medium', color: { argb: '166534' } }, bottom: { style: 'thin', color: { argb: 'BBF7D0' } }, left: borderThin.left, right: borderThin.right };

        // Opening balance row (only if present)
        if (periodOpeningBalance !== 0) {
          const obRow = ws.addRow(['', 'OPENING BALANCE', '', '', Math.abs(periodOpeningBalance)]);
          obRow.height = 18;
          obRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
            cell.border = borderThin;
            cell.font = { bold: true, size: 10, italic: true, color: { argb: 'B45309' } };
            if (colNum === 2) cell.alignment = { horizontal: 'left', vertical: 'middle' };
            if (colNum === balColIdx) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              cell.numFmt = '#,##0.00';
              const obLabel = periodOpeningBalance >= 0 ? ' DR' : ' CR';
              cell.value = `${Math.abs(periodOpeningBalance).toFixed(2)} ${obLabel.trim()}`;
            }
          });
        }

        // Data rows
        entries.forEach((entry, idx) => {
          const row = ws.addRow([
            formatDateToDDMMYYYY(entry.date),
            entry.description.toUpperCase(),
            entry.credit > 0 ? entry.credit : '',
            entry.debit > 0 ? entry.debit : '',
            entry.balance,
          ]);
          row.height = 20;
          row.eachCell({ includeEmpty: true }, (cell, colNum) => applyDataCell(cell, colNum, entry, idx));
        });

        // Subtotal row
        const subRow = ws.addRow(['', 'SUBTOTAL', grpCr, grpDr, closingBalance]);
        subRow.height = 22;
        subRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.fill = subtotalFill;
          cell.border = borderMedium;
          cell.font = { bold: true, size: 11, color: { argb: '0F172A' } };
          if (colNum === 2) cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (colNum === crColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 11, color: { argb: '059669' } }; }
          if (colNum === drColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 11, color: { argb: 'E11D48' } }; }
          if (colNum === balColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; }
        });

        // Period Net row (Cr or Dr column only, balance column blank)
        const periodNet = grpCr - grpDr;
        const periodNetAbs = Math.abs(periodNet);
        const isCrNet = periodNet >= 0;
        const netRowValues = ['', 'PERIOD NET (EXCL. OPENING)', isCrNet ? periodNetAbs : '', !isCrNet ? periodNetAbs : '', ''];
        const netRow = ws.addRow(netRowValues);
        netRow.height = 18;
        netRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
          cell.border = borderThin;
          cell.font = { bold: true, size: 10, italic: true, color: { argb: '64748B' } };
          if (colNum === 2) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
          if (colNum === crColIdx && isCrNet) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 10, color: { argb: '059669' } }; }
          if (colNum === drColIdx && !isCrNet) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 10, color: { argb: 'E11D48' } }; }
        });

        // blank spacer
        ws.addRow([]);
      });

      // Overall movement summary
      const grandDr = groupedReportData.reduce((s, g) => s + g.grpDr, 0);
      const grandCr = groupedReportData.reduce((s, g) => s + g.grpCr, 0);
      const lastGroup = groupedReportData[groupedReportData.length - 1];
      const totalRow = ws.addRow(['', 'MOVEMENT SUMMARY', grandCr, grandDr, lastGroup.closingBalance]);
      totalRow.height = 28;
      totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
        cell.border = borderMedium;
        cell.font = { bold: true, size: 12, color: { argb: '0F172A' } };
        if (colNum === 2) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colNum === crColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 12, color: { argb: '059669' } }; }
        if (colNum === drColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 12, color: { argb: 'E11D48' } }; }
        if (colNum === balColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; }
      });
    } else {
      // Flat export for leaf accounts
      reportData.forEach((entry, idx) => {
        const row = ws.addRow([
          formatDateToDDMMYYYY(entry.date),
          entry.description.toUpperCase(),
          entry.credit > 0 ? entry.credit : '',
          entry.debit > 0 ? entry.debit : '',
          entry.balance,
        ]);
        row.height = 22;
        row.eachCell({ includeEmpty: true }, (cell, colNum) => applyDataCell(cell, colNum, entry, idx));
      });

      // Summary row
      const lastEntry = reportData[reportData.length - 1];
      const totalRow = ws.addRow(['', 'MOVEMENT SUMMARY', totalCr, totalDr, lastEntry.balance]);
      totalRow.height = 28;
      const totalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = totalFill;
        cell.border = borderMedium;
        cell.font = { bold: true, size: 11, color: { argb: '0F172A' } };
        if (colNum === 2) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colNum === crColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 12, color: { argb: '059669' } }; }
        if (colNum === drColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; cell.font = { bold: true, size: 12, color: { argb: 'E11D48' } }; }
        if (colNum === balColIdx) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; cell.numFmt = '#,##0.00'; }
      });
    }

    // Footer
    ws.addRow([]);
    const footerRow = ws.addRow([`Generated: ${new Date().toLocaleString('en-IN')}  |  KR Fuels Management System  |  Confidential`]);
    ws.mergeCells(footerRow.number, 1, footerRow.number, colCount);
    footerRow.getCell(1).font = { size: 8, italic: true, color: { argb: '94A3B8' } };
    footerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Freeze header pane
    ws.views = [{ state: 'frozen', ySplit: 6, xSplit: 0 }];

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `LEDGER_${selectedAccount?.name}_${filters.fromDate}_TO_${filters.toDate}.xlsx`);
  };

  const handlePDF = () => {
    window.print();
  };

  return (
    <div className="w-full mx-auto pb-4 max-w-[1400px]">
      <div className="sticky top-0 -mx-5 px-5 pt-0 pb-2 md:pb-3 bg-[#f8fafc] z-10 no-print space-y-2 md:space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col">
            <h1 className="text-[14px] md:text-[18px] font-black text-slate-900 tracking-tight uppercase">Ledger Report</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              className="px-3 py-2 md:px-6 md:py-2.5 bg-emerald-700 text-white rounded-full font-bold text-[9px] md:text-[11px] flex items-center gap-1.5 md:gap-2 hover:bg-emerald-800 transition-all shadow-md shadow-emerald-100 uppercase tracking-widest active:scale-95"
            >
              <FileSpreadsheet size={14} className="md:w-4 md:h-4" /> Excel
            </button>
            <button 
              onClick={handlePDF}
              className="px-3 py-2 md:px-6 md:py-2.5 bg-brand text-white rounded-full font-bold text-[9px] md:text-[11px] flex items-center gap-1.5 md:gap-2 hover:bg-brand-hover transition-all shadow-md shadow-green-100 uppercase tracking-widest active:scale-95"
            >
              <FileText size={14} className="md:w-4 md:h-4" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3 md:px-6 md:py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col h-full">
               <LedgerModalSelector
                 label="SELECT ACCOUNT"
                 accounts={accounts}
                 selectedId={filters.accountId}
                 onChange={id => setFilters({ ...filters, accountId: id })}
                 placeholder="SEARCH LEDGER..."
                 compact={true}
                 labelClassName="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1 mb-1"
                 triggerHeight="h-[36px]"
                 allowGroups={true}
                 allowSelectAll={true}
               />
            </div>
            
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">From Date</label>
              <div className="relative group cursor-pointer h-[36px]" onClick={() => handleOpenPicker(fromDateRef)}>
                <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                  {formatDateToDDMMYYYY(filters.fromDate)}
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                  <Calendar size={18} />
                </div>
                <input
                  ref={fromDateRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                  value={filters.fromDate}
                  onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">To Date</label>
              <div className="relative group cursor-pointer h-[36px]" onClick={() => handleOpenPicker(toDateRef)}>
                <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                  {formatDateToDDMMYYYY(filters.toDate)}
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                  <Calendar size={18} />
                </div>
                <input
                  ref={toDateRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                  value={filters.toDate}
                  onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <div className="hidden print:block print-header">
          <h1>KR-FUELS ACCOUNTING</h1>
          <p>LEDGER REPORT: {selectedAccount?.name || 'All Accounts'}</p>
          <p>Period: {formatDateToDDMMYYYY(filters.fromDate)} to {formatDateToDDMMYYYY(filters.toDate)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                {showAccountColumn && (
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Account</th>
                )}
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Credit (Cr)</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Debit (Dr)</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedReportData ? (
                groupedReportData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center text-slate-300 font-bold italic uppercase tracking-widest text-[12px]">
                      NO TRANSACTION RECORDS FOUND.
                    </td>
                  </tr>
                ) : (
                  <>
                    {groupedReportData.map(({ account, entries, grpDr, grpCr, closingBalance, closingBalanceType, periodOpeningBalance }) => (
                      <React.Fragment key={account.id}>
                        <tr className="bg-emerald-50/60 border-t-2 border-emerald-100">
                          <td colSpan={5} className="px-4 py-1.5 text-[11px] font-black text-emerald-800 uppercase tracking-widest">
                            {account.name}
                          </td>
                        </tr>
                        {periodOpeningBalance !== 0 && (
                          <tr className="bg-amber-50/50 border-b border-amber-100">
                            <td colSpan={2} className="px-4 py-1 text-[10px] font-black text-amber-600 uppercase tracking-widest italic">Opening Balance</td>
                            <td className="px-4 py-1 text-right text-[11px] text-slate-300 tabular-nums font-mono">—</td>
                            <td className="px-4 py-1 text-right text-[11px] text-slate-300 tabular-nums font-mono">—</td>
                            <td className="px-4 py-1 text-[12px] text-amber-700 text-right font-bold tabular-nums font-mono">
                              {formatCurrency(Math.abs(periodOpeningBalance))} <span className="text-[10px] font-bold ml-1 uppercase">{periodOpeningBalance >= 0 ? 'DR' : 'CR'}</span>
                            </td>
                          </tr>
                        )}
                        {entries.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-1.5 text-[12px] font-bold text-slate-400 whitespace-nowrap tabular-nums uppercase">{formatDateToDDMMYYYY(entry.date)}</td>
                            <td className="px-4 py-1.5 text-[12px] font-bold text-slate-800 uppercase tracking-tight">{entry.description}</td>
                            <td className="px-4 py-1.5 text-[12px] text-emerald-600 text-right font-bold tabular-nums font-mono tracking-tight">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                            <td className="px-4 py-1.5 text-[12px] text-rose-500 text-right font-bold tabular-nums font-mono tracking-tight">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                            <td className="px-4 py-1.5 text-[12px] text-slate-900 text-right font-bold tabular-nums font-mono tracking-tight">
                              {formatCurrency(entry.balance)} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{entry.balanceType}</span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={2} className="px-4 py-2 text-right text-slate-500 text-[10px] font-black tracking-widest uppercase">Subtotal:</td>
                          <td className="px-4 py-2 text-right text-emerald-600 font-black text-[13px] tabular-nums font-mono">{formatCurrency(grpCr)}</td>
                          <td className="px-4 py-2 text-right text-rose-500 font-black text-[13px] tabular-nums font-mono">{formatCurrency(grpDr)}</td>
                          <td className="px-4 py-2 text-right text-slate-900 font-black text-[13px] tabular-nums font-mono tracking-tight">
                            {formatCurrency(closingBalance)} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{closingBalanceType}</span>
                          </td>
                        </tr>
                        {(() => {
                          const periodNet = grpCr - grpDr;
                          const periodNetAbs = Math.abs(periodNet);
                          const isCr = periodNet >= 0;
                          return (
                            <tr className="bg-slate-100/60 border-b-2 border-slate-200">
                              <td colSpan={2} className="px-4 py-1.5 text-right text-slate-400 text-[9px] font-black tracking-widest uppercase italic">Period Net (excl. opening):</td>
                              <td className="px-4 py-1.5 text-right font-black text-[12px] tabular-nums font-mono tracking-tight text-emerald-600">
                                {isCr ? <>{formatCurrency(periodNetAbs)} <span className="text-[9px] font-bold ml-1 uppercase">CR</span></> : '—'}
                              </td>
                              <td className="px-4 py-1.5 text-right font-black text-[12px] tabular-nums font-mono tracking-tight text-rose-500">
                                {!isCr ? <>{formatCurrency(periodNetAbs)} <span className="text-[9px] font-bold ml-1 uppercase">DR</span></> : '—'}
                              </td>
                              <td className="px-4 py-1.5 text-right text-slate-300 tabular-nums font-mono text-[11px]">—</td>
                            </tr>
                          );
                        })()}
                      </React.Fragment>
                    ))}
                  </>
                )
              ) : (
                <>
                  {reportPeriodOpening !== null && reportData.length > 0 && (
                    <tr className="bg-amber-50/50 border-b border-amber-100">
                      <td colSpan={2} className="px-4 py-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest italic">Opening Balance</td>
                      <td className="px-4 py-1.5 text-right text-[11px] text-slate-300 tabular-nums font-mono">—</td>
                      <td className="px-4 py-1.5 text-right text-[11px] text-slate-300 tabular-nums font-mono">—</td>
                      <td className="px-4 py-1.5 text-[12px] text-amber-700 text-right font-bold tabular-nums font-mono">
                        {formatCurrency(Math.abs(reportPeriodOpening))} <span className="text-[10px] font-bold ml-1 uppercase">{reportPeriodOpening >= 0 ? 'DR' : 'CR'}</span>
                      </td>
                    </tr>
                  )}
                  {reportData.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-1.5 text-[12px] font-bold text-slate-400 whitespace-nowrap tabular-nums uppercase">{formatDateToDDMMYYYY(entry.date)}</td>
                      {showAccountColumn && (
                        <td className="px-4 py-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                          {entry.accountId ? (accountNameMap[entry.accountId] || '-') : '-'}
                        </td>
                      )}
                      <td className="px-4 py-1.5 text-[12px] font-bold text-slate-800 uppercase tracking-tight">
                        {entry.description}
                      </td>
                      <td className="px-4 py-1.5 text-[12px] text-emerald-600 text-right font-bold tabular-nums font-mono tracking-tight">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-4 py-1.5 text-[12px] text-rose-500 text-right font-bold tabular-nums font-mono tracking-tight">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-1.5 text-[12px] text-slate-900 text-right font-bold tabular-nums font-mono tracking-tight">
                        {formatCurrency(entry.balance)} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{entry.balanceType}</span>
                      </td>
                    </tr>
                  ))}
                  {reportData.length === 0 && (
                    <tr>
                      <td colSpan={showAccountColumn ? 6 : 5} className="px-4 py-16 text-center text-slate-300 font-bold italic uppercase tracking-widest text-[12px]">
                        {filters.accountId ? 'NO TRANSACTION RECORDS FOUND.' : 'SELECT AN ACCOUNT TO VIEW ACTIVITY.'}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-slate-50 font-bold print:bg-slate-100 uppercase">
                <tr>
                  <td colSpan={showAccountColumn ? 3 : 2} className="px-4 py-3 text-right text-slate-800 text-[11px] font-bold tracking-widest uppercase">Movement Summary:</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-black text-[15px] tabular-nums font-mono">{formatCurrency(totalCr)}</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-black text-[15px] tabular-nums font-mono">{formatCurrency(totalDr)}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-black text-[15px] tabular-nums tracking-tighter font-mono">
                  {formatCurrency(reportData[reportData.length - 1].balance)} <span className="text-[10px] text-slate-400 font-bold ml-2">{reportData[reportData.length - 1].balanceType}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerReport;
