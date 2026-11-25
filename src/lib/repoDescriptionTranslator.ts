import type { AppLanguage } from '../types/vibeatlas';

const HANGUL_RE = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;
const KANA_RE = /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/g;
const HAN_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

/**
 * Determines whether a GitHub repository description needs translation into `targetLanguage`.
 * Avoids redundant API calls when text is already written in the target script.
 */
export function needsDescriptionTranslation(text: string, targetLanguage: AppLanguage): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const hangulCount = (trimmed.match(HANGUL_RE) ?? []).length;
  const kanaCount = (trimmed.match(KANA_RE) ?? []).length;
  const hanCount = (trimmed.match(HAN_RE) ?? []).length;

  switch (targetLanguage) {
    case 'ko':
      // Already predominantly Korean if Hangul characters appear without untranslated prose dominance
      return hangulCount < 2;
    case 'ja':
      // Japanese typically contains Hiragana/Katakana alongside Kanji
      return kanaCount === 0;
    case 'zh':
      // Simplified/Traditional Chinese uses Hanzi without Hangul or Kana
      return !(hanCount >= 2 && hangulCount === 0 && kanaCount === 0);
    case 'en':
      // Needs translation to English only if it contains Korean, Japanese Kana, or Chinese characters
      return hangulCount > 0 || kanaCount > 0 || hanCount > 0;
    default:
      return false;
  }
}

export function chunkTranslationItems<T>(
  items: ReadonlyArray<T>,
  batchSize: number = 25
): T[][] {
  const size = Math.max(1, Math.floor(batchSize));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function resolveDisplayedRepoDescription(params: {
  repoId: number;
  originalDescription: string;
  targetLanguage: AppLanguage;
  translationsMap?: Readonly<Record<number, string>>;
  showOriginal?: boolean;
}): { text: string; isTranslated: boolean; hasTranslation: boolean } {
  const original = params.originalDescription || '';
  const translated = params.translationsMap?.[params.repoId]?.trim() || '';
  const hasTranslation = Boolean(translated) && translated !== original.trim();

  if (!hasTranslation || params.showOriginal) {
    return {
      text: original,
      isTranslated: false,
      hasTranslation,
    };
  }

  return {
    text: translated,
    isTranslated: true,
    hasTranslation: true,
  };
}

export interface ParsedTranslationRow {
  id: string;
  translatedText: string;
}

/**
 * Parses Gemini structured JSON batch output, stripping optional markdown code fences.
 */
export function parseTranslationBatchResponse(rawText: string | undefined): ParsedTranslationRow[] {
  const cleaned = (rawText ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) return [];

  const parsed = JSON.parse(cleaned) as unknown;
  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)
      ? (parsed as { items: unknown[] }).items
      : [];

  const normalized: ParsedTranslationRow[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Record<string, unknown>;
    const id =
      typeof rec.id === 'string' || typeof rec.id === 'number' ? String(rec.id).trim() : '';
    const translatedText =
      typeof rec.translatedText === 'string' ? rec.translatedText.trim() : '';
    if (id && translatedText) {
      normalized.push({ id, translatedText });
    }
  }
  return normalized;
}

export function extractTranslationErrorDetails(err: unknown): {
  status: number;
  message: string;
} {
  const rawMessage = err instanceof Error ? err.message : String(err || 'Translation request failed.');
  const rawStatus =
    typeof (err as { status?: unknown })?.status === 'number'
      ? (err as { status: number }).status
      : typeof (err as { code?: unknown })?.code === 'number'
        ? (err as { code: number }).code
        : NaN;

  if (Number.isFinite(rawStatus) && rawStatus >= 400 && rawStatus < 600) {
    return { status: rawStatus, message: rawMessage };
  }

  const embeddedCodeMatch = rawMessage.match(/"code"\s*:\s*(\d{3})/);
  if (embeddedCodeMatch) {
    const parsedCode = Number(embeddedCodeMatch[1]);
    if (parsedCode >= 400 && parsedCode < 600) {
      return { status: parsedCode, message: rawMessage };
    }
  }

  if (/RESOURCE_EXHAUSTED|\b429\b/i.test(rawMessage)) {
    return { status: 429, message: rawMessage };
  }
  if (/UNAVAILABLE|\b503\b|high demand/i.test(rawMessage)) {
    return { status: 503, message: rawMessage };
  }
  if (/TIMEOUT|timed out|AbortError|ETIMEDOUT/i.test(rawMessage)) {
    return { status: 504, message: rawMessage };
  }

  return { status: 502, message: rawMessage };
}

export function isRetryableTranslationError(err: unknown): boolean {
  const { status, message } = extractTranslationErrorDetails(err);
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|timed out|ETIMEDOUT|ECONNRESET|fetch failed|AbortError/i.test(
    message
  );
}

export interface TranslationExecutionResult<T> {
  value: T;
  modelUsed: string;
}

/**
 * Executes a translation call across prioritized Gemini models with exponential backoff on transient failures.
 */
export async function executeTranslationWithFallback<T>(params: {
  models: ReadonlyArray<string>;
  runAttempt: (model: string, attemptIndex: number) => Promise<T>;
  maxRetriesPerModel?: number;
  baseDelayMs?: number;
  delayFn?: (ms: number) => Promise<void>;
}): Promise<TranslationExecutionResult<T>> {
  const {
    models,
    runAttempt,
    maxRetriesPerModel = 1,
    baseDelayMs = 350,
    delayFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = params;

  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt += 1) {
      try {
        const value = await runAttempt(model, attempt);
        return { value, modelUsed: model };
      } catch (err) {
        lastError = err;
        const retryable = isRetryableTranslationError(err);
        if (!retryable) {
          throw err;
        }
        if (attempt < maxRetriesPerModel) {
          const waitMs = Math.max(0, baseDelayMs * Math.pow(2, attempt));
          if (waitMs > 0) {
            await delayFn(waitMs);
          }
        }
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All translation model attempts failed.');
}

