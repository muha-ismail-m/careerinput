import { useState } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Building2, Clock, ExternalLink, CheckSquare, Square, Zap, Filter, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Layout } from '@/components/Layout';
import { Job, SearchFilters } from '@/types';
import { searchJobsAPI } from '@/services/api';
import { cn } from '@/utils/cn';

export function SearchPage() {
  const { jobs, setJobs, selectedJobs, toggleJobSelection, selectAllJobs, clearSelection, addToQueue, setCurrentPage, isAuthenticated } = useAppStore();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    remoteOnly: false,
    salaryMin: undefined,
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchJobsAPI(filters);
      setJobs(results);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleApplySelected = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    const selectedJobsList = jobs.filter(job => selectedJobs.has(job.id));
    addToQueue(selectedJobsList);
    setCurrentPage('dashboard');
  };
  
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    const format = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `${format(min)}+`;
    return `Up to ${format(max!)}`;
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Auth Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sign in to Apply</h3>
                <p className="text-slate-500 mb-6">
                  Create a free account to batch apply to jobs and track your applications.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthPrompt(false);
                      setCurrentPage('auth');
                    }}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Find Your Next Role</h1>
            <p className="text-slate-500 mt-1">Search jobs from LinkedIn, Indeed, Glassdoor, and 50+ sources</p>
          </div>
          
          {selectedJobs.size > 0 && (
            <button
              onClick={handleApplySelected}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Zap className="h-5 w-5" />
              Apply to {selectedJobs.size} Selected
            </button>
          )}
        </div>
        
        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Title or Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Job title, keywords, or company"
                />
              </div>
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="City, state, or remote"
                />
              </div>
            </div>
            
            {/* Min Salary */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Min Salary</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={filters.salaryMin || ''}
                  onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                >
                  <option value="">Any</option>
                  <option value="50000">$50k+</option>
                  <option value="75000">$75k+</option>
                  <option value="100000">$100k+</option>
                  <option value="125000">$125k+</option>
                  <option value="150000">$150k+</option>
                  <option value="200000">$200k+</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.remoteOnly}
                  onChange={(e) => setFilters({ ...filters, remoteOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Remote only</span>
              </label>
              
              <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <Filter className="h-4 w-4" />
                More filters
              </button>
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Search Jobs
                </>
              )}
            </button>
          </div>
        </div>

        {/* Job Sources Info */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>Searching across:</span>
          <span className="font-medium text-slate-700">LinkedIn</span>
          <span>•</span>
          <span className="font-medium text-slate-700">Indeed</span>
          <span>•</span>
          <span className="font-medium text-slate-700">Glassdoor</span>
          <span>•</span>
          <span className="font-medium text-slate-700">ZipRecruiter</span>
          <span>•</span>
          <span className="text-indigo-600">+46 more</span>
        </div>
        
        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-slate-600">
                Found <span className="font-semibold text-slate-900">{jobs.length}</span> jobs
              </p>
              
              {jobs.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectedJobs.size === jobs.length ? clearSelection : selectAllJobs}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {selectedJobs.size === jobs.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Job Cards */}
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobs.has(job.id)}
                  onToggle={() => toggleJobSelection(job.id)}
                  formatSalary={formatSalary}
                />
              ))}
            </div>
            
            {jobs.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-500">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
        
        {/* Initial State */}
        {!hasSearched && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
            <Briefcase className="h-16 w-16 text-indigo-200 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to find your next role?</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Enter a job title and location above to search thousands of jobs from LinkedIn, Indeed, Glassdoor, and more.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  onToggle: () => void;
  formatSalary: (min?: number, max?: number) => string;
}

function JobCard({ job, isSelected, onToggle, formatSalary }: JobCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg',
        isSelected
          ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10'
          : 'border-slate-100 hover:border-slate-200'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button className="mt-1 flex-shrink-0">
          {isSelected ? (
            <CheckSquare className="h-6 w-6 text-indigo-600" />
          ) : (
            <Square className="h-6 w-6 text-slate-300" />
          )}
        </button>
        
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.logoUrl ? (
            <img src={job.logoUrl} alt={job.company} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-slate-400" />
            </div>
          )}
        </div>
        
        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 truncate">{job.title}</h3>
              <p className="text-slate-600">{job.company}</p>
            </div>
            
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {job.postedAt}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {job.remote && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                Remote
              </span>
            )}
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full capitalize">
              {job.jobType}
            </span>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
              {job.source}
            </span>
          </div>
          
          <p className="mt-3 text-sm text-slate-500 line-clamp-2">{job.description}</p>
        </div>
      </div>
    </div>
  );
}
