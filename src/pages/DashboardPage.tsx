import { useAppStore } from '../store/appStore';

export default function DashboardPage() {
  const { jobQueue, processQueue, clearQueue, setCurrentPage } = useAppStore();

  const stats = {
    total: jobQueue.length,
    pending: jobQueue.filter((j) => j.status === 'pending').length,
    processing: jobQueue.filter((j) => j.status === 'processing').length,
    applied: jobQueue.filter((j) => j.status === 'applied').length,
    failed: jobQueue.filter((j) => j.status === 'failed').length,
    manual: jobQueue.filter((j) => j.status === 'manual_required').length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      applied: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      manual_required: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing...',
      applied: 'Applied ✓',
      failed: 'Failed',
      manual_required: 'Manual Required',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Dashboard</h1>
            <p className="text-gray-600">Track your job applications</p>
          </div>
          {stats.pending > 0 && (
            <button
              onClick={processQueue}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Process {stats.pending} Pending Applications
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-gray-600 text-sm">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600">{stats.applied}</div>
            <div className="text-gray-600 text-sm">Applied</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-gray-600 text-sm">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.manual}</div>
            <div className="text-gray-600 text-sm">Manual</div>
          </div>
        </div>

        {/* Job Queue */}
        {jobQueue.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Applications Yet</h2>
            <p className="text-gray-600 mb-6">
              Search for jobs and add them to your queue to start batch applying.
            </p>
            <button
              onClick={() => setCurrentPage('search')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search Jobs
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Application Queue</h2>
              <button
                onClick={clearQueue}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {jobQueue.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {item.job.companyLogo ? (
                        <img
                          src={item.job.companyLogo}
                          alt={item.job.company}
                          className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.job.company)}&background=6366f1&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">
                            {item.job.company.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{item.job.title}</h3>
                      <p className="text-sm text-gray-600">
                        {item.job.company} • {item.job.location}
                      </p>
                      {item.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">{item.errorMessage}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      
                      {item.status === 'manual_required' && (
                        <a
                          href={item.job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Apply Manually
                        </a>
                      )}
                      
                      {item.status === 'processing' && (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
