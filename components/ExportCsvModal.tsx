import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Table, 
  Layers, 
  BarChart3, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  generateDepartmentalCSV, 
  downloadCSV, 
  DEPARTMENT_LABELS, 
  type ProjectedDataInput, 
  type ExportCSVOptions 
} from '../services/exportCsv';

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectedData: any;
  basicInput: any;
  initialDeptFilter?: string[];
}

export const ExportCsvModal: React.FC<ExportCsvModalProps> = ({
  isOpen,
  onClose,
  projectedData,
  basicInput,
  initialDeptFilter = []
}) => {
  const [selectedMode, setSelectedMode] = useState<'comprehensive' | 'flat' | 'summary'>('comprehensive');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(initialDeptFilter);
  const [copied, setCopied] = useState(false);

  // Sync initial filter when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDepts(initialDeptFilter || []);
      setCopied(false);
    }
  }, [isOpen, initialDeptFilter]);

  const preparedInput: ProjectedDataInput = useMemo(() => {
    if (!projectedData) {
      return {
        depts: {},
        revenue: { room: 0, fb: 0, other: 0, total: 0 },
        property: {
          name: basicInput?.name || 'Hotel Property',
          location: basicInput?.location || '',
          address: basicInput?.address || '',
          rooms: basicInput?.rooms || 0,
          type: basicInput?.type || 'Resort',
        }
      };
    }
    return {
      depts: projectedData.depts,
      revenue: projectedData.revenue,
      property: {
        name: basicInput?.name || 'Hotel Property',
        location: basicInput?.location || '',
        address: basicInput?.address || '',
        rooms: basicInput?.rooms || 0,
        type: basicInput?.type || 'Resort',
      }
    };
  }, [projectedData, basicInput]);

  const csvOptions: ExportCSVOptions = useMemo(() => ({
    mode: selectedMode,
    departmentFilter: selectedDepts.length > 0 ? selectedDepts : undefined,
    payrollBenefitMultiplier: 1.2
  }), [selectedMode, selectedDepts]);

  const csvContent = useMemo(() => {
    return generateDepartmentalCSV(preparedInput, csvOptions);
  }, [preparedInput, csvOptions]);

  const previewSnippet = useMemo(() => {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length <= 16) return csvContent;
    return lines.slice(0, 16).join('\n') + `\n... [${lines.length - 16} more rows in full export]`;
  }, [csvContent]);

  if (!isOpen) return null;

  const toggleDept = (code: string) => {
    if (selectedDepts.includes(code)) {
      setSelectedDepts(selectedDepts.filter(c => c !== code));
    } else {
      setSelectedDepts([...selectedDepts, code]);
    }
  };

  const selectAllDepts = () => setSelectedDepts([]);

  const handleDownload = () => {
    const cleanPropName = (basicInput?.name || 'hotel')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const scopeTag = selectedDepts.length === 1 
      ? `_${selectedDepts[0]}` 
      : selectedDepts.length > 1 
      ? `_${selectedDepts.join('-')}` 
      : '_all_depts';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${cleanPropName}_payroll_expenses_${selectedMode}${scopeTag}_${dateStr}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Export Departmental Payroll & Expenses (CSV)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard CSV format for Excel, Google Sheets, ERP, BI pipelines, or Python/Pandas processing.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Format / Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              1. Select CSV Format Structure
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                onClick={() => setSelectedMode('comprehensive')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedMode === 'comprehensive' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-slate-800 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-emerald-600" /> Comprehensive
                  </span>
                  {selectedMode === 'comprehensive' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Includes property metadata, department rollup summaries, and line-by-line itemized breakdown.
                </p>
              </div>

              <div 
                onClick={() => setSelectedMode('flat')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedMode === 'flat' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-slate-800 flex items-center">
                    <Table className="w-4 h-4 mr-2 text-blue-600" /> Flat Normalized
                  </span>
                  {selectedMode === 'flat' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Single tabular dataset with standardized columns. Ideal for automated ETL, Pandas, SQL databases.
                </p>
              </div>

              <div 
                onClick={() => setSelectedMode('summary')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedMode === 'summary' 
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-slate-800 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-purple-600" /> Summary Rollup
                  </span>
                  {selectedMode === 'summary' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Aggregated department totals: Pax, monthly & annual payroll, expenses, and total costs.
                </p>
              </div>
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Department Scope
              </label>
              <button 
                type="button" 
                onClick={selectAllDepts} 
                className={`text-xs font-bold ${selectedDepts.length === 0 ? 'text-emerald-700' : 'text-blue-600 hover:underline'}`}
              >
                {selectedDepts.length === 0 ? '✓ All Departments Selected' : 'Select All Departments'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllDepts}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDepts.length === 0 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Departments
              </button>
              {Object.entries(DEPARTMENT_LABELS).map(([code, label]) => {
                const isSelected = selectedDepts.length === 0 || selectedDepts.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleDept(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
                Live CSV Output Preview
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                UTF-8 with BOM • RFC 4180
              </span>
            </div>
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-56 shadow-inner whitespace-pre leading-relaxed border border-slate-800">
              {previewSnippet}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500">
            Exporting data for <span className="font-bold text-slate-800">{basicInput?.name || 'Property'}</span>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-bold flex items-center justify-center transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5 text-slate-500" /> Copy CSV
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" /> Download .CSV File
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
