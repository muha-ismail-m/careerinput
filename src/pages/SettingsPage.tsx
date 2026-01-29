import { useState } from 'react';
import { Upload, Plus, Trash2, FileText, CheckCircle, User, Briefcase, GraduationCap, FileCheck, Save, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Profile, Education, Experience } from '@/types';
import { Layout } from '@/components/Layout';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/utils/cn';

type Tab = 'personal' | 'professional' | 'experience' | 'education' | 'documents';

export function SettingsPage() {
  const { user, profile, document: existingDoc, updateProfile, setDocument, setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Profile>>(profile || {
    userId: user?.id || '',
    firstName: '',
    lastName: '',
    phone: '',
    email: user?.email || '',
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
  });
  
  const [skillInput, setSkillInput] = useState('');
  
  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileCheck },
  ];
  
  const updateField = (field: keyof Profile, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };
  
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      updateField('skills', [...(formData.skills || []), skillInput.trim()]);
      setSkillInput('');
    }
  };
  
  const removeSkill = (skill: string) => {
    updateField('skills', formData.skills?.filter(s => s !== skill) || []);
  };
  
  const addExperience = () => {
    const newExp: Experience = {
      id: uuidv4(),
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    updateField('experience', [...(formData.experience || []), newExp]);
  };
  
  const updateExperience = (id: string, field: keyof Experience, value: unknown) => {
    const updated = formData.experience?.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateField('experience', updated);
  };
  
  const removeExperience = (id: string) => {
    updateField('experience', formData.experience?.filter(exp => exp.id !== id));
  };
  
  const addEducation = () => {
    const newEdu: Education = {
      id: uuidv4(),
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    updateField('education', [...(formData.education || []), newEdu]);
  };
  
  const updateEducation = (id: string, field: keyof Education, value: string) => {
    const updated = formData.education?.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    updateField('education', updated);
  };
  
  const removeEducation = (id: string) => {
    updateField('education', formData.education?.filter(edu => edu.id !== id));
  };
  
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setDocument({
        userId: user?.id || '',
        resumeFileUrl: URL.createObjectURL(file),
        resumeFileName: file.name,
        uploadedAt: new Date(),
      });
      setSaved(false);
    }
  };
  
  const handleSave = () => {
    updateProfile(formData as Profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => setCurrentPage('search')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Search
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-slate-500 mt-1">Manage your profile and application details</p>
          </div>
          
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
            )}
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Street address"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode || ''}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="ZIP code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Professional Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Professional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => updateField('linkedinUrl', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolioUrl || ''}
                    onChange={(e) => updateField('portfolioUrl', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.githubUrl || ''}
                    onChange={(e) => updateField('githubUrl', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="github.com/username"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Title</label>
                  <input
                    type="text"
                    value={formData.currentTitle || ''}
                    onChange={(e) => updateField('currentTitle', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                  <select
                    value={formData.yearsOfExperience || ''}
                    onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Desired Salary</label>
                  <input
                    type="text"
                    value={formData.desiredSalary || ''}
                    onChange={(e) => updateField('desiredSalary', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Desired salary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Work Authorization</label>
                  <select
                    value={formData.workAuthorization || ''}
                    onChange={(e) => updateField('workAuthorization', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card">Green Card</option>
                    <option value="H1B">H1B Visa</option>
                    <option value="OPT">OPT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="sponsorship"
                    checked={formData.requiresSponsorship || false}
                    onChange={(e) => updateField('requiresSponsorship', e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="sponsorship" className="text-sm text-slate-700">
                    I require visa sponsorship
                  </label>
                </div>
              </div>
              
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Add a skill"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-indigo-900">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Generic Cover Letter / "Why Work Here" Text
                </label>
                <textarea
                  value={formData.genericCoverLetter || ''}
                  onChange={(e) => updateField('genericCoverLetter', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  placeholder="Write about your passion and value proposition..."
                />
              </div>
            </div>
          )}
          
          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Work Experience</h2>
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Experience
                </button>
              </div>
              
              {formData.experience?.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No experience added yet</p>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Add your first experience
                  </button>
                </div>
              )}
              
              {formData.experience?.map((exp, index) => (
                <div key={exp.id} className="border border-slate-200 rounded-xl p-6 relative">
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  
                  <p className="text-sm font-medium text-slate-500 mb-4">Experience {index + 1}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="Job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="City, State"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label className="text-sm text-slate-700">I currently work here</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Education</h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Education
                </button>
              </div>
              
              {formData.education?.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No education added yet</p>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Add your education
                  </button>
                </div>
              )}
              
              {formData.education?.map((edu, index) => (
                <div key={edu.id} className="border border-slate-200 rounded-xl p-6 relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  
                  <p className="text-sm font-medium text-slate-500 mb-4">Education {index + 1}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">School / University</label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="School name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Degree</label>
                      <select
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="">Select degree</option>
                        <option value="High School">High School</option>
                        <option value="Associate">Associate's Degree</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Master">Master's Degree</option>
                        <option value="PhD">Ph.D.</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="Field of study"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="GPA"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Documents</h2>
              
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resume (PDF only)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors relative">
                  {resumeFile || existingDoc ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{resumeFile?.name || existingDoc?.resumeFileName}</p>
                        <p className="text-sm text-slate-500">PDF uploaded successfully</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-2">Drag and drop your resume or click to browse</p>
                      <p className="text-sm text-slate-400">PDF files only, max 5MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
