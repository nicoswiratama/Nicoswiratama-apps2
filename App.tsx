import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp, 
  Menu,
  Calculator,
  Hotel,
  Printer,
  AlertCircle,
  CheckCircle,
  BrainCircuit,
  DollarSign,
  ChevronRight,
  ArrowRight,
  BedDouble,
  Utensils,
  Wrench,
  Briefcase,
  Megaphone,
  Save,
  MapPin,
  Search,
  Star,
  Globe,
  Plus,
  Trash2,
  Filter,
  Navigation,
  Monitor,
  CloudLightning,
  Loader,
  PieChart,
  BarChart3,
  CalendarDays,
  Target,
  RefreshCw,
  TrendingDown,
  Download,
  ToggleLeft,
  ToggleRight,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ClipboardCheck,
  Zap,
  Droplets,
  ShieldCheck,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';

/**
 * THELOKA PRO v16.0 - Dynamic AI Scaling Edition
 */

// --- UTILITIES ---
const formatIDR = (amount: number) => {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

const getDaysInMonth = (monthIndex: number) => {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[monthIndex];
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- DATA CONSTANTS ---
const BASE_SEASONALITY = [0.70, 0.65, 0.60, 0.75, 0.70, 0.80, 0.85, 0.88, 0.75, 0.72, 0.68, 0.90];

const HOTEL_NAMES_DB = [
  "Village Resort", "Boutique Villa", "Luxury Suites", "Garden Stay", 
  "Hideaway", "Sanctuary", "Retreat", "Cottages", "Residence", "Haven"
];

// --- CORE LOGIC (THE BRAIN) ---
const ThelokaBrain = {
  calculateRevenue: (rooms: number, monthlyTargets: any[]) => {
    let yearlyStats = { available: 0, sold: 0, roomRevenue: 0, guests: 0 };
    const monthlyBreakdown = monthlyTargets.map((target, idx) => {
      const days = getDaysInMonth(idx);
      const available = rooms * days;
      const sold = Math.round(available * (target.occ / 100));
      const revenue = sold * target.arr;
      const guests = sold * 2; 
      const revpar = revenue / available;
      yearlyStats.available += available;
      yearlyStats.sold += sold;
      yearlyStats.roomRevenue += revenue;
      yearlyStats.guests += guests;
      return { month: MONTH_NAMES[idx], days, available, sold, occ: target.occ, arr: target.arr, revenue, revpar, guests };
    });
    const avgOcc = yearlyStats.sold / yearlyStats.available;
    const avgArr = yearlyStats.roomRevenue / yearlyStats.sold;
    return { monthlyBreakdown, yearlyStats, avgOcc, avgArr };
  },

  getDynamicManning: (rooms: number, hasRestaurant: boolean) => {
    return {
      fo: {
        roles: [
          { role: 'Front Office Manager', salary: 9000000, count: rooms > 20 ? 1 : 0 },
          { role: 'FO Supervisor', salary: 5000000, count: Math.ceil(rooms / 40) },
          { role: 'GSA / Bell Driver', salary: 3400000, count: Math.max(2, Math.ceil(rooms / 10)) },
        ],
        expenses: [
          { name: 'Guest Supplies & Amenities', type: 'percent', value: 1.0 }, 
          { name: 'Uniforms & Laundry', type: 'fixed', value: 3000000 + (rooms * 20000) },
          { name: 'Printing & Stationery', type: 'fixed', value: 2000000 + (rooms * 10000) },
          { name: 'Comms & Internet', type: 'fixed', value: 2500000 },
        ]
      },
      hk: {
        roles: [
          { role: 'Exec Housekeeper', salary: 10000000, count: rooms > 30 ? 1 : 0 },
          { role: 'HK Supervisor', salary: 5000000, count: Math.ceil(rooms / 25) },
          { role: 'HK Attendant', salary: 3200000, count: Math.ceil(rooms / 6) },
          { role: 'Gardener/Pool', salary: 3200000, count: Math.max(1, Math.ceil(rooms / 15)) },
        ],
        expenses: [
          { name: 'Cleaning Supplies', type: 'percent', value: 1.5 },
          { name: 'Linen & Towel Replacement', type: 'percent', value: 0.8 },
          { name: 'Guest Amenities (Soap/Shampoo)', type: 'percent', value: 2.0 },
          { name: 'Pest Control Contract', type: 'fixed', value: 3000000 + (rooms * 15000) },
          { name: 'Decorations & Flowers', type: 'fixed', value: 2000000 + (rooms * 10000) },
        ]
      },
      fb: {
        roles: hasRestaurant ? [
          { role: 'F&B Manager', salary: 10000000, count: rooms > 40 ? 1 : 0 },
          { role: 'Chef / Kitchen', salary: 5500000, count: Math.max(2, Math.ceil(rooms / 8)) },
          { role: 'Waiter/Waitress', salary: 3200000, count: Math.max(2, Math.ceil(rooms / 8)) },
        ] : [
          { role: 'Breakfast Cook (Casual)', salary: 3200000, count: Math.ceil(rooms / 20) },
        ],
        expenses: [
          { name: 'Cost of Food (HPP)', type: 'percent', value: 32.0 },
          { name: 'Gas / Fuel (Kitchen)', type: 'percent', value: 1.5 },
          { name: 'Chinaware/Glassware Replacement', type: 'fixed', value: 2000000 + (rooms * 10000) },
          { name: 'Cleaning Supplies (Stewarding)', type: 'fixed', value: 1500000 + (rooms * 5000) },
        ]
      },
      pomec: {
        roles: [
          { role: 'Chief Engineering', salary: 9000000, count: rooms > 30 ? 1 : 0 },
          { role: 'Engineering Staff', salary: 3800000, count: Math.max(1, Math.ceil(rooms / 15)) },
        ],
        expenses: [
          { name: 'Electricity & Water (Utility)', type: 'percent', value: 5.0 },
          { name: 'R&M Building', type: 'fixed', value: 5000000 + (rooms * 50000) },
          { name: 'R&M Equipment/Pool', type: 'fixed', value: 3000000 + (rooms * 30000) },
          { name: 'Sparepart Stock', type: 'fixed', value: 2000000 },
        ]
      },
      admin: {
        roles: [
          { role: 'General Manager', salary: 25000000, count: 1 },
          { role: 'Chief Accountant', salary: 10000000, count: 1 },
          { role: 'HR Manager', salary: 8000000, count: rooms > 40 ? 1 : 0 },
          { role: 'Security', salary: 3400000, count: Math.max(3, Math.ceil(rooms / 10)) },
        ],
        expenses: [
          { name: 'Legal & Licenses', type: 'fixed', value: 5000000 },
          { name: 'Travel & Entertainment', type: 'fixed', value: 5000000 + (rooms * 20000) },
          { name: 'Office Supplies', type: 'fixed', value: 2500000 },
          { name: 'Staff Welfare/Meal', type: 'percent', value: 1.2 },
        ]
      },
      sales: {
        roles: [
          { role: 'Sales Manager', salary: 10000000, count: 1 },
          { role: 'Marcom / Reservation', salary: 4500000, count: Math.max(1, Math.ceil(rooms / 30)) },
        ],
        expenses: [
          { name: 'Digital Marketing Ads', type: 'percent', value: 2.5 },
          { name: 'OTA Commission (Blended)', type: 'percent', value: 2.0 },
          { name: 'Travel Agent Fam Trip', type: 'fixed', value: 3000000 },
        ]
      }
    };
  },

  generateProjection: (basicInput: any, revenueData: any) => {
    const { rooms, hasRestaurant, fbRatio, otherStreams } = basicInput;
    const annualRoomRev = Number(revenueData.yearlyStats.roomRevenue);
    let annualFbRev = 0;
    if (hasRestaurant) {
      const ratio = fbRatio / 100;
      annualFbRev = annualRoomRev * ratio;
    }
    let annualOtherRev = 0;
    const processedOtherStreams = otherStreams.map((stream: any) => {
      if (!stream.active) return { ...stream, total: 0 };
      let val = 0;
      if (stream.type === 'percent') val = annualRoomRev * (stream.value / 100);
      else val = stream.value * 12; 
      return { ...stream, total: val };
    });
    annualOtherRev = processedOtherStreams.reduce((acc: number, curr: any) => acc + curr.total, 0);
    const annualTotalRev = annualRoomRev + annualFbRev + annualOtherRev;
    const DEPT_STRUCTURE: any = ThelokaBrain.getDynamicManning(rooms, hasRestaurant);

    const calcDept = (deptCode: string) => {
      const roles = JSON.parse(JSON.stringify(DEPT_STRUCTURE[deptCode].roles));
      const expenseItems = JSON.parse(JSON.stringify(DEPT_STRUCTURE[deptCode].expenses));
      const payroll = roles.reduce((acc: number, r: any) => acc + (Number(r.count) * Number(r.salary) * 1.2 * 12), 0);
      let totalExpense = 0;
      expenseItems.forEach((item: any) => {
        if (item.type === 'percent') {
          const baseRev = deptCode === 'fb' ? annualFbRev : annualTotalRev;
          item.calcValue = (Number(baseRev) || 0) * (Number(item.value) / 100);
        } else {
          item.calcValue = Number(item.value) * 12; 
        }
        totalExpense += Number(item.calcValue);
      });
      return { payroll, totalExpense, roles, expenseItems };
    };

    const depts = {
      fo: calcDept('fo'), hk: calcDept('hk'), fb: calcDept('fb'), 
      pomec: calcDept('pomec'), admin: calcDept('admin'), sales: calcDept('sales'),
    };

    return {
      revenue: { room: annualRoomRev, fb: annualFbRev, other: annualOtherRev, streams: processedOtherStreams, total: annualTotalRev },
      depts,
      occupancy: revenueData.avgOcc
    };
  },

  generateLongTerm: (year1Data: any, growthParams: any) => {
    const { revGrowth, costInflation } = growthParams;
    let projections = [];
    const y1TotalExp = (Object.values(year1Data.depts) as any[]).reduce((a: number,b: any) => a + Number(b.payroll) + Number(b.totalExpense), 0);
    for(let i=0; i<10; i++) {
      const year = i + 1;
      const rFactor = Math.pow(1 + (Number(revGrowth)), i); 
      const cFactor = Math.pow(1 + (Number(costInflation)), i); 
      const rev = Number(year1Data.revenue.total) * rFactor;
      const exp = y1TotalExp * cFactor;
      const gop = rev - exp;
      projections.push({ year, revenue: rev, expense: exp, gop: gop, margin: gop / rev });
    }
    return projections;
  }
};

// --- UI COMPONENTS ---

const InputCard = ({ label, value, onChange, type="text", suffix, icon: Icon, disabled=false, placeholder="" }: any) => (
  <div className="mb-4">
    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 flex items-center ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>
      {Icon && <Icon className="w-3 h-3 mr-1.5" />} {label}
    </label>
    <div className="relative">
      <input 
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-900 outline-none transition-colors font-semibold ${disabled ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700'}`}
      />
      {suffix && <span className={`absolute right-3 top-2 text-sm font-medium ${disabled ? 'text-slate-300' : 'text-slate-400'}`}>{suffix}</span>}
    </div>
  </div>
);

const DeptTable = ({ title, roles, expenseItems, revenueBasis, onUpdateRole, onAddRole, onRemoveRole, onUpdateExpenseItem, onAddExpenseItem, onRemoveExpenseItem }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-fade-in print-break-inside-avoid">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-blue-600" /> {title}</h3>
        <div className="text-xs text-slate-500 italic bg-white px-2 py-1 rounded border">Editable Mode</div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-blue-900 uppercase flex items-center"><Users className="w-3 h-3 mr-1" /> Manning & Payroll</h4>
          <button onClick={onAddRole} className="text-[10px] flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold transition-colors"><Plus className="w-3 h-3 mr-1" /> Tambah Posisi</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-100">
              <tr><th className="pb-2 pl-2">Position</th><th className="pb-2 text-center w-16">Pax</th><th className="pb-2 text-right w-32">Salary (IDR)</th><th className="pb-2 text-right w-32">Total</th><th className="pb-2 w-8"></th></tr>
            </thead>
            <tbody className="text-sm">
              {roles.map((role: any, idx: number) => (
                <tr key={idx} className="group hover:bg-slate-50 border-b border-slate-50 last:border-0">
                  <td className="py-2 pl-2"><input value={role.role} onChange={(e) => onUpdateRole(idx, 'role', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:border-blue-300 outline-none font-medium text-slate-700"/></td>
                  <td className="py-2 text-center"><input type="number" value={role.count} onChange={(e) => onUpdateRole(idx, 'count', parseInt(e.target.value) || 0)} className="w-12 text-center bg-white border border-slate-200 rounded py-1 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"/></td>
                  <td className="py-2 text-right"><input type="number" value={role.salary} onChange={(e) => onUpdateRole(idx, 'salary', parseInt(e.target.value) || 0)} className="w-28 text-right bg-white border border-slate-200 rounded px-2 py-1 focus:border-blue-300 outline-none text-slate-600"/></td>
                  <td className="py-2 text-right font-bold text-slate-700">{formatIDR(role.count * role.salary)}</td>
                  <td className="py-2 text-center"><button onClick={() => onRemoveRole(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
         <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-orange-600 uppercase flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Biaya Operasional (Expenses)</h4>
          <button onClick={onAddExpenseItem} className="text-[10px] flex items-center bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 font-bold transition-colors"><Plus className="w-3 h-3 mr-1" /> Tambah Biaya</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-100">
              <tr><th className="pb-2 pl-2">Item Biaya</th><th className="pb-2 w-24">Type</th><th className="pb-2 text-right w-24">Value</th><th className="pb-2 text-right w-32">Est. Monthly</th><th className="pb-2 w-8"></th></tr>
            </thead>
            <tbody className="text-sm">
              {expenseItems.map((item: any, idx: number) => (
                <tr key={idx} className="group hover:bg-white border-b border-slate-100 last:border-0 transition-colors">
                  <td className="py-2 pl-2"><input value={item.name} onChange={(e) => onUpdateExpenseItem(idx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:border-orange-300 outline-none font-medium text-slate-700"/></td>
                  <td className="py-2">
                    <select value={item.type} onChange={(e) => onUpdateExpenseItem(idx, 'type', e.target.value)} className="text-xs border border-slate-200 rounded px-1 py-1 bg-white focus:ring-1 focus:ring-orange-400">
                      <option value="fixed">Fixed (Rp)</option><option value="percent">% Revenue</option>
                    </select>
                  </td>
                  <td className="py-2 text-right"><div className="relative"><input type="number" value={item.value} onChange={(e) => onUpdateExpenseItem(idx, 'value', parseFloat(e.target.value) || 0)} className="w-full text-right bg-white border border-slate-200 rounded px-2 py-1 focus:border-orange-300 outline-none text-slate-700 font-bold"/>{item.type === 'percent' && <span className="absolute right-6 top-1 text-xs text-slate-400">%</span>}</div></td>
                  <td className="py-2 text-right text-slate-600 text-xs font-mono">{formatIDR(item.type === 'percent' ? (revenueBasis/12) * (item.value/100) : item.value)}</td>
                  <td className="py-2 text-center"><button onClick={() => onRemoveExpenseItem(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [activeView, setActiveView] = useState('setup');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // -- SETUP STATE --
  const [basicInput, setBasicInput] = useState({
    name: 'Skyaloka Resort Bali',
    location: 'Ubud', 
    address: 'Jl. Richloka 88, Ubud', 
    rooms: 80,
    adr: 2500000, 
    targetOcc: 70, 
    type: 'Resort',
    feeModel: '15_percent', 
    customFee: { revPct: 15, baseRevPct: 5, gopPct: 10 },
    hasRestaurant: true,
    fbRatio: 25,
    otherStreams: [
      { id: 1, name: 'Laundry', value: 1.5, type: 'percent', active: true },
      { id: 2, name: 'Spa & Wellness', value: 3.0, type: 'percent', active: true }
    ]
  });

  // -- PROPERTY SURVEY STATE --
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [singleAiAnalysis, setSingleAiAnalysis] = useState<string>("");
  const [singleAiLoading, setSingleAiLoading] = useState(false);

  const [currentSurvey, setCurrentSurvey] = useState({
    date: new Date().toISOString().split('T')[0],
    property: "",
    address: "",
    rooms: 0,
    inspector: "",
    facilities: [
      { item: "Room Quality / Bedding", status: "Good", notes: "" },
      { item: "AC / Ventilation", status: "Good", notes: "" },
      { item: "Bathroom / Plumbing", status: "Good", notes: "" },
      { item: "Electrical / Lighting", status: "Good", notes: "" },
      { item: "Pool / Public Area", status: "Good", notes: "" }
    ],
    services: [
      { item: "Staff Grooming & Uniform", status: "Good", notes: "" },
      { item: "Check-in Process", status: "Good", notes: "" },
      { item: "Security Protocol", status: "Good", notes: "" },
      { item: "Cleanliness Standard", status: "Good", notes: "" }
    ],
    generalNotes: ""
  });

  const [monthlyTargets, setMonthlyTargets] = useState(
    BASE_SEASONALITY.map((occ, idx) => ({ 
      monthIdx: idx, 
      occ: occ * 100, 
      arr: 2500000 
    }))
  );

  const [projectedData, setProjectedData] = useState<any>(null);
  const [longTermData, setLongTermData] = useState<any>(null);
  const [growthParams, setGrowthParams] = useState({ revGrowth: 0.05, costInflation: 0.03 });
  const [dashboardTimeframe, setDashboardTimeframe] = useState(10); 

  const [competitors, setCompetitors] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState("");
  const [suggestedRate, setSuggestedRate] = useState({ low: 0, mid: 0, high: 0 });
  const [newCompetitor, setNewCompetitor] = useState({ name: '', rate: 0, dist: 0 });

  // -- HANDLERS --
  const handleGenerate = () => {
    const revenueDetails = ThelokaBrain.calculateRevenue(basicInput.rooms, monthlyTargets);
    const data: any = ThelokaBrain.generateProjection(basicInput, revenueDetails);
    data.revenueDetails = revenueDetails;
    setProjectedData(data);
    const lt = ThelokaBrain.generateLongTerm(data, growthParams);
    setLongTermData(lt);
    setActiveView('dashboard'); 
  };

  const handleMonthlyChange = (idx: number, field: string, val: string) => {
    const newTargets: any = [...monthlyTargets];
    newTargets[idx][field] = parseFloat(val) || 0;
    setMonthlyTargets(newTargets);
  };

  const updateAndRecalculate = () => {
    handleGenerate();
  };

  const optimizeRevenue = () => {
    const optimized = monthlyTargets.map((m, i) => {
      let newOcc = m.occ;
      let newArr = basicInput.adr;
      if ([5,6,7,11].includes(i)) { newArr = basicInput.adr * 1.25; newOcc = Math.min(95, m.occ + 5); } 
      else if ([0,1,9,10].includes(i)) { newArr = basicInput.adr * 0.85; newOcc = Math.max(40, m.occ - 5); }
      return { ...m, occ: newOcc, arr: newArr };
    });
    setMonthlyTargets(optimized);
  };

  const simulateAiGrowth = () => {
    const newGrowth = 0.05 + (Math.random() * 0.03); 
    const newCost = 0.03 + (Math.random() * 0.01); 
    setGrowthParams({ revGrowth: newGrowth, costInflation: newCost });
    if (projectedData) {
      const lt = ThelokaBrain.generateLongTerm(projectedData, { revGrowth: newGrowth, costInflation: newCost });
      setLongTermData(lt);
    }
    alert(`AI Optimization Applied: Revenue Growth set to ${(newGrowth*100).toFixed(1)}%, Cost Inflation to ${(newCost*100).toFixed(1)}%`);
  };

  // Property Survey Handlers using gemini-3-pro-preview for high reasoning
  const saveSurvey = () => {
    if (!currentSurvey.property || !currentSurvey.inspector) {
      alert("Harap isi Nama Properti dan Inspektur");
      return;
    }
    setSurveys([...surveys, { ...currentSurvey, id: Date.now() }]);
    alert("Survey Berhasil Direkam ke Database");
    setCurrentSurvey({
      ...currentSurvey,
      property: "",
      address: "",
      rooms: 0,
      generalNotes: "",
      facilities: currentSurvey.facilities.map(f => ({ ...f, status: "Good", notes: "" })),
      services: currentSurvey.services.map(s => ({ ...s, status: "Good", notes: "" }))
    });
  };

  const analyzeSurveysWithAI = async () => {
    if (surveys.length === 0) {
      alert("Belum ada data survey untuk dianalisis.");
      return;
    }
    setSurveyLoading(true);
    try {
      // Create new instance before call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const surveyText = JSON.stringify(surveys);
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analyze these hotel property surveys and provide a strategic summary. Identify recurring problems, maintenance risks, and overall readiness for high-standard management. Surveys: ${surveyText}`,
      });
      setAiAnalysis(response.text || "Gagal mendapatkan analisis.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Error saat menghubungi AI. Pastikan API Key valid.");
    } finally {
      setSurveyLoading(false);
    }
  };

  const analyzeSingleSurveyAI = async (survey: any) => {
    setSingleAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const surveyData = JSON.stringify(survey);
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Review this property survey: ${surveyData}. Give a summary insight and a "Manage Recommendation" (Recommended, Needs Audit, or High Risk). Why? Keep it concise.`,
      });
      setSingleAiAnalysis(response.text || "No insights found.");
    } catch (error) {
      console.error(error);
      setSingleAiAnalysis("AI Error. Check API Key.");
    } finally {
      setSingleAiLoading(false);
    }
  };

  // -- COMPETITOR HANDLERS --
  const simulateScraping = () => {
    setIsScanning(true);
    setCompetitors([]);
    setScanLog("Scanning area...");
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if(step > 3) { clearInterval(interval); generateMockCompetitors(); }
    }, 500);
  };

  const generateMockCompetitors = () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const price = basicInput.adr * (0.8 + Math.random() * 0.4);
      results.push({
        name: `${basicInput.location} ${HOTEL_NAMES_DB[i]}`,
        rate: Math.round(price/10000)*10000,
        dist: (Math.random()*5).toFixed(1)
      });
    }
    setCompetitors(results);
    setIsScanning(false);
    calculateRecommendations(results);
  };

  const calculateRecommendations = (data: any[]) => {
    if (data.length === 0) return;
    const sorted = [...data].sort((a,b) => a.rate - b.rate);
    const low = sorted[0].rate;
    const high = sorted[sorted.length-1].rate;
    const avg = data.reduce((a,b)=>a+b.rate,0)/data.length;
    setSuggestedRate({ low: low * 0.95, mid: avg, high: high * 1.05 });
  };

  // Fixed missing applySuggestedRate function
  const applySuggestedRate = (rate: number) => {
    const roundedRate = Math.round(rate);
    setBasicInput(prev => ({ ...prev, adr: roundedRate }));
    // Globally update the ADR in monthly targets for consistent baseline projection
    setMonthlyTargets(prev => prev.map(m => ({ ...m, arr: roundedRate })));
  };

  const handlePrint = () => window.print();

  // -- DEPARTMENT HANDLERS --
  const updateRole = (dept: string, idx: number, field: string, val: any) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].roles[idx][field] = val;
    recalcTotalExpense(newData, dept);
  };
  const addRole = (dept: string) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].roles.push({ role: 'New Position', salary: 3200000, count: 1 });
    recalcTotalExpense(newData, dept);
  };
  const removeRole = (dept: string, idx: number) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].roles.splice(idx, 1);
    recalcTotalExpense(newData, dept);
  };
  const updateExpenseItem = (dept: string, idx: number, field: string, val: any) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].expenseItems[idx][field] = val;
    recalcTotalExpense(newData, dept);
  };
  const addExpenseItem = (dept: string) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].expenseItems.push({ name: 'New Expense', type: 'fixed', value: 1000000, calcValue: 0 });
    recalcTotalExpense(newData, dept);
  };
  const removeExpenseItem = (dept: string, idx: number) => {
    if (!projectedData) return;
    const newData = { ...projectedData };
    newData.depts[dept].expenseItems.splice(idx, 1);
    recalcTotalExpense(newData, dept);
  };
  const recalcTotalExpense = (data: any, dept: string) => {
    const annualRoomRev = data.revenue.room;
    const annualFbRev = data.revenue.fb;
    const annualTotalRev = data.revenue.total;
    const baseRev = dept === 'fb' ? annualFbRev : annualTotalRev;
    const payroll = data.depts[dept].roles.reduce((acc: number, r: any) => acc + (r.count * r.salary * 1.2 * 12), 0);
    data.depts[dept].payroll = payroll;
    let totalExp = 0;
    data.depts[dept].expenseItems.forEach((item: any) => {
      if (item.type === 'percent') item.calcValue = baseRev * (item.value / 100);
      else item.calcValue = item.value * 12;
      totalExp += item.calcValue;
    });
    data.depts[dept].totalExpense = totalExp;
    setProjectedData(data);
    if (longTermData) {
       const lt = ThelokaBrain.generateLongTerm(data, growthParams);
       setLongTermData(lt);
    }
  };

  // --- RENDERERS ---

  const renderSidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 w-64 text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl overflow-y-auto print:hidden`}>
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div className="bg-yellow-400 p-1.5 rounded-lg mr-3 shadow-lg">
          <Hotel className="w-5 h-5 text-blue-900" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wider">THELOKA</h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">System Pro v16.0</p>
        </div>
      </div>
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase">Core Setup</div>
        <button onClick={() => setActiveView('setup')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'setup' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Settings className="w-4 h-4 mr-3" /> Quick Setup</button>
        <button onClick={() => setActiveView('revenue')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'revenue' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><BarChart3 className="w-4 h-4 mr-3" /> Revenue Management</button>
        <button onClick={() => setActiveView('competitor')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'competitor' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Globe className="w-4 h-4 mr-3" /> Market Intelligence</button>
        
        <div className="px-3 mb-2 mt-6 text-[10px] font-bold text-slate-500 uppercase">Field Operations</div>
        <button onClick={() => setActiveView('property_survey')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'property_survey' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><ClipboardCheck className="w-4 h-4 mr-3" /> Property Survey</button>

        <div className="px-3 mb-2 mt-6 text-[10px] font-bold text-slate-500 uppercase">Analysis</div>
        <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard Summary</button>

        <div className="px-3 mb-2 mt-6 text-[10px] font-bold text-slate-500 uppercase">Departments</div>
        <button onClick={() => setActiveView('room_div')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'room_div' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><BedDouble className="w-4 h-4 mr-3" /> Rooms (FO & HK)</button>
        <button onClick={() => setActiveView('fb_div')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'fb_div' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Utensils className="w-4 h-4 mr-3" /> Food & Beverage</button>
        <button onClick={() => setActiveView('pomec_div')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'pomec_div' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Wrench className="w-4 h-4 mr-3" /> POMEC (Eng)</button>
        <button onClick={() => setActiveView('admin_div')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'admin_div' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Briefcase className="w-4 h-4 mr-3" /> A&G / HRD</button>
        <button onClick={() => setActiveView('sales_div')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'sales_div' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Megaphone className="w-4 h-4 mr-3" /> Sales & Marketing</button>

        <div className="px-3 mb-2 mt-6 text-[10px] font-bold text-slate-500 uppercase">Reports</div>
        <button onClick={() => setActiveView('pnl')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm ${activeView === 'pnl' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><FileText className="w-4 h-4 mr-3" /> Consolidated P&L</button>
      </div>
    </aside>
  );

  const renderPropertySurvey = () => {
    const addFacility = () => {
      setCurrentSurvey({
        ...currentSurvey,
        facilities: [...currentSurvey.facilities, { item: "New Item", status: "Good", notes: "" }]
      });
    };
    const removeFacility = (idx: number) => {
      setCurrentSurvey({
        ...currentSurvey,
        facilities: currentSurvey.facilities.filter((_, i) => i !== idx)
      });
    };
    const updateFacility = (idx: number, field: string, val: string) => {
      const newF = [...currentSurvey.facilities];
      (newF[idx] as any)[field] = val;
      setCurrentSurvey({ ...currentSurvey, facilities: newF });
    };

    const addService = () => {
      setCurrentSurvey({
        ...currentSurvey,
        services: [...currentSurvey.services, { item: "New Item", status: "Good", notes: "" }]
      });
    };
    const removeService = (idx: number) => {
      setCurrentSurvey({
        ...currentSurvey,
        services: currentSurvey.services.filter((_, i) => i !== idx)
      });
    };
    const updateService = (idx: number, field: string, val: string) => {
      const newS = [...currentSurvey.services];
      (newS[idx] as any)[field] = val;
      setCurrentSurvey({ ...currentSurvey, services: newS });
    };

    const filteredSurveys = surveys.filter(s => 
      s.property.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.inspector.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openSurveyDetail = (s: any) => {
      setSelectedSurvey(s);
      setSingleAiAnalysis("");
      analyzeSingleSurveyAI(s);
    };

    return (
      <div className="max-w-6xl mx-auto pt-6 animate-fade-in relative">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center"><ClipboardCheck className="w-7 h-7 mr-3 text-orange-600" /> Property Operational Survey</h2>
            <p className="text-slate-500 mt-1">Checklist fasilitas & kualitas layanan tim operasional.</p>
          </div>
          <button onClick={analyzeSurveysWithAI} disabled={surveyLoading} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
            {surveyLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2 text-yellow-400" />}
            Global AI Summary
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center"><Plus className="w-5 h-5 mr-2 text-orange-500"/> Data Survey Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-8">
                <InputCard label="Nama Properti" value={currentSurvey.property} onChange={(e:any)=>setCurrentSurvey({...currentSurvey, property: e.target.value})} placeholder="Contoh: Villa Seminyak" />
                <InputCard label="Alamat Properti" value={currentSurvey.address} onChange={(e:any)=>setCurrentSurvey({...currentSurvey, address: e.target.value})} placeholder="Jl. Alamat No. 123" />
                <InputCard label="Jumlah Kamar" value={currentSurvey.rooms} type="number" onChange={(e:any)=>setCurrentSurvey({...currentSurvey, rooms: parseInt(e.target.value)||0})} placeholder="0" />
                <InputCard label="Inspector Name" value={currentSurvey.inspector} onChange={(e:any)=>setCurrentSurvey({...currentSurvey, inspector: e.target.value})} placeholder="Nama tim survey" />
              </div>

              <div className="space-y-8">
                {/* FACILITIES SECTION */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest flex items-center">
                      <Zap className="w-3 h-3 mr-2 text-yellow-500" /> Facilities Assessment
                    </h4>
                    <button onClick={addFacility} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-4">
                    {currentSurvey.facilities.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100 group relative">
                        <div className="md:col-span-4">
                          <input 
                            value={item.item}
                            onChange={(e) => updateFacility(idx, 'item', e.target.value)}
                            className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-blue-300 outline-none"
                            placeholder="Facility name..."
                          />
                        </div>
                        <div className="md:col-span-3">
                          <select 
                            value={item.status} 
                            onChange={(e) => updateFacility(idx, 'status', e.target.value)}
                            className={`w-full text-xs font-bold border rounded px-2 py-1.5 focus:ring-1 outline-none ${item.status === 'Good' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : item.status === 'Minor Issue' ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-rose-600 bg-rose-50 border-rose-200'}`}
                          >
                            <option value="Good">Good Condition</option>
                            <option value="Minor Issue">Perlu Perbaikan Kecil</option>
                            <option value="Poor/Broken">Rusak / Perlu Penggantian</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <input 
                            placeholder="Catatan tambahan..." 
                            value={item.notes}
                            onChange={(e) => updateFacility(idx, 'notes', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-300" 
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                           <button onClick={() => removeFacility(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SERVICES SECTION */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center">
                      <Sparkles className="w-3 h-3 mr-2 text-emerald-500" /> Service Quality Assessment
                    </h4>
                    <button onClick={addService} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold hover:bg-emerald-100 flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-4">
                    {currentSurvey.services.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100 group relative">
                        <div className="md:col-span-4">
                          <input 
                            value={item.item}
                            onChange={(e) => updateService(idx, 'item', e.target.value)}
                            className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-emerald-300 outline-none"
                            placeholder="Service point..."
                          />
                        </div>
                        <div className="md:col-span-3">
                          <select 
                            value={item.status} 
                            onChange={(e) => updateService(idx, 'status', e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 rounded px-2 py-1.5 focus:ring-1 outline-none bg-white text-slate-600"
                          >
                            <option value="Good">Excellent / Standard</option>
                            <option value="Needs Training">Butuh Training Staf</option>
                            <option value="Poor">Dibawah Standar</option>
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <input 
                            placeholder="Detail temuan..." 
                            value={item.notes}
                            onChange={(e) => updateService(idx, 'notes', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none focus:border-emerald-300" 
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                           <button onClick={() => removeService(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">General Recommendation / Notes</label>
                  <textarea 
                    rows={3} 
                    value={currentSurvey.generalNotes}
                    onChange={(e)=>setCurrentSurvey({...currentSurvey, generalNotes: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                    placeholder="Berikan kesimpulan umum hasil survey..."
                  />
                </div>

                <button onClick={saveSurvey} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-all shadow-md flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" /> RECORD SURVEY RESULT
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center"><Target className="w-5 h-5 mr-2 text-blue-500"/> Survey History</h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari properti..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-32"
                  />
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredSurveys.length === 0 && <p className="text-xs text-slate-400 italic text-center py-8">Belum ada survey yang ditemukan.</p>}
                {filteredSurveys.map((s, idx) => (
                  <div 
                    key={s.id} 
                    onClick={() => openSurveyDetail(s)}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all group relative cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{s.property}</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 font-mono border">{s.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">Address: {s.address || "-"}</div>
                    <div className="text-[11px] text-slate-500">Rooms: {s.rooms || 0}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Inspector: {s.inspector}</div>
                    <button onClick={(e) => { e.stopPropagation(); setSurveys(surveys.filter((item) => item.id !== s.id)); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-500 transition-all p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit className="w-20 h-20" />
                </div>
                <h3 className="font-bold text-yellow-400 mb-3 flex items-center text-sm"><Sparkles className="w-4 h-4 mr-2" /> Global Market Analysis</h3>
                <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
                <button onClick={() => setAiAnalysis("")} className="mt-4 text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest">Clear Analysis</button>
              </div>
            )}
          </div>
        </div>

        {selectedSurvey && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <ClipboardCheck className="w-6 h-6 mr-2 text-orange-600" />
                    Survey Detail: {selectedSurvey.property}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Inspected on {selectedSurvey.date} by {selectedSurvey.inspector}</p>
                </div>
                <button onClick={() => setSelectedSurvey(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Address</span>
                          <span className="font-semibold text-slate-800">{selectedSurvey.address || "-"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Rooms</span>
                          <span className="font-semibold text-slate-800">{selectedSurvey.rooms} Rooms</span>
                        </div>
                      </div>
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase mb-4 flex items-center"><Zap className="w-3 h-3 mr-2 text-yellow-500" /> Facilities Assessment</h4>
                      <div className="space-y-2">
                        {selectedSurvey.facilities.map((f: any, i: number) => (
                          <div key={i} className="flex flex-col p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-slate-700">{f.item}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.status === 'Good' ? 'bg-emerald-100 text-emerald-700' : f.status === 'Minor Issue' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>{f.status}</span>
                            </div>
                            <span className="text-xs text-slate-500 italic">{f.notes || "No additional notes."}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-emerald-900 uppercase mb-4 flex items-center"><Sparkles className="w-3 h-3 mr-2 text-emerald-500" /> Service Quality</h4>
                      <div className="space-y-2">
                        {selectedSurvey.services.map((s: any, i: number) => (
                          <div key={i} className="flex flex-col p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-slate-700">{s.item}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'Good' ? 'bg-emerald-100 text-emerald-700' : s.status === 'Needs Training' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>{s.status}</span>
                            </div>
                            <span className="text-xs text-slate-500 italic">{s.notes || "No additional notes."}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-10"><BrainCircuit className="w-32 h-32" /></div>
                   <div className="flex-1 overflow-y-auto">
                      <h3 className="font-bold text-yellow-400 mb-6 flex items-center text-lg"><Sparkles className="w-5 h-5 mr-3" /> AI Property Analyst</h3>
                      {singleAiLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader className="w-8 h-8 animate-spin mb-4 text-blue-400" /><p className="text-sm animate-pulse">Analysing property data...</p></div>
                      ) : singleAiAnalysis ? (
                        <div className="space-y-4 animate-fade-in"><div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{singleAiAnalysis}</div></div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center"><button onClick={() => analyzeSingleSurveyAI(selectedSurvey)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg flex items-center"><BrainCircuit className="w-4 h-4 mr-2" /> Analyze Property</button></div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompetitorAnalysis = () => (
    <div className="max-w-5xl mx-auto pt-6 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Globe className="w-6 h-6 mr-3 text-blue-600" /> Market Intelligence</h2>
          <button onClick={simulateScraping} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Simulate Scan</button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-100 rounded-2xl h-80 relative flex items-center justify-center border border-slate-300 shadow-inner overflow-hidden">
             {isScanning ? <div className="text-blue-900 font-bold animate-pulse text-center">
               <CloudLightning className="w-12 h-12 mx-auto mb-2 text-blue-500 animate-bounce" />
               {scanLog}
             </div> : 
              <div className="text-center w-full h-full relative">
                {competitors.length > 0 ? 
                  <div className="absolute inset-0 p-6 space-y-2 overflow-y-auto">
                    {competitors.map((c,i)=><div key={i} className="bg-white p-3 rounded-xl shadow-sm text-xs flex justify-between items-center border border-slate-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-2 text-rose-500" />
                          <span className="font-bold text-slate-700">{c.name} ({c.dist} km)</span>
                        </div>
                        <span className="font-bold text-blue-900">{formatIDR(c.rate)}</span>
                    </div>)}
                  </div> : 
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Globe className="w-16 h-16 mb-4 opacity-10"/>
                      <p className="font-medium">Data Market belum ditarik. Klik Simulate Scan.</p>
                  </div>
                }
              </div>
             }
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">Competitors & AI Insights</h3>
             
             {competitors.length > 0 ? (
                <div className="space-y-4">
                   <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="text-[10px] font-bold text-blue-700 uppercase mb-2">AI Price Recommendation</h4>
                      <div className="space-y-2">
                        <button onClick={() => applySuggestedRate(suggestedRate.low)} className="w-full flex justify-between bg-white hover:bg-emerald-50 p-2 rounded-lg border text-[11px] transition-all group">
                          <span className="text-slate-500">Aggressive</span>
                          <span className="font-bold text-emerald-600">{formatIDR(suggestedRate.low)}</span>
                        </button>
                        <button onClick={() => applySuggestedRate(suggestedRate.mid)} className="w-full flex justify-between bg-white hover:bg-blue-50 p-2 rounded-lg border text-[11px] transition-all group">
                          <span className="text-slate-500">Competitive</span>
                          <span className="font-bold text-blue-600">{formatIDR(suggestedRate.mid)}</span>
                        </button>
                        <button onClick={() => applySuggestedRate(suggestedRate.high)} className="w-full flex justify-between bg-white hover:bg-purple-50 p-2 rounded-lg border text-[11px] transition-all group">
                          <span className="text-slate-500">Premium</span>
                          <span className="font-bold text-purple-600">{formatIDR(suggestedRate.high)}</span>
                        </button>
                      </div>
                   </div>
                   <div className="pt-4 border-t">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Add Competitor Manual</h4>
                      <input placeholder="Hotel Name" value={newCompetitor.name} onChange={(e)=>setNewCompetitor({...newCompetitor, name: e.target.value})} className="w-full text-xs border rounded-lg p-2 mb-2" />
                      <input type="number" placeholder="Price (IDR)" value={newCompetitor.rate || ''} onChange={(e)=>setNewCompetitor({...newCompetitor, rate: parseFloat(e.target.value)})} className="w-full text-xs border rounded-lg p-2 mb-2" />
                      <button onClick={() => { if(newCompetitor.name && newCompetitor.rate) { setCompetitors([...competitors, {...newCompetitor, dist: '0.0'}]); calculateRecommendations([...competitors, {...newCompetitor, dist: '0.0'}]); setNewCompetitor({name:'', rate:0, dist:0}); } }} className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-all">Add Manual</button>
                   </div>
                </div>
             ) : (
               <div className="text-center py-10 opacity-30">
                  <Monitor className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px]">Ready for Scan</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderDepartmentDetail = (type: string) => {
    if (!projectedData) return <div className="text-center p-20 text-slate-400">Silahkan isi Setup & Kalkulasi terlebih dahulu.</div>;
    const viewMap: Record<string, string[]> = { 'room_div': ['fo', 'hk'], 'fb_div': ['fb'], 'pomec_div': ['pomec'], 'admin_div': ['admin'], 'sales_div': ['sales'] };
    const keys = viewMap[type];
    
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pt-6">
         <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter">Departmental Deep-Dive: <span className="text-blue-600">{type.replace('_div', '').toUpperCase()}</span></h2>
          <button onClick={() => setActiveView('dashboard')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 transition-all shadow-md">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Return to Summary
          </button>
        </div>
        {keys.map(key => (
          <DeptTable 
            key={key}
            title={key === 'fo' ? 'Front Office' : key === 'hk' ? 'Housekeeping' : key === 'fb' ? 'F&B Department' : key === 'pomec' ? 'Engineering (POMEC)' : key === 'admin' ? 'Administration & General' : 'Sales & Marketing'}
            roles={projectedData.depts[key].roles}
            expenseItems={projectedData.depts[key].expenseItems}
            revenueBasis={projectedData.revenue.total} 
            onUpdateRole={(idx: number, field: string, val: any) => updateRole(key, idx, field, val)}
            onAddRole={() => addRole(key)}
            onRemoveRole={(idx: number) => removeRole(key, idx)}
            onUpdateExpenseItem={(idx: number, field: string, val: any) => updateExpenseItem(key, idx, field, val)}
            onAddExpenseItem={() => addExpenseItem(key)}
            onRemoveExpenseItem={(idx: number) => removeExpenseItem(key, idx)}
          />
        ))}
      </div>
    );
  };

  const renderSetup = () => (
    <div className="max-w-4xl mx-auto pt-10 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Setup Properti</h2>
        <p className="text-slate-500 mt-2">Isi data dasar untuk memulai kalkulasi otomatis.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Informasi Umum</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputCard label="Nama Properti" icon={Building2} value={basicInput.name} onChange={(e: any)=>setBasicInput({...basicInput, name: e.target.value})} />
                <InputCard label="Area / Kota" icon={MapPin} value={basicInput.location} onChange={(e: any)=>setBasicInput({...basicInput, location: e.target.value})} />
                <div className="col-span-2">
                   <InputCard label="Alamat Lengkap" icon={Navigation} value={basicInput.address} onChange={(e: any)=>setBasicInput({...basicInput, address: e.target.value})} />
                </div>
                <InputCard label="Jumlah Kamar" icon={BedDouble} value={basicInput.rooms} onChange={(e: any)=>setBasicInput({...basicInput, rooms: parseInt(e.target.value)||0})} type="number" />
                <InputCard label="Tipe Aset" icon={Hotel} value={basicInput.type} onChange={(e: any)=>setBasicInput({...basicInput, type: e.target.value})} />
             </div>
             <div className="mt-4 pt-4 border-t border-slate-100 bg-blue-50/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Target Harga (ADR)</label>
                    <input type="number" value={basicInput.adr} onChange={(e)=>setBasicInput({...basicInput, adr: parseFloat(e.target.value)||0})} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 font-bold text-blue-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Target Occupancy (%)</label>
                    <input type="number" value={basicInput.targetOcc} onChange={(e)=>setBasicInput({...basicInput, targetOcc: parseFloat(e.target.value)||0})} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 font-bold text-blue-900" />
                  </div>
                </div>
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
               <h3 className="font-bold text-slate-700 flex items-center"><Coins className="w-5 h-5 mr-2 text-yellow-500"/> Konfigurasi Sumber Pendapatan</h3>
               <button onClick={() => setBasicInput(prev => ({...prev, otherStreams: [...prev.otherStreams, { id: Date.now(), name: 'New Income', value: 0, type: 'percent', active: true }]}))} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full flex items-center hover:bg-blue-700">
                 <Plus className="w-3 h-3 mr-1"/> Tambah Income Lain
               </button>
             </div>
             
             <div className={`p-4 rounded-lg border mb-3 transition-colors ${basicInput.hasRestaurant ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center">
                      <Utensils className={`w-4 h-4 mr-2 ${basicInput.hasRestaurant ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${basicInput.hasRestaurant ? 'text-orange-800' : 'text-slate-500'}`}>Restoran & F&B Outlet</span>
                   </div>
                   <button onClick={() => setBasicInput({...basicInput, hasRestaurant: !basicInput.hasRestaurant})} className="text-blue-600 focus:outline-none">
                     {basicInput.hasRestaurant ? <ToggleRight className="w-8 h-8 text-blue-600"/> : <ToggleLeft className="w-8 h-8 text-slate-300"/>}
                   </button>
                </div>
                {basicInput.hasRestaurant && (
                   <div className="flex items-center mt-2 pl-6">
                     <input type="number" value={basicInput.fbRatio} onChange={(e)=>setBasicInput({...basicInput, fbRatio: parseFloat(e.target.value)||0})} className="w-20 bg-white border border-orange-200 rounded px-2 py-1 font-bold text-orange-900 text-sm" />
                     <span className="ml-2 text-xs text-orange-600">% dari Room Revenue</span>
                   </div>
                )}
             </div>

             {basicInput.otherStreams.map((stream, idx) => (
                <div key={stream.id} className={`p-4 rounded-lg border mb-3 transition-colors ${stream.active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center flex-1">
                         <input 
                           value={stream.name} 
                           onChange={(e) => {
                             const newS = [...basicInput.otherStreams];
                             newS[idx].name = e.target.value;
                             setBasicInput({...basicInput, otherStreams: newS});
                           }}
                           className={`bg-white border-b border-transparent focus:border-emerald-300 outline-none font-bold text-sm ${stream.active ? 'text-emerald-800' : 'text-slate-500'}`}
                         />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => {
                             const newS = [...basicInput.otherStreams];
                             newS[idx].active = !newS[idx].active;
                             setBasicInput({...basicInput, otherStreams: newS});
                        }} className="focus:outline-none">
                          {stream.active ? <ToggleRight className="w-8 h-8 text-emerald-600"/> : <ToggleLeft className="w-8 h-8 text-slate-300"/>}
                        </button>
                        <button onClick={() => {
                             const newS = [...basicInput.otherStreams];
                             newS.splice(idx, 1);
                             setBasicInput({...basicInput, otherStreams: newS});
                        }} className="text-slate-300 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                   {stream.active && (
                      <div className="flex items-center mt-2 space-x-2">
                        <input 
                          type="number" 
                          value={stream.value} 
                          onChange={(e) => {
                             const newS = [...basicInput.otherStreams];
                             newS[idx].value = parseFloat(e.target.value)||0;
                             setBasicInput({...basicInput, otherStreams: newS});
                          }}
                          className="w-24 bg-white border border-emerald-200 rounded px-2 py-1 font-bold text-emerald-900 text-sm" 
                        />
                        <select 
                          value={stream.type}
                          onChange={(e) => {
                             const newS = [...basicInput.otherStreams];
                             newS[idx].type = e.target.value;
                             setBasicInput({...basicInput, otherStreams: newS});
                          }}
                          className="text-xs border border-emerald-200 rounded px-2 py-1 bg-white text-emerald-700"
                        >
                          <option value="percent">% dari Room Rev</option>
                          <option value="fixed">Fixed (Rp) / Bulan</option>
                        </select>
                      </div>
                   )}
                </div>
             ))}
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Fee Management</h3>
          <div className="space-y-4">
             <div onClick={() => setBasicInput({...basicInput, feeModel: '15_percent'})} className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${basicInput.feeModel === '15_percent' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-slate-700">Revenue Share</span>
                  {basicInput.feeModel === '15_percent' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex items-center space-x-2">
                   <input type="number" value={basicInput.customFee.revPct} onChange={(e) => setBasicInput({...basicInput, customFee: {...basicInput.customFee, revPct: parseFloat(e.target.value)}})} className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold" disabled={basicInput.feeModel !== '15_percent'} />
                   <span className="text-sm text-slate-500">% dari Total Revenue</span>
                </div>
             </div>
             <div onClick={() => setBasicInput({...basicInput, feeModel: 'split'})} className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${basicInput.feeModel === 'split' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-slate-700">Split Fee (Incentive)</span>
                  {basicInput.feeModel === 'split' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                      <input type="number" value={basicInput.customFee.baseRevPct} onChange={(e) => setBasicInput({...basicInput, customFee: {...basicInput.customFee, baseRevPct: parseFloat(e.target.value)}})} className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold" disabled={basicInput.feeModel !== 'split'} />
                      <span className="text-xs text-slate-500">% Base Revenue</span>
                   </div>
                   <div className="flex items-center space-x-2">
                      <input type="number" value={basicInput.customFee.gopPct} onChange={(e) => setBasicInput({...basicInput, customFee: {...basicInput.customFee, gopPct: parseFloat(e.target.value)}})} className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold" disabled={basicInput.feeModel !== 'split'} />
                      <span className="text-xs text-slate-500">% Incentive GOP</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      <button onClick={handleGenerate} className="w-full mt-8 bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl text-lg">
        <BrainCircuit className="w-6 h-6 mr-3" /> CALCULATE PROJECTION
      </button>
    </div>
  );

  const renderRevenueView = () => (
    <div className="max-w-7xl mx-auto pt-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center"><BarChart3 className="w-6 h-6 mr-3 text-blue-600" /> Revenue Management</h2>
          <p className="text-sm text-slate-500 ml-9 mt-1">Monthly Detail Targets</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={optimizeRevenue} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow hover:bg-purple-700">
            <BrainCircuit className="w-4 h-4 mr-2" /> AI Optimize (Seasonality)
          </button>
          <button onClick={updateAndRecalculate} className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow hover:bg-blue-800">
            <Save className="w-4 h-4 mr-2" /> Save & Update Reports
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <th className="py-4 px-4 text-left w-32 sticky left-0 bg-slate-50">Metric</th>
                {monthlyTargets.map((m, i) => <th key={i} className="px-2 min-w-[80px]">{MONTH_NAMES[i]}</th>)}
                <th className="px-4 min-w-[100px] bg-slate-100">TOTAL</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="py-3 px-4 text-left font-bold text-slate-700 sticky left-0 bg-white">ROOMS AVAILABLE</td>
                {monthlyTargets.map((m, i) => <td key={i} className="px-2 text-slate-600">{basicInput.rooms * getDaysInMonth(i)}</td>)}
                <td className="px-4 font-bold bg-slate-50">{basicInput.rooms * 365}</td>
              </tr>
              <tr className="border-b border-slate-100 bg-blue-50/20">
                <td className="py-3 px-4 text-left font-bold text-slate-700 sticky left-0 bg-white">ROOMS SOLD</td>
                {monthlyTargets.map((m, i) => <td key={i} className="px-2 text-slate-600">{Math.round((m.occ/100) * basicInput.rooms * getDaysInMonth(i))}</td>)}
                <td className="px-4 font-bold bg-slate-50">{Math.round(monthlyTargets.reduce((a,b,i)=>a + (b.occ/100 * basicInput.rooms * getDaysInMonth(i)),0))}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-left font-bold text-blue-900 sticky left-0 bg-white">OCCUPANCY %</td>
                {monthlyTargets.map((m, i) => (
                  <td key={i} className="px-1"><input type="number" value={m.occ} onChange={(e) => handleMonthlyChange(i, 'occ', e.target.value)} className="w-full text-center bg-white border border-blue-200 rounded py-1 font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"/></td>
                ))}
                <td className="px-4 font-bold bg-slate-50 text-blue-900">
                  {formatPercent(monthlyTargets.reduce((a,b,i)=>a + (Number(b.occ)/100 * basicInput.rooms * getDaysInMonth(i)),0) / (basicInput.rooms * 365))}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-left font-bold text-emerald-700 sticky left-0 bg-white">ARR (Net)</td>
                {monthlyTargets.map((m, i) => (
                  <td key={i} className="px-1"><input type="number" value={m.arr} onChange={(e) => handleMonthlyChange(i, 'arr', e.target.value)} className="w-full text-right bg-white text-xs border border-emerald-200 rounded py-1 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"/></td>
                ))}
                <td className="px-4 font-bold bg-slate-50 text-emerald-900">
                  {formatIDR(monthlyTargets.reduce((a,b,i) => a + (Math.round((Number(b.occ)/100) * basicInput.rooms * getDaysInMonth(i)) * Number(b.arr)), 0) / monthlyTargets.reduce((a,b,i) => a + (Math.round((Number(b.occ)/100) * basicInput.rooms * getDaysInMonth(i))), 0))}
                </td>
              </tr>
              <tr className="border-b border-slate-100 bg-yellow-50/50">
                <td className="py-3 px-4 text-left font-bold text-slate-700 sticky left-0 bg-white">REVPAR</td>
                {monthlyTargets.map((m, i) => <td key={i} className="px-2 font-mono text-xs text-slate-600">{formatIDR((m.arr * m.occ)/100)}</td>)}
                <td className="px-4 font-bold bg-slate-50">-</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-left font-bold text-slate-500 sticky left-0 bg-white">NO. GUESTS</td>
                {monthlyTargets.map((m, i) => <td key={i} className="px-2 text-xs text-slate-400">{Math.round((m.occ/100) * basicInput.rooms * getDaysInMonth(i)) * 2}</td>)}
                <td className="px-4 font-bold bg-slate-50 text-slate-600">
                  {monthlyTargets.reduce((a,b,i) => a + (Math.round((Number(b.occ)/100) * basicInput.rooms * getDaysInMonth(i)) * 2), 0)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                <td className="py-3 px-4 text-left sticky left-0 bg-slate-50">ROOM REVENUE</td>
                {monthlyTargets.map((m, i) => { const sold = Math.round((Number(m.occ)/100) * basicInput.rooms * getDaysInMonth(i)); return <td key={i} className="px-2 text-xs">{formatIDR((sold * Number(m.arr))/1000000)}M</td> })}
                <td className="px-4 text-blue-900">{formatIDR(monthlyTargets.reduce((a,b,i) => a + (Math.round((Number(b.occ)/100) * basicInput.rooms * getDaysInMonth(i)) * Number(b.arr)), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!projectedData) return <div className="text-center p-10 text-slate-400">Please Run Setup First</div>;
    const { revenue, depts } = projectedData;
    const deptValues = Object.values(depts) as any[];
    const totalPayroll = deptValues.reduce((a: number, b: any) => a + (b.payroll as number), 0);
    const totalExpense = deptValues.reduce((a: number, b: any) => a + (b.totalExpense as number), 0);
    const gop = revenue.total - totalPayroll - totalExpense;
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pt-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div><h2 className="text-2xl font-bold text-slate-800">Executive Summary</h2><p className="text-xs text-slate-500 font-bold uppercase mt-1">{basicInput.name} • {basicInput.address}</p></div>
          <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold">Projected GOP: {formatPercent(gop / revenue.total)}</div>
        </div>

        {longTermData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                   <h3 className="font-bold text-slate-700 flex items-center"><TrendingUp className="w-4 h-4 mr-2"/> Growth Outlook</h3>
                   <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                      {[1, 3, 5, 10].map(yr => (
                        <button 
                          key={yr}
                          onClick={() => setDashboardTimeframe(yr)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${dashboardTimeframe === yr ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          {yr} Year
                        </button>
                      ))}
                   </div>
                </div>
                <button onClick={simulateAiGrowth} className="text-xs flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                   <BrainCircuit className="w-3 h-3 mr-1"/> AI Simulate
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                   <thead>
                      <tr className="text-xs text-slate-500 border-b">
                         <th className="p-3 text-left">Period</th>
                         <th className="p-3">Revenue</th>
                         <th className="p-3">Total Cost</th>
                         <th className="p-3 text-emerald-700">GOP</th>
                         <th className="p-3">Margin</th>
                      </tr>
                   </thead>
                   <tbody>
                      {longTermData.filter((d: any) => d.year <= dashboardTimeframe).map((d: any, i: number) => (
                         <tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-left font-bold text-slate-700">Year {d.year}</td>
                            <td className="p-3 text-slate-600">{formatIDR(d.revenue)}</td>
                            <td className="p-3 text-red-400">({formatIDR(d.expense)})</td>
                            <td className="p-3 font-bold text-emerald-700">{formatIDR(d.gop)}</td>
                            <td className="p-3 text-slate-500">{formatPercent(d.margin)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-900">{formatIDR(revenue.total)}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="text-sm text-slate-500 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-rose-600">{formatIDR(totalPayroll + totalExpense)}</div>
          </div>
          <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
             <div className="text-sm text-blue-200 mb-1">Gross Operating Profit</div>
            <div className="text-3xl font-bold text-yellow-400">{formatIDR(gop)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderPnL = () => {
     if (!projectedData) return <div className="text-center p-10 text-slate-400">Please Generate Projection First</div>;
     const { revenue, depts } = projectedData;
     const deptValues = Object.values(depts) as any[];
     const totalPayroll = deptValues.reduce((a: number, b: any) => a + (b.payroll as number), 0);
     const totalExpense = deptValues.reduce((a: number, b: any) => a + (b.totalExpense as number), 0);
     const gop = revenue.total - totalPayroll - totalExpense;
     let fee = basicInput.feeModel === '15_percent' ? revenue.total * (basicInput.customFee.revPct / 100) : (revenue.total * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, gop) * (basicInput.customFee.gopPct / 100));
     const nop = gop - fee;

     return (
       <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in max-w-4xl mx-auto border border-slate-200 print:p-0">
         <div className="flex justify-between items-center mb-8 border-b pb-6">
           <div><h2 className="text-2xl font-bold text-slate-900">Consolidated P&L Projection</h2><div className="text-slate-500 text-sm mt-1 font-bold">{basicInput.name}</div></div>
           <button onClick={handlePrint} className="text-white bg-blue-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center print:hidden"><Download className="w-4 h-4 mr-2" /> PDF Report</button>
         </div>
         <div className="space-y-2 text-sm">
           <div className="flex justify-between font-bold bg-slate-50 p-2 rounded"><span>TOTAL REVENUE</span><span>{formatIDR(revenue.total)}</span></div>
           <div className="flex justify-between font-bold bg-slate-50 p-2 rounded mt-2"><span>OPERATING EXPENSES</span><span className="text-rose-600">({formatIDR(totalPayroll + totalExpense)})</span></div>
           <div className="flex justify-between font-bold text-xl text-blue-900 bg-blue-50 p-3 mt-6 rounded"><span>GROSS OPERATING PROFIT</span><span>{formatIDR(gop)}</span></div>
           <div className="flex justify-between font-bold text-xl text-white bg-slate-900 p-4 rounded-lg mt-4 shadow-lg"><span>NET OPERATING PROFIT (NOP)</span><span>{formatIDR(nop)}</span></div>
         </div>
       </div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}
      {renderSidebar()}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 md:hidden flex-shrink-0">
           <span className="font-bold text-slate-800">THELOKA PRO</span>
           <button onClick={() => setSidebarOpen(!isSidebarOpen)}><Menu className="text-slate-600" /></button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
           {activeView === 'setup' && renderSetup()}
           {activeView === 'revenue' && renderRevenueView()}
           {activeView === 'competitor' && renderCompetitorAnalysis()}
           {activeView === 'property_survey' && renderPropertySurvey()}
           {activeView === 'dashboard' && renderDashboard()}
           {['room_div', 'fb_div', 'pomec_div', 'admin_div', 'sales_div'].includes(activeView) && renderDepartmentDetail(activeView)}
           {activeView === 'pnl' && renderPnL()}
        </main>
      </div>
    </div>
  );
}