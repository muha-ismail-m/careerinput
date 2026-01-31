import { useAppStore } from '../store/appStore';

// All job sources - covers ALL industries
const jobSources = [
  // General Job Boards (ALL industries)
  { name: 'Indeed', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' },
  { name: 'Glassdoor', color: 'bg-green-100 text-green-700' },
  { name: 'ZipRecruiter', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Monster', color: 'bg-purple-100 text-purple-700' },
  { name: 'SimplyHired', color: 'bg-orange-100 text-orange-700' },
  { name: 'CareerBuilder', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Jooble', color: 'bg-cyan-100 text-cyan-700' },
  { name: 'CareerJet', color: 'bg-pink-100 text-pink-700' },
  { name: 'Adzuna', color: 'bg-teal-100 text-teal-700' },
  // Regional
  { name: 'Reed (UK)', color: 'bg-red-100 text-red-700' },
  { name: 'USAJobs', color: 'bg-blue-100 text-blue-700' },
  { name: 'FlexJobs', color: 'bg-green-100 text-green-700' },
  { name: 'The Muse', color: 'bg-rose-100 text-rose-700' },
  // Tech & Remote
  { name: 'Remotive', color: 'bg-purple-100 text-purple-700' },
  { name: 'RemoteOK', color: 'bg-orange-100 text-orange-700' },
  { name: 'We Work Remotely', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Dice', color: 'bg-amber-100 text-amber-700' },
  { name: 'Wellfound', color: 'bg-gray-100 text-gray-700' },
  { name: 'Himalayas', color: 'bg-cyan-100 text-cyan-700' },
  { name: 'Jobicy', color: 'bg-sky-100 text-sky-700' },
  { name: 'Arbeitnow', color: 'bg-teal-100 text-teal-700' },
  // Specialized Industries
  { name: 'iHire Engineering', color: 'bg-slate-100 text-slate-700' },
  { name: 'Health eCareers', color: 'bg-emerald-100 text-emerald-700' },
];

export default function LandingPage() {
  const { setCurrentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              One Profile.<br />Unlimited Applications.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Stop filling out the same forms over and over. Career Input lets you apply to hundreds of jobs with a single click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentPage('search')}
                className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
              >
                Start Searching Jobs
              </button>
              <button
                onClick={() => setCurrentPage('auth')}
                className="px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-lg hover:bg-white/30 transition-colors text-lg border border-white/30"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-600">50+</div>
              <div className="text-gray-600">Job Sources</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-600">1M+</div>
              <div className="text-gray-600">Jobs Available</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-600">10x</div>
              <div className="text-gray-600">Faster Applications</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-indigo-600">Free</div>
              <div className="text-gray-600">To Get Started</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Sources */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Jobs Aggregated From Top Platforms
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {jobSources.map((source) => (
              <span
                key={source.name}
                className={`px-4 py-2 ${source.color} rounded-full font-medium text-sm`}
              >
                {source.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600">
                Fill out your information once. We'll use it to auto-fill every application.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search & Select Jobs</h3>
              <p className="text-gray-600">
                Browse jobs from 50+ sources. Check the ones you want to apply to.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Batch Apply</h3>
              <p className="text-gray-600">
                Click once and we'll submit your applications automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of job seekers who've simplified their application process.
          </p>
          <button
            onClick={() => setCurrentPage('search')}
            className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            Browse Jobs Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-white mb-4">Career Input</div>
          <p className="mb-4">Making job applications effortless.</p>
          <p className="text-sm">© 2024 Career Input. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
