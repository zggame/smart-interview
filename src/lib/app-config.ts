export interface AppConfig {
  inviteExpiryDays: number;
  retentionDays: number;
  consentCopy: {
    recording: string;
    aiUse: string;
    identityConfirmation: string;
    noCheating: string;
  };
}

export function getAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const inviteExpiryDays = env.INTERVIEW_INVITE_EXPIRY_DAYS ? parseInt(env.INTERVIEW_INVITE_EXPIRY_DAYS, 10) : 14;
  const retentionDays = env.INTERVIEW_RETENTION_DAYS ? parseInt(env.INTERVIEW_RETENTION_DAYS, 10) : 60;
  return {
    inviteExpiryDays: isNaN(inviteExpiryDays) ? 14 : inviteExpiryDays,
    retentionDays: isNaN(retentionDays) ? 60 : retentionDays,
    consentCopy: {
      recording: 'The interview will be recorded.',
      aiUse: 'AI will be used to generate questions and assist evaluation.',
      identityConfirmation: 'The candidate confirms they are the invited person.',
      noCheating: 'The candidate agrees not to use cheating, impersonation, or outside assistance.',
    },
  };
}
