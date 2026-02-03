import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Document, Job, JobQueue } from '../types';

type Page = 'landing' | 'search' | 'dashboard' | 'settings';

interface AppState {
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Profile
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => void;

  // Documents
  document: Document | null;
  setDocument: (doc: Document) => void;

  // Jobs
  searchResults: Job[];
  setSearchResults: (jobs: Job[]) => void;
  selectedJobIds: string[];
  toggleJobSelection: (jobId: string) => void;
  selectAllJobs: (jobs: Job[]) => void;
  clearSelection: () => void;
  isJobSelected: (jobId: string) => boolean;
  getSelectedCount: () => number;

  // Job Queue
  jobQueue: JobQueue[];
  addToQueue: (jobs: Job[]) => void;
  updateQueueItem: (id: string, updates: Partial<JobQueue>) => void;
  processQueue: () => void;
  clearQueue: () => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const defaultProfile: Profile = {
  userId: 'local-user',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'landing',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Profile - initialize with default profile
      profile: defaultProfile,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : { ...defaultProfile, ...updates },
      })),

      // Documents
      document: null,
      setDocument: (doc) => set({ document: doc }),

      // Jobs
      searchResults: [],
      setSearchResults: (jobs) => set({ searchResults: jobs }),
      selectedJobIds: [],
      toggleJobSelection: (jobId) => set((state) => {
        const isSelected = state.selectedJobIds.includes(jobId);
        return {
          selectedJobIds: isSelected
            ? state.selectedJobIds.filter(id => id !== jobId)
            : [...state.selectedJobIds, jobId],
        };
      }),
      selectAllJobs: (jobs) => set({ selectedJobIds: jobs.map(j => j.id) }),
      clearSelection: () => set({ selectedJobIds: [] }),
      isJobSelected: (jobId) => get().selectedJobIds.includes(jobId),
      getSelectedCount: () => get().selectedJobIds.length,

      // Job Queue
      jobQueue: [],
      addToQueue: (jobs) => set((state) => {
        const newItems: JobQueue[] = jobs.map((job) => ({
          id: `queue-${job.id}-${Date.now()}`,
          userId: 'local-user',
          jobId: job.id,
          job,
          status: 'pending',
          createdAt: new Date(),
        }));
        return { 
          jobQueue: [...state.jobQueue, ...newItems],
          selectedJobIds: [],
          currentPage: 'dashboard',
        };
      }),
      updateQueueItem: (id, updates) => set((state) => ({
        jobQueue: state.jobQueue.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),
      processQueue: () => {
        const { jobQueue, updateQueueItem } = get();
        const pendingItems = jobQueue.filter((item) => item.status === 'pending');

        pendingItems.forEach((item, index) => {
          // Set to processing
          setTimeout(() => {
            updateQueueItem(item.id, { status: 'processing' });
          }, index * 500);

          // Simulate automation result
          setTimeout(() => {
            const rand = Math.random();
            let status: JobQueue['status'];
            let errorMessage: string | undefined;

            if (rand < 0.6) {
              status = 'applied';
            } else if (rand < 0.8) {
              status = 'manual_required';
              errorMessage = 'CAPTCHA detected or login required';
            } else {
              status = 'failed';
              errorMessage = 'Form structure not recognized';
            }

            updateQueueItem(item.id, {
              status,
              errorMessage,
              appliedAt: status === 'applied' ? new Date() : undefined,
            });
          }, index * 500 + 2000 + Math.random() * 2000);
        });
      },
      clearQueue: () => set({ jobQueue: [] }),

      // UI State
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'career-input-storage',
      partialize: (state) => ({
        profile: state.profile,
        document: state.document,
        jobQueue: state.jobQueue.map(item => ({
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          appliedAt: item.appliedAt instanceof Date ? item.appliedAt.toISOString() : item.appliedAt,
          job: {
            ...item.job,
            postedAt: item.job.postedAt instanceof Date ? item.job.postedAt.toISOString() : item.job.postedAt,
          }
        })),
        currentPage: state.currentPage,
      }),
    }
  )
);
