// Database Schema Types

export interface User {
  id: string;
  email: string;
  name: string;
  authToken?: string;
  photoURL?: string;
  createdAt?: Date;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  yearsOfExperience: string;
  currentTitle: string;
  desiredSalary: string;
  workAuthorization: string;
  requiresSponsorship: boolean;
  genericCoverLetter: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Document {
  userId: string;
  resumeFileUrl: string;
  resumeFileName: string;
  uploadedAt: Date;
}

// Job interface - fields may be optional since real APIs have varying data
export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyDescription?: string;
  location: string;
  locationType: 'Remote' | 'On-site' | 'Hybrid';
  salary?: { min: number; max: number };
  salaryPeriod?: 'yearly' | 'hourly';
  description: string;
  fullDescription?: string; // Full job description from source
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: string;
  employmentType?: string;
  applyUrl: string; // REAL URL to apply on the original job site
  sourceUrl?: string; // URL where the job was found
  source: string; // Which job board (Remotive, Arbeitnow, etc.)
  sourceLogoUrl?: string;
  postedAt: Date | string;
  expiresAt?: Date;
  applicantCount?: number;
  easyApply?: boolean;
  urgentHiring?: boolean;
  industry?: string;
  department?: string;
}

export interface JobQueue {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  status: 'pending' | 'processing' | 'applied' | 'failed' | 'manual_required';
  errorMessage?: string;
  appliedAt?: Date;
  createdAt: Date;
}

export interface SearchFilters {
  query: string;
  location: string;
  remoteOnly: boolean;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
}
