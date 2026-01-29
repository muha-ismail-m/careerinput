import { ArrowRight, Search, Zap, BarChart3, Shield, Globe, Users, Briefcase } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function LandingPage() {
  const { setCurrentPage } = useAppStore();
  
  const features = [
    {
      icon: Search,
      title: 'Aggregate Jobs Everywhere',
      description: 'Search LinkedIn, Indeed, Glassdoor, and 50+ job boards from one place.',
    },
    {
      icon: Zap,
      title: 'One-Click Batch Apply',
      description: 'Select multiple jobs and apply to all of them with a single click.',
    },
    {
      icon: BarChart3,
      title: 'Track Everything',
      description: 'Monitor application status, success rates, and follow-ups in real-time.',
    },
    {
      icon: Shield,
      title: 'Smart Form Filling',
      description: 'Our AI automatically fills out application forms using your profile.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Jobs Aggregated Daily' },
    { value: '85%', label: 'Auto-Apply Success Rate' },
    { value: '50+', label: 'Job Sources' },
    { value: '3 min', label: 'Average Time to Apply' },
  ];

  const sources = [
    'LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster', 
    'CareerBuilder', 'Dice', 'AngelList', 'Greenhouse', 'Lever'
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Career Input</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('search')}
                className="text-indigo-200 hover:text-white font-medium transition-colors"
              >
                Search Jobs
              </button>
              <button
                onClick={() => setCurrentPage('auth')}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium mb-8 border border-indigo-500/30">
            <Globe className="h-4 w-4" />
            Aggregating jobs from 50+ sources
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Apply to{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hundreds of Jobs
            </span>
            <br />
            in Minutes
          </h1>
          
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto mb-10">
            Search jobs from LinkedIn, Indeed, Glassdoor, and more. Select the ones you want. 
            Click apply. We handle the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage('search')}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 text-lg"
            >
              Start Searching Jobs
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage('auth')}
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
            >
              Create Free Account
            </button>
          </div>

          <p className="mt-6 text-sm text-indigo-300/70">
            No credit card required • Free to search • Pay only when you apply
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/10 bg-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-indigo-300 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Sources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-indigo-300 mb-8">We aggregate jobs from the best platforms</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {sources.map((source) => (
              <span
                key={source}
                className="px-4 py-2 bg-white/10 rounded-lg text-white/80 text-sm font-medium border border-white/10"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Stop wasting hours on repetitive applications. Let Career Input do the heavy lifting.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-indigo-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How Career Input Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-6 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Search Jobs</h3>
              <p className="text-indigo-200">
                Enter your desired job title and location. We search 50+ job boards instantly.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-6 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Select & Apply</h3>
              <p className="text-indigo-200">
                Check the jobs you like. Fill out your profile once. Click "Apply to Selected."
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-6 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Track Progress</h3>
              <p className="text-indigo-200">
                Monitor all your applications in one dashboard. Get notified of updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Trusted by Job Seekers
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I applied to 50 jobs in 20 minutes. Got 3 interviews the next week!",
                name: "Sarah M.",
                role: "Product Manager"
              },
              {
                quote: "The automation is incredible. It filled out forms perfectly every time.",
                name: "James L.",
                role: "Software Engineer"
              },
              {
                quote: "Finally, a tool that actually saves time. Landed my dream job in 2 weeks.",
                name: "Emily R.",
                role: "Marketing Director"
              }
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/10 border border-white/10">
                <p className="text-white mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{testimonial.name}</p>
                    <p className="text-indigo-300 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            Join thousands of job seekers who are applying smarter, not harder.
          </p>
          <button
            onClick={() => setCurrentPage('search')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 text-lg"
          >
            Start Searching Jobs Free
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Career Input</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-indigo-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-indigo-400">
              © 2024 Career Input. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
