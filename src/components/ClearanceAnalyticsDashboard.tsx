import React, { useState, useMemo } from 'react';
import { Learner, SchoolSettings, UserAccount } from '../types';
import { VivaBadge } from './VivaBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Camera,
  PenTool,
  Download,
  Printer,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  SlidersHorizontal,
  ChevronDown,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ClearanceAnalyticsDashboardProps {
  learners: Learner[];
  settings: SchoolSettings;
  users: UserAccount[];
  onOpenClassStreamManager?: () => void;
}

const TIER_COLORS = ['#059669', '#0284C7', '#D97706', '#DC2626'];
const STREAM_PALETTE = ['#7A1326', '#1E40AF', '#047857', '#B45309', '#6D28D9', '#0F766E', '#C2410C'];

export const ClearanceAnalyticsDashboard: React.FC<ClearanceAnalyticsDashboardProps> = ({
  learners,
  settings,
  users,
  onOpenClassStreamManager,
}) => {
  // Filter states
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('ALL');
  const [chartViewMode, setChartViewMode] = useState<'comprehensive' | 'classes' | 'subjects' | 'streams'>('comprehensive');

  // Available classes and streams
  const distinctClasses = useMemo(() => {
    const fromLearners = Array.from(new Set(learners.map((l) => l.class))).filter(Boolean);
    const fromSettings = settings.availableClasses || [];
    const combined = Array.from(new Set([...fromSettings, ...fromLearners]));
    return combined.sort();
  }, [learners, settings]);

  const availableStreamsForClass = useMemo(() => {
    const relevant = selectedClassFilter === 'ALL'
      ? learners
      : learners.filter((l) => l.class === selectedClassFilter);
    return Array.from(new Set(relevant.map((l) => l.stream))).filter(Boolean).sort();
  }, [learners, selectedClassFilter]);

  // Filtered dataset
  const filteredLearners = useMemo(() => {
    return learners.filter((l) => {
      const matchClass = selectedClassFilter === 'ALL' || l.class === selectedClassFilter;
      const matchStream = selectedStreamFilter === 'ALL' || l.stream === selectedStreamFilter;
      return matchClass && matchStream;
    });
  }, [learners, selectedClassFilter, selectedStreamFilter]);

  // 1. High-Level KPI Calculations
  const kpis = useMemo(() => {
    const total = filteredLearners.length;
    if (total === 0) {
      return {
        total: 0,
        fullyCleared: 0,
        fullyClearedPct: 0,
        inProgress: 0,
        inProgressPct: 0,
        flagged: 0,
        flaggedPct: 0,
        totalFolios: 0,
        clearedFolios: 0,
        folioPct: 0,
        photoProofsCount: 0,
        signaturesCount: 0,
      };
    }

    let fullyCleared = 0;
    let inProgress = 0;
    let flagged = 0;
    let totalFolios = 0;
    let clearedFolios = 0;
    let photoProofsCount = 0;
    let signaturesCount = 0;

    filteredLearners.forEach((l) => {
      const allCleared = l.subjects.length > 0 && l.subjects.every((s) => s.status === 'cleared');
      const hasDeficiency = l.subjects.some((s) => s.status === 'not_cleared');

      if (allCleared) {
        fullyCleared++;
      } else if (hasDeficiency) {
        flagged++;
      } else {
        inProgress++;
      }

      l.subjects.forEach((s) => {
        totalFolios++;
        if (s.status === 'cleared') clearedFolios++;
        if (s.photoProofUrl) photoProofsCount++;
        if (s.signatureDataUrl) signaturesCount++;
      });
    });

    return {
      total,
      fullyCleared,
      fullyClearedPct: Math.round((fullyCleared / total) * 100),
      inProgress,
      inProgressPct: Math.round((inProgress / total) * 100),
      flagged,
      flaggedPct: Math.round((flagged / total) * 100),
      totalFolios,
      clearedFolios,
      folioPct: totalFolios > 0 ? Math.round((clearedFolios / totalFolios) * 100) : 0,
      photoProofsCount,
      signaturesCount,
    };
  }, [filteredLearners]);

  // 2. Class-by-Class Clearance Status (Stacked Bar Chart Data)
  const classStatusData = useMemo(() => {
    const classMap: Record<string, { className: string; cleared: number; inProgress: number; flagged: number; total: number }> = {};

    distinctClasses.forEach((cls) => {
      classMap[cls] = { className: cls, cleared: 0, inProgress: 0, flagged: 0, total: 0 };
    });

    learners.forEach((l) => {
      if (!classMap[l.class]) {
        classMap[l.class] = { className: l.class, cleared: 0, inProgress: 0, flagged: 0, total: 0 };
      }
      const item = classMap[l.class];
      item.total++;
      const allCleared = l.subjects.length > 0 && l.subjects.every((s) => s.status === 'cleared');
      const hasDeficiency = l.subjects.some((s) => s.status === 'not_cleared');

      if (allCleared) {
        item.cleared++;
      } else if (hasDeficiency) {
        item.flagged++;
      } else {
        item.inProgress++;
      }
    });

    return Object.values(classMap).filter((d) => d.total > 0);
  }, [learners, distinctClasses]);

  // 3. Stream-by-Stream Comparison Data
  const streamComparisonData = useMemo(() => {
    const streamMap: Record<string, { streamName: string; total: number; cleared: number; rate: number; photoProofs: number }> = {};

    filteredLearners.forEach((l) => {
      const key = l.stream || 'General';
      if (!streamMap[key]) {
        streamMap[key] = { streamName: `Stream ${key}`, total: 0, cleared: 0, rate: 0, photoProofs: 0 };
      }
      streamMap[key].total++;
      if (l.subjects.length > 0 && l.subjects.every((s) => s.status === 'cleared')) {
        streamMap[key].cleared++;
      }
      l.subjects.forEach((s) => {
        if (s.photoProofUrl) streamMap[key].photoProofs++;
      });
    });

    return Object.values(streamMap).map((d) => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.cleared / d.total) * 100) : 0,
    }));
  }, [filteredLearners]);

  // 4. Department & Subject Clearance Velocity
  const subjectPerformanceData = useMemo(() => {
    const subMap: Record<string, { subject: string; code: string; cleared: number; pending: number; flagged: number; total: number; rate: number }> = {};

    filteredLearners.forEach((l) => {
      l.subjects.forEach((s) => {
        const key = s.name;
        if (!subMap[key]) {
          subMap[key] = { subject: s.name, code: s.code, cleared: 0, pending: 0, flagged: 0, total: 0, rate: 0 };
        }
        subMap[key].total++;
        if (s.status === 'cleared') subMap[key].cleared++;
        else if (s.status === 'not_cleared') subMap[key].flagged++;
        else subMap[key].pending++;
      });
    });

    return Object.values(subMap)
      .map((d) => ({
        ...d,
        rate: d.total > 0 ? Math.round((d.cleared / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filteredLearners]);

  // 5. Clearance Tier Distribution (Pie Chart)
  const tierDistributionData = useMemo(() => {
    let tier100 = 0; // 100%
    let tier75 = 0;  // 75-99%
    let tier50 = 0;  // 50-74%
    let tierLow = 0; // <50%

    filteredLearners.forEach((l) => {
      if (l.subjects.length === 0) return;
      const clearedCount = l.subjects.filter((s) => s.status === 'cleared').length;
      const pct = (clearedCount / l.subjects.length) * 100;

      if (pct === 100) tier100++;
      else if (pct >= 75) tier75++;
      else if (pct >= 50) tier50++;
      else tierLow++;
    });

    return [
      { name: '100% Fully Cleared', value: tier100, color: '#059669' },
      { name: '75% - 99% Almost Done', value: tier75, color: '#0284C7' },
      { name: '50% - 74% In-Progress', value: tier50, color: '#D97706' },
      { name: 'Below 50% Deficient', value: tierLow, color: '#DC2626' },
    ].filter((d) => d.value > 0);
  }, [filteredLearners]);

  // 6. House Clearance Comparison
  const houseComparisonData = useMemo(() => {
    const houseMap: Record<string, { house: string; cleared: number; total: number; rate: number }> = {};

    filteredLearners.forEach((l) => {
      const h = l.house || 'Unassigned House';
      if (!houseMap[h]) {
        houseMap[h] = { house: h.replace(' House', ''), cleared: 0, total: 0, rate: 0 };
      }
      houseMap[h].total++;
      if (l.subjects.length > 0 && l.subjects.every((s) => s.status === 'cleared')) {
        houseMap[h].cleared++;
      }
    });

    return Object.values(houseMap).map((d) => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.cleared / d.total) * 100) : 0,
    }));
  }, [filteredLearners]);

  // 7. Teacher Leaderboard (Based on signed officer name)
  const teacherLeaderboardData = useMemo(() => {
    const leaderMap: Record<string, { name: string; clearances: number; flags: number; total: number }> = {};
    
    learners.forEach(l => {
      l.subjects.forEach(s => {
        if (s.officer && s.status !== 'pending') {
          const officer = s.officer.toUpperCase();
          if (!leaderMap[officer]) {
            leaderMap[officer] = { name: s.officer, clearances: 0, flags: 0, total: 0 };
          }
          leaderMap[officer].total++;
          if (s.status === 'cleared') leaderMap[officer].clearances++;
          else if (s.status === 'not_cleared') leaderMap[officer].flags++;
        }
      });
    });

    return Object.values(leaderMap)
      .sort((a, b) => b.clearances - a.clearances)
      .slice(0, 10);
  }, [learners]);

  // 8. Completion Trend (Clearing velocity over time)
  const completionTrendData = useMemo(() => {
    const trendMap: Record<string, { date: string; count: number; timestamp: number }> = {};
    
    learners.forEach(l => {
      l.subjects.forEach(s => {
        if (s.status === 'cleared' && s.signedDate) {
          const dateStr = s.signedDate;
          if (!trendMap[dateStr]) {
            const parts = dateStr.split('/');
            let ts = 0;
            if (parts.length === 3) {
              ts = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
            }
            trendMap[dateStr] = { date: dateStr, count: 0, timestamp: ts };
          }
          trendMap[dateStr].count++;
        }
      });
    });

    return Object.values(trendMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-14);
  }, [learners]);

  const handleExportPDF = async () => {
    const dashboard = document.getElementById('clearance_analytics_dashboard');
    if (!dashboard) return;

    try {
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDFCF7'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VCS_Clearance_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div id="clearance_analytics_dashboard" className="space-y-6">
      
      {/* Top Banner & Filter Controls */}
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-[#7A1326]" />
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">
              Academic Clearance Intelligence & Visual Analytics
            </h2>
          </div>
          <p className="text-xs text-neutral-600">
            Real-time metric breakdowns, class & stream clearance velocity, departmental coursework inspection rates, and photographic audit tracking.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A]/20 px-2.5 py-1.5 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-[#7A1326]" />
            <label className="text-[10px] font-bold uppercase text-neutral-500">Class:</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setSelectedStreamFilter('ALL');
              }}
              className="text-xs font-serif font-bold text-[#1A1A1A] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Classes (School-Wide)</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Stream Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A]/20 px-2.5 py-1.5 shadow-xs">
            <Users className="w-3.5 h-3.5 text-[#7A1326]" />
            <label className="text-[10px] font-bold uppercase text-neutral-500">Stream:</label>
            <select
              value={selectedStreamFilter}
              onChange={(e) => setSelectedStreamFilter(e.target.value)}
              className="text-xs font-serif font-bold text-[#1A1A1A] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Streams</option>
              {availableStreamsForClass.map((st) => (
                <option key={st} value={st}>
                  Stream {st}
                </option>
              ))}
            </select>
          </div>

          {/* Manage Classes & Streams Button */}
          {onOpenClassStreamManager && (
            <button
              type="button"
              onClick={onOpenClassStreamManager}
              className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#7A1326] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Configure Classes & Streams</span>
            </button>
          )}

          {/* PDF & Print Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-emerald-600/30 text-emerald-800 text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export Full Dashboard to PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrintSummary}
              className="px-3 py-1.5 bg-white border border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Print Analytics Report"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-700" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Enrolled */}
        <div className="p-4 bg-white border-2 border-[#1A1A1A]/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Enrolled Roster</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{kpis.total}</span>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {selectedClassFilter === 'ALL' ? 'Across all classes' : `${selectedClassFilter} students`}
            </p>
          </div>
        </div>

        {/* Fully Cleared */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Fully Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-emerald-950">{kpis.fullyCleared}</span>
              <span className="text-xs font-bold font-mono text-emerald-800">({kpis.fullyClearedPct}%)</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-mono mt-0.5">100% exam qualified</p>
          </div>
        </div>

        {/* In-Progress */}
        <div className="p-4 bg-amber-50 border-2 border-amber-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800">In-Progress</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-amber-950">{kpis.inProgress}</span>
              <span className="text-xs font-bold font-mono text-amber-800">({kpis.inProgressPct}%)</span>
            </div>
            <p className="text-[10px] text-amber-700 font-mono mt-0.5">Awaiting teacher sign-off</p>
          </div>
        </div>

        {/* Flagged */}
        <div className="p-4 bg-red-50 border-2 border-red-400 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-red-800">Flagged / Deficient</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-red-950">{kpis.flagged}</span>
              <span className="text-xs font-bold font-mono text-red-800">({kpis.flaggedPct}%)</span>
            </div>
            <p className="text-[10px] text-red-700 font-mono mt-0.5">Missing books/apparatus</p>
          </div>
        </div>

        {/* Coursework Folios */}
        <div className="p-4 bg-white border-2 border-[#1A1A1A]/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Folios Cleared</span>
            <BookOpen className="w-4 h-4 text-[#7A1326]" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{kpis.clearedFolios}</span>
              <span className="text-xs font-mono text-neutral-500">/{kpis.totalFolios}</span>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{kpis.folioPct}% completion rate</p>
          </div>
        </div>

        {/* Photo Proofs & Signatures */}
        <div className="p-4 bg-[#7A1326]/5 border-2 border-[#7A1326]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-[#7A1326]">Photo & Signature</span>
            <Camera className="w-4 h-4 text-[#7A1326]" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-[#7A1326]">{kpis.photoProofsCount}</span>
              <span className="text-[11px] font-mono text-neutral-600">photos</span>
            </div>
            <p className="text-[10px] text-neutral-600 font-mono mt-0.5">{kpis.signaturesCount} digital signatures</p>
          </div>
        </div>

      </div>

      {/* Row 1 Graphs: Class-by-Class Breakdown (Stacked Bar) + Clearance Tier Distribution (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 1: Class-by-Class Clearance Status (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-[#1A1A1A] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7A1326]" />
                <span>Class-by-Class Clearance Distribution</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Comparison of cleared, in-progress, and flagged candidate numbers across school classes
              </p>
            </div>
            <span className="text-[9px] font-mono bg-neutral-100 px-2 py-0.5 uppercase border font-bold">
              Stacked Roster
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classStatusData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="className" tick={{ fill: '#1A1A1A', fontSize: 12, fontFamily: 'serif', fontWeight: 'bold' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#1A1A1A', borderWidth: 2, fontFamily: 'serif' }}
                  formatter={(value: any, name: any) => [
                    `${value} students`,
                    name === 'cleared' ? '100% Cleared' : name === 'inProgress' ? 'In Progress' : 'Flagged',
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: 'sans-serif' }}
                  formatter={(value) => (value === 'cleared' ? 'Fully Cleared' : value === 'inProgress' ? 'In Progress' : 'Flagged')}
                />
                <Bar dataKey="cleared" stackId="a" fill="#059669" name="cleared" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" stackId="a" fill="#D97706" name="inProgress" radius={[0, 0, 0, 0]} />
                <Bar dataKey="flagged" stackId="a" fill="#DC2626" name="flagged" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Clearance Tier Distribution (Pie / Donut) (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-[#1A1A1A] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#7A1326]" />
                <span>Clearance Completion Tiers</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Proportion of student body achieving full vs partial subject sign-offs
              </p>
            </div>
            <span className="text-[9px] font-mono bg-neutral-100 px-2 py-0.5 uppercase border font-bold">
              {filteredLearners.length} Students
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {tierDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tierDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#1A1A1A" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#1A1A1A', borderWidth: 2, fontFamily: 'serif' }}
                    formatter={(value: any, name: any) => [`${value} students (${Math.round((value / filteredLearners.length) * 100)}%)`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-neutral-400 text-xs font-serif">
                No clearance data matching current filter
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 2 Graphs: Stream Performance Velocity + Subject/Department Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 3: Stream Performance & Velocity (6 cols) */}
        <div className="lg:col-span-6 bg-white border-2 border-[#1A1A1A] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7A1326]" />
                <span>Stream Performance & Clearance Velocity</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Clearance completion rate (%) across distinct registered streams
              </p>
            </div>
            <span className="text-[9px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 uppercase border border-emerald-300 font-bold">
              Rate %
            </span>
          </div>

          <div className="h-72 w-full">
            {streamComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={streamComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="streamName" tick={{ fill: '#1A1A1A', fontSize: 11, fontFamily: 'serif' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'monospace' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#1A1A1A', borderWidth: 2, fontFamily: 'serif' }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value}% (${item.payload.cleared}/${item.payload.total} Cleared)`,
                      'Clearance Rate',
                    ]}
                  />
                  <Bar dataKey="rate" fill="#7A1326" name="Clearance Rate (%)" radius={[4, 4, 0, 0]}>
                    {streamComparisonData.map((entry, idx) => (
                      <Cell key={`str-${idx}`} fill={STREAM_PALETTE[idx % STREAM_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-xs font-serif">
                No stream data in selection
              </div>
            )}
          </div>
        </div>

        {/* Graph 4: Subject & Department Clearance Velocity (6 cols) */}
        <div className="lg:col-span-6 bg-white border-2 border-[#1A1A1A] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#7A1326]" />
                <span>Departmental Subject Sign-Off Velocity</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Clearance rate (%) per academic subject curriculum
              </p>
            </div>
            <span className="text-[9px] font-mono bg-blue-100 text-blue-900 px-2 py-0.5 uppercase border border-blue-300 font-bold">
              Subjects
            </span>
          </div>

          <div className="h-72 w-full overflow-y-auto">
            {subjectPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, subjectPerformanceData.length * 36)}>
                <BarChart
                  data={subjectPerformanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis type="category" dataKey="subject" width={110} tick={{ fontSize: 11, fontFamily: 'serif', fill: '#1A1A1A' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#1A1A1A', borderWidth: 2, fontFamily: 'serif' }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value}% (${item.payload.cleared}/${item.payload.total} Cleared • ${item.payload.flagged} Flagged)`,
                      'Subject Rate',
                    ]}
                  />
                  <Bar dataKey="rate" fill="#047857" name="Subject Clearance Rate" radius={[0, 4, 4, 0]}>
                    {subjectPerformanceData.map((entry, idx) => (
                      <Cell
                        key={`sub-${idx}`}
                        fill={entry.rate >= 80 ? '#059669' : entry.rate >= 50 ? '#D97706' : '#DC2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-xs font-serif">
                No subject records found
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: House Rivalry & Coursework Proof Adoption */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* House Clearance Rates */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#7A1326]" />
              <span>Residential House Clearance Standings</span>
            </h3>
            <span className="text-[9px] font-mono uppercase bg-neutral-100 px-2 py-0.5 border">
              House Trophy
            </span>
          </div>

          <div className="space-y-3">
            {houseComparisonData.map((h, i) => (
              <div key={h.house} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-neutral-900">{h.house} House</span>
                  <span className="font-mono font-bold text-emerald-800">{h.rate}% ({h.cleared}/{h.total})</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 border border-[#1A1A1A]/15 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${h.rate}%`,
                      backgroundColor: i === 0 ? '#7A1326' : i === 1 ? '#1E40AF' : i === 2 ? '#047857' : '#B45309',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Audit: Exercise Book Photographic Proof Verification */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#7A1326]" />
                <span>Photographic Book Proof & Signatures</span>
              </h3>
              <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5">
                Audit Trail
              </span>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              Quality assurance audit ensuring teachers physically inspect and photograph student notes/exercise books before issuing clearance stamps.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#FAF8F5] border border-[#1A1A1A]/20">
                <div className="flex items-center gap-1.5 text-xs text-[#7A1326] font-bold uppercase mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo Proofs</span>
                </div>
                <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{kpis.photoProofsCount}</span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Photos of verified exercise books</p>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#1A1A1A]/20">
                <div className="flex items-center gap-1.5 text-xs text-[#1E40AF] font-bold uppercase mb-1">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Digital Signatures</span>
                </div>
                <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{kpis.signaturesCount}</span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Official teacher ink signatures</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>Academic Year: {settings.academicYear || '2026'}</span>
            <span>{settings.term || 'Term II Finals'}</span>
          </div>
        </div>

      </div>

      {/* Row 4: Trends & Teacher Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Completion Velocity Trend */}
        <div className="lg:col-span-2 bg-white border-2 border-[#1A1A1A] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7A1326]" />
              <span>Clearance Completion Velocity (Daily Trend)</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Past 14 Active Days</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A1326" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7A1326" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={9} tickMargin={8} />
                <YAxis fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FDFCF7', border: '1px solid #7A1326', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Daily Clearances" 
                  stroke="#7A1326" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teacher Productivity Leaderboard */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A1A1A]/15">
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Top Verifying Officers</span>
            </h3>
          </div>
          <div className="space-y-4">
            {teacherLeaderboardData.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? 'bg-[#D4AF37] text-[#5B0B19]' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A] truncate max-w-[140px]">{t.name}</p>
                    <p className="text-[9px] text-neutral-500 font-mono">Folios Inspected: {t.total}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#7A1326] font-mono">{t.clearances} Cleared</p>
                  <div className="w-20 h-1 bg-neutral-100 mt-1">
                    <div 
                      className="h-full bg-emerald-600" 
                      style={{ width: `${(t.clearances / t.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {teacherLeaderboardData.length === 0 && (
              <p className="text-center py-10 text-xs text-neutral-500 italic">No verification activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
