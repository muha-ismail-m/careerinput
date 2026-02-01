/**
 * CAREER INPUT - Backend Job Proxy Server
 * This server fetches jobs from all sources without CORS issues
 * 
 * Run with: node server/index.js
 * The server runs on port 3001
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Request timeout
const TIMEOUT = 15000;

// Create axios instance with defaults
const http = axios.create({
  timeout: TIMEOUT,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  }
});

// Parse RSS/XML
const parseXML = async (xmlString) => {
  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
  return parser.parseStringPromise(xmlString);
};

// Parse HTML to text
const parseHTML = (html) => {
  if (!html) return '';
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

// Extract skills from description
const extractSkills = (description) => {
  const allSkills = [
    // Tech
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Git', 'Linux', 'CI/CD',
    // Engineering
    'AutoCAD', 'SolidWorks', 'CATIA', 'MATLAB', 'Simulink', 'Ansys', 'Revit', 'Civil 3D', 'PLC', 'SCADA',
    'CAD', 'CAM', 'CNC', 'GD&T', 'FEA', 'CFD', 'BIM', 'Six Sigma', 'Lean Manufacturing', 'PMP',
    // Healthcare
    'EMR', 'EHR', 'HIPAA', 'CPR', 'BLS', 'ACLS', 'Epic', 'Cerner', 'ICD-10', 'Medical Billing',
    // Finance
    'Excel', 'Financial Modeling', 'Bloomberg', 'SAP', 'QuickBooks', 'GAAP', 'CPA', 'CFA',
    // Marketing
    'SEO', 'SEM', 'Google Analytics', 'HubSpot', 'Salesforce', 'Social Media', 'Content Marketing',
    // General
    'Project Management', 'Communication', 'Leadership', 'Agile', 'Scrum', 'Data Analysis'
  ];
  
  const descLower = description.toLowerCase();
  return allSkills.filter(skill => descLower.includes(skill.toLowerCase())).slice(0, 10);
};

// Parse salary
const parseSalary = (text) => {
  if (!text) return null;
  const matches = text.match(/\$?([\d,]+)[kK]?\s*[-–—to]+\s*\$?([\d,]+)[kK]?/i);
  if (matches) {
    let min = parseInt(matches[1].replace(/,/g, ''));
    let max = parseInt(matches[2].replace(/,/g, ''));
    if (text.toLowerCase().includes('k') || min < 1000) {
      min *= 1000;
      max *= 1000;
    }
    if (min > 0 && max > 0 && max >= min) {
      return { min, max };
    }
  }
  return null;
};

// ============================================================================
// JOB SOURCE: INDEED
// ============================================================================
app.get('/api/jobs/indeed', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[Indeed] Searching for "${query}" in "${location}"`);
    
    const jobs = [];
    
    // Try RSS feed first
    try {
      const rssUrl = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date&limit=50`;
      const response = await http.get(rssUrl);
      const xml = await parseXML(response.data);
      
      const items = xml.rss?.channel?.item || [];
      const itemArray = Array.isArray(items) ? items : [items];
      
      itemArray.forEach((item, index) => {
        if (!item.title) return;
        const desc = parseHTML(item.description || '');
        jobs.push({
          id: `indeed-${index}-${Date.now()}`,
          title: item.title,
          company: item.source?._ || item.source || 'Company on Indeed',
          location: location,
          locationType: item.title?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          salary: parseSalary(desc),
          salaryPeriod: 'yearly',
          description: desc.slice(0, 500),
          fullDescription: desc,
          skills: extractSkills(desc),
          employmentType: 'Full-time',
          experienceLevel: 'Mid Level',
          postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          source: 'Indeed',
          sourceUrl: item.link,
          applyUrl: item.link,
          industry: 'Various',
          easyApply: false,
        });
      });
    } catch (rssError) {
      console.log('[Indeed] RSS failed, trying HTML scrape...');
      
      // Fallback: Scrape HTML
      try {
        const htmlUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
        const response = await http.get(htmlUrl);
        const $ = cheerio.load(response.data);
        
        $('div.job_seen_beacon, div.jobsearch-SerpJobCard, div.result').each((index, element) => {
          const title = $(element).find('h2.jobTitle span, a.jobtitle, .jobTitle').first().text().trim();
          const company = $(element).find('span.companyName, span.company, .companyName').first().text().trim();
          const jobLocation = $(element).find('div.companyLocation, span.location, .companyLocation').first().text().trim();
          const link = $(element).find('a[href*="/rc/clk"], a[href*="/viewjob"], a.jobtitle').first().attr('href');
          const snippet = $(element).find('.job-snippet, .summary').first().text().trim();
          
          if (title && link) {
            const fullLink = link.startsWith('http') ? link : `https://www.indeed.com${link}`;
            jobs.push({
              id: `indeed-html-${index}-${Date.now()}`,
              title,
              company: company || 'Company on Indeed',
              location: jobLocation || location,
              locationType: title.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
              description: snippet,
              fullDescription: snippet,
              skills: extractSkills(snippet),
              employmentType: 'Full-time',
              experienceLevel: 'Mid Level',
              postedAt: new Date(),
              source: 'Indeed',
              sourceUrl: fullLink,
              applyUrl: fullLink,
              industry: 'Various',
              easyApply: false,
            });
          }
        });
      } catch (htmlError) {
        console.error('[Indeed] HTML scrape also failed:', htmlError.message);
      }
    }
    
    console.log(`[Indeed] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Indeed] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: LINKEDIN
// ============================================================================
app.get('/api/jobs/linkedin', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[LinkedIn] Searching for "${query}" in "${location}"`);
    
    const jobs = [];
    
    // Try multiple pages
    for (let page = 0; page < 3; page++) {
      try {
        const start = page * 25;
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}`;
        const response = await http.get(url);
        const $ = cheerio.load(response.data);
        
        $('li, .base-card, .job-search-card').each((index, element) => {
          const titleEl = $(element).find('.base-search-card__title, h3, .job-card-list__title');
          const companyEl = $(element).find('.base-search-card__subtitle, h4, .job-card-container__company-name');
          const locationEl = $(element).find('.job-search-card__location, .base-search-card__metadata');
          const linkEl = $(element).find('a.base-card__full-link, a[href*="/jobs/view/"]');
          const timeEl = $(element).find('time');
          
          const title = titleEl.first().text().trim();
          const company = companyEl.first().text().trim();
          const jobLocation = locationEl.first().text().trim();
          let link = linkEl.first().attr('href') || '';
          const dateStr = timeEl.first().attr('datetime') || '';
          
          if (title && link) {
            if (!link.startsWith('http')) link = `https://www.linkedin.com${link}`;
            
            jobs.push({
              id: `linkedin-${page}-${index}-${Date.now()}`,
              title,
              company: company || 'Company on LinkedIn',
              location: jobLocation || location,
              locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
              description: `${title} position at ${company}. View full details on LinkedIn.`,
              fullDescription: `${title} at ${company}\nLocation: ${jobLocation}`,
              skills: extractSkills(title),
              employmentType: 'Full-time',
              experienceLevel: 'Mid Level',
              postedAt: dateStr ? new Date(dateStr) : new Date(),
              source: 'LinkedIn',
              sourceUrl: link,
              applyUrl: link,
              industry: 'Various',
              easyApply: true,
            });
          }
        });
      } catch (pageError) {
        console.log(`[LinkedIn] Page ${page} failed:`, pageError.message);
      }
    }
    
    console.log(`[LinkedIn] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[LinkedIn] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: GLASSDOOR
// ============================================================================
app.get('/api/jobs/glassdoor', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[Glassdoor] Searching for "${query}"`);
    
    const jobs = [];
    
    try {
      const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}&locT=N&locId=1`;
      const response = await http.get(url);
      const $ = cheerio.load(response.data);
      
      $('li[data-test="jobListing"], .react-job-listing, .jobCard').each((index, element) => {
        const title = $(element).find('[data-test="job-title"], .job-title, .jobTitle').first().text().trim();
        const company = $(element).find('[data-test="employer-name"], .employer-name, .companyName').first().text().trim();
        const jobLocation = $(element).find('[data-test="emp-location"], .location, .jobLocation').first().text().trim();
        const link = $(element).find('a[href*="/job-listing/"]').first().attr('href');
        const salary = $(element).find('[data-test="salary-estimate"], .salary').first().text().trim();
        
        if (title) {
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.glassdoor.com${link}`) : `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}`;
          jobs.push({
            id: `glassdoor-${index}-${Date.now()}`,
            title,
            company: company || 'Company on Glassdoor',
            location: jobLocation || location,
            locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            salary: parseSalary(salary),
            salaryPeriod: 'yearly',
            description: `${title} at ${company}`,
            fullDescription: `${title} at ${company}\nLocation: ${jobLocation}\nSalary: ${salary || 'Not specified'}`,
            skills: extractSkills(title),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(),
            source: 'Glassdoor',
            sourceUrl: fullLink,
            applyUrl: fullLink,
            industry: 'Various',
            easyApply: false,
          });
        }
      });
    } catch (scrapeError) {
      console.error('[Glassdoor] Scrape failed:', scrapeError.message);
    }
    
    console.log(`[Glassdoor] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Glassdoor] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: ZIPRECRUITER
// ============================================================================
app.get('/api/jobs/ziprecruiter', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[ZipRecruiter] Searching for "${query}"`);
    
    const jobs = [];
    
    try {
      const url = `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      const response = await http.get(url);
      const $ = cheerio.load(response.data);
      
      $('article.job_result, .job_content, .jobList-item').each((index, element) => {
        const title = $(element).find('.job_title, h2.title, .jobTitle').first().text().trim();
        const company = $(element).find('.hiring_company, .company, .companyName').first().text().trim();
        const jobLocation = $(element).find('.job_location, .location, .jobLocation').first().text().trim();
        const link = $(element).find('a[href*="/jobs/"], a.job_link').first().attr('href');
        const snippet = $(element).find('.job_snippet, .snippet').first().text().trim();
        const salary = $(element).find('.salary, .compensation').first().text().trim();
        
        if (title) {
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.ziprecruiter.com${link}`) : `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}`;
          jobs.push({
            id: `ziprecruiter-${index}-${Date.now()}`,
            title,
            company: company || 'Company on ZipRecruiter',
            location: jobLocation || location,
            locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            salary: parseSalary(salary),
            salaryPeriod: 'yearly',
            description: snippet || `${title} at ${company}`,
            fullDescription: snippet || `${title} at ${company}\nLocation: ${jobLocation}`,
            skills: extractSkills(snippet || title),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(),
            source: 'ZipRecruiter',
            sourceUrl: fullLink,
            applyUrl: fullLink,
            industry: 'Various',
            easyApply: false,
          });
        }
      });
    } catch (scrapeError) {
      console.error('[ZipRecruiter] Scrape failed:', scrapeError.message);
    }
    
    console.log(`[ZipRecruiter] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[ZipRecruiter] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: MONSTER
// ============================================================================
app.get('/api/jobs/monster', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[Monster] Searching for "${query}"`);
    
    const jobs = [];
    
    try {
      const url = `https://www.monster.com/jobs/search?q=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`;
      const response = await http.get(url);
      const $ = cheerio.load(response.data);
      
      $('[data-testid="svx-job-card"], .job-search-resultsstyle__JobCard, .card-content').each((index, element) => {
        const title = $(element).find('[data-testid="job-title"], .title, h2').first().text().trim();
        const company = $(element).find('[data-testid="company"], .company, .name').first().text().trim();
        const jobLocation = $(element).find('[data-testid="location"], .location').first().text().trim();
        const link = $(element).find('a[href*="/job-openings/"], a.job-title').first().attr('href');
        
        if (title) {
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.monster.com${link}`) : `https://www.monster.com/jobs/search?q=${encodeURIComponent(query)}`;
          jobs.push({
            id: `monster-${index}-${Date.now()}`,
            title,
            company: company || 'Company on Monster',
            location: jobLocation || location,
            locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            description: `${title} at ${company}`,
            fullDescription: `${title} at ${company}\nLocation: ${jobLocation}`,
            skills: extractSkills(title),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(),
            source: 'Monster',
            sourceUrl: fullLink,
            applyUrl: fullLink,
            industry: 'Various',
            easyApply: false,
          });
        }
      });
    } catch (scrapeError) {
      console.error('[Monster] Scrape failed:', scrapeError.message);
    }
    
    console.log(`[Monster] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Monster] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: CAREERBUILDER
// ============================================================================
app.get('/api/jobs/careerbuilder', async (req, res) => {
  try {
    const { query, location = 'United States' } = req.query;
    console.log(`[CareerBuilder] Searching for "${query}"`);
    
    const jobs = [];
    
    try {
      const url = `https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      const response = await http.get(url);
      const $ = cheerio.load(response.data);
      
      $('[data-job-id], .data-results-content, .job-listing-item').each((index, element) => {
        const title = $(element).find('.data-results-title, .job-title, h2').first().text().trim();
        const company = $(element).find('.data-details .company, .company-name').first().text().trim();
        const jobLocation = $(element).find('.data-details .location, .job-location').first().text().trim();
        const link = $(element).find('a[href*="/job/"]').first().attr('href');
        
        if (title) {
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.careerbuilder.com${link}`) : `https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(query)}`;
          jobs.push({
            id: `careerbuilder-${index}-${Date.now()}`,
            title,
            company: company || 'Company on CareerBuilder',
            location: jobLocation || location,
            locationType: jobLocation?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            description: `${title} at ${company}`,
            fullDescription: `${title} at ${company}\nLocation: ${jobLocation}`,
            skills: extractSkills(title),
            employmentType: 'Full-time',
            experienceLevel: 'Mid Level',
            postedAt: new Date(),
            source: 'CareerBuilder',
            sourceUrl: fullLink,
            applyUrl: fullLink,
            industry: 'Various',
            easyApply: false,
          });
        }
      });
    } catch (scrapeError) {
      console.error('[CareerBuilder] Scrape failed:', scrapeError.message);
    }
    
    console.log(`[CareerBuilder] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[CareerBuilder] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: REMOTIVE (API - Most Reliable)
// ============================================================================
app.get('/api/jobs/remotive', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[Remotive] Searching for "${query}"`);
    
    const response = await http.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`);
    
    const jobs = (response.data.jobs || []).map((job, index) => {
      const desc = parseHTML(job.description || '');
      return {
        id: `remotive-${job.id || index}`,
        title: job.title,
        company: job.company_name,
        companyLogo: job.company_logo || undefined,
        location: job.candidate_required_location || 'Worldwide',
        locationType: 'Remote',
        salary: parseSalary(job.salary),
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc),
        employmentType: job.job_type === 'full_time' ? 'Full-time' : job.job_type === 'contract' ? 'Contract' : 'Full-time',
        experienceLevel: 'Mid Level',
        postedAt: new Date(job.publication_date),
        source: 'Remotive',
        sourceUrl: job.url,
        applyUrl: job.url,
        industry: job.category || 'Technology',
        easyApply: false,
      };
    });
    
    console.log(`[Remotive] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Remotive] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: REMOTEOK (API)
// ============================================================================
app.get('/api/jobs/remoteok', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[RemoteOK] Searching for "${query}"`);
    
    const response = await http.get('https://remoteok.com/api');
    const queryLower = query.toLowerCase();
    
    const jobs = response.data
      .filter(job => {
        if (!job.position) return false;
        const posLower = job.position.toLowerCase();
        const tags = (job.tags || []).join(' ').toLowerCase();
        const desc = (job.description || '').toLowerCase();
        return posLower.includes(queryLower) || tags.includes(queryLower) || desc.includes(queryLower);
      })
      .slice(0, 50)
      .map((job, index) => {
        const desc = parseHTML(job.description || '');
        return {
          id: `remoteok-${job.id || index}`,
          title: job.position,
          company: job.company,
          companyLogo: job.company_logo || undefined,
          location: job.location || 'Worldwide',
          locationType: 'Remote',
          salary: job.salary_min && job.salary_max ? { min: job.salary_min, max: job.salary_max } : undefined,
          salaryPeriod: 'yearly',
          description: desc.slice(0, 500),
          fullDescription: desc,
          skills: job.tags?.slice(0, 10) || [],
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
    
    console.log(`[RemoteOK] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[RemoteOK] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: ARBEITNOW (API)
// ============================================================================
app.get('/api/jobs/arbeitnow', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[Arbeitnow] Searching for "${query}"`);
    
    const response = await http.get('https://www.arbeitnow.com/api/job-board-api');
    const queryLower = query.toLowerCase();
    
    const jobs = (response.data.data || [])
      .filter(job => {
        return job.title.toLowerCase().includes(queryLower) ||
               (job.tags || []).some(t => t.toLowerCase().includes(queryLower)) ||
               (job.description || '').toLowerCase().includes(queryLower);
      })
      .slice(0, 50)
      .map((job, index) => {
        const desc = parseHTML(job.description || '');
        return {
          id: `arbeitnow-${job.slug || index}`,
          title: job.title,
          company: job.company_name,
          location: job.location || 'Europe',
          locationType: job.remote ? 'Remote' : 'On-site',
          description: desc.slice(0, 500),
          fullDescription: desc,
          skills: extractSkills(desc),
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
    
    console.log(`[Arbeitnow] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Arbeitnow] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: HIMALAYAS (API)
// ============================================================================
app.get('/api/jobs/himalayas', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[Himalayas] Searching for "${query}"`);
    
    const response = await http.get(`https://himalayas.app/jobs/api?limit=50&q=${encodeURIComponent(query)}`);
    
    const jobs = (response.data.jobs || []).map((job, index) => {
      const desc = parseHTML(job.description || job.excerpt || '');
      const applyUrl = job.applicationLink || job.externalUrl || `https://himalayas.app/jobs/${job.id}`;
      return {
        id: `himalayas-${job.id || index}`,
        title: job.title,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.locationRestrictions?.join(', ') || 'Worldwide',
        locationType: 'Remote',
        salary: job.minSalary && job.maxSalary ? { min: job.minSalary, max: job.maxSalary } : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc),
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
    
    console.log(`[Himalayas] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Himalayas] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: USAJOBS (API - Excellent for ALL industries)
// ============================================================================
app.get('/api/jobs/usajobs', async (req, res) => {
  try {
    const { query, location } = req.query;
    console.log(`[USAJobs] Searching for "${query}"`);
    
    const params = new URLSearchParams({
      Keyword: query,
      ResultsPerPage: '100',
    });
    if (location) params.set('LocationName', location);
    
    const response = await http.get(`https://data.usajobs.gov/api/search?${params.toString()}`, {
      headers: {
        'Authorization-Key': 'GWvh6gTX0oPnXWjQ8aPfSVUGHUFnmFlx8cCCQhZmkRg=',
        'User-Agent': 'career-input-job-search',
      }
    });
    
    const jobs = (response.data.SearchResult?.SearchResultItems || []).map((item, index) => {
      const job = item.MatchedObjectDescriptor;
      const salary = job.PositionRemuneration?.[0];
      const duties = job.UserArea?.Details?.MajorDuties || [];
      const requirements = job.UserArea?.Details?.Requirements || '';
      const desc = job.QualificationSummary || '';
      
      return {
        id: `usajobs-${item.MatchedObjectId || index}`,
        title: job.PositionTitle,
        company: job.OrganizationName || job.DepartmentName,
        companyDescription: `${job.DepartmentName} - U.S. Federal Government`,
        location: job.PositionLocationDisplay || job.PositionLocation?.[0]?.LocationName || 'Various',
        locationType: job.PositionLocationDisplay?.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        salary: salary ? { min: parseInt(salary.MinimumRange.replace(/,/g, '')), max: parseInt(salary.MaximumRange.replace(/,/g, '')) } : undefined,
        salaryPeriod: salary?.RateIntervalCode === 'Per Hour' ? 'hourly' : 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        responsibilities: duties.slice(0, 8),
        requirements: [],
        skills: extractSkills(desc + ' ' + duties.join(' ') + ' ' + requirements),
        benefits: ['Federal Benefits', 'Pension Plan', 'Health Insurance', 'Paid Leave'],
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
    
    console.log(`[USAJobs] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[USAJobs] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: JOBICY (API)
// ============================================================================
app.get('/api/jobs/jobicy', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[Jobicy] Searching for "${query}"`);
    
    const response = await http.get(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(query)}`);
    
    const jobs = (response.data.jobs || []).map((job, index) => {
      const desc = parseHTML(job.jobDescription || '');
      return {
        id: `jobicy-${job.id || index}`,
        title: job.jobTitle,
        company: job.companyName,
        companyLogo: job.companyLogo,
        location: job.jobGeo || 'Worldwide',
        locationType: 'Remote',
        salary: job.annualSalaryMin && job.annualSalaryMax ? { min: job.annualSalaryMin, max: job.annualSalaryMax } : undefined,
        salaryPeriod: 'yearly',
        description: desc.slice(0, 500),
        fullDescription: desc,
        skills: extractSkills(desc),
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
    
    console.log(`[Jobicy] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Jobicy] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: THE MUSE (API)
// ============================================================================
app.get('/api/jobs/themuse', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`[The Muse] Searching for "${query}"`);
    
    const response = await http.get('https://www.themuse.com/api/public/jobs?page=1&descending=true');
    const queryLower = query.toLowerCase();
    
    const jobs = (response.data.results || [])
      .filter(job => {
        return job.name.toLowerCase().includes(queryLower) || 
               (job.contents || '').toLowerCase().includes(queryLower);
      })
      .slice(0, 50)
      .map((job, index) => {
        const desc = parseHTML(job.contents || '');
        return {
          id: `muse-${job.id || index}`,
          title: job.name,
          company: job.company?.name || 'Company',
          location: job.locations?.map(l => l.name).join(', ') || 'Various',
          locationType: job.locations?.some(l => l.name.toLowerCase().includes('remote')) ? 'Remote' : 'On-site',
          description: desc.slice(0, 500),
          fullDescription: desc,
          skills: extractSkills(desc),
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
    
    console.log(`[The Muse] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[The Muse] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// JOB SOURCE: ADZUNA (Multi-country)
// ============================================================================
app.get('/api/jobs/adzuna', async (req, res) => {
  try {
    const { query, location } = req.query;
    console.log(`[Adzuna] Searching for "${query}"`);
    
    const jobs = [];
    const countries = ['us', 'gb', 'ca', 'au', 'de'];
    
    for (const country of countries) {
      try {
        // Using free tier - you can add API key for more results
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=demo&app_key=demo&results_per_page=20&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
        const response = await http.get(url);
        
        (response.data.results || []).forEach((job, index) => {
          const desc = parseHTML(job.description || '');
          jobs.push({
            id: `adzuna-${country}-${job.id || index}-${Date.now()}`,
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
      } catch (countryError) {
        console.log(`[Adzuna] ${country} failed:`, countryError.message);
      }
    }
    
    console.log(`[Adzuna] Found ${jobs.length} jobs`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[Adzuna] Error:', error.message);
    res.json({ success: false, jobs: [], error: error.message });
  }
});

// ============================================================================
// AGGREGATE ALL JOBS
// ============================================================================
app.get('/api/jobs/search', async (req, res) => {
  const { query, location, remoteOnly, salaryMin, salaryMax } = req.query;
  
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 SEARCHING: "${query}" in "${location || 'Anywhere'}"`);
  console.log(`${'='.repeat(60)}\n`);
  
  const sources = [
    { name: 'Indeed', url: `/api/jobs/indeed?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'LinkedIn', url: `/api/jobs/linkedin?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'Glassdoor', url: `/api/jobs/glassdoor?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'ZipRecruiter', url: `/api/jobs/ziprecruiter?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'Monster', url: `/api/jobs/monster?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'CareerBuilder', url: `/api/jobs/careerbuilder?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'Remotive', url: `/api/jobs/remotive?query=${encodeURIComponent(query)}` },
    { name: 'RemoteOK', url: `/api/jobs/remoteok?query=${encodeURIComponent(query)}` },
    { name: 'Arbeitnow', url: `/api/jobs/arbeitnow?query=${encodeURIComponent(query)}` },
    { name: 'Himalayas', url: `/api/jobs/himalayas?query=${encodeURIComponent(query)}` },
    { name: 'USAJobs', url: `/api/jobs/usajobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
    { name: 'Jobicy', url: `/api/jobs/jobicy?query=${encodeURIComponent(query)}` },
    { name: 'The Muse', url: `/api/jobs/themuse?query=${encodeURIComponent(query)}` },
    { name: 'Adzuna', url: `/api/jobs/adzuna?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}` },
  ];
  
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      try {
        const response = await http.get(`http://localhost:${PORT}${source.url}`);
        return { name: source.name, ...response.data };
      } catch (error) {
        return { name: source.name, success: false, jobs: [], error: error.message };
      }
    })
  );
  
  let allJobs = [];
  const sourceStatuses = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { name, success, jobs = [], count = 0, error } = result.value;
      sourceStatuses.push({ name, success, count, error });
      if (success && jobs.length > 0) {
        allJobs = [...allJobs, ...jobs];
      }
    }
  });
  
  // Apply filters
  if (remoteOnly === 'true') {
    allJobs = allJobs.filter(job => job.locationType === 'Remote');
  }
  
  if (salaryMin) {
    allJobs = allJobs.filter(job => !job.salary || job.salary.max >= parseInt(salaryMin));
  }
  
  if (salaryMax) {
    allJobs = allJobs.filter(job => !job.salary || job.salary.min <= parseInt(salaryMax));
  }
  
  // Remove duplicates
  const seen = new Set();
  allJobs = allJobs.filter(job => {
    const key = `${job.title.toLowerCase().substring(0, 50)}-${job.company.toLowerCase().substring(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by date
  allJobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  
  console.log(`\n✅ TOTAL: ${allJobs.length} unique jobs from ${sourceStatuses.filter(s => s.success).length}/${sources.length} sources\n`);
  
  res.json({
    success: true,
    query,
    location,
    totalJobs: allJobs.length,
    sources: sourceStatuses,
    jobs: allJobs,
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 CAREER INPUT - Job Proxy Server                         ║
║                                                               ║
║   Server running on http://localhost:${PORT}                    ║
║                                                               ║
║   Endpoints:                                                  ║
║   • GET /api/jobs/search?query=...&location=...              ║
║   • GET /api/jobs/indeed?query=...                           ║
║   • GET /api/jobs/linkedin?query=...                         ║
║   • GET /api/jobs/glassdoor?query=...                        ║
║   • GET /api/jobs/ziprecruiter?query=...                     ║
║   • GET /api/jobs/monster?query=...                          ║
║   • GET /api/jobs/careerbuilder?query=...                    ║
║   • GET /api/jobs/remotive?query=...                         ║
║   • GET /api/jobs/remoteok?query=...                         ║
║   • GET /api/jobs/arbeitnow?query=...                        ║
║   • GET /api/jobs/himalayas?query=...                        ║
║   • GET /api/jobs/usajobs?query=...                          ║
║   • GET /api/jobs/jobicy?query=...                           ║
║   • GET /api/jobs/themuse?query=...                          ║
║   • GET /api/jobs/adzuna?query=...                           ║
║   • GET /api/health                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
