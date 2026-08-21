'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { fetchMyProfile } from '@/lib/profile';
import { submitFireDoor, fetchFireDoorLatest, FireDoorReport, rpcError, csvInjectionGuard } from '@/lib/forms';

const DEFAULT_CHECKLIST = [
  'Car park signage and zebra crossings clean and clear and free of any obstructions',
  'Car park surfaces free of ice/slip and trip hazards',
  'Car park steps free of trip hazards, nosing and treads in good condition.',
  'Car park markings are clear and visible with leaf-free gullies.',
  'Down pipes and gutters are functional, with no obvious leaks.',
  'Walls of car parks in good repair and condition.',
  'Garages/outbuildings are secure and in good external condition.',
  'All boundary fencing in good repair.',
  'Disabled access is free of obstruction and parking bays correctly utilised.',
  'Landscaping and trees in good order of repair.',
  'Automatic barriers and gates in good order and operational.',
  'Paving and roadways free of trip hazards and potholes.',
  'General tidiness – rubbish/litter free, cones tidy and in good condition.',
];

const existingIssues = [
  'Zebra crossing lines faded (needs repaint)',
  'Visitors Car Park potholes / uneven ground (FM Helpdesk aware)',
  'Rear of ROB: uneven slabs – trip hazard (FM Helpdesk aware)',
  'Arches Car Park potholes and cracking (FM Helpdesk aware)',
  'Leaves need clearing from all pathways',
  'Anti-slip tape required on multiple stair locations',
  'Car Park C: spaces need repainting & "No Exit" sign needs repainting',
  'Gutters in Car Park G blocked',
  'Car Park G pillars cracked/damaged',
  'Leahoe House/Annex & White Garages boarded due to vandalism',
  'Trees overhanging in Car Park F (Soft FM aware)',
  'Kerbstone dislodged in member car park',
  'Road to Leahoe has many potholes',
  'Various uneven paving slabs across site (multiple locations noted)',
  'Moss build-up on paths (slip risk)',
  'Under-croft slab dropped, creating a lip (trip hazard)',
  'Centre Quadrant broken/uneven slabs',
  'Slab raised on path to patio area',
  'Slabs raised near centre tower fire exit',
  'Slabs uneven on slope to ROB entrance',
];

interface ChecklistItem {
  id: number;
  text: string;
  status: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function FireDoorInspectionPage() {
  const { user } = useAuth();
  const [completedBy, setCompletedBy] = useState('');
  const [reportDate, setReportDate] = useState(todayStr());
  const [showExistingIssues, setShowExistingIssues] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((text, i) => ({ id: i + 1, text, status: '' })),
  );
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [actionsRecommendations, setActionsRecommendations] = useState('');
  const [lineManagerName, setLineManagerName] = useState('');
  const [operationsComments, setOperationsComments] = useState('');
  const [contractComments, setContractComments] = useState('');
  const [latest, setLatest] = useState<FireDoorReport | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchMyProfile(user?.id || '');
        if (p?.full_name) setCompletedBy(p.full_name);
      } catch {
        /* ignore */
      }
      try {
        setLatest(await fetchFireDoorLatest());
      } catch {
        setLatest(null);
      }
    })();
  }, [user?.id]);

  const loadLatest = async () => {
    try {
      setLatest(await fetchFireDoorLatest());
    } catch {
      setLatest(null);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);
    if (!reportDate) {
      setError('Report date is required.');
      return;
    }
    if (!completedBy.trim()) {
      setError('Completed by is required.');
      return;
    }
    if (checklistItems.some((i) => !i.status)) {
      setError('Please complete every checklist item (YES / NO / N/A).');
      return;
    }
    const checklist = checklistItems.map((item) => ({
      id: item.id,
      text: item.text,
      status: item.status,
      comment: comments[item.id] || '',
    }));
    setSaving(true);
    try {
      const ref = await submitFireDoor({
        report_date: reportDate,
        completed_by: completedBy,
        checklist,
        actions_recommendations: actionsRecommendations,
        line_manager_name: lineManagerName,
        operations_comments: operationsComments,
        contract_comments: contractComments,
      });
      setSaved(true);
      setError('');
      await loadLatest();
      window.setTimeout(() => setSaved(false), 4000);
      void ref;
    } catch (e) {
      setError(rpcError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleCommentChange = (id: number, comment: string) => {
    setComments((prev) => ({ ...prev, [id]: comment }));
  };

  const csvCell = (v: unknown) => {
    let s = csvInjectionGuard(v);
    if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleExport = () => {
    const lines: string[] = [];
    lines.push('Fire Door Inspection Report - Site Self Inspection Report - Security Services');
    lines.push(`Reference,${latest?.reference_number || 'Draft'}`);
    lines.push(`Site,County Hall – External & Car Parks`);
    lines.push(`Date,${reportDate}`);
    lines.push('Section,EXTERNAL GROUNDS AND CAR PARKS');
    lines.push('');
    lines.push('Item,Description,Status,Comments');
    checklistItems.forEach((item) => {
      lines.push(`${item.id},${csvCell(item.text)},${csvCell(item.status)},${csvCell(comments[item.id] || '')}`);
    });
    lines.push('');
    lines.push('Actions and Recommendations');
    lines.push(csvCell(actionsRecommendations));
    lines.push('');
    lines.push(`Completed by,${csvCell(completedBy)}`);
    lines.push(`Line Manager Name,${csvCell(lineManagerName)}`);
    lines.push(`Operations Manager Comments,${csvCell(operationsComments)}`);
    lines.push(`Contract Manager Comments,${csvCell(contractComments)}`);
    lines.push('');
    lines.push('Audit footer: This export was generated by the security services record system. Printed copies are uncontrolled.');

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fire-door-inspection-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fire Door Inspection Report</h1>
            <p className="text-lg text-gray-700 mb-1">Site Self Inspection Report – Security Services</p>
            <div className="flex items-center gap-2 mt-2">
              {latest?.reference_number && (
                <span className="text-sm font-mono font-medium text-blue-600">Latest: {latest.reference_number}</span>
              )}
            </div>
          </div>

          <div className="mb-6 flex gap-3 print:hidden">
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
              <i className="ri-printer-line"></i> Print Report
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
              <i className="ri-file-excel-2-line"></i> Export CSV
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50">
              <i className={saving ? 'ri-loader-4-line animate-spin' : 'ri-save-line'}></i> {saving ? 'Saving…' : 'Save Report'}
            </button>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <i className="ri-check-line text-green-600"></i>
              <p className="text-green-800 font-semibold">Report saved successfully!</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <i className="ri-error-warning-line text-red-600"></i>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Report Date <span className="text-red-500">*</span></label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Completed by</label>
              <input type="text" value={completedBy} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inspection Checklist</h2>
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4 mb-3">
                    <span className="font-semibold text-gray-700 min-w-[30px]">{item.id}.</span>
                    <p className="flex-1 text-gray-800">{item.text}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-[46px]">
                    <div className="flex gap-2">
                      {['YES', 'NO', 'N/A'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(item.id, s)}
                          className={`px-4 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            item.status === s
                              ? s === 'YES' ? 'bg-green-600 text-white' : s === 'NO' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add comments..."
                      value={comments[item.id] || ''}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      maxLength={500}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions and Recommendations</h2>
            <textarea value={actionsRecommendations} onChange={(e) => setActionsRecommendations(e.target.value)} rows={6} maxLength={2000} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="mb-8">
            <button onClick={() => setShowExistingIssues(!showExistingIssues)} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
              <h2 className="text-xl font-bold text-gray-900">Existing Issues Noted</h2>
              <i className={showExistingIssues ? 'ri-arrow-up-s-line text-2xl text-gray-600' : 'ri-arrow-down-s-line text-2xl text-gray-600'}></i>
            </button>
            {showExistingIssues && (
              <div className="mt-3 bg-white border border-amber-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {existingIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <i className="ri-alert-line text-amber-600 mt-0.5"></i>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Report Completion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Line Manager Name</label>
                <input type="text" value={lineManagerName} onChange={(e) => setLineManagerName(e.target.value)} maxLength={200} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Operations Manager Comments</label>
                <textarea value={operationsComments} onChange={(e) => setOperationsComments(e.target.value)} rows={4} maxLength={1000} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Manager Comments</label>
                <textarea value={contractComments} onChange={(e) => setContractComments(e.target.value)} rows={4} maxLength={1000} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">Serco Internal</p>
          </div>
        </div>
      </main>
    </div>
  );
}