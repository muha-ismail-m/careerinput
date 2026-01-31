import { Job } from '../types';

// ============================================================================
// CAREER INPUT - UNIVERSAL JOB AGGREGATOR v2.0
// More reliable sources with better CORS handling
// ============================================================================

// Multiple CORS proxies for reliability
const corsProxies = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const fetchWithCors = async (url: string, timeout = 8000): Promise<Response> => {
  for (const proxy of corsProxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(proxy(url), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) return response;
    } catch {
      continue;
    }
  }
  throw new Error('All proxies failed');
};

// Track which sources returned results
interface SourceResult {
  name: string;
  count: number;
  success: boolean;
  error?: string;
}

let lastSearchResults: SourceResult[] = [];
export const getLastSearchResults = () => lastSearchResults;

// Parse HTML to plain text
const parseHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Extract bullet points
const extractBullets = (text: string, keywords: string[]): string[] => {
  const lines = text.split('\n');
  const points: string[] = [];
  let capture = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(k => lower.includes(k))) {
      capture = true;
      continue;
    }
    if (capture && /about|company|who we are/i.test(lower)) capture = false;
    if (capture) {
      const clean = line.replace(/^[\s•\-\*\d\.]+/, '').trim();
      if (clean.length > 15 && clean.length < 300) points.push(clean);
    }
  }
  return points.slice(0, 8);
};

// Extract skills from text
const extractSkills = (text: string, tags: string[] = []): string[] => {
  const skillsList = [
    // Tech
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Git', 'Linux', 'CI/CD', 'Machine Learning',
    // Engineering
    'AutoCAD', 'SolidWorks', 'CATIA', 'MATLAB', 'Simulink', 'Ansys', 'Revit', 'PLC', 'SCADA', 'CAD', 'CAM',
    'Six Sigma', 'Lean Manufacturing', 'GD&T', 'FEA', 'CFD', 'BIM', 'HVAC', 'PMP', 'Thermodynamics',
    // Healthcare
    'EMR', 'EHR', 'HIPAA', 'CPR', 'BLS', 'ACLS', 'Epic', 'Cerner', 'Patient Care', 'Clinical Research',
    // Finance/Business
    'Excel', 'Financial Modeling', 'Bloomberg', 'SAP', 'QuickBooks', 'GAAP', 'CPA', 'SQL', 'Tableau', 'Power BI',
    // Marketing
    'SEO', 'SEM', 'Google Analytics', 'HubSpot', 'Salesforce', 'Social Media', 'Content Marketing',
    // General
    'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication', 'Problem Solving'
  ];
  
  const found = new Set<string>(tags.slice(0, 5));
  const lower = text.toLowerCase();
  
  skillsList.forEach(skill => {
    if (lower.includes(skill.toLowerCase()) && found.size < 12) found.add(skill);
  });
  
  return Array.from(found);
};

// ============================================================================
// SOURCE 1: REMOTIVE (Remote Jobs - Very Reliable)
// ============================================================================
const fetchRemotive = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; title: string; company_name: string; company_logo?: string;
      category: string; tags: string[]; job_type: string; publication_date: string;
      candidate_required_location: string; salary: string; description: string;
    }): Job => {
      const desc = parseHtml(job.description || '');
      return {
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        companyLogo: job.company_logo || undefined,
        location: job.candidate_required_location || 'Worldwide',
        locationType: 'Remote',
        salary: job.salary ? parseSalary(job.salary) : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will', 'what you\'ll do']),
        requirements: extractBullets(desc, ['requirement', 'qualif', 'you have']),
        skills: extractSkills(desc, job.tags || []),
        benefits: extractBullets(desc, ['benefit', 'perk', 'we offer']),
        employmentType: job.job_type === 'full_time' ? 'Full-time' : job.job_type === 'contract' ? 'Contract' : 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.publication_date),
        source: 'Remotive',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.category,
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Remotive:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 2: REMOTEOK (Remote Jobs - Very Reliable)
// ============================================================================
const fetchRemoteOK = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetchWithCors('https://remoteok.com/api');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    const filtered = data.filter((job: { position?: string; tags?: string[]; description?: string }) => {
      if (!job.position) return false;
      return job.position.toLowerCase().includes(queryLower) ||
             (job.tags || []).join(' ').toLowerCase().includes(queryLower) ||
             (job.description || '').toLowerCase().includes(queryLower);
    }).slice(0, 50);
    
    return filtered.map((job: {
      id: string; url?: string; position: string; company: string; company_logo?: string;
      tags: string[]; date: string; location?: string; salary_min?: number; salary_max?: number;
      description?: string;
    }): Job => {
      const desc = parseHtml(job.description || '');
      return {
        id: `remoteok-${job.id}`,
        title: job.position,
        company: job.company,
        companyLogo: job.company_logo || undefined,
        location: job.location || 'Worldwide',
        locationType: 'Remote',
        salary: job.salary_min && job.salary_max ? { min: job.salary_min, max: job.salary_max } : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: job.tags?.slice(0, 10) || [],
        benefits: extractBullets(desc, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.date),
        source: 'RemoteOK',
        sourceUrl: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
        applyUrl: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
        industry: 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('RemoteOK:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 3: ARBEITNOW (EU Jobs - Reliable)
// ============================================================================
const fetchArbeitnow = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    const filtered = (data.data || []).filter((job: { title: string; tags: string[]; description: string }) => {
      return job.title.toLowerCase().includes(queryLower) ||
             (job.tags || []).some((t: string) => t.toLowerCase().includes(queryLower)) ||
             (job.description || '').toLowerCase().includes(queryLower);
    }).slice(0, 40);
    
    return filtered.map((job: {
      slug: string; company_name: string; title: string; description: string;
      remote: boolean; url: string; tags: string[]; location: string; created_at: number;
    }): Job => {
      const desc = parseHtml(job.description || '');
      return {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Europe',
        locationType: job.remote ? 'Remote' : 'On-site',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, job.tags || []),
        benefits: extractBullets(desc, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.created_at * 1000),
        source: 'Arbeitnow',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.tags?.[0] || 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Arbeitnow:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 4: HIMALAYAS (Remote Jobs - Reliable)
// ============================================================================
const fetchHimalayas = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://himalayas.app/jobs/api?limit=50&q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: string; title: string; companyName: string; companyLogo?: string;
      excerpt?: string; description?: string; locationRestrictions?: string[];
      categories?: string[]; seniority?: string; minSalary?: number; maxSalary?: number;
      pubDate?: string; applicationLink?: string; externalUrl?: string;
    }): Job => {
      const desc = parseHtml(job.description || job.excerpt || '');
      const url = job.applicationLink || job.externalUrl || `https://himalayas.app/jobs/${job.id}`;
      return {
        id: `himalayas-${job.id}`,
        title: job.title,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.locationRestrictions?.join(', ') || 'Worldwide',
        locationType: 'Remote',
        salary: job.minSalary && job.maxSalary ? { min: job.minSalary, max: job.maxSalary } : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, job.categories || []),
        benefits: extractBullets(desc, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: job.seniority === 'senior' ? 'Senior' : job.seniority === 'junior' ? 'Entry Level' : 'Mid Level',
        postedAt: new Date(job.pubDate || Date.now()),
        source: 'Himalayas',
        sourceUrl: url,
        applyUrl: url,
        industry: job.categories?.[0] || 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Himalayas:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 5: JOBICY (Remote Jobs with Salary - Reliable)
// ============================================================================
const fetchJobicy = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetchWithCors(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; jobTitle: string; companyName: string; companyLogo?: string;
      jobIndustry?: string[]; jobType?: string[]; jobGeo?: string; pubDate?: string;
      annualSalaryMin?: number; annualSalaryMax?: number; jobDescription?: string;
    }): Job => {
      const desc = parseHtml(job.jobDescription || '');
      return {
        id: `jobicy-${job.id}`,
        title: job.jobTitle,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.jobGeo || 'Worldwide',
        locationType: 'Remote',
        salary: job.annualSalaryMin && job.annualSalaryMax ? { min: job.annualSalaryMin, max: job.annualSalaryMax } : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, job.jobIndustry || []),
        employmentType: job.jobType?.[0] || 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.pubDate || Date.now()),
        source: 'Jobicy',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.jobIndustry?.[0] || 'Various',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Jobicy:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 6: USAJOBS (Government Jobs - ALL Industries - Very Reliable)
// ============================================================================
const fetchUSAJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const params = new URLSearchParams({
      Keyword: query,
      ResultsPerPage: '100',
    });
    if (location) params.set('LocationName', location);
    
    const response = await fetch(`https://data.usajobs.gov/api/search?${params.toString()}`, {
      headers: {
        'Authorization-Key': 'GWvh6gTX0oPnXWjQ8aPfSVUGHUFnmFlx8cCCQhZmkRg=',
        'User-Agent': 'career-input-job-search',
      }
    });
    
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return (data.SearchResult?.SearchResultItems || []).slice(0, 50).map((item: {
      MatchedObjectId: string;
      MatchedObjectDescriptor: {
        PositionTitle: string; OrganizationName: string; DepartmentName: string;
        PositionLocationDisplay: string; PositionLocation: { LocationName: string }[];
        PositionRemuneration: { MinimumRange: string; MaximumRange: string; RateIntervalCode: string }[];
        QualificationSummary: string; PositionStartDate: string;
        ApplyURI: string[]; PositionURI: string;
        JobCategory: { Name: string }[]; PositionSchedule: { Name: string }[];
        UserArea: { Details: { MajorDuties: string[]; Requirements: string } };
      };
    }): Job => {
      const job = item.MatchedObjectDescriptor;
      const salary = job.PositionRemuneration?.[0];
      const duties = job.UserArea?.Details?.MajorDuties || [];
      const requirements = job.UserArea?.Details?.Requirements || '';
      
      return {
        id: `usajobs-${item.MatchedObjectId}`,
        title: job.PositionTitle,
        company: job.OrganizationName || job.DepartmentName,
        companyDescription: `${job.DepartmentName} - U.S. Federal Government`,
        location: job.PositionLocationDisplay || job.PositionLocation?.[0]?.LocationName || 'Various',
        locationType: job.PositionLocationDisplay?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: salary ? { 
          min: parseInt(salary.MinimumRange.replace(/,/g, '')), 
          max: parseInt(salary.MaximumRange.replace(/,/g, '')) 
        } : undefined,
        salaryPeriod: salary?.RateIntervalCode === 'Per Hour' ? 'hourly' : 'yearly',
        description: job.QualificationSummary?.slice(0, 500) || '',
        fullDescription: job.QualificationSummary || '',
        responsibilities: duties.slice(0, 8),
        requirements: extractBullets(requirements, ['requirement', 'qualif', 'must']),
        skills: extractSkills(job.QualificationSummary + ' ' + duties.join(' '), []),
        employmentType: job.PositionSchedule?.[0]?.Name || 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.PositionStartDate || Date.now()),
        source: 'USAJobs',
        sourceUrl: job.PositionURI,
        applyUrl: job.ApplyURI?.[0] || job.PositionURI,
        industry: job.JobCategory?.[0]?.Name || 'Government',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('USAJobs:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 7: THE MUSE (Curated Jobs - Reliable)
// ============================================================================
const fetchTheMuse = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://www.themuse.com/api/public/jobs?page=1&descending=true`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    const filtered = (data.results || []).filter((job: { name: string; contents: string }) => {
      return job.name.toLowerCase().includes(queryLower) || 
             (job.contents || '').toLowerCase().includes(queryLower);
    });
    
    return filtered.slice(0, 30).map((job: {
      id: number; name: string; company: { name: string }; locations: { name: string }[];
      levels: { name: string }[]; refs: { landing_page: string }; contents: string;
      publication_date: string; categories: { name: string }[];
    }): Job => {
      const desc = parseHtml(job.contents || '');
      return {
        id: `muse-${job.id}`,
        title: job.name,
        company: job.company?.name || 'Company',
        location: job.locations?.map(l => l.name).join(', ') || 'Various',
        locationType: job.locations?.some(l => l.name.toLowerCase().includes('remote')) ? 'Remote' : 'On-site',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'you will']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, []),
        benefits: extractBullets(desc, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: job.levels?.[0]?.name || 'Mid Level',
        postedAt: new Date(job.publication_date),
        source: 'The Muse',
        sourceUrl: job.refs?.landing_page,
        applyUrl: job.refs?.landing_page,
        industry: job.categories?.[0]?.name || 'Various',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('The Muse:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 8: LINKEDIN (Guest API - Works Sometimes)
// ============================================================================
const fetchLinkedIn = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const keywords = encodeURIComponent(query);
    const loc = encodeURIComponent(location || 'United States');
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keywords}&location=${loc}&start=0`;
    
    const response = await fetchWithCors(url);
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = doc.querySelectorAll('.base-card, .job-search-card, li');
    const jobs: Job[] = [];
    
    cards.forEach((card, index) => {
      if (index >= 50) return;
      
      const title = card.querySelector('.base-search-card__title, h3')?.textContent?.trim() || '';
      const company = card.querySelector('.base-search-card__subtitle, h4')?.textContent?.trim() || '';
      const jobLocation = card.querySelector('.job-search-card__location')?.textContent?.trim() || location || '';
      let link = card.querySelector('a')?.getAttribute('href') || '';
      const dateStr = card.querySelector('time')?.getAttribute('datetime') || '';
      
      if (!title || !link) return;
      if (!link.startsWith('http')) link = `https://www.linkedin.com${link}`;
      
      jobs.push({
        id: `linkedin-${index}-${Date.now()}`,
        title,
        company,
        location: jobLocation,
        locationType: jobLocation.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        description: `${title} at ${company}. View full details on LinkedIn.`,
        fullDescription: `${title} at ${company}\nLocation: ${jobLocation}`,
        skills: extractSkills(title + ' ' + company, []),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: dateStr ? new Date(dateStr) : new Date(),
        source: 'LinkedIn',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Various',
        easyApply: true,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('LinkedIn:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 9: INDEED RSS (Works Sometimes)
// ============================================================================
const fetchIndeed = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const loc = location || 'United States';
    const url = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}&sort=date`;
    
    const response = await fetchWithCors(url);
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    
    items.forEach((item, index) => {
      if (index >= 50) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const source = item.querySelector('source')?.textContent || '';
      
      const desc = parseHtml(description);
      
      jobs.push({
        id: `indeed-${index}-${Date.now()}`,
        title,
        company: source || 'Company on Indeed',
        location: loc,
        locationType: title.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: parseSalary(desc),
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'duties']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, []),
        benefits: extractBullets(desc, ['benefit', 'we offer']),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'Indeed',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Various',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Indeed:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 10: ADZUNA (Multi-country - Works Sometimes)
// ============================================================================
const fetchAdzuna = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const countries = ['us', 'gb', 'ca', 'au'];
    const allJobs: Job[] = [];
    
    for (const country of countries) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=demo&app_key=demo&results_per_page=25&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
        const response = await fetchWithCors(url);
        const data = await response.json();
        
        (data.results || []).forEach((job: {
          id: string; title: string; company: { display_name: string };
          location: { display_name: string }; description: string;
          redirect_url: string; created: string; salary_min?: number;
          salary_max?: number; category?: { label: string };
        }) => {
          const desc = parseHtml(job.description || '');
          allJobs.push({
            id: `adzuna-${country}-${job.id}`,
            title: job.title,
            company: job.company?.display_name || 'Company',
            location: job.location?.display_name || location || 'Various',
            locationType: job.location?.display_name?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            salary: job.salary_min && job.salary_max ? { min: job.salary_min, max: job.salary_max } : undefined,
            salaryPeriod: 'yearly',
            description: desc.slice(0, 500),
            fullDescription: desc,
            responsibilities: extractBullets(desc, ['responsibilit', 'duties']),
            requirements: extractBullets(desc, ['requirement', 'qualif']),
            skills: extractSkills(desc, []),
            benefits: extractBullets(desc, ['benefit', 'we offer']),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(job.created),
            source: 'Adzuna',
            sourceUrl: job.redirect_url,
            applyUrl: job.redirect_url,
            industry: job.category?.label || 'Various',
            easyApply: false,
          });
        });
      } catch {
        continue;
      }
    }
    
    return allJobs;
  } catch (error) {
    console.error('Adzuna:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 11: JOOBLE (Global Aggregator - Works Sometimes)
// ============================================================================
const fetchJooble = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const loc = location || 'usa';
    const url = `https://jooble.org/rss/${encodeURIComponent(query)}/${encodeURIComponent(loc)}`;
    
    const response = await fetchWithCors(url);
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    
    items.forEach((item, index) => {
      if (index >= 30) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      const desc = parseHtml(description);
      const companyMatch = desc.match(/(?:at|@|company:?\s*)([\w\s&]+?)(?:\.|,|\n|$)/i);
      
      jobs.push({
        id: `jooble-${index}-${Date.now()}`,
        title,
        company: companyMatch?.[1]?.trim() || 'Company',
        location: loc,
        locationType: title.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBullets(desc, ['responsibilit', 'duties']),
        requirements: extractBullets(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, []),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'Jooble',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Various',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Jooble:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 12: REED UK (UK Jobs - Works Sometimes)
// ============================================================================
const fetchReed = async (query: string): Promise<Job[]> => {
  try {
    const url = `https://www.reed.co.uk/jobs/${encodeURIComponent(query.replace(/\s+/g, '-'))}-jobs?format=rss`;
    
    const response = await fetchWithCors(url);
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    
    items.forEach((item, index) => {
      if (index >= 30) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      const desc = parseHtml(description);
      
      jobs.push({
        id: `reed-${index}-${Date.now()}`,
        title,
        company: 'Company on Reed',
        location: 'United Kingdom',
        locationType: 'On-site',
        description: desc.slice(0, 500),
        fullDescription: desc,
        salary: parseSalary(desc),
        salaryPeriod: 'yearly',
        skills: extractSkills(desc, []),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'Reed',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Various',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Reed:', error);
    return [];
  }
};

// ============================================================================
// HELPER: Parse salary
// ============================================================================
const parseSalary = (text: string): { min: number; max: number } | undefined => {
  if (!text) return undefined;
  const match = text.match(/\$?([\d,]+)[kK]?\s*[-–—to]+\s*\$?([\d,]+)[kK]?/i);
  if (match) {
    let min = parseInt(match[1].replace(/,/g, ''));
    let max = parseInt(match[2].replace(/,/g, ''));
    if (text.toLowerCase().includes('k') || min < 1000) {
      min *= 1000;
      max *= 1000;
    }
    if (min > 0 && max > 0 && max >= min) return { min, max };
  }
  return undefined;
};

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================
export const searchJobs = async (params: {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}): Promise<Job[]> => {
  const { query, location, remoteOnly, salaryMin, salaryMax } = params;
  
  if (!query.trim()) return [];
  
  console.log(`🔍 Searching for "${query}"...`);
  lastSearchResults = [];
  
  // Define all sources
  const sources = [
    { name: 'Remotive', fn: () => fetchRemotive(query) },
    { name: 'RemoteOK', fn: () => fetchRemoteOK(query) },
    { name: 'Arbeitnow', fn: () => fetchArbeitnow(query) },
    { name: 'Himalayas', fn: () => fetchHimalayas(query) },
    { name: 'Jobicy', fn: () => fetchJobicy(query) },
    { name: 'USAJobs', fn: () => fetchUSAJobs(query, location) },
    { name: 'The Muse', fn: () => fetchTheMuse(query) },
    { name: 'LinkedIn', fn: () => fetchLinkedIn(query, location) },
    { name: 'Indeed', fn: () => fetchIndeed(query, location) },
    { name: 'Adzuna', fn: () => fetchAdzuna(query, location) },
    { name: 'Jooble', fn: () => fetchJooble(query, location) },
    { name: 'Reed', fn: () => fetchReed(query) },
  ];
  
  // Run all searches in parallel
  const results = await Promise.allSettled(sources.map(async (source) => {
    try {
      const jobs = await source.fn();
      lastSearchResults.push({ name: source.name, count: jobs.length, success: jobs.length > 0 });
      console.log(`✓ ${source.name}: ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      lastSearchResults.push({ name: source.name, count: 0, success: false, error: String(error) });
      console.log(`✗ ${source.name}: failed`);
      return [];
    }
  }));
  
  // Collect all jobs
  let allJobs: Job[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allJobs = [...allJobs, ...result.value];
    }
  });
  
  // Apply filters
  if (remoteOnly) {
    allJobs = allJobs.filter(job => job.locationType === 'Remote');
  }
  
  if (location && location.trim()) {
    const locLower = location.toLowerCase();
    allJobs = allJobs.filter(job => {
      const jobLoc = (job.location || '').toLowerCase();
      return jobLoc.includes(locLower) ||
             job.locationType === 'Remote' ||
             jobLoc.includes('worldwide') ||
             jobLoc.includes('anywhere');
    });
  }
  
  if (salaryMin || salaryMax) {
    allJobs = allJobs.filter(job => {
      if (!job.salary) return true;
      if (salaryMin && job.salary.max < salaryMin) return false;
      if (salaryMax && job.salary.min > salaryMax) return false;
      return true;
    });
  }
  
  // Remove duplicates
  const seen = new Set<string>();
  allJobs = allJobs.filter(job => {
    const key = `${job.title.toLowerCase().slice(0, 40)}-${job.company.toLowerCase().slice(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by date
  allJobs.sort((a, b) => {
    const dateA = a.postedAt instanceof Date ? a.postedAt.getTime() : new Date(a.postedAt).getTime();
    const dateB = b.postedAt instanceof Date ? b.postedAt.getTime() : new Date(b.postedAt).getTime();
    return dateB - dateA;
  });
  
  const successCount = lastSearchResults.filter(r => r.success).length;
  console.log(`✅ ${successCount}/${sources.length} sources returned ${allJobs.length} unique jobs`);
  
  return allJobs;
};

// ============================================================================
// EXPORTS
// ============================================================================
export const formatPostedTime = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

export const formatSalary = (salary?: { min: number; max: number }): string => {
  if (!salary) return 'Not specified';
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  return `${fmt(salary.min)} - ${fmt(salary.max)}`;
};

export const JOB_SOURCE_LIST = [
  'Remotive', 'RemoteOK', 'Arbeitnow', 'Himalayas', 'Jobicy',
  'USAJobs', 'The Muse', 'LinkedIn', 'Indeed', 'Adzuna', 'Jooble', 'Reed'
];
