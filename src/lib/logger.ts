import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Configurable via env: LOG_LEVEL (default: DEBUG), LOG_DIR (default: ./tmp)
const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'DEBUG';
const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'tmp');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(LOG_DIR, `app-${date}.log`);
}

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  let line = `${timestamp} [${level.padEnd(5)}] [${context}] ${message}`;
  if (data !== undefined) {
    try {
      const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 0);
      line += ` | ${serialized}`;
    } catch {
      line += ` | [unserializable data]`;
    }
  }
  return line;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LEVEL];
}

function writeLog(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, context, message, data);

  // Write to file
  try {
    appendFileSync(getLogFilePath(), formatted + '\n');
  } catch (err) {
    console.error('Failed to write log file:', err);
  }

  // Also write to console with appropriate method
  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
      break;
  }
}

/**
 * Create a scoped logger for a specific context (e.g., 'InterviewAPI', 'Auth').
 * 
 * Usage:
 *   const log = createLogger('InterviewAPI');
 *   log.info('Request received', { phase: 'intro' });
 *   log.error('Failed to generate', error);
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => writeLog('DEBUG', context, message, data),
    info:  (message: string, data?: unknown) => writeLog('INFO',  context, message, data),
    warn:  (message: string, data?: unknown) => writeLog('WARN',  context, message, data),
    error: (message: string, data?: unknown) => writeLog('ERROR', context, message, data),
  };
}
