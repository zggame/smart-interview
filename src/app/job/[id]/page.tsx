'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Users, Link as LinkIcon, Briefcase, FileText, Settings, Clock } from 'lucide-react';
import { createInterviewSessionAction, getJobAction } from '@/app/actions';

export default function JobDashboard() {
  const params = useParams();
  const id = params.id as string;
  const [candidateName, setCandidateName] = useState('');
  const [interviewLinks, setInterviewLinks] = useState<{name: string, url: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [jobConfig, setJobConfig] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    async function loadJob() {
      try {
        const job = await getJobAction(id);
        setJobConfig(job);
      } catch (err) {
        console.error("Failed to load job configuration", err);
      }
    }
    loadJob();
  }, [id]);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('candidateName', candidateName);

      const interviewId = await createInterviewSessionAction(id, formData);
      const url = `${window.location.origin}/interview/${interviewId}`;

      setInterviewLinks(prev => [...prev, { name: candidateName, url }]);
      setCandidateName('');
    } catch (error) {
      console.error('Failed to generate interview link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center gap-4 mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Job Template Dashboard</h1>
          </div>
          <p className="text-gray-600 mb-6">
            This job template has been successfully created. You can now generate unique interview links for your candidates.
            Each candidate will receive the specific number of questions and time limits you configured.
          </p>

          {jobConfig && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Template Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-blue-800 font-medium flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" /> Questions
                  </div>
                  <div className="text-gray-700 bg-white p-3 rounded-lg border border-blue-100">
                    <p><strong>Intro:</strong> {jobConfig.num_intro_questions}</p>
                    <p><strong>Technical:</strong> {jobConfig.num_tech_questions}</p>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-blue-800 font-medium flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" /> Timers
                  </div>
                  <div className="text-gray-700 bg-white p-3 rounded-lg border border-blue-100">
                    <p><strong>Prep Limit:</strong> {jobConfig.prep_time_limit}s</p>
                    <p><strong>Record Limit:</strong> {jobConfig.record_time_limit}s</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-blue-800 font-medium mb-1">Skills Assessed</div>
                <div className="text-gray-700 bg-white p-3 rounded-lg border border-blue-100 text-sm">
                  {jobConfig.skills || 'None specified'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center gap-4 mb-6">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold">Generate Interview Link</h2>
          </div>

          <form onSubmit={handleGenerateLink} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. Alice Smith"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !candidateName.trim() || !isClient}
              className="bg-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Link'}
            </button>
          </form>
        </div>

        {interviewLinks.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-semibold mb-6">Active Interview Links</h2>
            <div className="space-y-4">
              {interviewLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{link.name}</p>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-1">
                      <LinkIcon className="w-3 h-3" />
                      {link.url}
                    </a>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(link.url)}
                    className="text-gray-500 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
