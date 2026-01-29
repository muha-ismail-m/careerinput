import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Play, RefreshCw, ExternalLink, Building2, Trash2, Zap, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Layout } from '@/components/Layout';
import { JobQueue } from '@/types';
import { cn } from '@/utils/cn';

export function DashboardPage() {
  const { jobQueue, processQueue, setCurrentPage, removeFromQueue } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const stats = {
    total: jobQueue.length,
    pending: jobQueue.filter(j => j.status === 'pending').length,
    processing: jobQueue.filter(j => j.status === 'processing').length,
    applied: jobQueue.filter(j => j.status === 'applied').length,
    failed: jobQueue.filter(j => j.status === 'failed').length,
    manual: jobQueue.filter(j => j.status === 'manual_required').length,
  };
  
  const handleProcess = async () => {
    setIsProcessing(true);
    await processQueue();
    setIsProcessing(false);
  };
  
  const getStatusIcon = (status: JobQueue['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-slate-400" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'applied':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'manual_required':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };
  
  const getStatusText = (status: JobQueue['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing...';
      case 'applied':
        return 'Applied Successfully';
      case 'failed':
        return 'Failed';
      case 'manual_required':
        return 'Manual Apply Required';
    }
  };
  
  const getStatusColor = (status: JobQueue['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 text-slate-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'applied':
        return 'bg-emerald-100 text-emerald-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'manual_required':
        return 'bg-amber-100 text-amber-700';
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Application Dashboard</h1>
            <p className="text-slate-500 mt-1">Track and manage your job applications</p>
          </div>
          
          {stats.pending > 0 && (
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Process {stats.pending} Pending
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard
            label="Total Jobs"
            value={stats.total}
            icon={Zap}
            color="bg-gradient-to-br from-indigo-500 to-purple-600"
          />
          <StatsCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-slate-500"
          />
          <StatsCard
            label="Applied"
            value={stats.applied}
            icon={CheckCircle2}
            color="bg-emerald-500"
          />
          <StatsCard
            label="Failed"
            value={stats.failed}
            icon={XCircle}
            color="bg-red-500"
          />
          <StatsCard
            label="Manual Required"
            value={stats.manual}
            icon={AlertTriangle}
            color="bg-amber-500"
          />
        </div>
        
        {/* Application List */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Application Queue</h2>
          </div>
          
          {jobQueue.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
              <p className="text-slate-500 mb-6">Start by searching for jobs and adding them to your queue</p>
              <button
                onClick={() => setCurrentPage('search')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Search className="h-5 w-5" />
                Search Jobs
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobQueue.map((item) => (
                <ApplicationRow
                  key={item.id}
                  item={item}
                  statusIcon={getStatusIcon(item.status)}
                  statusText={getStatusText(item.status)}
                  statusColor={getStatusColor(item.status)}
                  onRemove={() => removeFromQueue(item.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Processing Info */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Automation in Progress</h3>
                <p className="text-blue-700 mt-1">
                  Our system is automatically filling out application forms using your profile. 
                  This may take a few minutes depending on the number of applications.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Info Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-emerald-900 mb-2">Successfully Applied</h3>
            <p className="text-emerald-700 text-sm">
              These applications were submitted automatically using your universal profile. 
              You should receive confirmation emails from the companies.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <AlertTriangle className="h-8 w-8 text-amber-600 mb-3" />
            <h3 className="font-semibold text-amber-900 mb-2">Manual Apply Required</h3>
            <p className="text-amber-700 text-sm">
              Some job sites (like Workday or Taleo) require account creation or have CAPTCHAs. 
              Click "Apply Manually" to complete these applications yourself.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface StatsCardProps {
  label: string;
  value: number;
  icon: typeof Zap;
  color: string;
}

function StatsCard({ label, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg text-white', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface ApplicationRowProps {
  item: JobQueue;
  statusIcon: React.ReactNode;
  statusText: string;
  statusColor: string;
  onRemove: () => void;
}

function ApplicationRow({ item, statusIcon, statusText, statusColor, onRemove }: ApplicationRowProps) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {item.job.logoUrl ? (
            <img src={item.job.logoUrl} alt={item.job.company} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>
        
        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{item.job.title}</h3>
          <p className="text-sm text-slate-500">{item.job.company} • {item.job.location}</p>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', statusColor)}>
            {statusIcon}
            <span className="hidden sm:inline">{statusText}</span>
          </span>
          
          {/* Error Message Tooltip */}
          {item.errorMessage && (
            <span className="text-xs text-red-500 hidden md:block max-w-[200px] truncate">
              {item.errorMessage}
            </span>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {item.status === 'manual_required' && (
              <a
                href={item.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            
            <button 
              onClick={onRemove}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
