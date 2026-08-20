import Link from 'next/link';
import Header from '@/components/Header';

export default function HomePage() {
  const features = [
    {
      title: 'Dashboard',
      description: 'View real-time security metrics and system status',
      icon: 'ri-dashboard-line',
      href: '/dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Rota Management',
      description: 'Manage staff schedules and shift assignments',
      icon: 'ri-calendar-line',
      href: '/rota',
      color: 'bg-green-500'
    },
    {
      title: 'Reports',
      description: 'Generate and view security reports',
      icon: 'ri-file-text-line',
      href: '/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'KPI Dashboard',
      description: 'Track key performance indicators',
      icon: 'ri-line-chart-line',
      href: '/kpi-dashboard',
      color: 'bg-orange-500'
    },
    {
      title: 'Incident Report',
      description: 'Log and track security incidents',
      icon: 'ri-alert-line',
      href: '/incident-report',
      color: 'bg-red-500'
    },
    {
      title: 'CCTV Incident',
      description: 'Report and manage CCTV incidents',
      icon: 'ri-vidicon-line',
      href: '/cctv-incident',
      color: 'bg-indigo-500'
    },
    {
      title: 'Fire Door Inspection',
      description: 'Site self inspection report for external grounds',
      icon: 'ri-door-line',
      href: '/fire-door-inspection',
      color: 'bg-amber-500'
    },
    {
      title: 'Comms Room Log',
      description: 'Monitor and log communications room activity',
      icon: 'ri-radio-line',
      href: '/comms-room-log',
      color: 'bg-teal-500'
    },
    {
      title: 'ID Cards',
      description: 'Request and manage ID card applications',
      icon: 'ri-bank-card-line',
      href: '/id-cards',
      color: 'bg-pink-500'
    },
    {
      title: 'DOB',
      description: 'Daily Occurrence Book entries',
      icon: 'ri-book-line',
      href: '/dob',
      color: 'bg-cyan-500'
    },
    {
      title: 'Form',
      description: 'Access general forms and templates',
      icon: 'ri-file-list-line',
      href: '/form',
      color: 'bg-lime-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Security Services Portal
          </h1>
          <p className="text-xl text-gray-600">
            Comprehensive security management and reporting system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`${feature.color} w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0`}>
                  <i className={`${feature.icon} text-2xl text-white`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/incident-report"
              className="flex items-center gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-alert-line text-2xl text-red-600"></i>
              </div>
              <span className="font-medium text-gray-900">Report Incident</span>
            </Link>
            <Link
              href="/rota"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-calendar-check-line text-2xl text-green-600"></i>
              </div>
              <span className="font-medium text-gray-900">View Rota</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-dashboard-line text-2xl text-blue-600"></i>
              </div>
              <span className="font-medium text-gray-900">View Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
