import { useState } from 'react';
import { useAppStore } from '../store/appStore';

type Tab = 'personal' | 'professional' | 'experience' | 'education' | 'documents';

export default function SettingsPage() {
  const { profile, updateProfile, document, setDocument, logout, setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    updateProfile({ [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setDocument({
        userId: profile?.userId || '',
        resumeFileUrl: url,
        resumeFileName: file.name,
        uploadedAt: new Date(),
      });
      showSaved();
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'professional', label: 'Professional' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your profile information for job applications</p>
          </div>
          {saved && (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              ✓ Saved
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile?.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onBlur={showSaved}
                      placeholder="Your first name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile?.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onBlur={showSaved}
                      placeholder="Your last name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={showSaved}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={showSaved}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={profile?.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onBlur={showSaved}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={profile?.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      onBlur={showSaved}
                      placeholder="San Francisco"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={profile?.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      onBlur={showSaved}
                      placeholder="CA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={profile?.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      onBlur={showSaved}
                      placeholder="94102"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={profile?.currentTitle || ''}
                      onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                      onBlur={showSaved}
                      placeholder="Software Engineer"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="text"
                      value={profile?.yearsOfExperience || ''}
                      onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                      onBlur={showSaved}
                      placeholder="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profile?.linkedinUrl || ''}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    onBlur={showSaved}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={profile?.githubUrl || ''}
                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                    onBlur={showSaved}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={profile?.portfolioUrl || ''}
                    onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                    onBlur={showSaved}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profile?.skills?.join(', ') || ''}
                    onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as unknown as string)}
                    onBlur={showSaved}
                    placeholder="JavaScript, React, Python, SQL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generic Cover Letter / Why Work Here
                  </label>
                  <textarea
                    value={profile?.genericCoverLetter || ''}
                    onChange={(e) => handleInputChange('genericCoverLetter', e.target.value)}
                    onBlur={showSaved}
                    placeholder="Write a general cover letter that can be used for applications..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Authorization
                    </label>
                    <select
                      value={profile?.workAuthorization || ''}
                      onChange={(e) => handleInputChange('workAuthorization', e.target.value)}
                      onBlur={showSaved}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="citizen">US Citizen</option>
                      <option value="permanent_resident">Permanent Resident</option>
                      <option value="visa">Work Visa</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile?.requiresSponsorship || false}
                        onChange={(e) => handleInputChange('requiresSponsorship', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">Requires visa sponsorship</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Add your work experience. This information will be used to auto-fill job applications.
                </p>
                
                {(profile?.experience || []).map((exp, index) => (
                  <div key={exp.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-medium">Position {index + 1}</h3>
                      <button
                        onClick={() => {
                          const newExp = profile?.experience?.filter(e => e.id !== exp.id) || [];
                          updateProfile({ experience: newExp });
                          showSaved();
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => {
                          const newExp = [...(profile?.experience || [])];
                          newExp[index] = { ...exp, title: e.target.value };
                          updateProfile({ experience: newExp });
                        }}
                        onBlur={showSaved}
                        placeholder="Job Title"
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...(profile?.experience || [])];
                          newExp[index] = { ...exp, company: e.target.value };
                          updateProfile({ experience: newExp });
                        }}
                        onBlur={showSaved}
                        placeholder="Company Name"
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newExp = [
                      ...(profile?.experience || []),
                      {
                        id: `exp-${Date.now()}`,
                        title: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        description: '',
                      },
                    ];
                    updateProfile({ experience: newExp });
                  }}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 w-full"
                >
                  + Add Experience
                </button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Add your educational background.
                </p>
                
                {(profile?.education || []).map((edu, index) => (
                  <div key={edu.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-medium">Education {index + 1}</h3>
                      <button
                        onClick={() => {
                          const newEdu = profile?.education?.filter(e => e.id !== edu.id) || [];
                          updateProfile({ education: newEdu });
                          showSaved();
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => {
                          const newEdu = [...(profile?.education || [])];
                          newEdu[index] = { ...edu, school: e.target.value };
                          updateProfile({ education: newEdu });
                        }}
                        onBlur={showSaved}
                        placeholder="School Name"
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...(profile?.education || [])];
                          newEdu[index] = { ...edu, degree: e.target.value };
                          updateProfile({ education: newEdu });
                        }}
                        onBlur={showSaved}
                        placeholder="Degree (e.g., Bachelor's in Computer Science)"
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newEdu = [
                      ...(profile?.education || []),
                      {
                        id: `edu-${Date.now()}`,
                        school: '',
                        degree: '',
                        fieldOfStudy: '',
                        startDate: '',
                        endDate: '',
                      },
                    ];
                    updateProfile({ education: newEdu });
                  }}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 w-full"
                >
                  + Add Education
                </button>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume (PDF only)
                  </label>
                  
                  {document ? (
                    <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-sm font-medium">PDF</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{document.resumeFileName}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDocument(null as unknown as typeof document)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="block p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-indigo-500">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-gray-600">Click to upload your resume (PDF)</p>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Section */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <button
            onClick={() => {
              logout();
              setCurrentPage('landing');
            }}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
