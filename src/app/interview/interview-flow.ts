export function createUploadRecoveryState(input: {
  prepTimeLimit: number;
  recordTimeLimit: number;
}) {
  return {
    status: 'prep' as const,
    prepTimeLeft: input.prepTimeLimit,
    recordTimeLeft: input.recordTimeLimit,
  };
}
