'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Link as LinkIcon, Briefcase, FileText, Settings, Clock, ArrowRight } from 'lucide-react';
import {
  createInterviewInviteAction,
  getJobAction,
  listJobInterviewsForRecruiterAction,
} from '@/app/actions';
import { mapInterviewSessionsToLinks, type InterviewLink } from '@/app/job/interview-links';

interface JobConfig {
  num_intro_questions: number;
  num_tech_questions: number;
  prep_time_limit: number;
  record_time_limit: number;
  skills: string | null;
}

export default function JobDashboard() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [interviewLinks, setInterviewLinks] = useState<InterviewLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null);

  useEffect(() => {
    setIsClient(true);
    async function loadJob() {
      try {
        const [job, sessions] = await Promise.all([
          getJobAction(id),
          listJobInterviewsForRecruiterAction(id),
        ]);
        setJobConfig(job);
        setInterviewLinks(mapInterviewSessionsToLinks(sessions, window.location.origin));
      } catch (err) {
        console.error("Failed to load job configuration", err);
      }
    }
    loadJob();
  }, [id]);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('candidateName', candidateName);
      formData.append('candidateEmail', candidateEmail);

      const result = await createInterviewInviteAction(id, formData);
      const url = `${window.location.origin}/interview/${result.interviewId}?token=${result.rawToken}`;

      // Refresh list
      const sessions = await listJobInterviewsForRecruiterAction(id);
      setInterviewLinks(mapInterviewSessionsToLinks(sessions, window.location.origin));

      setCandidateName('');
      setCandidateEmail('');
    } catch (error) {
      console.error('Failed to generate interview link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold uppercase tracking-wider">Completed</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold uppercase tracking-wider">In Progress</span>;
      case 'expired': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold uppercase tracking-wider">Expired</span>;
      default: return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold uppercase tracking-wider">Not Started</span>;
    }
  };

  const getRecBadge = (rec?: string) => {
    switch(rec) {
      case 'advance': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold uppercase tracking-wider">Advance</span>;
      case 'maybe': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold uppercase tracking-wider">Maybe</span>;
      case 'reject': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-semibold uppercase tracking-wider">Reject</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center gap-4 mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Job Template Dashboard</h1>
          </div>
          <p className="text-gray-600 mb-6">
            This job template is ready for screening. You can create invite links for candidates to perform an AI-assisted asynchronous interview.
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
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center gap-4 mb-6">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold">Generate Invite Link</h2>
          </div>

          <form onSubmit={handleGenerateLink} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
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
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="alice@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !candidateName.trim() || !candidateEmail.trim() || !isClient}
              className="bg-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 h-[50px]"
            >
              {isLoading ? 'Generating...' : 'Generate Invite'}
            </button>
          </form>
        </div>

        {interviewLinks.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-semibold mb-6">Candidate Reviews</h2>
            <div className="space-y-4">
              {interviewLinks.map((link, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-200 rounded-xl bg-gray-50 hover:border-gray-300 transition-colors">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-lg text-gray-900">{link.name}</p>
                      {getStatusBadge(link.status)}
                      {getRecBadge(link.recommendation)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{link.email}</p>
                    {link.status !== 'completed' && (
                       <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                         <LinkIcon className="w-3 h-3" />
                         View Landing Page
                       </a>
                    )}
                    {link.expiresAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Expires: {new Date(link.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">

                    <button
                      onClick={() => router.push(`/job/${id}/interviews/${link.id}`)}
                      className="text-white bg-blue-600 hover:bg-blue-700 border border-transparent px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      View Review <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
