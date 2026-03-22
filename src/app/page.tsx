import { requireRecruiterAuth } from '@/lib/recruiter-auth';
import { redirect } from 'next/navigation';
import CreateJobForm from './create-job-form';

export default async function Home() {
  let user;
  try {
    const authResult = await requireRecruiterAuth();
    user = authResult.user;
  } catch {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Interview App</h1>
        <div className="text-sm text-gray-600">
          Logged in as: {user?.email}
        </div>
      </div>
      <CreateJobForm />
    </main>
  );
}
