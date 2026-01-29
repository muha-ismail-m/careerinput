"""
Universal Job Application Platform - Automation Script
=======================================================

This script automates job application form filling using Playwright.
It uses heuristic field mapping to identify form fields and populate them
with data from the user's Universal Profile.

Requirements:
    pip install playwright httpx
    playwright install chromium

Usage:
    python automation-script.py --job-url "https://example.com/apply" --profile-id "uuid"
"""

import asyncio
import json
import re
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from enum import Enum

# Playwright is the automation library
from playwright.async_api import async_playwright, Page, Browser, ElementHandle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApplicationStatus(Enum):
    """Application result statuses"""
    SUCCESS = "applied"
    FAILED = "failed"
    MANUAL_REQUIRED = "manual_required"
    CAPTCHA_DETECTED = "captcha_detected"
    LOGIN_REQUIRED = "login_required"


@dataclass
class UserProfile:
    """User's Universal Profile data structure"""
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    linkedin_url: str
    portfolio_url: str
    github_url: str
    current_title: str
    years_of_experience: str
    desired_salary: str
    work_authorization: str
    requires_sponsorship: bool
    cover_letter: str
    skills: List[str]
    resume_path: str  # Local path to downloaded resume PDF


# ============================================
# Field Mapping Heuristics
# ============================================

# Common field name patterns mapped to profile attributes
FIELD_MAPPINGS: Dict[str, List[str]] = {
    "first_name": [
        "first", "fname", "given", "first_name", "firstname",
        "first-name", "givenname", "given_name"
    ],
    "last_name": [
        "last", "lname", "surname", "family", "last_name", "lastname",
        "last-name", "familyname", "family_name"
    ],
    "email": [
        "email", "e-mail", "mail", "email_address", "emailaddress"
    ],
    "phone": [
        "phone", "tel", "telephone", "mobile", "cell", "phone_number",
        "phonenumber", "contact_number"
    ],
    "address": [
        "address", "street", "address1", "street_address", "address_line",
        "streetaddress"
    ],
    "city": [
        "city", "town", "municipality"
    ],
    "state": [
        "state", "province", "region"
    ],
    "zip_code": [
        "zip", "postal", "zipcode", "zip_code", "postalcode", "postal_code"
    ],
    "country": [
        "country", "nation"
    ],
    "linkedin_url": [
        "linkedin", "linked_in", "linkedin_url", "linkedinurl",
        "linkedin_profile"
    ],
    "portfolio_url": [
        "portfolio", "website", "personal_website", "portfolio_url"
    ],
    "github_url": [
        "github", "git_hub", "github_url", "githuburl"
    ],
    "cover_letter": [
        "cover", "letter", "coverletter", "cover_letter", "motivation",
        "why_interested", "why_us", "message"
    ],
    "current_title": [
        "title", "current_title", "job_title", "position"
    ],
    "salary": [
        "salary", "compensation", "expected_salary", "desired_salary",
        "salary_expectation"
    ],
}

# Patterns that indicate CAPTCHA or login requirements
BLOCKER_PATTERNS = [
    r"captcha",
    r"recaptcha",
    r"hcaptcha",
    r"verify.*human",
    r"sign.?in",
    r"log.?in",
    r"create.*account",
    r"workday",
    r"taleo",
    r"icims"
]

# Known ATS patterns for special handling
KNOWN_ATS = {
    "greenhouse": r"boards\.greenhouse\.io",
    "lever": r"jobs\.lever\.co",
    "ashby": r"jobs\.ashbyhq\.com",
    "workable": r"apply\.workable\.com",
}


class JobApplicationAutomator:
    """
    Main automation class that handles job application form filling.
    """
    
    def __init__(self, profile: UserProfile, headless: bool = True):
        self.profile = profile
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        
    async def __aenter__(self):
        """Context manager entry - initialize browser"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        self.page = await context.new_page()
        return self
    
    async def __aexit__(self, *args):
        """Context manager exit - cleanup"""
        if self.browser:
            await self.browser.close()
    
    async def apply_to_job(self, job_url: str) -> Dict[str, Any]:
        """
        Main entry point - attempt to apply to a job.
        
        Returns:
            Dict with status, message, and details
        """
        logger.info(f"Starting application for: {job_url}")
        
        try:
            # Navigate to the job page
            await self.page.goto(job_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)  # Wait for dynamic content
            
            # Check for blockers (CAPTCHA, login walls)
            blocker = await self._check_for_blockers()
            if blocker:
                logger.warning(f"Blocker detected: {blocker}")
                return {
                    "status": ApplicationStatus.MANUAL_REQUIRED.value,
                    "message": f"Manual apply required: {blocker}",
                    "url": job_url
                }
            
            # Detect ATS type for specialized handling
            ats_type = self._detect_ats(job_url)
            logger.info(f"Detected ATS: {ats_type or 'Unknown'}")
            
            # Find and click apply button
            applied = await self._click_apply_button()
            if not applied:
                return {
                    "status": ApplicationStatus.FAILED.value,
                    "message": "Could not find apply button",
                    "url": job_url
                }
            
            await asyncio.sleep(2)
            
            # Fill out the application form
            fields_filled = await self._fill_form()
            
            # Upload resume if file input found
            await self._upload_resume()
            
            # Submit the application
            submitted = await self._submit_form()
            
            if submitted:
                return {
                    "status": ApplicationStatus.SUCCESS.value,
                    "message": "Application submitted successfully",
                    "fields_filled": fields_filled,
                    "url": job_url
                }
            else:
                return {
                    "status": ApplicationStatus.FAILED.value,
                    "message": "Could not submit application",
                    "fields_filled": fields_filled,
                    "url": job_url
                }
                
        except Exception as e:
            logger.error(f"Error applying to job: {e}")
            return {
                "status": ApplicationStatus.FAILED.value,
                "message": str(e),
                "url": job_url
            }
    
    async def _check_for_blockers(self) -> Optional[str]:
        """Check if page has CAPTCHA or login requirements"""
        page_content = await self.page.content()
        page_lower = page_content.lower()
        
        for pattern in BLOCKER_PATTERNS:
            if re.search(pattern, page_lower, re.IGNORECASE):
                return pattern
        
        return None
    
    def _detect_ats(self, url: str) -> Optional[str]:
        """Detect which ATS system the job posting uses"""
        for ats_name, pattern in KNOWN_ATS.items():
            if re.search(pattern, url, re.IGNORECASE):
                return ats_name
        return None
    
    async def _click_apply_button(self) -> bool:
        """Find and click the apply button"""
        apply_selectors = [
            'button:has-text("Apply")',
            'a:has-text("Apply")',
            '[data-testid*="apply"]',
            '.apply-button',
            '#apply-button',
            'button:has-text("Easy Apply")',
            'button:has-text("Quick Apply")',
            'a:has-text("Apply Now")',
            'button:has-text("Apply Now")',
        ]
        
        for selector in apply_selectors:
            try:
                button = await self.page.query_selector(selector)
                if button:
                    await button.click()
                    logger.info(f"Clicked apply button: {selector}")
                    return True
            except Exception:
                continue
        
        return False
    
    async def _fill_form(self) -> List[str]:
        """
        Fill form fields using heuristic matching.
        Returns list of fields that were successfully filled.
        """
        filled_fields = []
        
        # Get all input elements
        inputs = await self.page.query_selector_all('input, textarea, select')
        
        for input_elem in inputs:
            try:
                # Get input attributes
                input_type = await input_elem.get_attribute('type') or 'text'
                input_name = await input_elem.get_attribute('name') or ''
                input_id = await input_elem.get_attribute('id') or ''
                placeholder = await input_elem.get_attribute('placeholder') or ''
                
                # Skip hidden, submit, and already filled fields
                if input_type in ['hidden', 'submit', 'button', 'file']:
                    continue
                
                # Check if field is already filled
                current_value = await input_elem.input_value()
                if current_value:
                    continue
                
                # Combine attributes for matching
                field_text = f"{input_name} {input_id} {placeholder}".lower()
                
                # Try to match to profile field
                value = self._get_field_value(field_text, input_type)
                
                if value:
                    await input_elem.fill(value)
                    filled_fields.append(input_name or input_id)
                    logger.info(f"Filled field: {input_name or input_id}")
                    
            except Exception as e:
                logger.debug(f"Could not fill input: {e}")
                continue
        
        return filled_fields
    
    def _get_field_value(self, field_text: str, input_type: str) -> Optional[str]:
        """Match field text to profile value using heuristics"""
        
        # Check each mapping
        for profile_attr, patterns in FIELD_MAPPINGS.items():
            for pattern in patterns:
                if pattern in field_text:
                    return getattr(self.profile, profile_attr, None)
        
        # Special handling for specific input types
        if input_type == 'email':
            return self.profile.email
        elif input_type == 'tel':
            return self.profile.phone
        elif input_type == 'url':
            # Try to match URL fields
            if 'linkedin' in field_text:
                return self.profile.linkedin_url
            elif 'github' in field_text:
                return self.profile.github_url
            elif 'portfolio' in field_text or 'website' in field_text:
                return self.profile.portfolio_url
        
        # Handle radio/checkbox for sponsorship/authorization
        if 'sponsor' in field_text or 'visa' in field_text:
            return 'No' if not self.profile.requires_sponsorship else 'Yes'
        
        if 'authorized' in field_text or 'eligible' in field_text:
            return 'Yes'
        
        return None
    
    async def _upload_resume(self) -> bool:
        """Upload resume PDF to file input"""
        try:
            file_inputs = await self.page.query_selector_all('input[type="file"]')
            
            for file_input in file_inputs:
                accept = await file_input.get_attribute('accept') or ''
                
                # Check if it accepts PDFs
                if not accept or '.pdf' in accept or 'application/pdf' in accept:
                    await file_input.set_input_files(self.profile.resume_path)
                    logger.info("Resume uploaded successfully")
                    return True
                    
        except Exception as e:
            logger.error(f"Could not upload resume: {e}")
        
        return False
    
    async def _submit_form(self) -> bool:
        """Find and click submit button"""
        submit_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Submit Application")',
            'button:has-text("Complete")',
            'button:has-text("Send")',
            'button:has-text("Finish")',
        ]
        
        for selector in submit_selectors:
            try:
                button = await self.page.query_selector(selector)
                if button:
                    await button.click()
                    await asyncio.sleep(3)  # Wait for submission
                    logger.info(f"Clicked submit: {selector}")
                    return True
            except Exception:
                continue
        
        return False


# ============================================
# FastAPI Backend Integration
# ============================================

"""
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI()

class ApplyRequest(BaseModel):
    job_url: str
    user_id: str

@app.post("/api/queue/process")
async def process_queue(background_tasks: BackgroundTasks, user_id: str):
    '''Trigger processing of pending applications'''
    background_tasks.add_task(process_user_queue, user_id)
    return {"message": "Processing started"}

async def process_user_queue(user_id: str):
    '''Background task to process all pending applications'''
    # 1. Fetch user profile from database
    profile = await get_user_profile(user_id)
    
    # 2. Fetch pending jobs from queue
    pending_jobs = await get_pending_jobs(user_id)
    
    # 3. Download resume to temp file
    resume_path = await download_resume(profile.resume_url)
    
    # 4. Process each job
    user_profile = UserProfile(
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        phone=profile.phone,
        address=profile.address,
        city=profile.city,
        state=profile.state,
        zip_code=profile.zip_code,
        country=profile.country,
        linkedin_url=profile.linkedin_url,
        portfolio_url=profile.portfolio_url,
        github_url=profile.github_url,
        current_title=profile.current_title,
        years_of_experience=profile.years_of_experience,
        desired_salary=profile.desired_salary,
        work_authorization=profile.work_authorization,
        requires_sponsorship=profile.requires_sponsorship,
        cover_letter=profile.generic_cover_letter,
        skills=profile.skills,
        resume_path=resume_path
    )
    
    async with JobApplicationAutomator(user_profile, headless=True) as automator:
        for job in pending_jobs:
            # Update status to processing
            await update_job_status(job.id, "processing")
            
            # Apply to job
            result = await automator.apply_to_job(job.apply_url)
            
            # Update status based on result
            await update_job_status(
                job.id, 
                result["status"],
                error_message=result.get("message")
            )
            
            # Log the attempt
            await log_application_attempt(job.id, result)
            
            # Add delay between applications to avoid rate limiting
            await asyncio.sleep(5)
"""


# ============================================
# CLI Entry Point
# ============================================

async def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Job Application Automator')
    parser.add_argument('--job-url', required=True, help='URL of the job to apply to')
    parser.add_argument('--profile', required=True, help='Path to profile JSON file')
    parser.add_argument('--resume', required=True, help='Path to resume PDF')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    
    args = parser.parse_args()
    
    # Load profile from JSON
    with open(args.profile, 'r') as f:
        profile_data = json.load(f)
    
    profile = UserProfile(
        resume_path=args.resume,
        **profile_data
    )
    
    async with JobApplicationAutomator(profile, headless=args.headless) as automator:
        result = await automator.apply_to_job(args.job_url)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
