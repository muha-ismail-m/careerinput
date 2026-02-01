import { Job } from '../types';

// ============================================================================
// CAREER INPUT - Job Search API
// Searches 20+ job platforms for comprehensive job coverage
// ============================================================================

// Backend server URL
const BACKEND_URL = 'http://localhost:3001';

// Check if backend is available
let backendAvailable: boolean | null = null;

const checkBackend = async (): Promise<boolean> => {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    backendAvailable = response.ok;
    console.log(backendAvailable ? '✅ Backend server connected' : '⚠️ Backend not available, using direct APIs');
    return backendAvailable;
  } catch {
    backendAvailable = false;
    console.log('⚠️ Backend not available, using direct APIs (some sources may not work due to CORS)');
    return false;
  }
};

// ============================================================================
// BACKEND-POWERED SEARCH (Preferred - All sources work)
// ============================================================================
const searchWithBackend = async (params: {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}): Promise<{ jobs: Job[]; sources: { name: string; success: boolean; count: number }[] }> => {
  const { query, location, remoteOnly, salaryMin, salaryMax } = params;
  
  const searchParams = new URLSearchParams({ query });
  if (location) searchParams.set('location', location);
  if (remoteOnly) searchParams.set('remoteOnly', 'true');
  if (salaryMin) searchParams.set('salaryMin', salaryMin.toString());
  if (salaryMax) searchParams.set('salaryMax', salaryMax.toString());
  
  const response = await fetch(`${BACKEND_URL}/api/jobs/search?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Backend search failed');
  
  const data = await response.json();
  
  // Convert date strings back to Date objects
  const jobs = (data.jobs || []).map((job: Job) => ({
    ...job,
    postedAt: new Date(job.postedAt),
  }));
  
  return { jobs, sources: data.sources || [] };
};

// ============================================================================
// DIRECT API FALLBACK (When backend is not available)
// ============================================================================

// Multiple CORS proxies for reliability
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const fetchWithProxy = async (url: string, timeout = 12000): Promise<Response> => {
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(proxy(url), { 
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        // Check we got real content
        if (text.length > 200 && !text.includes('Access Denied') && !text.includes('captcha')) {
          return new Response(text, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }
      }
    } catch {
      continue;
    }
  }
  throw new Error('All proxies failed');
};

// Parse HTML to text - comprehensive version
const parseHTML = (html: string): string => {
  if (!html) return '';
  return html
    // Convert block elements to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    // Add bullet points for list items
    .replace(/<li[^>]*>/gi, '• ')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&#\d+;/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
};

// Extract bullet points/list items from description for responsibilities/requirements
const extractBulletPoints = (text: string, sectionKeywords: string[]): string[] => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const points: string[] = [];
  let inSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    // Check if we're entering a relevant section
    if (sectionKeywords.some(kw => lower.includes(kw))) {
      inSection = true;
      continue;
    }
    
    // Check if we're leaving the section (new heading)
    if (inSection && /^(about|company|benefits|perks|salary|location|how to apply)/i.test(lower)) {
      if (!sectionKeywords.some(kw => lower.includes(kw))) {
        inSection = false;
      }
    }
    
    // Extract bullet points
    if (inSection || sectionKeywords.length === 0) {
      // Match lines that start with bullets, dashes, numbers, or are standalone sentences
      const cleaned = trimmed.replace(/^[\s•\-\*\d\.→►▸✓✔]+\s*/, '').trim();
      if (cleaned.length > 20 && cleaned.length < 400 && !cleaned.endsWith(':')) {
        points.push(cleaned);
      }
    }
  }
  
  return points.slice(0, 10);
};

// Extract responsibilities from description
const extractResponsibilities = (description: string): string[] => {
  const keywords = ['responsibilit', 'you will', "you'll", 'duties', 'what you will do', 'role', 'day to day', 'tasks'];
  let points = extractBulletPoints(description, keywords);
  
  // If no section found, try to extract any bullet points
  if (points.length === 0) {
    const lines = description.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
    points = lines.slice(0, 6).map(l => l.replace(/^[\s•\-]+/, '').trim()).filter(l => l.length > 20);
  }
  
  return points;
};

// Extract requirements from description
const extractRequirements = (description: string): string[] => {
  const keywords = ['requirement', 'qualif', 'must have', 'you have', 'experience', 'skills needed', 'ideal candidate', 'looking for'];
  return extractBulletPoints(description, keywords);
};

// Extract benefits from description
const extractBenefits = (description: string): string[] => {
  const keywords = ['benefit', 'perk', 'we offer', 'what we offer', 'compensation', 'why join'];
  let points = extractBulletPoints(description, keywords);
  
  // If no specific benefits section, look for common benefit keywords
  if (points.length === 0) {
    const commonBenefits = [
      '401(k)', '401k', 'health insurance', 'dental', 'vision', 'PTO', 'paid time off',
      'remote work', 'flexible hours', 'stock options', 'equity', 'bonus', 'wellness',
      'parental leave', 'professional development', 'learning budget', 'gym'
    ];
    const descLower = description.toLowerCase();
    points = commonBenefits.filter(b => descLower.includes(b.toLowerCase()));
  }
  
  return points;
};

// Extract skills from description
const extractSkills = (description: string, existingTags: string[] = []): string[] => {
  const allSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'PostgreSQL', 'MySQL', 'MongoDB', 'GraphQL', 'Git', 'Linux', 'CI/CD',
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Ansys', 'CAD', 'Six Sigma', 'PMP',
    'Excel', 'SAP', 'Salesforce', 'Project Management', 'Agile', 'Scrum',
  ];
  
  const foundSkills = new Set<string>(existingTags.slice(0, 5));
  const descLower = description.toLowerCase();
  
  allSkills.forEach(skill => {
    if (descLower.includes(skill.toLowerCase()) && foundSkills.size < 10) {
      foundSkills.add(skill);
    }
  });
  
  return Array.from(foundSkills);
};

// Parse salary
const parseSalary = (text: string): { min: number; max: number } | undefined => {
  if (!text) return undefined;
  const matches = text.match(/\$?([\d,]+)[kK]?\s*[-–—to]+\s*\$?([\d,]+)[kK]?/i);
  if (matches) {
    let min = parseInt(matches[1].replace(/,/g, ''));
    let max = parseInt(matches[2].replace(/,/g, ''));
    if (text.toLowerCase().includes('k') || min < 1000) {
      min *= 1000;
      max *= 1000;
    }
    if (min > 0 && max > 0 && max >= min) return { min, max };
  }
  return undefined;
};

// ============================================================================
// SOURCE 1: INDEED - Multiple approaches with fallback
// ============================================================================
const fetchIndeedJobs = async (query: string, location?: string): Promise<Job[]> => {
  const loc = location || 'United States';
  const jobs: Job[] = [];
  
  // Try multiple Indeed RSS endpoint formats
  const rssUrls = [
    `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}&sort=date&fromage=14`,
    `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc.split(',')[0])}`,
    `https://rss.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}`,
    `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}&format=rss`,
  ];
  
  for (const rssUrl of rssUrls) {
    try {
      console.log(`📡 Trying Indeed: ${rssUrl.substring(0, 60)}...`);
      const response = await fetchWithProxy(rssUrl, 15000);
      const text = await response.text();
      
      // Check if it's valid RSS/XML
      if (!text.includes('<item>') && !text.includes('<entry>')) {
        console.log('   Not valid RSS, trying next...');
        continue;
      }
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const items = xml.querySelectorAll('item');
      
      if (items.length === 0) {
        console.log('   No items found, trying next...');
        continue;
      }
      
      console.log(`   ✅ Found ${items.length} jobs from Indeed RSS`);
      
      items.forEach((item, index) => {
        if (index >= 40) return;
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const source = item.querySelector('source')?.textContent || '';
        
        if (!title || !link) return;
        
        const desc = parseHTML(description);
        
        jobs.push({
          id: `indeed-${index}-${Date.now()}`,
          title: title.trim(),
          company: source?.trim() || 'Company on Indeed',
          location: loc,
          locationType: title.toLowerCase().includes('remote') || desc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          salary: parseSalary(desc),
          salaryPeriod: 'yearly',
          description: desc.slice(0, 500),
          fullDescription: desc,
          skills: extractSkills(desc),
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
      
      if (jobs.length > 0) return jobs;
    } catch (err) {
      console.log(`   ❌ Failed: ${err}`);
      continue;
    }
  }
  
  // If RSS failed, create a fallback "search link" job so users can still access Indeed
  console.log('   ⚠️ Indeed RSS blocked - adding direct search link');
  const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}`;
  jobs.push({
    id: `indeed-search-${Date.now()}`,
    title: `${query} jobs on Indeed`,
    company: 'Indeed',
    companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Indeed_logo.svg',
    location: loc,
    locationType: 'On-site',
    description: `Click "Apply on Indeed" to see all ${query} jobs on Indeed. Indeed has thousands of listings that may not be accessible via API.`,
    fullDescription: `Indeed is one of the largest job boards with millions of listings.\n\nThis is a direct search link because Indeed's RSS feed was blocked by CORS.\n\nClick "Apply on Indeed" to view all available ${query} positions.`,
    skills: [],
    employmentType: 'Full-time',
    experienceLevel: 'Various',
    postedAt: new Date(),
    source: 'Indeed',
    sourceUrl: searchUrl,
    applyUrl: searchUrl,
    industry: 'Various',
    easyApply: false,
    isSearchLink: true,
  });
  
  return jobs;
};

// ============================================================================
// SOURCE 2: LINKEDIN (via CORS proxy)
// ============================================================================
const fetchLinkedInJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'United States')}&start=0`;
    const response = await fetchWithProxy(url);
    const html = await response.text();
    
    const jobs: Job[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = doc.querySelectorAll('li, .base-card');
    
    cards.forEach((card, index) => {
      if (index >= 25) return;
      const title = card.querySelector('.base-search-card__title, h3')?.textContent?.trim() || '';
      const company = card.querySelector('.base-search-card__subtitle, h4')?.textContent?.trim() || '';
      const jobLocation = card.querySelector('.job-search-card__location')?.textContent?.trim() || '';
      let link = card.querySelector('a')?.getAttribute('href') || '';
      
      if (title && link) {
        if (!link.startsWith('http')) link = `https://www.linkedin.com${link}`;
        jobs.push({
          id: `linkedin-${index}-${Date.now()}`,
          title,
          company: company || 'Company on LinkedIn',
          location: jobLocation || location || 'Various',
          locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          description: `${title} position at ${company}`,
          fullDescription: `${title} at ${company}\nLocation: ${jobLocation}`,
          skills: extractSkills(title),
          employmentType: 'Full-time',
          experienceLevel: 'Mid Level',
          postedAt: new Date(),
          source: 'LinkedIn',
          sourceUrl: link,
          applyUrl: link,
          industry: 'Various',
          easyApply: true,
        });
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('LinkedIn error:', error);
    
    // Fallback search link
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'United States')}`;
    return [{
      id: `linkedin-search-${Date.now()}`,
      title: `${query} jobs on LinkedIn`,
      company: 'LinkedIn',
      companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      location: location || 'United States',
      locationType: 'On-site',
      description: `Click "Apply on LinkedIn" to see all ${query} jobs on LinkedIn.`,
      fullDescription: `LinkedIn has thousands of job listings.\n\nClick "Apply on LinkedIn" to view all available ${query} positions.`,
      skills: [],
      employmentType: 'Full-time',
      experienceLevel: 'Various',
      postedAt: new Date(),
      source: 'LinkedIn',
      sourceUrl: searchUrl,
      applyUrl: searchUrl,
      industry: 'Various',
      easyApply: true,
      isSearchLink: true,
    }];
  }
};

// ============================================================================
// SOURCE 3: REMOTIVE (Remote jobs - Most reliable, has full descriptions)
// ============================================================================
const fetchRemotiveJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; title: string; company_name: string; company_logo?: string;
      category: string; tags: string[]; job_type: string; publication_date: string;
      candidate_required_location: string; salary: string; description: string;
    }): Job => {
      const description = parseHTML(job.description);
      const responsibilities = extractResponsibilities(description);
      const requirements = extractRequirements(description);
      const benefits = extractBenefits(description);
      
      // Determine experience level from title/description
      const titleLower = job.title.toLowerCase();
      const experienceLevel = titleLower.includes('senior') || titleLower.includes('sr.') ? 'Senior' :
                             titleLower.includes('junior') || titleLower.includes('jr.') ? 'Entry Level' :
                             titleLower.includes('lead') || titleLower.includes('principal') ? 'Lead' :
                             titleLower.includes('intern') ? 'Internship' : 'Mid Level';
      
      return {
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        companyLogo: job.company_logo,
        location: job.candidate_required_location || 'Worldwide',
        locationType: 'Remote',
        salary: parseSalary(job.salary),
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
        benefits: benefits.length > 0 ? benefits : undefined,
        skills: extractSkills(description, job.tags || []),
        employmentType: job.job_type === 'full_time' ? 'Full-time' : job.job_type === 'part_time' ? 'Part-time' : 'Contract',
        experienceLevel,
        postedAt: new Date(job.publication_date),
        source: 'Remotive',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.category,
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Remotive error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 4: REMOTEOK (Remote jobs)
// ============================================================================
const fetchRemoteOKJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetchWithProxy('https://remoteok.com/api');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    return data
      .filter((job: { position?: string; tags?: string[]; description?: string }) => {
        if (!job.position) return false;
        return job.position.toLowerCase().includes(queryLower) ||
               (job.tags || []).join(' ').toLowerCase().includes(queryLower) ||
               (job.description || '').toLowerCase().includes(queryLower);
      })
      .slice(0, 30)
      .map((job: {
        id: string; url: string; position: string; company: string; company_logo?: string;
        tags: string[]; date: string; location: string; salary_min?: number; salary_max?: number;
        description: string;
      }): Job => {
        const description = parseHTML(job.description || '');
        const responsibilities = extractResponsibilities(description);
        const requirements = extractRequirements(description);
        const benefits = extractBenefits(description);
        
        const titleLower = job.position.toLowerCase();
        const experienceLevel = titleLower.includes('senior') || titleLower.includes('sr.') ? 'Senior' :
                               titleLower.includes('junior') || titleLower.includes('jr.') ? 'Entry Level' :
                               titleLower.includes('lead') || titleLower.includes('principal') ? 'Lead' : 'Mid Level';
        
        return {
          id: `remoteok-${job.id}`,
          title: job.position,
          company: job.company,
          companyLogo: job.company_logo,
          location: job.location || 'Worldwide',
          locationType: 'Remote',
          salary: job.salary_min && job.salary_max ? { min: job.salary_min, max: job.salary_max } : undefined,
          salaryPeriod: 'yearly',
          description: description.slice(0, 500),
          fullDescription: description,
          responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
          requirements: requirements.length > 0 ? requirements : undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          skills: job.tags?.slice(0, 10) || extractSkills(description, []),
          employmentType: 'Full-time',
          experienceLevel,
          postedAt: new Date(job.date),
          source: 'RemoteOK',
          sourceUrl: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
          applyUrl: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
          industry: 'Technology',
          easyApply: false,
        };
      });
  } catch (error) {
    console.error('RemoteOK error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 5: ARBEITNOW (European tech jobs)
// ============================================================================
const fetchArbeitnowJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!response.ok) return [];
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    return (data.data || [])
      .filter((job: { title: string; description?: string; tags?: string[] }) => {
        return job.title.toLowerCase().includes(queryLower) ||
               (job.description || '').toLowerCase().includes(queryLower) ||
               (job.tags || []).join(' ').toLowerCase().includes(queryLower);
      })
      .slice(0, 30)
      .map((job: {
        slug: string; company_name: string; title: string; description: string;
        remote: boolean; url: string; tags: string[]; location: string; created_at: number;
      }): Job => {
        const description = parseHTML(job.description);
        const responsibilities = extractResponsibilities(description);
        const requirements = extractRequirements(description);
        const benefits = extractBenefits(description);
        
        const titleLower = job.title.toLowerCase();
        const experienceLevel = titleLower.includes('senior') || titleLower.includes('sr.') ? 'Senior' :
                               titleLower.includes('junior') || titleLower.includes('jr.') ? 'Entry Level' :
                               titleLower.includes('lead') || titleLower.includes('principal') ? 'Lead' : 'Mid Level';
        
        return {
          id: `arbeitnow-${job.slug}`,
          title: job.title,
          company: job.company_name,
          location: job.location || 'Europe',
          locationType: job.remote ? 'Remote' : 'On-site',
          description: description.slice(0, 500),
          fullDescription: description,
          responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
          requirements: requirements.length > 0 ? requirements : undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          skills: extractSkills(description, job.tags || []),
          employmentType: 'Full-time',
          experienceLevel,
          postedAt: new Date(job.created_at * 1000),
          source: 'Arbeitnow',
          sourceUrl: job.url,
          applyUrl: job.url,
          industry: job.tags?.[0] || 'Technology',
          easyApply: false,
        };
      });
  } catch (error) {
    console.error('Arbeitnow error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 6: HIMALAYAS (Remote-first companies)
// ============================================================================
const fetchHimalayasJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://himalayas.app/jobs/api?limit=50&q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: string; title: string; companyName: string; companyLogo?: string;
      excerpt?: string; description?: string; locationRestrictions?: string[];
      categories?: string[]; seniority?: string; minSalary?: number; maxSalary?: number;
      pubDate?: string; applicationLink?: string; externalUrl?: string;
      companyDescription?: string;
    }): Job => {
      const description = parseHTML(job.description || job.excerpt || '');
      const applyUrl = job.applicationLink || job.externalUrl || `https://himalayas.app/jobs/${job.id}`;
      const responsibilities = extractResponsibilities(description);
      const requirements = extractRequirements(description);
      const benefits = extractBenefits(description);
      
      const titleLower = job.title.toLowerCase();
      const seniority = job.seniority?.toLowerCase() || '';
      const experienceLevel = seniority.includes('senior') || titleLower.includes('senior') || titleLower.includes('sr.') ? 'Senior' :
                             seniority.includes('junior') || titleLower.includes('junior') || titleLower.includes('jr.') ? 'Entry Level' :
                             seniority.includes('lead') || titleLower.includes('lead') || titleLower.includes('principal') ? 'Lead' :
                             seniority.includes('intern') || titleLower.includes('intern') ? 'Internship' : 'Mid Level';
      
      return {
        id: `himalayas-${job.id}`,
        title: job.title,
        company: job.companyName,
        companyLogo: job.companyLogo,
        companyDescription: job.companyDescription,
        location: job.locationRestrictions?.join(', ') || 'Worldwide',
        locationType: 'Remote',
        salary: job.minSalary && job.maxSalary ? { min: job.minSalary, max: job.maxSalary } : undefined,
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
        benefits: benefits.length > 0 ? benefits : undefined,
        skills: extractSkills(description, job.categories || []),
        employmentType: 'Full-time',
        experienceLevel,
        postedAt: new Date(job.pubDate || Date.now()),
        source: 'Himalayas',
        sourceUrl: applyUrl,
        applyUrl: applyUrl,
        industry: job.categories?.[0] || 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Himalayas error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 7: USAJOBS (Government jobs - ALL industries, very detailed)
// ============================================================================
const fetchUSAJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const params = new URLSearchParams({ Keyword: query, ResultsPerPage: '100' });
    if (location) params.set('LocationName', location);
    
    const response = await fetch(`https://data.usajobs.gov/api/search?${params.toString()}`, {
      headers: {
        'Authorization-Key': 'GWvh6gTX0oPnXWjQ8aPfSVUGHUFnmFlx8cCCQhZmkRg=',
        'User-Agent': 'career-input-job-search',
      }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.SearchResult?.SearchResultItems || []).slice(0, 50).map((item: {
      MatchedObjectId: string;
      MatchedObjectDescriptor: {
        PositionTitle: string; OrganizationName: string; DepartmentName: string;
        PositionLocationDisplay: string;
        PositionRemuneration: { MinimumRange: string; MaximumRange: string; RateIntervalCode: string }[];
        QualificationSummary: string; PositionStartDate: string;
        ApplyURI: string[]; PositionURI: string;
        JobCategory: { Name: string }[];
        UserArea?: {
          Details?: {
            MajorDuties?: string[];
            Education?: string;
            Requirements?: string;
            Evaluations?: string;
            HowToApply?: string;
            WhatToExpectNext?: string;
            RequiredDocuments?: string;
            Benefits?: string;
            BenefitsUrl?: string;
            OtherInformation?: string;
            JobSummary?: string;
          };
        };
        PositionSchedule?: { Name: string }[];
        PositionOfferingType?: { Name: string }[];
        JobGrade?: { Code: string }[];
      };
    }): Job => {
      const job = item.MatchedObjectDescriptor;
      const salary = job.PositionRemuneration?.[0];
      const details = job.UserArea?.Details;
      const desc = details?.JobSummary || job.QualificationSummary || '';
      
      // Extract responsibilities from MajorDuties
      const responsibilities = details?.MajorDuties || [];
      
      // Extract requirements from Requirements and Education
      const requirementText = (details?.Requirements || '') + ' ' + (details?.Education || '');
      const requirements = extractRequirements(requirementText);
      if (requirements.length === 0 && details?.Education) {
        requirements.push(details.Education.slice(0, 300));
      }
      
      // Standard federal benefits
      const benefits = [
        'Comprehensive health insurance (FEHB)',
        'Retirement pension (FERS)',
        'Thrift Savings Plan (401k-style)',
        '13-26 days paid vacation annually',
        '13 days paid sick leave annually',
        '11 paid federal holidays',
        'Life insurance (FEGLI)',
        'Flexible spending accounts',
      ];
      
      // Determine experience level from grade
      const grade = job.JobGrade?.[0]?.Code || '';
      const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;
      const experienceLevel = gradeNum >= 14 ? 'Lead' :
                             gradeNum >= 12 ? 'Senior' :
                             gradeNum >= 9 ? 'Mid Level' :
                             gradeNum >= 5 ? 'Entry Level' : 'Mid Level';
      
      // Employment type
      const scheduleType = job.PositionSchedule?.[0]?.Name || 'Full-time';
      const offeringType = job.PositionOfferingType?.[0]?.Name || '';
      const employmentType = offeringType.includes('Term') ? 'Contract' :
                            scheduleType.includes('Part') ? 'Part-time' : 'Full-time';
      
      return {
        id: `usajobs-${item.MatchedObjectId}`,
        title: job.PositionTitle,
        company: job.OrganizationName || job.DepartmentName,
        companyDescription: `${job.DepartmentName} - U.S. Federal Government. ${job.OrganizationName ? `Part of ${job.OrganizationName}.` : ''}`,
        location: job.PositionLocationDisplay || 'Various',
        locationType: job.PositionLocationDisplay?.toLowerCase().includes('remote') || 
                     job.PositionLocationDisplay?.toLowerCase().includes('telework') ||
                     job.PositionLocationDisplay?.toLowerCase().includes('anywhere') ? 'Remote' : 'On-site',
        salary: salary ? { 
          min: parseInt(salary.MinimumRange.replace(/,/g, '')), 
          max: parseInt(salary.MaximumRange.replace(/,/g, '')) 
        } : undefined,
        salaryPeriod: salary?.RateIntervalCode === 'Per Hour' ? 'hourly' : 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc + (details?.OtherInformation ? '\n\n' + details.OtherInformation : ''),
        responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
        skills: extractSkills(desc + ' ' + responsibilities.join(' ')),
        benefits,
        employmentType,
        experienceLevel,
        postedAt: new Date(job.PositionStartDate || Date.now()),
        source: 'USAJobs',
        sourceUrl: job.PositionURI,
        applyUrl: job.ApplyURI?.[0] || job.PositionURI,
        industry: job.JobCategory?.[0]?.Name || 'Government',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('USAJobs error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 8: JOBICY (Remote jobs with salary)
// ============================================================================
const fetchJobicyJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetchWithProxy(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; jobTitle: string; companyName: string; companyLogo?: string;
      jobIndustry?: string[]; jobType?: string[]; jobGeo?: string; pubDate?: string;
      annualSalaryMin?: number; annualSalaryMax?: number; jobDescription?: string;
    }): Job => {
      const description = parseHTML(job.jobDescription || '');
      return {
        id: `jobicy-${job.id}`,
        title: job.jobTitle,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.jobGeo || 'Worldwide',
        locationType: 'Remote',
        salary: job.annualSalaryMin && job.annualSalaryMax ? { min: job.annualSalaryMin, max: job.annualSalaryMax } : undefined,
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        skills: extractSkills(description, job.jobIndustry || []),
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
    console.error('Jobicy error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 9: THE MUSE (Curated jobs with company info)
// ============================================================================
const fetchMuseJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch('https://www.themuse.com/api/public/jobs?page=1&descending=true');
    if (!response.ok) return [];
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    return (data.results || [])
      .filter((job: { name: string; contents?: string; categories?: { name: string }[] }) => {
        return job.name.toLowerCase().includes(queryLower) || 
               (job.contents || '').toLowerCase().includes(queryLower) ||
               (job.categories || []).some(c => c.name.toLowerCase().includes(queryLower));
      })
      .slice(0, 30)
      .map((job: {
        id: number; name: string; 
        company: { name: string; short_name?: string; description?: string; industries?: { name: string }[] }; 
        locations: { name: string }[];
        levels: { name: string }[]; refs: { landing_page: string }; contents: string;
        publication_date: string; categories: { name: string }[];
      }): Job => {
        const description = parseHTML(job.contents || '');
        const responsibilities = extractResponsibilities(description);
        const requirements = extractRequirements(description);
        const benefits = extractBenefits(description);
        
        // Map experience level from Muse format
        const level = job.levels?.[0]?.name?.toLowerCase() || '';
        const experienceLevel = level.includes('senior') ? 'Senior' :
                               level.includes('entry') || level.includes('intern') ? 'Entry Level' :
                               level.includes('manager') || level.includes('director') ? 'Lead' : 'Mid Level';
        
        return {
          id: `muse-${job.id}`,
          title: job.name,
          company: job.company?.name || 'Company',
          companyDescription: job.company?.description,
          location: job.locations?.map(l => l.name).join(', ') || 'Various',
          locationType: job.locations?.some(l => 
            l.name.toLowerCase().includes('remote') || 
            l.name.toLowerCase().includes('flexible')
          ) ? 'Remote' : 'On-site',
          description: description.slice(0, 500),
          fullDescription: description,
          responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
          requirements: requirements.length > 0 ? requirements : undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          skills: extractSkills(description),
          employmentType: 'Full-time',
          experienceLevel,
          postedAt: new Date(job.publication_date),
          source: 'The Muse',
          sourceUrl: job.refs?.landing_page,
          applyUrl: job.refs?.landing_page,
          industry: job.company?.industries?.[0]?.name || job.categories?.[0]?.name || 'Various',
          easyApply: false,
        };
      });
  } catch (error) {
    console.error('The Muse error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 10: GLASSDOOR (Fallback with search link)
// ============================================================================
const fetchGlassdoorJobs = async (query: string, location?: string): Promise<Job[]> => {
  const loc = location || 'United States';
  const searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}&locT=N&locKeyword=${encodeURIComponent(loc)}`;
  
  // Glassdoor heavily blocks scraping, so we just provide a search link
  return [{
    id: `glassdoor-search-${Date.now()}`,
    title: `${query} jobs on Glassdoor`,
    company: 'Glassdoor',
    companyLogo: 'https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png',
    location: loc,
    locationType: 'On-site',
    description: `Click "Apply on Glassdoor" to see ${query} jobs with company reviews and salary data.`,
    fullDescription: `Glassdoor provides job listings along with company reviews, salary reports, and interview questions.\n\nClick "Apply on Glassdoor" to view all available ${query} positions.`,
    skills: [],
    employmentType: 'Full-time',
    experienceLevel: 'Various',
    postedAt: new Date(),
    source: 'Glassdoor',
    sourceUrl: searchUrl,
    applyUrl: searchUrl,
    industry: 'Various',
    easyApply: false,
    isSearchLink: true,
  }];
};

// ============================================================================
// SOURCE 11: ZIPRECRUITER (Fallback with search link)
// ============================================================================
const fetchZipRecruiterJobs = async (query: string, location?: string): Promise<Job[]> => {
  const loc = location || 'United States';
  const searchUrl = `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(loc)}`;
  
  return [{
    id: `ziprecruiter-search-${Date.now()}`,
    title: `${query} jobs on ZipRecruiter`,
    company: 'ZipRecruiter',
    companyLogo: 'https://www.ziprecruiter.com/favicon.ico',
    location: loc,
    locationType: 'On-site',
    description: `Click "Apply on ZipRecruiter" to see ${query} jobs. ZipRecruiter aggregates millions of listings.`,
    fullDescription: `ZipRecruiter is a leading job board with millions of listings.\n\nClick "Apply on ZipRecruiter" to view all available ${query} positions.`,
    skills: [],
    employmentType: 'Full-time',
    experienceLevel: 'Various',
    postedAt: new Date(),
    source: 'ZipRecruiter',
    sourceUrl: searchUrl,
    applyUrl: searchUrl,
    industry: 'Various',
    easyApply: false,
    isSearchLink: true,
  }];
};

// ============================================================================
// SOURCE 12: ADZUNA (Multi-country)
// ============================================================================
const fetchAdzunaJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const countries = ['us', 'gb', 'ca', 'au', 'de'];
    const allJobs: Job[] = [];
    
    for (const country of countries) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=demo&app_key=demo&results_per_page=20&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
        const response = await fetchWithProxy(url);
        const data = await response.json();
        
        (data.results || []).forEach((job: {
          id: string; title: string; company: { display_name: string };
          location: { display_name: string }; description: string;
          redirect_url: string; created: string; salary_min?: number;
          salary_max?: number; category?: { label: string };
        }) => {
          const desc = parseHTML(job.description || '');
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
            skills: extractSkills(desc),
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
    console.error('Adzuna error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 13: WE WORK REMOTELY
// ============================================================================
const fetchWeWorkRemotelyJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetchWithProxy('https://weworkremotely.com/remote-jobs.rss');
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    const queryLower = query.toLowerCase();
    const jobs: Job[] = [];
    
    items.forEach((item, index) => {
      if (index >= 30) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      if (!title.toLowerCase().includes(queryLower) && !description.toLowerCase().includes(queryLower)) return;
      
      const desc = parseHTML(description);
      const companyMatch = title.match(/^(.+?):\s*(.+)$/);
      
      jobs.push({
        id: `wwr-${index}-${Date.now()}`,
        title: companyMatch ? companyMatch[2] : title,
        company: companyMatch ? companyMatch[1] : 'Company',
        location: 'Worldwide',
        locationType: 'Remote',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'We Work Remotely',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Technology',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('We Work Remotely error:', error);
    return [];
  }
};

// ============================================================================
// SOURCE 14: JOOBLE (Global aggregator)
// ============================================================================
const fetchJoobleJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const loc = location || 'usa';
    const url = `https://jooble.org/api/${encodeURIComponent(query)}`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    
    return (data.jobs || []).slice(0, 25).map((job: {
      id: string; title: string; company: string; location: string;
      snippet: string; link: string; updated: string; salary: string;
    }, index: number): Job => {
      const desc = parseHTML(job.snippet || '');
      return {
        id: `jooble-${index}-${Date.now()}`,
        title: job.title,
        company: job.company || 'Company',
        location: job.location || loc,
        locationType: job.title.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: parseSalary(job.salary || ''),
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.updated || Date.now()),
        source: 'Jooble',
        sourceUrl: job.link,
        applyUrl: job.link,
        industry: 'Various',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Jooble error:', error);
    return [];
  }
};

// ============================================================================
// DIRECT API SEARCH - Searches ALL 14 sources
// ============================================================================
const searchWithDirectAPIs = async (params: {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}): Promise<{ jobs: Job[]; sources: { name: string; success: boolean; count: number }[] }> => {
  const { query, location, remoteOnly, salaryMin, salaryMax } = params;
  
  console.log(`🔍 Searching across 14 platforms for "${query}"...`);
  
  // All 14 job sources
  const fetchers = [
    { name: 'Indeed', fn: () => fetchIndeedJobs(query, location) },
    { name: 'LinkedIn', fn: () => fetchLinkedInJobs(query, location) },
    { name: 'Glassdoor', fn: () => fetchGlassdoorJobs(query, location) },
    { name: 'ZipRecruiter', fn: () => fetchZipRecruiterJobs(query, location) },
    { name: 'USAJobs', fn: () => fetchUSAJobs(query, location) },
    { name: 'Remotive', fn: () => fetchRemotiveJobs(query) },
    { name: 'RemoteOK', fn: () => fetchRemoteOKJobs(query) },
    { name: 'Arbeitnow', fn: () => fetchArbeitnowJobs(query) },
    { name: 'Himalayas', fn: () => fetchHimalayasJobs(query) },
    { name: 'Jobicy', fn: () => fetchJobicyJobs(query) },
    { name: 'The Muse', fn: () => fetchMuseJobs(query) },
    { name: 'Adzuna', fn: () => fetchAdzunaJobs(query, location) },
    { name: 'We Work Remotely', fn: () => fetchWeWorkRemotelyJobs(query) },
    { name: 'Jooble', fn: () => fetchJoobleJobs(query, location) },
  ];
  
  const results = await Promise.allSettled(fetchers.map(f => f.fn()));
  
  let allJobs: Job[] = [];
  const sources: { name: string; success: boolean; count: number }[] = [];
  
  results.forEach((result, index) => {
    const name = fetchers[index].name;
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allJobs = [...allJobs, ...result.value];
      sources.push({ name, success: true, count: result.value.length });
      console.log(`✅ ${name}: ${result.value.length} jobs`);
    } else {
      sources.push({ name, success: false, count: 0 });
      console.log(`❌ ${name}: no results`);
    }
  });
  
  // Apply filters
  if (location && location.trim()) {
    const locationLower = location.toLowerCase();
    allJobs = allJobs.filter(job => {
      const jobLocationLower = (job.location || '').toLowerCase();
      return jobLocationLower.includes(locationLower) ||
             jobLocationLower.includes('worldwide') ||
             jobLocationLower.includes('anywhere') ||
             job.locationType === 'Remote';
    });
  }
  
  if (remoteOnly) {
    allJobs = allJobs.filter(job => job.locationType === 'Remote');
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
    const key = `${job.title.toLowerCase().substring(0, 50)}-${job.company.toLowerCase().substring(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort: Real jobs first, then search links
  allJobs.sort((a, b) => {
    // Search links go to the end
    const aIsSearch = (a as Job & { isSearchLink?: boolean }).isSearchLink ? 1 : 0;
    const bIsSearch = (b as Job & { isSearchLink?: boolean }).isSearchLink ? 1 : 0;
    if (aIsSearch !== bIsSearch) return aIsSearch - bIsSearch;
    
    // Then sort by date
    const dateA = a.postedAt instanceof Date ? a.postedAt.getTime() : new Date(a.postedAt).getTime();
    const dateB = b.postedAt instanceof Date ? b.postedAt.getTime() : new Date(b.postedAt).getTime();
    return dateB - dateA;
  });
  
  console.log(`✨ Found ${allJobs.length} total jobs from ${sources.filter(s => s.success).length}/14 sources`);
  
  return { jobs: allJobs, sources };
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
  const { query } = params;
  
  if (!query.trim()) return [];
  
  // Check if backend is available
  const useBackend = await checkBackend();
  
  try {
    if (useBackend) {
      console.log('🚀 Using backend proxy server...');
      const result = await searchWithBackend(params);
      
      // Store sources for UI display
      (window as { __jobSources?: { name: string; success: boolean; count: number }[] }).__jobSources = result.sources;
      
      console.log(`✅ Backend returned ${result.jobs.length} jobs from ${result.sources.filter(s => s.success).length} sources`);
      return result.jobs;
    } else {
      console.log('📡 Using direct API calls (14 sources)...');
      const result = await searchWithDirectAPIs(params);
      
      // Store sources for UI display
      (window as { __jobSources?: { name: string; success: boolean; count: number }[] }).__jobSources = result.sources;
      
      console.log(`✅ Direct APIs returned ${result.jobs.length} jobs from ${result.sources.filter(s => s.success).length} sources`);
      return result.jobs;
    }
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to direct APIs if backend fails
    if (useBackend) {
      console.log('⚠️ Backend failed, falling back to direct APIs...');
      backendAvailable = false;
      const result = await searchWithDirectAPIs(params);
      (window as { __jobSources?: { name: string; success: boolean; count: number }[] }).__jobSources = result.sources;
      return result.jobs;
    }
    
    return [];
  }
};

// Get job sources (for UI display)
export const getJobSources = (): { name: string; success: boolean; count: number }[] => {
  return (window as { __jobSources?: { name: string; success: boolean; count: number }[] }).__jobSources || [];
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export const formatPostedTime = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

export const formatSalary = (salary?: { min: number; max: number }): string => {
  if (!salary) return 'Not specified';
  const formatNum = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  return `${formatNum(salary.min)} - ${formatNum(salary.max)}`;
};

// All the job sources we aggregate from
export const JOB_SOURCES = [
  'Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'USAJobs',
  'Remotive', 'RemoteOK', 'Arbeitnow', 'Himalayas', 'Jobicy',
  'The Muse', 'Adzuna', 'We Work Remotely', 'Jooble',
];
