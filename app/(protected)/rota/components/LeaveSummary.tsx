import { StaffMember, months, availableYears, getStaffColorClasses } from '../types';

interface Props {
  selectedMonthStaffData: StaffMember[];
  selectedSummaryMonth: { month: number; year: number };
  setSelectedSummaryMonth: (value: { month: number; year: number }) => void;
  showMonthPicker: boolean;
  setShowMonthPicker: (value: boolean) => void;
  showExportDropdown: boolean;
  setShowExportDropdown: (value: boolean) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  totalTeamDaysOff: number;
  totalAnnualLeave: number;
  totalSickLeave: number;
  totalTraining: number;
}

export default function LeaveSummary(props: Props) {
  const {
    selectedMonthStaffData,
    selectedSummaryMonth,
    setSelectedSummaryMonth,
    showMonthPicker,
    setShowMonthPicker,
    showExportDropdown,
    setShowExportDropdown,
    onExportCSV,
    onExportPDF,
    totalTeamDaysOff,
    totalAnnualLeave,
    totalSickLeave,
    totalTraining,
  } = props;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <i className="ri-calendar-check-line text-slate-700 text-lg"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Monthly Leave Summary</h2>
          <span className="text-slate-400 mx-1">-</span>
          <div className="relative">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <span className="font-medium text-slate-700">{months[selectedSummaryMonth.month]} {selectedSummaryMonth.year}</span>
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line text-slate-500 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`}></i>
              </div>
            </button>
            {showMonthPicker && (
              <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-20 min-w-[280px]">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-500 mb-2">Year</label>
                  <div className="flex gap-2">
                    {availableYears().map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedSummaryMonth({ ...selectedSummaryMonth, year })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          selectedSummaryMonth.year === year
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Month</label>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedSummaryMonth({ ...selectedSummaryMonth, month: index });
                          setShowMonthPicker(false);
                        }}
                        className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          selectedSummaryMonth.month === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-700">Total Team Days Off: <span className="text-slate-900 font-bold">{totalTeamDaysOff}</span></span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-download-line text-lg"></i>
              </div>
              <span>Export</span>
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line text-lg transition-transform ${showExportDropdown ? 'rotate-180' : ''}`}></i>
              </div>
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[180px] z-10">
                <button
                  onClick={onExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-file-pdf-line text-red-500 text-lg"></i>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Export as PDF</span>
                </button>
                <button
                  onClick={onExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-file-excel-line text-green-500 text-lg"></i>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Export as CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
              <i className="ri-plane-line text-blue-600 text-lg"></i>
            </div>
            <span className="text-sm font-medium text-blue-700">Annual Leave</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalAnnualLeave} days</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-lg">
              <i className="ri-hospital-line text-red-600 text-lg"></i>
            </div>
            <span className="text-sm font-medium text-red-700">Sick Leave</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{totalSickLeave} days</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-lg">
              <i className="ri-graduation-cap-line text-purple-600 text-lg"></i>
            </div>
            <span className="text-sm font-medium text-purple-700">Training</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{totalTraining} days</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
              <i className="ri-calendar-event-line text-slate-600 text-lg"></i>
            </div>
            <span className="text-sm font-medium text-slate-700">Total Days Off</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalTeamDaysOff} days</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Staff Member</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-blue-700">Annual Leave</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-red-700">Sick Leave</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-purple-700">Training</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Other</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900">Total Days Off</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {selectedMonthStaffData.map((member) => {
              const colors = getStaffColorClasses(member.color);
              const memberTotalDaysOff = member.monthlyLeave.annualLeave + member.monthlyLeave.sickLeave + member.monthlyLeave.training + member.monthlyLeave.other;
              const maxDays = Math.max(...selectedMonthStaffData.map(m => m.monthlyLeave.annualLeave + m.monthlyLeave.sickLeave + m.monthlyLeave.training + m.monthlyLeave.other), 1);
              return (
                <tr key={member.initials} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}>
                        <span className={`${colors.text} font-bold text-xs`}>{member.initials}</span>
                      </div>
                      <span className="font-medium text-slate-800">{member.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${member.monthlyLeave.annualLeave > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'} font-semibold text-sm`}>
                      {member.monthlyLeave.annualLeave}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${member.monthlyLeave.sickLeave > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'} font-semibold text-sm`}>
                      {member.monthlyLeave.sickLeave}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${member.monthlyLeave.training > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'} font-semibold text-sm`}>
                      {member.monthlyLeave.training}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${member.monthlyLeave.other > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'} font-semibold text-sm`}>
                      {member.monthlyLeave.other}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg ${colors.bg} ${colors.text} font-bold text-sm`}>
                      {memberTotalDaysOff} {memberTotalDaysOff === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full max-w-[200px]">
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
                        {member.monthlyLeave.annualLeave > 0 && (
                          <div className="bg-blue-500 h-full" style={{ width: `${(member.monthlyLeave.annualLeave / maxDays) * 100}%` }} title={`Annual Leave: ${member.monthlyLeave.annualLeave} days`}></div>
                        )}
                        {member.monthlyLeave.sickLeave > 0 && (
                          <div className="bg-red-500 h-full" style={{ width: `${(member.monthlyLeave.sickLeave / maxDays) * 100}%` }} title={`Sick Leave: ${member.monthlyLeave.sickLeave} days`}></div>
                        )}
                        {member.monthlyLeave.training > 0 && (
                          <div className="bg-purple-500 h-full" style={{ width: `${(member.monthlyLeave.training / maxDays) * 100}%` }} title={`Training: ${member.monthlyLeave.training} days`}></div>
                        )}
                        {member.monthlyLeave.other > 0 && (
                          <div className="bg-amber-500 h-full" style={{ width: `${(member.monthlyLeave.other / maxDays) * 100}%` }} title={`Other: ${member.monthlyLeave.other} days`}></div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-xs text-slate-600">Annual Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-slate-600">Sick Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-xs text-slate-600">Training</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span className="text-xs text-slate-600">Other</span>
        </div>
      </div>
    </div>
  );
}