/**
 * Departmental Payroll and Expense CSV Export Service
 * For external processing (Excel, Google Sheets, ERP, BI, Python/Pandas, Accounting)
 */

export interface RoleItem {
  role: string;
  count: number;
  salary: number;
}

export interface ExpenseItem {
  name: string;
  type: 'fixed' | 'percent';
  value: number;
  calcValue?: number;
}

export interface DepartmentData {
  payroll: number;
  totalExpense: number;
  roles: RoleItem[];
  expenseItems: ExpenseItem[];
}

export interface PropertyMetadata {
  name?: string;
  location?: string;
  address?: string;
  rooms?: number;
  type?: string;
}

export interface RevenueData {
  room: number;
  fb: number;
  other: number;
  total: number;
}

export interface ProjectedDataInput {
  depts: Record<string, DepartmentData>;
  revenue?: RevenueData;
  property?: PropertyMetadata;
}

export interface ExportCSVOptions {
  /**
   * 'flat' (pure table for ETL/script ingestion), 
   * 'comprehensive' (includes summary and itemized breakdown with metadata)
   * Defaults to 'comprehensive'.
   */
  mode?: 'comprehensive' | 'flat' | 'summary';
  /**
   * Filter to specific department codes (e.g. ['fo', 'hk']) or export all if empty
   */
  departmentFilter?: string[];
  /**
   * Benefit multiplier applied to payroll (default: 1.2 = 20% allowance/insurance)
   */
  payrollBenefitMultiplier?: number;
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  fo: 'Front Office',
  hk: 'Housekeeping',
  fb: 'Food & Beverage',
  pomec: 'Engineering & POMEC',
  admin: 'Administration & General',
  sales: 'Sales & Marketing',
};

/**
 * Escapes a single CSV value following RFC 4180 rules
 */
export function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a row of values into a CSV line
 */
export function toCSVRow(row: (string | number | null | undefined)[]): string {
  return row.map(escapeCSV).join(',');
}

/**
 * Generates CSV string for departmental payroll and expense data
 */
export function generateDepartmentalCSV(
  input: ProjectedDataInput,
  options: ExportCSVOptions = {}
): string {
  const {
    mode = 'comprehensive',
    departmentFilter,
    payrollBenefitMultiplier = 1.2,
  } = options;

  const depts = input.depts || {};
  const revenue = input.revenue || { room: 0, fb: 0, other: 0, total: 0 };
  const property = input.property || {};

  const deptKeys = Object.keys(depts).filter(
    (key) => !departmentFilter || departmentFilter.length === 0 || departmentFilter.includes(key)
  );

  const rows: string[] = [];

  // Flat mode: purely tabular for automated ETL & script imports
  if (mode === 'flat') {
    rows.push(
      toCSVRow([
        'Department_Code',
        'Department_Name',
        'Category',
        'Item_Name',
        'Headcount_Pax',
        'Base_Unit_Rate',
        'Rate_Type',
        'Revenue_Basis_Annual',
        'Monthly_Amount',
        'Annual_Amount',
        'Remarks',
      ])
    );

    deptKeys.forEach((key) => {
      const dept = depts[key];
      const deptName = DEPARTMENT_LABELS[key] || key.toUpperCase();
      const baseRev = key === 'fb' ? revenue.fb : revenue.total;

      // Manning & Payroll items
      dept.roles.forEach((role) => {
        const count = Number(role.count) || 0;
        const salary = Number(role.salary) || 0;
        const monthlyAmount = count * salary * payrollBenefitMultiplier;
        const annualAmount = monthlyAmount * 12;

        rows.push(
          toCSVRow([
            key,
            deptName,
            'Payroll',
            role.role,
            count,
            salary,
            'Monthly Salary (IDR)',
            0,
            Math.round(monthlyAmount),
            Math.round(annualAmount),
            `Includes ${((payrollBenefitMultiplier - 1) * 100).toFixed(0)}% allowances/benefits`,
          ])
        );
      });

      // Operational Expense items
      dept.expenseItems.forEach((exp) => {
        const isPercent = exp.type === 'percent';
        const val = Number(exp.value) || 0;
        let annualAmount = 0;
        let monthlyAmount = 0;

        if (isPercent) {
          annualAmount = baseRev * (val / 100);
          monthlyAmount = annualAmount / 12;
        } else {
          monthlyAmount = val;
          annualAmount = val * 12;
        }

        rows.push(
          toCSVRow([
            key,
            deptName,
            'Operational Expense',
            exp.name,
            0,
            val,
            isPercent ? '% of Revenue' : 'Fixed Monthly (IDR)',
            isPercent ? Math.round(baseRev) : 0,
            Math.round(monthlyAmount),
            Math.round(annualAmount),
            isPercent
              ? `${val}% of ${key === 'fb' ? 'F&B Revenue' : 'Total Revenue'}`
              : 'Fixed monthly operating cost',
          ])
        );
      });
    });

    return rows.join('\r\n');
  }

  // Summary mode: department-level aggregation table
  if (mode === 'summary') {
    rows.push(
      toCSVRow([
        'Department_Code',
        'Department_Name',
        'Total_Staff_Pax',
        'Monthly_Payroll',
        'Annual_Payroll',
        'Monthly_Expenses',
        'Annual_Expenses',
        'Total_Monthly_Cost',
        'Total_Annual_Cost',
      ])
    );

    let grandPax = 0;
    let grandMonthlyPayroll = 0;
    let grandAnnualPayroll = 0;
    let grandMonthlyExp = 0;
    let grandAnnualExp = 0;

    deptKeys.forEach((key) => {
      const dept = depts[key];
      const deptName = DEPARTMENT_LABELS[key] || key.toUpperCase();
      const baseRev = key === 'fb' ? revenue.fb : revenue.total;

      const totalPax = dept.roles.reduce((acc, r) => acc + (Number(r.count) || 0), 0);
      const monthlyPayroll = dept.roles.reduce(
        (acc, r) => acc + (Number(r.count) || 0) * (Number(r.salary) || 0) * payrollBenefitMultiplier,
        0
      );
      const annualPayroll = monthlyPayroll * 12;

      let annualExp = 0;
      dept.expenseItems.forEach((exp) => {
        if (exp.type === 'percent') {
          annualExp += baseRev * (Number(exp.value) / 100);
        } else {
          annualExp += Number(exp.value) * 12;
        }
      });
      const monthlyExp = annualExp / 12;

      const totalMonthly = monthlyPayroll + monthlyExp;
      const totalAnnual = annualPayroll + annualExp;

      grandPax += totalPax;
      grandMonthlyPayroll += monthlyPayroll;
      grandAnnualPayroll += annualPayroll;
      grandMonthlyExp += monthlyExp;
      grandAnnualExp += annualExp;

      rows.push(
        toCSVRow([
          key,
          deptName,
          totalPax,
          Math.round(monthlyPayroll),
          Math.round(annualPayroll),
          Math.round(monthlyExp),
          Math.round(annualExp),
          Math.round(totalMonthly),
          Math.round(totalAnnual),
        ])
      );
    });

    rows.push(
      toCSVRow([
        'TOTAL',
        'All Departments',
        grandPax,
        Math.round(grandMonthlyPayroll),
        Math.round(grandAnnualPayroll),
        Math.round(grandMonthlyExp),
        Math.round(grandAnnualExp),
        Math.round(grandMonthlyPayroll + grandMonthlyExp),
        Math.round(grandAnnualPayroll + grandAnnualExp),
      ])
    );

    return rows.join('\r\n');
  }

  // Comprehensive mode: Metadata + Department Summaries + Line-by-Line Items
  // Suitable for both human spreadsheet review and external script ingestion
  const dateStr = new Date().toISOString().split('T')[0];
  rows.push(toCSVRow(['# THELOKA PRO - DEPARTMENTAL PAYROLL & EXPENSES EXPORT']));
  rows.push(toCSVRow(['# Property Name', property.name || 'Hospitality Property']));
  rows.push(toCSVRow(['# Location', property.location || '-']));
  rows.push(toCSVRow(['# Address', property.address || '-']));
  rows.push(toCSVRow(['# Room Count', property.rooms || 0]));
  rows.push(toCSVRow(['# Export Date', dateStr]));
  rows.push(toCSVRow(['# Total Annual Projected Revenue', Math.round(revenue.total)]));
  rows.push(toCSVRow(['# Annual F&B Projected Revenue', Math.round(revenue.fb)]));
  rows.push('');

  // 1. Department Summary Section
  rows.push(toCSVRow(['--- DEPARTMENT SUMMARY ---']));
  rows.push(
    toCSVRow([
      'Department Code',
      'Department Name',
      'Total Staff (Pax)',
      'Monthly Payroll (IDR)',
      'Annual Payroll (IDR)',
      'Monthly Expenses (IDR)',
      'Annual Expenses (IDR)',
      'Total Monthly Cost (IDR)',
      'Total Annual Cost (IDR)',
      '% of Total Dept Cost',
    ])
  );

  let grandPax = 0;
  let grandAnnualPayroll = 0;
  let grandAnnualExp = 0;

  const deptSummaries = deptKeys.map((key) => {
    const dept = depts[key];
    const deptName = DEPARTMENT_LABELS[key] || key.toUpperCase();
    const baseRev = key === 'fb' ? revenue.fb : revenue.total;

    const totalPax = dept.roles.reduce((acc, r) => acc + (Number(r.count) || 0), 0);
    const monthlyPayroll = dept.roles.reduce(
      (acc, r) => acc + (Number(r.count) || 0) * (Number(r.salary) || 0) * payrollBenefitMultiplier,
      0
    );
    const annualPayroll = monthlyPayroll * 12;

    let annualExp = 0;
    dept.expenseItems.forEach((exp) => {
      if (exp.type === 'percent') {
        annualExp += baseRev * (Number(exp.value) / 100);
      } else {
        annualExp += Number(exp.value) * 12;
      }
    });
    const monthlyExp = annualExp / 12;

    grandPax += totalPax;
    grandAnnualPayroll += annualPayroll;
    grandAnnualExp += annualExp;

    return {
      key,
      name: deptName,
      totalPax,
      monthlyPayroll,
      annualPayroll,
      monthlyExp,
      annualExp,
      totalMonthly: monthlyPayroll + monthlyExp,
      totalAnnual: annualPayroll + annualExp,
    };
  });

  const grandTotalAnnual = grandAnnualPayroll + grandAnnualExp;

  deptSummaries.forEach((s) => {
    const pct = grandTotalAnnual > 0 ? ((s.totalAnnual / grandTotalAnnual) * 100).toFixed(2) + '%' : '0%';
    rows.push(
      toCSVRow([
        s.key,
        s.name,
        s.totalPax,
        Math.round(s.monthlyPayroll),
        Math.round(s.annualPayroll),
        Math.round(s.monthlyExp),
        Math.round(s.annualExp),
        Math.round(s.totalMonthly),
        Math.round(s.totalAnnual),
        pct,
      ])
    );
  });

  rows.push(
    toCSVRow([
      'TOTAL',
      'Grand Total',
      grandPax,
      Math.round(grandAnnualPayroll / 12),
      Math.round(grandAnnualPayroll),
      Math.round(grandAnnualExp / 12),
      Math.round(grandAnnualExp),
      Math.round(grandTotalAnnual / 12),
      Math.round(grandTotalAnnual),
      '100.00%',
    ])
  );
  rows.push('');

  // 2. Itemized Payroll Section
  rows.push(toCSVRow(['--- ITEMIZED MANNING & PAYROLL ---']));
  rows.push(
    toCSVRow([
      'Department Code',
      'Department Name',
      'Position / Role',
      'Headcount (Pax)',
      'Base Monthly Salary (IDR)',
      'Monthly Base Payroll (IDR)',
      'Benefit Multiplier',
      'Monthly Payroll w/ Benefits (IDR)',
      'Annual Payroll (IDR)',
    ])
  );

  deptKeys.forEach((key) => {
    const dept = depts[key];
    const deptName = DEPARTMENT_LABELS[key] || key.toUpperCase();

    dept.roles.forEach((role) => {
      const count = Number(role.count) || 0;
      const salary = Number(role.salary) || 0;
      const baseMonthly = count * salary;
      const monthlyWithBenefits = baseMonthly * payrollBenefitMultiplier;
      const annualAmount = monthlyWithBenefits * 12;

      rows.push(
        toCSVRow([
          key,
          deptName,
          role.role,
          count,
          Math.round(salary),
          Math.round(baseMonthly),
          `${payrollBenefitMultiplier}x`,
          Math.round(monthlyWithBenefits),
          Math.round(annualAmount),
        ])
      );
    });
  });
  rows.push('');

  // 3. Itemized Operational Expenses Section
  rows.push(toCSVRow(['--- ITEMIZED OPERATIONAL EXPENSES ---']));
  rows.push(
    toCSVRow([
      'Department Code',
      'Department Name',
      'Expense Item',
      'Cost Type',
      'Input Value',
      'Revenue Basis (IDR)',
      'Estimated Monthly Expense (IDR)',
      'Estimated Annual Expense (IDR)',
      'Formula / Description',
    ])
  );

  deptKeys.forEach((key) => {
    const dept = depts[key];
    const deptName = DEPARTMENT_LABELS[key] || key.toUpperCase();
    const isFb = key === 'fb';
    const baseRev = isFb ? revenue.fb : revenue.total;

    dept.expenseItems.forEach((exp) => {
      const isPercent = exp.type === 'percent';
      const val = Number(exp.value) || 0;
      let annualAmount = 0;
      let monthlyAmount = 0;

      if (isPercent) {
        annualAmount = baseRev * (val / 100);
        monthlyAmount = annualAmount / 12;
      } else {
        monthlyAmount = val;
        annualAmount = val * 12;
      }

      rows.push(
        toCSVRow([
          key,
          deptName,
          exp.name,
          isPercent ? 'Variable (% Rev)' : 'Fixed (Rp)',
          isPercent ? `${val}%` : val,
          isPercent ? Math.round(baseRev) : '-',
          Math.round(monthlyAmount),
          Math.round(annualAmount),
          isPercent
            ? `${val}% of ${isFb ? 'F&B Revenue' : 'Total Revenue'}`
            : 'Fixed Monthly Allowance',
        ])
      );
    });
  });

  return rows.join('\r\n');
}

/**
 * Triggers a browser file download of CSV content with UTF-8 BOM
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // \uFEFF BOM ensures Microsoft Excel and Google Sheets open Indonesian IDR and UTF-8 characters without garbling
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Complete helper to export and trigger download of departmental data
 */
export function exportDepartmentalDataToCSV(
  input: ProjectedDataInput,
  customFilename?: string,
  options?: ExportCSVOptions
): string {
  const csvContent = generateDepartmentalCSV(input, options);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const cleanPropName = (input.property?.name || 'Hotel')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const defaultFilename = `${cleanPropName}_departmental_payroll_expenses_${dateStr}.csv`;
    downloadCSV(csvContent, customFilename || defaultFilename);
  }
  return csvContent;
}
