import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Document, Job, JobQueue, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Profile
  profile: Profile | null;
  document: Document | null;
  
  // Jobs
  jobs: Job[];
  selectedJobIds: string[];
  jobQueue: JobQueue[];
  
  // UI State
  currentPage: 'landing' | 'search' | 'dashboard' | 'settings' | 'auth';
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => void;
  signup: (email: string, password: string) => void;
  logout: () => void;
  
  setProfile: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  setDocument: (document: Document) => void;
  
  setJobs: (jobs: Job[]) => void;
  toggleJobSelection: (jobId: string) => void;
  selectAllJobs: () => void;
  clearSelection: () => void;
  isJobSelected: (jobId: string) => boolean;
  getSelectedCount: () => number;
  
  addToQueue: (jobs: Job[]) => void;
  updateQueueStatus: (queueId: string, status: JobQueue['status'], errorMessage?: string) => void;
  removeFromQueue: (queueId: string) => void;
  processQueue: () => Promise<void>;
  
  setCurrentPage: (page: AppState['currentPage']) => void;
  setLoading: (loading: boolean) => void;
  
  // Check if user needs login for applying
  requiresAuth: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      profile: null,
      document: null,
      jobs: [],
      selectedJobIds: [],
      jobQueue: [],
      currentPage: 'landing',
      isLoading: false,
      
      // Auth Actions
      login: (email: string, _password: string) => {
        const user: User = {
          id: uuidv4(),
          email,
          authToken: uuidv4(),
          createdAt: new Date(),
        };
        // Create empty profile on login
        const emptyProfile: Profile = {
          userId: user.id,
          firstName: '',
          lastName: '',
          phone: '',
          email: email,
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          linkedinUrl: '',
          portfolioUrl: '',
          githubUrl: '',
          yearsOfExperience: '',
          currentTitle: '',
          desiredSalary: '',
          workAuthorization: '',
          requiresSponsorship: false,
          genericCoverLetter: '',
          skills: [],
          education: [],
          experience: [],
        };
        set({ user, isAuthenticated: true, profile: emptyProfile, currentPage: 'search' });
      },
      
      signup: (email: string, _password: string) => {
        const user: User = {
          id: uuidv4(),
          email,
          authToken: uuidv4(),
          createdAt: new Date(),
        };
        const emptyProfile: Profile = {
          userId: user.id,
          firstName: '',
          lastName: '',
          phone: '',
          email: email,
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          linkedinUrl: '',
          portfolioUrl: '',
          githubUrl: '',
          yearsOfExperience: '',
          currentTitle: '',
          desiredSalary: '',
          workAuthorization: '',
          requiresSponsorship: false,
          genericCoverLetter: '',
          skills: [],
          education: [],
          experience: [],
        };
        set({ user, isAuthenticated: true, profile: emptyProfile, currentPage: 'search' });
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          profile: null,
          document: null,
          jobs: [],
          selectedJobIds: [],
          jobQueue: [],
          currentPage: 'landing',
        });
      },
      
      // Profile Actions
      setProfile: (profile: Profile) => {
        set({ profile });
      },
      
      updateProfile: (updates: Partial<Profile>) => {
        const { profile } = get();
        if (profile) {
          set({ profile: { ...profile, ...updates } });
        }
      },
      
      setDocument: (document: Document) => {
        set({ document });
      },
      
      // Job Actions
      setJobs: (jobs: Job[]) => {
        set({ jobs, selectedJobIds: [] });
      },
      
      toggleJobSelection: (jobId: string) => {
        const { selectedJobIds } = get();
        const isSelected = selectedJobIds.includes(jobId);
        if (isSelected) {
          set({ selectedJobIds: selectedJobIds.filter(id => id !== jobId) });
        } else {
          set({ selectedJobIds: [...selectedJobIds, jobId] });
        }
      },
      
      selectAllJobs: () => {
        const { jobs } = get();
        set({ selectedJobIds: jobs.map(j => j.id) });
      },
      
      clearSelection: () => {
        set({ selectedJobIds: [] });
      },
      
      isJobSelected: (jobId: string) => {
        return get().selectedJobIds.includes(jobId);
      },
      
      getSelectedCount: () => {
        return get().selectedJobIds.length;
      },
      
      addToQueue: (jobs: Job[]) => {
        const { user, jobQueue } = get();
        const existingJobIds = new Set(jobQueue.map(item => item.jobId));
        const newItems: JobQueue[] = jobs
          .filter(job => !existingJobIds.has(job.id))
          .map(job => ({
            id: uuidv4(),
            userId: user?.id || '',
            jobId: job.id,
            job,
            status: 'pending',
            createdAt: new Date(),
          }));
        set({ jobQueue: [...jobQueue, ...newItems], selectedJobIds: [] });
      },
      
      updateQueueStatus: (queueId: string, status: JobQueue['status'], errorMessage?: string) => {
        const { jobQueue } = get();
        const updated = jobQueue.map(item => 
          item.id === queueId 
            ? { ...item, status, errorMessage, appliedAt: status === 'applied' ? new Date() : undefined }
            : item
        );
        set({ jobQueue: updated });
      },
      
      removeFromQueue: (queueId: string) => {
        const { jobQueue } = get();
        set({ jobQueue: jobQueue.filter(item => item.id !== queueId) });
      },
      
      processQueue: async () => {
        const { jobQueue, updateQueueStatus } = get();
        const pending = jobQueue.filter(item => item.status === 'pending');
        
        for (const item of pending) {
          updateQueueStatus(item.id, 'processing');
          
          // Simulate automation processing
          await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
          
          // Simulate success/failure (70% success rate for demo)
          const success = Math.random() > 0.3;
          const isManualRequired = !success && Math.random() > 0.5;
          
          if (success) {
            updateQueueStatus(item.id, 'applied');
          } else if (isManualRequired) {
            updateQueueStatus(item.id, 'manual_required', 'CAPTCHA or login wall detected');
          } else {
            updateQueueStatus(item.id, 'failed', 'Could not find application form');
          }
        }
      },
      
      setCurrentPage: (page) => set({ currentPage: page }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      requiresAuth: () => {
        const { isAuthenticated } = get();
        return !isAuthenticated;
      },
    }),
    {
      name: 'career-input-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        document: state.document,
        jobQueue: state.jobQueue,
        currentPage: state.currentPage,
      }),
    }
  )
);
