'use client';

import Header from '@/components/Header';
import { useState, useEffect, Fragment, useCallback } from 'react';
import { fetchCommsLog, saveCommsLog, rpcError } from '@/lib/forms';

interface DayEntry {
  date: number;
  dayName: string;
  lightsWorking: 'yes' | 'no' | 'na';
  anySmells: 'yes' | 'no' | 'na';
  anyAlarms: 'yes' | 'no' | 'na';
  officer: string;
  notes: string;
}

const getDayName = (year: number, month: number, day: number) =>
  new Date(year, month, day).toLocaleDateString('en-GB', { weekday: 'short' });

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CommsRoomLogPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'completed' | 'pending'>('all');

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const initializeEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const base = Array.from({ length: daysInMonth }, (_, i) => ({
      date: i + 1,
      dayName: getDayName(selectedYear, selectedMonth, i + 1),
      lightsWorking: 'na' as const,
      anySmells: 'na' as const,
      anyAlarms: 'na' as const,
      officer: '',
      notes: '',
    }));

    try {
      const rows = await fetchCommsLog(selectedYear, selectedMonth);
      rows.forEach((row) => {
        const idx = base.findIndex((e) => e.date === row.day);
        if (idx >= 0) {
          base[idx].lightsWorking = (row.lights_working as DayEntry['lightsWorking']) || 'na';
          base[idx].anySmells = (row.any_smells as DayEntry['anySmells']) || 'na';
          base[idx].anyAlarms = (row.any_alarms as DayEntry['anyAlarms']) || 'na';
          base[idx].officer = row.officer || '';
          base[idx].notes = row.notes || '';
        }
      });
      setEntries(base);
    } catch {
      setEntries(base);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    initializeEntries();
  }, [initializeEntries]);

  const handleStatusClick = (index: number, field: 'lightsWorking' | 'anySmells' | 'anyAlarms', value: 'yes' | 'no' | 'na') => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const handleOfficerChange = (index: number, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, officer: value } : e)));
  };

  const handleNotesChange = (index: number, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, notes: value } : e)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    setSaving(true);
    try {
      await saveCommsLog(selectedYear, selectedMonth, entries);
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(rpcError(err));
    } finally {
      setSaving(false);
    }
  };

  const quickFillAll = (field: 'lightsWorking' | 'anySmells' | 'anyAlarms', value: 'yes' | 'no') => {
    setEntries((prev) => prev.map((entry) => ({ ...entry, [field]: value })));
  };

  const isEntryComplete = (entry: DayEntry) => entry.officer !== '' && entry.lightsWorking !== 'na';

  const completedCount = entries.filter(isEntryComplete).length;
  const pendingCount = entries.length - completedCount;
  const issuesCount = entries.filter((e) => e.anySmells === 'yes' || e.anyAlarms === 'yes' || e.lightsWorking === 'no').length;

  const filteredEntries = entries.filter((entry) => {
    if (filterView === 'completed') return isEntryComplete(entry);
    if (filterView === 'pending') return !isEntryComplete(entry);
    return true;
  });

  const isWeekend = (dayName: string) => dayName === 'Sat' || dayName === 'Sun';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-72 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <i className="ri-calendar-check-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Select Period</h2>
                    <p className="text-xs text-gray-500">Choose month &amp; year</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer">
                    {months.map((month, idx) => <option key={`month-${idx}`} value={idx}>{month}</option>)}
                  </select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer">
                    {years.map((year) => <option key={`year-${year}`} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center"><i className="ri-check-line text-white"></i></div>
                      <span className="text-sm text-gray-700">Completed</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center"><i className="ri-time-line text-white"></i></div>
                      <span className="text-sm text-gray-700">Pending</span>
                    </div>
                    <span className="text-lg font-bold text-amber-600">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center"><i className="ri-alert-line text-white"></i></div>
                      <span className="text-sm text-gray-700">Issues</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{issuesCount}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Completion</span>
                    <span className="font-semibold text-gray-900">{entries.length ? Math.round((completedCount / entries.length) * 100) : 0}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${entries.length ? (completedCount / entries.length) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Fill</h3>
                <p className="text-xs text-gray-500 mb-4">Apply to all entries</p>
                <div className="space-y-2">
                  <button type="button" onClick={() => quickFillAll('lightsWorking', 'yes')} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-green-50 rounded-lg text-sm text-gray-700 hover:text-green-700 transition-colors cursor-pointer"><i className="ri-lightbulb-line"></i> All Lights Working</button>
                  <button type="button" onClick={() => quickFillAll('anySmells', 'no')} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-green-50 rounded-lg text-sm text-gray-700 hover:text-green-700 transition-colors cursor-pointer"><i className="ri-windy-line"></i> No Smells Detected</button>
                  <button type="button" onClick={() => quickFillAll('anyAlarms', 'no')} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-green-50 rounded-lg text-sm text-gray-700 hover:text-green-700 transition-colors cursor-pointer"><i className="ri-alarm-warning-line"></i> No Alarms Active</button>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Serco Internal</span>
                      </div>
                      <h1 className="text-xl font-bold text-gray-900">Main Comms Room Check Log</h1>
                      <p className="text-sm text-gray-500 mt-1">{months[selectedMonth]} {selectedYear} • {entries.length} days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        {(['all', 'completed', 'pending'] as const).map((view) => (
                          <button key={`filter-${view}`} type="button" onClick={() => setFilterView(view)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${filterView === view ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left px-4 py-3">Date</th>
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left px-4 py-3"><div className="flex items-center gap-1.5"><i className="ri-lightbulb-line"></i>Lights</div></th>
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left px-4 py-3"><div className="flex items-center gap-1.5"><i className="ri-windy-line"></i>Smells</div></th>
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left px-4 py-3"><div className="flex items-center gap-1.5"><i className="ri-alarm-warning-line"></i>Alarms</div></th>
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-left px-4 py-3">Officer</th>
                          <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center px-4 py-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredEntries.map((entry) => {
                          const actualIndex = entries.findIndex((e) => e.date === entry.date);
                          const complete = isEntryComplete(entry);
                          const hasIssue = entry.anySmells === 'yes' || entry.anyAlarms === 'yes' || entry.lightsWorking === 'no';
                          return (
                            <Fragment key={`fragment-${entry.date}`}>
                              <tr className={`group transition-colors ${isWeekend(entry.dayName) ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'} ${hasIssue ? 'bg-red-50/30' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${complete ? 'bg-green-100' : 'bg-gray-100'}`}>
                                      <span className="text-xs font-medium text-gray-500">{entry.dayName}</span>
                                      <span className={`text-sm font-bold ${complete ? 'text-green-700' : 'text-gray-700'}`}>{entry.date}</span>
                                    </div>
                                    {complete && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><i className="ri-check-line text-white text-xs"></i></div>}
                                    {hasIssue && <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><i className="ri-alert-line text-white text-xs"></i></div>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    {(['yes', 'no', 'na'] as const).map((value) => (
                                      <button key={`lights-${entry.date}-${value}`} type="button" onClick={() => handleStatusClick(actualIndex, 'lightsWorking', value)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${entry.lightsWorking === value ? (value === 'yes' ? 'bg-green-500 text-white shadow-sm' : value === 'no' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-400 text-white shadow-sm') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {value === 'na' ? 'N/A' : value.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    {(['yes', 'no', 'na'] as const).map((value) => (
                                      <button key={`smells-${entry.date}-${value}`} type="button" onClick={() => handleStatusClick(actualIndex, 'anySmells', value)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${entry.anySmells === value ? (value === 'yes' ? 'bg-red-500 text-white shadow-sm' : value === 'no' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-400 text-white shadow-sm') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {value === 'na' ? 'N/A' : value.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    {(['yes', 'no', 'na'] as const).map((value) => (
                                      <button key={`alarms-${entry.date}-${value}`} type="button" onClick={() => handleStatusClick(actualIndex, 'anyAlarms', value)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${entry.anyAlarms === value ? (value === 'yes' ? 'bg-red-500 text-white shadow-sm' : value === 'no' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-400 text-white shadow-sm') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {value === 'na' ? 'N/A' : value.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input type="text" name={`officer_${entry.date}`} value={entry.officer} onChange={(e) => handleOfficerChange(actualIndex, e.target.value)} placeholder="Enter initials" maxLength={50} className="w-28 bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all" />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button type="button" onClick={() => setExpandedRow(expandedRow === entry.date ? null : entry.date)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${expandedRow === entry.date ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    <i className={expandedRow === entry.date ? 'ri-subtract-line' : 'ri-add-line'}></i>
                                  </button>
                                </td>
                              </tr>
                              {expandedRow === entry.date && (
                                <tr className="bg-blue-50/50">
                                  <td colSpan={6} className="px-4 py-4">
                                    <div className="pl-14">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes for {entry.dayName} {entry.date}</label>
                                      <textarea value={entry.notes} onChange={(e) => handleNotesChange(actualIndex, e.target.value)} rows={3} maxLength={500} className="w-full bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 resize-none" />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-gray-500">Showing {filteredEntries.length} of {entries.length} entries</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => initializeEntries()} className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"><i className="ri-refresh-line"></i> Reset</button>
                        <button type="button" onClick={() => window.print()} className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"><i className="ri-printer-line"></i> Print</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium transition-all shadow-sm hover:shadow whitespace-nowrap cursor-pointer flex items-center gap-2 disabled:opacity-50">
                          <i className={saving ? 'ri-loader-4-line animate-spin' : 'ri-check-double-line'}></i> {saving ? 'Saving…' : 'Submit Log'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {submitted && (
                  <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"><i className="ri-check-line text-white text-xl"></i></div>
                    <div>
                      <p className="text-green-800 font-semibold">Log submitted successfully!</p>
                      <p className="text-green-600 text-sm">Your entries have been saved.</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <i className="ri-error-warning-line text-red-600 text-xl"></i>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400" suppressHydrationWarning={true}>Last updated: {currentDate || 'Loading...'}</p>
                  <p className="text-xs text-gray-400">Serco Internal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}