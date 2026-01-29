/**
 * API Service Layer
 * 
 * This file contains the API structure for Career Input.
 * 
 * In production, you would integrate with:
 * - RapidAPI JSearch API (for LinkedIn, Indeed, Glassdoor aggregation)
 * - JSearch: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * 
 * API Key Configuration:
 * Set your RapidAPI key as an environment variable: VITE_RAPIDAPI_KEY
 */

import { Job, Profile, SearchFilters } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Job sources we aggregate from
const JOB_SOURCES = [
  'LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster',
  'CareerBuilder', 'Dice', 'AngelList', 'Greenhouse', 'Lever',
  'SimplyHired', 'FlexJobs', 'Ladders', 'Snagajob', 'Hired'
];

// Company names for realistic job listings
const COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Stripe',
  'Airbnb', 'Uber', 'Lyft', 'Spotify', 'Slack', 'Dropbox', 'Square',
  'Shopify', 'Salesforce', 'Adobe', 'Oracle', 'IBM', 'Intel',
  'Tesla', 'SpaceX', 'Palantir', 'Databricks', 'Snowflake',
  'Figma', 'Notion', 'Airtable', 'Canva', 'Zoom',
  'HubSpot', 'Zendesk', 'Twilio', 'Cloudflare', 'HashiCorp'
];

// Generate realistic job descriptions
function generateDescription(title: string, company: string): string {
  const templates = [
    `${company} is looking for a talented ${title} to join our growing team. You will work on challenging problems and have a direct impact on millions of users.`,
    `We're seeking an experienced ${title} to help drive our product forward. Join ${company} and work with world-class talent on cutting-edge technology.`,
    `${company} is hiring a ${title}. In this role, you'll collaborate cross-functionally to deliver exceptional user experiences.`,
    `Excited to grow? ${company} is looking for a ${title} who's passionate about building great products and wants to make an impact.`,
    `Join ${company} as a ${title}. You'll be part of a dynamic team working on innovative solutions that scale globally.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate jobs based on search criteria
function generateJobs(filters: SearchFilters): Job[] {
  const { query, location, remoteOnly, salaryMin } = filters;
  
  // Base job titles that match common searches
  const baseTitles: Record<string, string[]> = {
    'product': ['Product Manager', 'Senior Product Manager', 'Associate Product Manager', 'Technical Product Manager', 'Product Lead', 'Director of Product'],
    'engineer': ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer'],
    'software': ['Software Engineer', 'Software Developer', 'Senior Software Engineer', 'Principal Engineer', 'Engineering Manager'],
    'manager': ['Product Manager', 'Engineering Manager', 'Project Manager', 'Program Manager', 'Account Manager'],
    'design': ['Product Designer', 'UX Designer', 'UI Designer', 'Senior Designer', 'Design Lead'],
    'data': ['Data Scientist', 'Data Engineer', 'Data Analyst', 'ML Engineer', 'Analytics Manager'],
    'marketing': ['Marketing Manager', 'Growth Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager'],
    'sales': ['Account Executive', 'Sales Manager', 'Sales Development Rep', 'Enterprise Sales', 'Sales Director'],
    'default': ['Product Manager', 'Software Engineer', 'Data Analyst', 'Marketing Manager', 'UX Designer']
  };
  
  // Find matching title category
  const queryLower = query.toLowerCase();
  let titles = baseTitles['default'];
  for (const [key, value] of Object.entries(baseTitles)) {
    if (queryLower.includes(key)) {
      titles = value;
      break;
    }
  }
  
  // Locations
  const locations = [
    'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 
    'Los Angeles, CA', 'Boston, MA', 'Chicago, IL', 'Denver, CO',
    'Remote', 'San Jose, CA', 'Portland, OR', 'Atlanta, GA'
  ];
  
  // Filter locations based on search
  let filteredLocations = locations;
  if (location) {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('remote')) {
      filteredLocations = ['Remote'];
    } else {
      filteredLocations = locations.filter(loc => 
        loc.toLowerCase().includes(locationLower)
      );
      if (filteredLocations.length === 0) filteredLocations = locations;
    }
  }
  
  // Generate jobs
  const jobs: Job[] = [];
  const numJobs = 15 + Math.floor(Math.random() * 10);
  
  for (let i = 0; i < numJobs; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)];
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const jobLocation = filteredLocations[Math.floor(Math.random() * filteredLocations.length)];
    const isRemote = remoteOnly || jobLocation === 'Remote' || Math.random() > 0.6;
    const source = JOB_SOURCES[Math.floor(Math.random() * JOB_SOURCES.length)];
    
    // Generate salary range
    const baseSalary = salaryMin || (80000 + Math.floor(Math.random() * 80000));
    const salaryMinVal = Math.floor(baseSalary / 5000) * 5000;
    const salaryMaxVal = salaryMinVal + 20000 + Math.floor(Math.random() * 40000);
    
    // Skip if below min salary
    if (salaryMin && salaryMinVal < salaryMin) continue;
    
    // Skip non-remote if remoteOnly
    if (remoteOnly && !isRemote) continue;
    
    const daysAgo = Math.floor(Math.random() * 14);
    const postedDate = new Date();
    postedDate.setDate(postedDate.getDate() - daysAgo);
    
    jobs.push({
      id: uuidv4(),
      title: query ? `${title}` : title,
      company,
      location: isRemote ? 'Remote' : jobLocation,
      salaryMin: salaryMinVal,
      salaryMax: salaryMaxVal,
      description: generateDescription(title, company),
      applyUrl: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${uuidv4().slice(0, 8)}`,
      jobType: 'full-time',
      remote: isRemote,
      postedAt: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
      source,
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=${['6366f1', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '14b8a6', 'f97316', '3b82f6'][Math.floor(Math.random() * 8)]}&color=fff`,
    });
  }
  
  // Sort by "posted date" (most recent first)
  return jobs.sort((a, b) => {
    const getDays = (str: string) => {
      if (str === 'Today') return 0;
      if (str === 'Yesterday') return 1;
      return parseInt(str) || 99;
    };
    return getDays(a.postedAt) - getDays(b.postedAt);
  });
}

/**
 * Search Jobs API
 * 
 * In production, this would call RapidAPI JSearch:
 * 
 * const response = await fetch('https://jsearch.p.rapidapi.com/search', {
 *   method: 'GET',
 *   headers: {
 *     'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
 *     'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
 *   },
 *   params: {
 *     query: `${filters.query} in ${filters.location}`,
 *     page: '1',
 *     num_pages: '1',
 *     remote_jobs_only: filters.remoteOnly
 *   }
 * });
 */
export async function searchJobsAPI(filters: SearchFilters): Promise<Job[]> {
  await delay(800 + Math.random() * 400); // Simulate network delay
  
  // Generate realistic jobs based on search
  return generateJobs(filters);
}

export async function uploadResume(file: File): Promise<{ url: string; fileName: string }> {
  await delay(1000);
  
  // In production, upload to S3 or Supabase Storage
  const url = URL.createObjectURL(file);
  return { url, fileName: file.name };
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await delay(500);
  return profile;
}

export async function addJobsToQueue(_jobIds: string[]): Promise<void> {
  await delay(300);
}

export async function triggerAutomation(): Promise<void> {
  // In production, this would call the backend to start Playwright automation
}

/**
 * RapidAPI JSearch Integration Example
 * 
 * To enable real job data, you need:
 * 1. Sign up for RapidAPI: https://rapidapi.com/
 * 2. Subscribe to JSearch API: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * 3. Add your API key to environment variables
 * 
 * Example implementation:
 * 
 * const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
 * 
 * export async function searchJobsReal(filters: SearchFilters): Promise<Job[]> {
 *   const params = new URLSearchParams({
 *     query: `${filters.query} in ${filters.location || 'USA'}`,
 *     page: '1',
 *     num_pages: '1',
 *     remote_jobs_only: String(filters.remoteOnly),
 *   });
 *   
 *   const response = await fetch(
 *     `https://jsearch.p.rapidapi.com/search?${params}`,
 *     {
 *       headers: {
 *         'X-RapidAPI-Key': RAPIDAPI_KEY,
 *         'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
 *       },
 *     }
 *   );
 *   
 *   const data = await response.json();
 *   
 *   return data.data.map((job: any) => ({
 *     id: job.job_id,
 *     title: job.job_title,
 *     company: job.employer_name,
 *     location: job.job_city + ', ' + job.job_state,
 *     salaryMin: job.job_min_salary,
 *     salaryMax: job.job_max_salary,
 *     description: job.job_description,
 *     applyUrl: job.job_apply_link,
 *     jobType: job.job_employment_type?.toLowerCase() || 'full-time',
 *     remote: job.job_is_remote,
 *     postedAt: new Date(job.job_posted_at_datetime_utc).toLocaleDateString(),
 *     source: 'JSearch',
 *     logoUrl: job.employer_logo,
 *   }));
 * }
 */
