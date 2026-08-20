'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';

export default function FireDoorInspectionPage() {
  const [showExistingIssues, setShowExistingIssues] = useState(false);
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: 'Car park signage and zebra crossings clean and clear and free of any obstructions', status: '' },
    { id: 2, text: 'Car park surfaces free of ice/slip and trip hazards', status: '' },
    { id: 3, text: 'Car park steps free of trip hazards, nosing and treads in good condition.', status: '' },
    { id: 4, text: 'Car park markings are clear and visible with leaf‑free gullies.', status: '' },
    { id: 5, text: 'Down pipes and gutters are functional, with no obvious leaks.', status: '' },
    { id: 6, text: 'Walls of car parks in good repair and condition.', status: '' },
    { id: 7, text: 'Garages/outbuildings are secure and in good external condition.', status: '' },
    { id: 8, text: 'All boundary fencing in good repair.', status: '' },
    { id: 9, text: 'Disabled access is free of obstruction and parking bays correctly utilised.', status: '' },
    { id: 10, text: 'Landscaping and trees in good order of repair.', status: '' },
    { id: 11, text: 'Automatic barriers and gates in good order and operational.', status: '' },
    { id: 12, text: 'Paving and roadways free of trip hazards and potholes.', status: '' },
    { id: 13, text: 'General tidiness – rubbish/litter free, cones tidy and in good condition.', status: '' }
  ]);
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [actionsRecommendations, setActionsRecommendations] = useState('');
  const [lineManagerName, setLineManagerName] = useState('');
  const [operationsComments, setOperationsComments] = useState('');
  const [contractComments, setContractComments] = useState('');
  const [saved, setSaved] = useState(false);

  const loadLatest = async () => {
    const { data, error } = await supabase
      .from('fire_door_inspection_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return;
    const report = data[0];
    if (Array.isArray(report.checklist)) {
      const items = report.checklist.map((c: any, i: number) => ({
        id: c.id ?? i + 1,
        text: c.text ?? '',
        status: c.status ?? '',
      }));
      setChecklistItems(items);
      const cm: { [key: number]: string } = {};
      report.checklist.forEach((c: any) => {
        if (c.comment) cm[c.id] = c.comment;
      });
      setComments(cm);
    }
    if (report.actions_recommendations) setActionsRecommendations(report.actions_recommendations);
    if (report.line_manager_name) setLineManagerName(report.line_manager_name);
    if (report.operations_comments) setOperationsComments(report.operations_comments);
    if (report.contract_comments) setContractComments(report.contract_comments);
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const handleSave = async () => {
    const checklist = checklistItems.map((item) => ({
      id: item.id,
      text: item.text,
      status: item.status,
      comment: comments[item.id] || '',
    }));
    const { error } = await supabase.from('fire_door_inspection_reports').insert({
      report_date: '16/01/2026',
      completed_by: 'Phil Gill',
      checklist,
      actions_recommendations: actionsRecommendations,
      line_manager_name: lineManagerName,
      operations_comments: operationsComments,
      contract_comments: contractComments,
    });
    if (error) {
      console.error('Save error:', error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
    'Under‑croft slab dropped, creating a lip (trip hazard)',
    'Centre Quadrant broken/uneven slabs',
    'Slab raised on path to patio area',
    'Slabs raised near centre tower fire exit',
    'Slabs uneven on slope to ROB entrance'
  ];

  const handleStatusChange = (id: number, status: string) => {
    setChecklistItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleCommentChange = (id: number, comment: string) => {
    setComments(prev => ({ ...prev, [id]: comment }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    let csvContent = 'Fire Door Inspection Report - Site Self Inspection Report - Security Services\n';
    csvContent += 'Site: County Hall – External & Car Parks\n';
    csvContent += 'Date: 16/01/2026\n';
    csvContent += 'Section: EXTERNAL GROUNDS AND CAR PARKS\n\n';
    csvContent += 'Item,Description,Status,Comments\n';
    
    checklistItems.forEach(item => {
      const comment = comments[item.id] || '';
      csvContent += `${item.id},"${item.text}","${item.status}","${comment}"\n`;
    });
    
    csvContent += '\nActions and Recommendations\n';
    csvContent += `"${actionsRecommendations}"\n\n`;
    
    csvContent += 'Completed by: Phil Gill\n';
    csvContent += 'Date: 16/01/2026\n';
    csvContent += `Line Manager Name: ${lineManagerName}\n`;
    csvContent += `Operations Manager Comments: ${operationsComments}\n`;
    csvContent += `Contract Manager Comments: ${contractComments}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fire Door Inspection Report
            </h1>
            <p className="text-lg text-gray-700 mb-1">
              Site Self Inspection Report – Security Services
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Site:</span> County Hall – External & Car Parks
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Date:</span> 16/01/2026
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Section:</span> EXTERNAL GROUNDS AND CAR PARKS
            </p>
          </div>

          <div className="mb-6 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-printer-line"></i>
              Print Report
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-file-excel-2-line"></i>
              Export to Excel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-save-line"></i>
              Save Report
            </button>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <i className="ri-check-line text-white"></i>
              </div>
              <p className="text-green-800 font-semibold">Report saved successfully!</p>
            </div>
          )}

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
                      <button
                        onClick={() => handleStatusChange(item.id, 'YES')}
                        className={`px-4 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                          item.status === 'YES'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, 'NO')}
                        className={`px-4 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                          item.status === 'NO'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        NO
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, 'N/A')}
                        className={`px-4 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                          item.status === 'N/A'
                            ? 'bg-gray-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Add comments..."
                      value={comments[item.id] || ''}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions and Recommendations</h2>
            <textarea
              value={actionsRecommendations}
              onChange={(e) => setActionsRecommendations(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter actions and recommendations..."
            />
          </div>

          <div className="mb-8">
            <button
              onClick={() => setShowExistingIssues(!showExistingIssues)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <h2 className="text-xl font-bold text-gray-900">Existing Issues Noted</h2>
              <i className={`ri-arrow-${showExistingIssues ? 'up' : 'down'}-s-line text-2xl text-gray-600`}></i>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Completed by
                </label>
                <input
                  type="text"
                  value="Phil Gill"
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value="16/01/2026"
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Line Manager Name
                </label>
                <input
                  type="text"
                  value={lineManagerName}
                  onChange={(e) => setLineManagerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter line manager name..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Signature
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter signature..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Operations Manager Comments
                </label>
                <textarea
                  value={operationsComments}
                  onChange={(e) => setOperationsComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter operations manager comments..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract Manager Comments
                </label>
                <textarea
                  value={contractComments}
                  onChange={(e) => setContractComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter contract manager comments..."
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">Serco Internal</p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
