import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LoggerConfig {
  level: LogLevel;
  logDir: string;
  console: boolean;
  file: boolean;
  contexts: Record<string, LogLevel>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Load config from logger.config.json, falling back to env vars and defaults
function loadConfig(): LoggerConfig {
  const configPath = resolve(process.cwd(), 'logger.config.json');

  const defaults: LoggerConfig = {
    level: (process.env.LOG_LEVEL as LogLevel) || 'DEBUG',
    logDir: process.env.LOG_DIR || join(process.cwd(), 'tmp'),
    console: true,
    file: true,
    contexts: {},
  };

  try {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        level: parsed.level || defaults.level,
        logDir: parsed.logDir ? resolve(process.cwd(), parsed.logDir) : defaults.logDir,
        console: parsed.console ?? defaults.console,
        file: parsed.file ?? defaults.file,
        contexts: parsed.contexts || defaults.contexts,
      };
    }
  } catch (err) {
    console.warn('Failed to load logger.config.json, using defaults:', err);
  }

  return defaults;
}

const config = loadConfig();

// Ensure log directory exists
if (config.file && !existsSync(config.logDir)) {
  mkdirSync(config.logDir, { recursive: true });
}

function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(config.logDir, `app-${date}.log`);
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

function getEffectiveLevel(context: string): LogLevel {
  return config.contexts[context] || config.level;
}

function shouldLog(level: LogLevel, context: string): boolean {
  const effectiveLevel = getEffectiveLevel(context);
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[effectiveLevel];
}

function writeLog(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (!shouldLog(level, context)) return;

  const formatted = formatMessage(level, context, message, data);

  // Write to file
  if (config.file) {
    try {
      appendFileSync(getLogFilePath(), formatted + '\n');
    } catch (err) {
      console.error('Failed to write log file:', err);
    }
  }

  // Write to console
  if (config.console) {
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
}

/**
 * Create a scoped logger for a specific context (e.g., 'InterviewAPI', 'Auth').
 * 
 * The log level can be configured per-context in logger.config.json:
 *   { "contexts": { "InterviewAPI": "DEBUG", "Auth": "WARN" } }
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
