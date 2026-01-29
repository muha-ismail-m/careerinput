// Database Schema Types

export interface User {
  id: string;
  email: string;
  authToken: string;
  createdAt: Date;
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

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  applyUrl: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  postedAt: string;
  source: string;
  logoUrl?: string;
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
