'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, BrainCircuit } from 'lucide-react';
import { createJobAction } from './actions';

export default function CreateJobForm() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [numIntroQuestions, setNumIntroQuestions] = useState(2);
  const [numTechQuestions, setNumTechQuestions] = useState(3);
  const [prepTimeLimit, setPrepTimeLimit] = useState(30);
  const [recordTimeLimit, setRecordTimeLimit] = useState(300);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      formData.append('skills', skills);
      formData.append('numIntroQuestions', numIntroQuestions.toString());
      formData.append('numTechQuestions', numTechQuestions.toString());
      formData.append('prepTimeLimit', prepTimeLimit.toString());
      formData.append('recordTimeLimit', recordTimeLimit.toString());

      const jobId = await createJobAction(formData);
      router.push(`/job/${jobId}`);
    } catch (error) {
      console.error('Failed to create job template:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8">
      <div className="bg-blue-600 p-8 text-white text-center">
        <BrainCircuit className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Smart Interview Setup</h1>
        <p className="text-blue-100">Phase 2: Job Template Configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Intro Questions
            </label>
            <input
              type="number"
              min="1"
              max="5"
              required
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={numIntroQuestions}
              onChange={(e) => setNumIntroQuestions(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Technical Questions
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={numTechQuestions}
              onChange={(e) => setNumTechQuestions(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prep Time Limit (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              required
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={prepTimeLimit}
              onChange={(e) => setPrepTimeLimit(parseInt(e.target.value) || 30)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Time Limit (seconds)
            </label>
            <input
              type="number"
              min="60"
              max="600"
              required
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={recordTimeLimit}
              onChange={(e) => setRecordTimeLimit(parseInt(e.target.value) || 300)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={false}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {isLoading ? (
            <span className="animate-pulse">Creating Job Template...</span>
          ) : (
            'Create Job Template'
          )}
        </button>
      </form>
    </div>
  );
}
