import { requireRecruiterAuth } from '@/lib/recruiter-auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerConfig } from '@/lib/supabase-config';
import LoginForm from './login-form';

export default async function LoginPage() {
  const config = getSupabaseServerConfig();
  if (config.mode === 'mock') {
    redirect('/');
  }

  try {
    const supabase = await requireRecruiterAuth();
    if (supabase) {
      redirect('/');
    }
  } catch {}

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Recruiter Login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
