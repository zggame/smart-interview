'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, BrainCircuit } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsLoading(true);
    // In a real app, we might save this to a DB and pass an ID. 
    // For Phase 1, we pass the data to the interview room via sessionStorage
    sessionStorage.setItem('smart-interview-jd', jobDescription);
    sessionStorage.setItem('smart-interview-skills', skills);
    
    router.push('/interview');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <BrainCircuit className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Smart Interview Setup</h1>
          <p className="text-blue-100">Phase 1: Dynamic AI Interviewer Prototype</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Description
              </span>
            </label>
            <textarea
              required
              rows={8}
              className="w-full rounded-xl border border-gray-300 p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Paste the full job description here... (The AI will use this context to generate intro and technical questions)"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Technical Skills (Optional)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g. React, Next.js, Python, Supabase"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="mt-2 text-sm text-gray-500">
              The second phase of the interview (up to 5 questions) will focus on these technical areas.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !jobDescription.trim()}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Starting Interview Room...</span>
            ) : (
              'Start AI Interview'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
