import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { Job } from '../types';
import { searchJobs, formatPostedTime, formatSalary, JOB_SOURCES, getJobSources } from '../services/api';

// Generate initials from company name
const getInitials = (name: string): string => {
  return name
    .split(/[\s&]+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
};

// Generate a consistent color based on company name
const getColorFromName = (name: string): string => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-red-500 to-red-600',
    'from-orange-500 to-orange-600',
    'from-amber-500 to-amber-600',
    'from-green-500 to-green-600',
    'from-teal-500 to-teal-600',
    'from-cyan-500 to-cyan-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Company Logo component with proper fallback
const CompanyLogo = ({ 
  company, 
  logo, 
  size = 'md' 
}: { 
  company: string; 
  logo?: string; 
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };
  
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);
  
  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Check if logo URL is valid
  const isValidUrl = logo && 
    (logo.startsWith('http://') || logo.startsWith('https://')) && 
    !logo.includes('undefined') && 
    !logo.includes('null');
  
  // Show fallback if no logo, invalid URL, or error occurred
  if (!isValidUrl || hasError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br ${getColorFromName(company)} flex items-center justify-center text-white font-bold flex-shrink-0`}
      >
        {getInitials(company)}
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gray-50 border flex-shrink-0 relative overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={logo}
        alt={company}
        className={`w-full h-full object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );
};

interface SourceStatus {
  name: string;
  count: number;
  success: boolean;
}

export default function SearchPage() {
  const { selectedJobIds, toggleJobSelection, selectAllJobs, clearSelection, addToQueue, setCurrentPage } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    clearSelection();
    setSelectedJob(null);
    
    try {
      const results = await searchJobs({
        query: searchQuery,
        location,
        remoteOnly,
        salaryMin: salaryMin ? parseInt(salaryMin) * 1000 : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) * 1000 : undefined,
      });
      setJobs(results);
      setSourceStatuses(getJobSources());
      if (results.length > 0) {
        setSelectedJob(results[0]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelected = () => {
    const selectedJobs = jobs.filter(job => selectedJobIds.includes(job.id));
    addToQueue(selectedJobs);
    clearSelection();
    setCurrentPage('dashboard');
  };

  const handleSelectAll = () => {
    if (selectedJobIds.length === jobs.length) {
      clearSelection();
    } else {
      selectAllJobs(jobs);
    }
  };

  const isJobSelected = (jobId: string) => selectedJobIds.includes(jobId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
          <p className="text-blue-100 mb-6">
            Searching across {JOB_SOURCES.length}+ platforms: {JOB_SOURCES.slice(0, 5).join(' • ')} and more
          </p>
          
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm font-medium mb-1">Job Title or Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Product Manager"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search Jobs'}
                </button>
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Remote Only</span>
              </label>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Salary:</span>
                <select
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Min</option>
                  <option value="50">$50K+</option>
                  <option value="75">$75K+</option>
                  <option value="100">$100K+</option>
                  <option value="125">$125K+</option>
                  <option value="150">$150K+</option>
                  <option value="200">$200K+</option>
                </select>
                <span className="text-gray-400">-</span>
                <select
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Max</option>
                  <option value="100">$100K</option>
                  <option value="150">$150K</option>
                  <option value="200">$200K</option>
                  <option value="250">$250K</option>
                  <option value="300">$300K</option>
                  <option value="400">$400K+</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Searching across multiple job boards...</span>
          </div>
        )}

        {!loading && hasSearched && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            
            {/* Show source statuses when no jobs found */}
            {sourceStatuses.length > 0 && (
              <div className="max-w-md mx-auto">
                <button
                  onClick={() => setShowSourceDetails(!showSourceDetails)}
                  className="text-blue-600 text-sm hover:underline mb-4"
                >
                  {showSourceDetails ? 'Hide' : 'Show'} source details
                </button>
                {showSourceDetails && (
                  <div className="bg-white rounded-lg border p-4 text-left">
                    <h4 className="font-medium text-gray-700 mb-2">Sources Searched:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {sourceStatuses.map((s) => (
                        <div key={s.name} className={`flex items-center gap-2 ${s.success ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{s.success ? '✓' : '✗'}</span>
                          <span>{s.name}</span>
                          <span className="text-xs">({s.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <>
            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedJobIds.length === jobs.length && jobs.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </label>
                <span className="text-gray-500 text-sm">
                  {jobs.length} jobs found • {selectedJobIds.length} selected
                </span>
                
                {/* Source Status Indicator */}
                {sourceStatuses.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSourceDetails(!showSourceDetails)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {sourceStatuses.filter(s => s.success).length}/{sourceStatuses.length} sources
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${showSourceDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showSourceDetails && (
                      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-20 min-w-[280px]">
                        <h4 className="font-medium text-gray-800 mb-3">Job Sources Status</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {sourceStatuses.map((s) => (
                            <div key={s.name} className={`flex items-center justify-between gap-2 px-2 py-1 rounded ${s.success ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <span className={s.success ? 'text-green-700' : 'text-gray-400'}>{s.name}</span>
                              <span className={`text-xs font-medium ${s.success ? 'text-green-600' : 'text-gray-400'}`}>{s.count}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          Green = returned jobs • Gray = no jobs or failed
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedJobIds.length > 0 && (
                <button
                  onClick={handleApplySelected}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Apply to {selectedJobIds.length} Job{selectedJobIds.length > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Job List and Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Job List */}
              <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isJobSelected(job.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleJobSelection(job.id);
                          }}
                          className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                      <CompanyLogo company={job.company} logo={job.companyLogo} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                          <span>•</span>
                          <span className="text-green-600 font-medium">{formatSalary(job.salary)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {job.isSearchLink && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                              🔗 Search Link
                            </span>
                          )}
                          {job.easyApply && !job.isSearchLink && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              ⚡ Easy Apply
                            </span>
                          )}
                          {job.urgentHiring && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              🔥 Urgent
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {job.source}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Job Detail */}
              {selectedJob && (
                <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm max-h-[calc(100vh-280px)] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b p-6 z-10">
                    <div className="flex items-start gap-4">
                      <CompanyLogo company={selectedJob.company} logo={selectedJob.companyLogo} size="lg" />
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                        <p className="text-lg text-gray-700">{selectedJob.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {selectedJob.location}
                          </span>
                          <span>•</span>
                          <span>{selectedJob.employmentType || 'Full-time'}</span>
                          <span>•</span>
                          <span>{selectedJob.experienceLevel || 'All levels'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      {!selectedJob.isSearchLink && (
                        <button
                          onClick={() => toggleJobSelection(selectedJob.id)}
                          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                            isJobSelected(selectedJob.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isJobSelected(selectedJob.id) ? '✓ Selected' : '+ Add to Apply List'}
                        </button>
                      )}
                      <a
                        href={selectedJob.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                          selectedJob.isSearchLink 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700' 
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {selectedJob.isSearchLink ? `Search on ${selectedJob.source} →` : `View on ${selectedJob.source} →`}
                      </a>
                      {selectedJob.isSearchLink && (
                        <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                          ⚠️ This is a search link - click to view jobs on {selectedJob.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Salary</p>
                        <p className="text-lg font-bold text-green-700">{formatSalary(selectedJob.salary)}</p>
                        <p className="text-xs text-green-600">per year</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Location</p>
                        <p className="text-lg font-bold text-blue-700">{selectedJob.locationType}</p>
                        <p className="text-xs text-blue-600 truncate">{selectedJob.location}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-600 font-medium">Experience</p>
                        <p className="text-lg font-bold text-purple-700">{selectedJob.experienceLevel || 'Not specified'}</p>
                        <p className="text-xs text-purple-600">{selectedJob.department || selectedJob.industry || 'Various'}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-orange-600 font-medium">Posted</p>
                        <p className="text-lg font-bold text-orange-700">{formatPostedTime(selectedJob.postedAt)}</p>
                        <p className="text-xs text-orange-600">{selectedJob.applicantCount ? `${selectedJob.applicantCount} applicants` : 'Be an early applicant'}</p>
                      </div>
                    </div>

                    {/* About the Company */}
                    {selectedJob.companyDescription && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">About {selectedJob.company}</h3>
                        <p className="text-gray-600 leading-relaxed">{selectedJob.companyDescription}</p>
                        {selectedJob.industry && (
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="bg-gray-100 px-3 py-1 rounded-full">{selectedJob.industry}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Job Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">About this Role</h3>
                      <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {selectedJob.fullDescription || selectedJob.description || 'No description available. Click the button below to view full details on the source website.'}
                      </div>
                      
                      {/* If description is short, show a note */}
                      {(!selectedJob.fullDescription || selectedJob.fullDescription.length < 200) && !selectedJob.isSearchLink && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-sm text-blue-700">
                            💡 <strong>Tip:</strong> This listing has limited details. Click "View on {selectedJob.source}" to see the complete job description with all requirements and benefits.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Responsibilities */}
                    {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
                        <ul className="space-y-2">
                          {selectedJob.responsibilities.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-600">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : !selectedJob.isSearchLink && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
                        <p className="text-gray-500 text-sm">
                          Detailed responsibilities are available on the {selectedJob.source} listing. 
                          <a 
                            href={selectedJob.applyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            View full details →
                          </a>
                        </p>
                      </div>
                    )}

                    {/* Requirements */}
                    {selectedJob.requirements && selectedJob.requirements.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                        <ul className="space-y-2">
                          {selectedJob.requirements.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-600">
                              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : !selectedJob.isSearchLink && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                        <p className="text-gray-500 text-sm">
                          Full qualifications and requirements are available on the {selectedJob.source} listing.
                          <a 
                            href={selectedJob.applyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            View full details →
                          </a>
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedJob.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-600">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source Info */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {selectedJob.source.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Listed on</p>
                            <p className="font-medium text-gray-700">{selectedJob.source}</p>
                          </div>
                        </div>
                        <a
                          href={selectedJob.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Apply on {selectedJob.source}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Initial State */}
        {!loading && !hasSearched && (
          <div className="text-center py-16">
            <div className="text-7xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Start Your Job Search</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Search across LinkedIn, Indeed, Glassdoor, and 50+ other job boards. 
              Select multiple jobs and apply to all of them with one click.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Software Engineer', 'Product Manager', 'Data Scientist', 'Mechanical Engineer', 'Marketing Manager'].map((term) => (
                <button
                  key={term}
                  onClick={async () => {
                    setSearchQuery(term);
                    setLoading(true);
                    setHasSearched(true);
                    clearSelection();
                    setSelectedJob(null);
                    const results = await searchJobs({ query: term, remoteOnly });
                    setJobs(results);
                    setSourceStatuses(getJobSources());
                    if (results.length > 0) setSelectedJob(results[0]);
                    setLoading(false);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
