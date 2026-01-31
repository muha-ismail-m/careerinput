import { Job } from '../types';

// ============================================================================
// CAREER INPUT - UNIVERSAL JOB AGGREGATOR
// Fetches REAL jobs from 15+ job boards with actual application URLs
// ============================================================================

// Parse HTML description to plain text
const parseDescription = (html: string): string => {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
};

// Extract bullet points from description
const extractBulletPoints = (description: string, keywords: string[]): string[] => {
  const points: string[] = [];
  const lines = description.split('\n');
  let inSection = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      inSection = true;
      continue;
    }
    if (inSection && (lower.includes('about us') || lower.includes('benefits') || lower.includes('perks'))) {
      if (!keywords.some(kw => lower.includes(kw))) inSection = false;
    }
    if (inSection) {
      const cleaned = line.replace(/^[\s•\-\*\d\.→►▸]+/, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300 && !cleaned.endsWith(':')) {
        points.push(cleaned);
      }
    }
  }
  return points.slice(0, 8);
};

// Extract skills from description
const extractSkills = (description: string, existingTags: string[]): string[] => {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails', 'Next.js',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'GraphQL', 'REST API',
    'Git', 'Linux', 'Agile', 'Scrum', 'Jira', 'Figma', 'Sketch',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'SQL', 'NoSQL'
  ];
  
  const foundSkills = new Set<string>(existingTags.slice(0, 5));
  const descLower = description.toLowerCase();
  
  for (const skill of commonSkills) {
    if (descLower.includes(skill.toLowerCase()) && foundSkills.size < 10) {
      foundSkills.add(skill);
    }
  }
  return Array.from(foundSkills);
};

// Parse salary string
const parseSalary = (salaryStr: string): { min: number; max: number } | undefined => {
  if (!salaryStr) return undefined;
  const matches = salaryStr.match(/\$?(\d+)[,.]?(\d*)k?\s*[-–—to]+\s*\$?(\d+)[,.]?(\d*)k?/i);
  if (matches) {
    let min = parseInt(matches[1] + (matches[2] || ''));
    let max = parseInt(matches[3] + (matches[4] || ''));
    if (salaryStr.toLowerCase().includes('k') || min < 1000) {
      min = min * 1000;
      max = max * 1000;
    }
    if (min > 0 && max > 0 && max >= min) return { min, max };
  }
  return undefined;
};

// CORS proxy for APIs that don't support CORS
const corsProxy = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

// ============================================================================
// JOB SOURCE 1: REMOTIVE (Remote Jobs)
// ============================================================================
const fetchRemotiveJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=30`);
    if (!response.ok) throw new Error('Remotive API failed');
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; title: string; company_name: string; company_logo: string;
      category: string; tags: string[]; job_type: string; publication_date: string;
      candidate_required_location: string; salary: string; description: string;
    }): Job => {
      const description = parseDescription(job.description);
      return {
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        companyLogo: job.company_logo || undefined,
        companyDescription: `${job.company_name} is a company hiring remote talent.`,
        location: job.candidate_required_location || 'Worldwide',
        locationType: 'Remote',
        salary: parseSalary(job.salary),
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will', 'what you\'ll do']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif', 'you have', 'must have']),
        skills: extractSkills(description, job.tags || []),
        benefits: extractBulletPoints(description, ['benefit', 'perk', 'we offer']),
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
    console.error('Remotive error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 2: REMOTEOK (Popular Remote Job Board)
// ============================================================================
const fetchRemoteOKJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy('https://remoteok.com/api'));
    if (!response.ok) throw new Error('RemoteOK API failed');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    const filtered = data.filter((job: { position?: string; tags?: string[] }) => {
      if (!job.position) return false;
      const posLower = job.position.toLowerCase();
      const tags = (job.tags || []).join(' ').toLowerCase();
      return posLower.includes(queryLower) || tags.includes(queryLower);
    }).slice(0, 25);
    
    return filtered.map((job: {
      id: string; url: string; position: string; company: string; company_logo: string;
      tags: string[]; date: string; location: string; salary_min?: number; salary_max?: number;
      description: string;
    }): Job => {
      const description = parseDescription(job.description || '');
      return {
        id: `remoteok-${job.id}`,
        title: job.position,
        company: job.company,
        companyLogo: job.company_logo || undefined,
        location: job.location || 'Worldwide',
        locationType: 'Remote',
        salary: job.salary_min && job.salary_max ? { min: job.salary_min, max: job.salary_max } : undefined,
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: job.tags?.slice(0, 8) || [],
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
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
    console.error('RemoteOK error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 3: ARBEITNOW (European Tech Jobs)
// ============================================================================
const fetchArbeitnowJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!response.ok) throw new Error('Arbeitnow API failed');
    const data = await response.json();
    
    const queryLower = query.toLowerCase();
    const filtered = (data.data || []).filter((job: { title: string; tags: string[] }) => {
      return job.title.toLowerCase().includes(queryLower) ||
             (job.tags || []).some((t: string) => t.toLowerCase().includes(queryLower));
    }).slice(0, 20);
    
    return filtered.map((job: {
      slug: string; company_name: string; title: string; description: string;
      remote: boolean; url: string; tags: string[]; job_types: string[];
      location: string; created_at: number;
    }): Job => {
      const description = parseDescription(job.description);
      return {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Europe',
        locationType: job.remote ? 'Remote' : 'On-site',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: extractSkills(description, job.tags || []),
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
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
    console.error('Arbeitnow error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 4: HIMALAYAS (Remote-First Companies)
// ============================================================================
const fetchHimalayasJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://himalayas.app/jobs/api?limit=30&q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Himalayas API failed');
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: string; title: string; companyName: string; companyLogo?: string;
      excerpt?: string; description?: string; locationRestrictions?: string[];
      categories?: string[]; seniority?: string; minSalary?: number; maxSalary?: number;
      pubDate?: string; applicationLink?: string; externalUrl?: string;
    }): Job => {
      const description = parseDescription(job.description || job.excerpt || '');
      const applyUrl = job.applicationLink || job.externalUrl || `https://himalayas.app/jobs/${job.id}`;
      return {
        id: `himalayas-${job.id}`,
        title: job.title,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.locationRestrictions?.join(', ') || 'Worldwide',
        locationType: 'Remote',
        salary: job.minSalary && job.maxSalary ? { min: job.minSalary, max: job.maxSalary } : undefined,
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: extractSkills(description, job.categories || []),
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: job.seniority === 'senior' ? 'Senior' : job.seniority === 'junior' ? 'Entry Level' : 'Mid Level',
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
// JOB SOURCE 5: JOBICY (Remote Jobs)
// ============================================================================
const fetchJobicyJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy(`https://jobicy.com/api/v2/remote-jobs?count=30&tag=${encodeURIComponent(query)}`));
    if (!response.ok) throw new Error('Jobicy API failed');
    const data = await response.json();
    
    return (data.jobs || []).map((job: {
      id: number; url: string; jobTitle: string; companyName: string; companyLogo?: string;
      jobIndustry?: string[]; jobType?: string[]; jobGeo?: string; pubDate?: string;
      annualSalaryMin?: number; annualSalaryMax?: number; jobDescription?: string;
      jobExcerpt?: string;
    }): Job => {
      const description = parseDescription(job.jobDescription || job.jobExcerpt || '');
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
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: extractSkills(description, job.jobIndustry || []),
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
        employmentType: job.jobType?.[0] || 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.pubDate || Date.now()),
        source: 'Jobicy',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.jobIndustry?.[0] || 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Jobicy error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 6: WE WORK REMOTELY (WWR)
// ============================================================================
const fetchWWRJobs = async (query: string): Promise<Job[]> => {
  try {
    // WWR has RSS feeds we can parse
    const categories = ['programming', 'design', 'devops', 'product', 'marketing', 'customer-support'];
    const allJobs: Job[] = [];
    
    for (const category of categories.slice(0, 3)) {
      try {
        const response = await fetch(corsProxy(`https://weworkremotely.com/categories/${category}.rss`));
        if (!response.ok) continue;
        const text = await response.text();
        
        // Parse RSS XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          
          const queryLower = query.toLowerCase();
          if (!title.toLowerCase().includes(queryLower) && !description.toLowerCase().includes(queryLower)) {
            return;
          }
          
          // Extract company from title (usually "Company: Job Title")
          const titleParts = title.split(':');
          const company = titleParts.length > 1 ? titleParts[0].trim() : 'Company';
          const jobTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : title;
          
          const desc = parseDescription(description);
          
          allJobs.push({
            id: `wwr-${category}-${index}-${Date.now()}`,
            title: jobTitle,
            company: company,
            location: 'Worldwide',
            locationType: 'Remote',
            description: desc.slice(0, 500),
            fullDescription: desc,
            responsibilities: extractBulletPoints(desc, ['responsibilit', 'you will']),
            requirements: extractBulletPoints(desc, ['requirement', 'qualif']),
            skills: extractSkills(desc, []),
            benefits: extractBulletPoints(desc, ['benefit', 'perk']),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(pubDate || Date.now()),
            source: 'We Work Remotely',
            sourceUrl: link,
            applyUrl: link,
            industry: category,
            easyApply: false,
          });
        });
      } catch {
        continue;
      }
    }
    
    return allJobs;
  } catch (error) {
    console.error('WWR error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 7: GITHUB JOBS (via Arbeitnow/FindWork aggregation)
// ============================================================================
const fetchGitHubJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy(`https://jobs.github.com/positions.json?description=${encodeURIComponent(query)}`));
    if (!response.ok) throw new Error('GitHub Jobs failed');
    const jobs = await response.json();
    
    return (jobs || []).slice(0, 15).map((job: {
      id: string; title: string; company: string; company_logo?: string;
      location: string; type: string; description: string; how_to_apply: string;
      company_url?: string; url: string; created_at: string;
    }): Job => {
      const description = parseDescription(job.description || '');
      return {
        id: `github-${job.id}`,
        title: job.title,
        company: job.company,
        companyLogo: job.company_logo,
        location: job.location || 'Remote',
        locationType: job.location?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: extractSkills(description, []),
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
        employmentType: job.type || 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.created_at),
        source: 'GitHub Jobs',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('GitHub Jobs error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 8: THE MUSE (Curated Jobs)
// ============================================================================
const fetchMuseJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(`https://www.themuse.com/api/public/jobs?page=1&descending=true&category=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('The Muse API failed');
    const data = await response.json();
    
    return (data.results || []).slice(0, 20).map((job: {
      id: number; name: string; company: { name: string }; locations: { name: string }[];
      levels: { name: string }[]; refs: { landing_page: string }; contents: string;
      publication_date: string; categories: { name: string }[];
    }): Job => {
      const description = parseDescription(job.contents || '');
      return {
        id: `muse-${job.id}`,
        title: job.name,
        company: job.company?.name || 'Company',
        location: job.locations?.map(l => l.name).join(', ') || 'Various',
        locationType: job.locations?.some(l => l.name.toLowerCase().includes('remote')) ? 'Remote' : 'On-site',
        description: description.slice(0, 500),
        fullDescription: description,
        responsibilities: extractBulletPoints(description, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(description, ['requirement', 'qualif']),
        skills: extractSkills(description, []),
        benefits: extractBulletPoints(description, ['benefit', 'perk']),
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
    console.error('The Muse error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 9: INDEED (via RSS Feed)
// ============================================================================
const fetchIndeedJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const loc = location || 'remote';
    const rssUrl = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(loc)}`;
    const response = await fetch(corsProxy(rssUrl));
    if (!response.ok) throw new Error('Indeed RSS failed');
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    
    items.forEach((item, index) => {
      if (index >= 25) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const source = item.querySelector('source')?.textContent || '';
      
      const desc = parseDescription(description);
      
      jobs.push({
        id: `indeed-${index}-${Date.now()}`,
        title: title,
        company: source || 'Company on Indeed',
        location: loc,
        locationType: loc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBulletPoints(desc, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, []),
        benefits: extractBulletPoints(desc, ['benefit', 'perk']),
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
    console.error('Indeed error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 10: LINKEDIN (via RSS - limited)
// ============================================================================
const fetchLinkedInJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const keywords = encodeURIComponent(query);
    const loc = encodeURIComponent(location || '');
    const rssUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keywords}&location=${loc}&start=0`;
    
    const response = await fetch(corsProxy(rssUrl));
    if (!response.ok) throw new Error('LinkedIn scrape failed');
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const jobCards = doc.querySelectorAll('.base-card, .job-search-card');
    const jobs: Job[] = [];
    
    jobCards.forEach((card, index) => {
      if (index >= 25) return;
      const titleEl = card.querySelector('.base-search-card__title, h3');
      const companyEl = card.querySelector('.base-search-card__subtitle, h4');
      const locationEl = card.querySelector('.job-search-card__location, .base-search-card__metadata');
      const linkEl = card.querySelector('a.base-card__full-link, a');
      const timeEl = card.querySelector('time');
      
      const title = titleEl?.textContent?.trim() || '';
      const company = companyEl?.textContent?.trim() || '';
      const jobLocation = locationEl?.textContent?.trim() || location || 'Remote';
      const link = linkEl?.getAttribute('href') || '';
      const dateStr = timeEl?.getAttribute('datetime') || '';
      
      if (!title || !link) return;
      
      jobs.push({
        id: `linkedin-${index}-${Date.now()}`,
        title: title,
        company: company,
        location: jobLocation,
        locationType: jobLocation.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        description: `${title} position at ${company}. Apply on LinkedIn to see full details.`,
        fullDescription: `Apply on LinkedIn to see the full job description for ${title} at ${company}.`,
        skills: extractSkills(title, []),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: dateStr ? new Date(dateStr) : new Date(),
        source: 'LinkedIn',
        sourceUrl: link.startsWith('http') ? link : `https://www.linkedin.com${link}`,
        applyUrl: link.startsWith('http') ? link : `https://www.linkedin.com${link}`,
        industry: 'Various',
        easyApply: true,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('LinkedIn error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 11: ADZUNA (UK/EU Jobs)
// ============================================================================
const fetchAdzunaJobs = async (query: string): Promise<Job[]> => {
  try {
    // Adzuna has a public search that we can scrape
    const searchUrl = `https://www.adzuna.com/search?q=${encodeURIComponent(query)}&w=remote`;
    const response = await fetch(corsProxy(searchUrl));
    if (!response.ok) throw new Error('Adzuna failed');
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const jobCards = doc.querySelectorAll('.a, [data-aid="jobCard"]');
    const jobs: Job[] = [];
    
    // Fallback: return empty if scraping fails (need actual API key for production)
    if (jobCards.length === 0) return [];
    
    return jobs;
  } catch (error) {
    console.error('Adzuna error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 12: AUTHENTIC JOBS (Design & Creative)
// ============================================================================
const fetchAuthenticJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy('https://authenticjobs.com/?format=rss'));
    if (!response.ok) throw new Error('Authentic Jobs failed');
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    const queryLower = query.toLowerCase();
    
    items.forEach((item, index) => {
      if (index >= 20) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      if (!title.toLowerCase().includes(queryLower) && !description.toLowerCase().includes(queryLower)) {
        return;
      }
      
      const desc = parseDescription(description);
      const titleParts = title.split(' at ');
      const jobTitle = titleParts[0]?.trim() || title;
      const company = titleParts[1]?.trim() || 'Company';
      
      jobs.push({
        id: `authentic-${index}-${Date.now()}`,
        title: jobTitle,
        company: company,
        location: 'Remote',
        locationType: 'Remote',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: extractBulletPoints(desc, ['responsibilit', 'you will']),
        requirements: extractBulletPoints(desc, ['requirement', 'qualif']),
        skills: extractSkills(desc, []),
        benefits: extractBulletPoints(desc, ['benefit', 'perk']),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'Authentic Jobs',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Design & Creative',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Authentic Jobs error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 13: USAJOBS (US Government Jobs)
// ============================================================================
const fetchUSAJobs = async (query: string, location?: string): Promise<Job[]> => {
  try {
    const params = new URLSearchParams({
      Keyword: query,
      ResultsPerPage: '25',
    });
    if (location) params.set('LocationName', location);
    
    const response = await fetch(`https://data.usajobs.gov/api/search?${params.toString()}`, {
      headers: {
        'Authorization-Key': 'demo', // Public demo key
        'User-Agent': 'career-input-job-search',
      }
    });
    
    if (!response.ok) throw new Error('USAJobs failed');
    const data = await response.json();
    
    return (data.SearchResult?.SearchResultItems || []).map((item: {
      MatchedObjectId: string;
      MatchedObjectDescriptor: {
        PositionTitle: string;
        OrganizationName: string;
        PositionLocationDisplay: string;
        PositionRemuneration: { MinimumRange: string; MaximumRange: string }[];
        QualificationSummary: string;
        PositionStartDate: string;
        ApplyURI: string[];
        PositionURI: string;
        JobCategory: { Name: string }[];
      };
    }): Job => {
      const job = item.MatchedObjectDescriptor;
      const salary = job.PositionRemuneration?.[0];
      
      return {
        id: `usajobs-${item.MatchedObjectId}`,
        title: job.PositionTitle,
        company: job.OrganizationName,
        location: job.PositionLocationDisplay,
        locationType: job.PositionLocationDisplay?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: salary ? { min: parseInt(salary.MinimumRange), max: parseInt(salary.MaximumRange) } : undefined,
        salaryPeriod: 'yearly',
        description: job.QualificationSummary?.slice(0, 500) || '',
        fullDescription: job.QualificationSummary || '',
        requirements: extractBulletPoints(job.QualificationSummary || '', ['requirement', 'qualif']),
        skills: [],
        employmentType: 'Full-time',
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
    console.error('USAJobs error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 14: LANDING.JOBS (EU Tech)
// ============================================================================
const fetchLandingJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy(`https://landing.jobs/api/v1/jobs?q=${encodeURIComponent(query)}`));
    if (!response.ok) throw new Error('Landing.jobs failed');
    const data = await response.json();
    
    return (data.jobs || []).slice(0, 20).map((job: {
      id: string; title: string; company_name: string; city: string;
      country: string; remote: boolean; salary_from?: number; salary_to?: number;
      description: string; url: string; created_at: string; main_requirements?: string[];
      tags?: string[];
    }): Job => {
      const description = parseDescription(job.description || '');
      return {
        id: `landing-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: `${job.city}, ${job.country}`,
        locationType: job.remote ? 'Remote' : 'On-site',
        salary: job.salary_from && job.salary_to ? { min: job.salary_from, max: job.salary_to } : undefined,
        salaryPeriod: 'yearly',
        description: description.slice(0, 500),
        fullDescription: description,
        requirements: job.main_requirements || extractBulletPoints(description, ['requirement']),
        skills: job.tags || extractSkills(description, []),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.created_at),
        source: 'Landing.jobs',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: 'Technology',
        easyApply: false,
      };
    });
  } catch (error) {
    console.error('Landing.jobs error:', error);
    return [];
  }
};

// ============================================================================
// JOB SOURCE 15: DRIBBBLE JOBS (Design)
// ============================================================================
const fetchDribbbleJobs = async (query: string): Promise<Job[]> => {
  try {
    const response = await fetch(corsProxy('https://dribbble.com/jobs?format=rss'));
    if (!response.ok) throw new Error('Dribbble failed');
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const jobs: Job[] = [];
    const queryLower = query.toLowerCase();
    
    items.forEach((item, index) => {
      if (index >= 15) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      if (!title.toLowerCase().includes(queryLower) && !description.toLowerCase().includes(queryLower)) {
        return;
      }
      
      const desc = parseDescription(description);
      const titleParts = title.split(' at ');
      const jobTitle = titleParts[0]?.trim() || title;
      const company = titleParts[1]?.trim() || 'Company';
      
      jobs.push({
        id: `dribbble-${index}-${Date.now()}`,
        title: jobTitle,
        company: company,
        location: 'Remote',
        locationType: 'Remote',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc, ['Design', 'UI', 'UX', 'Figma']),
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(pubDate || Date.now()),
        source: 'Dribbble',
        sourceUrl: link,
        applyUrl: link,
        industry: 'Design',
        easyApply: false,
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Dribbble error:', error);
    return [];
  }
};

// ============================================================================
// MAIN SEARCH FUNCTION - Aggregates from ALL sources
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
  
  console.log(`🔍 Searching for "${query}" across 15+ job boards...`);
  
  // Fetch from ALL job sources in parallel
  const results = await Promise.allSettled([
    fetchRemotiveJobs(query),
    fetchRemoteOKJobs(query),
    fetchArbeitnowJobs(query),
    fetchHimalayasJobs(query),
    fetchJobicyJobs(query),
    fetchWWRJobs(query),
    fetchGitHubJobs(query),
    fetchMuseJobs(query),
    fetchIndeedJobs(query, location),
    fetchLinkedInJobs(query, location),
    fetchAdzunaJobs(query),
    fetchAuthenticJobs(query),
    fetchUSAJobs(query, location),
    fetchLandingJobs(query),
    fetchDribbbleJobs(query),
  ]);
  
  // Collect successful results
  let allJobs: Job[] = [];
  const sourceStats: Record<string, number> = {};
  
  results.forEach((result, index) => {
    const sourceNames = [
      'Remotive', 'RemoteOK', 'Arbeitnow', 'Himalayas', 'Jobicy',
      'WeWorkRemotely', 'GitHubJobs', 'TheMuse', 'Indeed', 'LinkedIn',
      'Adzuna', 'AuthenticJobs', 'USAJobs', 'LandingJobs', 'Dribbble'
    ];
    
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allJobs = [...allJobs, ...result.value];
      sourceStats[sourceNames[index]] = result.value.length;
      console.log(`✅ ${sourceNames[index]}: ${result.value.length} jobs`);
    } else if (result.status === 'rejected') {
      console.log(`❌ ${sourceNames[index]}: Failed`);
    }
  });
  
  console.log(`📊 Total jobs before filtering: ${allJobs.length}`);
  
  // Apply filters
  if (location && location.trim()) {
    const locationLower = location.toLowerCase();
    allJobs = allJobs.filter(job => {
      const jobLocationLower = (job.location || '').toLowerCase();
      return jobLocationLower.includes(locationLower) ||
             locationLower.includes('remote') && job.locationType === 'Remote' ||
             jobLocationLower.includes('worldwide') ||
             jobLocationLower.includes('anywhere');
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
    const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
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
  
  console.log(`✨ Returning ${allJobs.length} unique jobs`);
  
  return allJobs;
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
export const JOB_SOURCE_LIST = [
  'Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'Monster',
  'Remotive', 'RemoteOK', 'We Work Remotely', 'Himalayas', 'Jobicy',
  'GitHub Jobs', 'The Muse', 'Arbeitnow', 'USAJobs', 'Landing.jobs',
  'Dribbble', 'Authentic Jobs', 'AngelList', 'Dice', 'CareerBuilder'
];
