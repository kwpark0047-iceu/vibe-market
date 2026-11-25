import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkTranslationItems,
  executeTranslationWithFallback,
  extractTranslationErrorDetails,
  isRetryableTranslationError,
  needsDescriptionTranslation,
  parseTranslationBatchResponse,
  resolveDisplayedRepoDescription,
} from './repoDescriptionTranslator';

test('needsDescriptionTranslation detects script coverage for ko, en, zh, ja cleanly', () => {
  const englishDesc = 'Official TypeScript SDK for AI agents and MCP tools.';
  const koreanDesc = 'AI 에이전트와 MCP 도구를 위한 공식 TypeScript SDK입니다.';
  const japaneseDesc = 'AIエージェントとMCPツールのための公式TypeScript SDKです。';
  const chineseDesc = '用于构建人工智能代理和工具链的开源框架。';

  assert.equal(needsDescriptionTranslation('', 'ko'), false);
  assert.equal(needsDescriptionTranslation(englishDesc, 'en'), false);
  assert.equal(needsDescriptionTranslation(englishDesc, 'ko'), true);
  assert.equal(needsDescriptionTranslation(englishDesc, 'zh'), true);
  assert.equal(needsDescriptionTranslation(englishDesc, 'ja'), true);

  assert.equal(needsDescriptionTranslation(koreanDesc, 'ko'), false);
  assert.equal(needsDescriptionTranslation(koreanDesc, 'en'), true);

  assert.equal(needsDescriptionTranslation(japaneseDesc, 'ja'), false);
  assert.equal(needsDescriptionTranslation(japaneseDesc, 'zh'), true);

  assert.equal(needsDescriptionTranslation(chineseDesc, 'zh'), false);
  assert.equal(needsDescriptionTranslation(chineseDesc, 'ja'), true);
  assert.equal(needsDescriptionTranslation(chineseDesc, 'en'), true);
});

test('chunkTranslationItems groups arrays into bounded batches safely', () => {
  const items = Array.from({ length: 6 }, (_, i) => i + 1);
  assert.deepEqual(chunkTranslationItems(items, 2), [
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
  assert.deepEqual(chunkTranslationItems(items, 4), [
    [1, 2, 3, 4],
    [5, 6],
  ]);
  assert.deepEqual(chunkTranslationItems([], 25), []);
});

test('resolveDisplayedRepoDescription selects translated text when available and respects showOriginal', () => {
  const translatedResult = resolveDisplayedRepoDescription({
    repoId: 101,
    originalDescription: 'Command-line fuzzy finder',
    targetLanguage: 'ja',
    translationsMap: { 101: 'コマンドライン用ファジーファインダー' },
  });
  assert.deepEqual(translatedResult, {
    text: 'コマンドライン用ファジーファインダー',
    isTranslated: true,
    hasTranslation: true,
  });

  const originalToggleResult = resolveDisplayedRepoDescription({
    repoId: 101,
    originalDescription: 'Command-line fuzzy finder',
    targetLanguage: 'ja',
    translationsMap: { 101: 'コマンドライン用ファジーファインダー' },
    showOriginal: true,
  });
  assert.deepEqual(originalToggleResult, {
    text: 'Command-line fuzzy finder',
    isTranslated: false,
    hasTranslation: true,
  });

  const fallbackResult = resolveDisplayedRepoDescription({
    repoId: 202,
    originalDescription: 'Fast web framework',
    targetLanguage: 'zh',
    translationsMap: {},
  });
  assert.deepEqual(fallbackResult, {
    text: 'Fast web framework',
    isTranslated: false,
    hasTranslation: false,
  });
});

test('parseTranslationBatchResponse handles plain JSON, markdown code fences, and object wrappers', () => {
  assert.deepEqual(
    parseTranslationBatchResponse('[{"id":1,"translatedText":"빠른 UI 라이브러리"},{"id":"2","translatedText":""}]'),
    [{ id: '1', translatedText: '빠른 UI 라이브러리' }]
  );

  assert.deepEqual(
    parseTranslationBatchResponse('```json\n[{"id":"10","translatedText":"高速なフレームワーク"}]\n```'),
    [{ id: '10', translatedText: '高速なフレームワーク' }]
  );

  assert.deepEqual(
    parseTranslationBatchResponse('{"items":[{"id":"7","translatedText":"开源工具"}]}'),
    [{ id: '7', translatedText: '开源工具' }]
  );

  assert.deepEqual(parseTranslationBatchResponse(''), []);
});

test('extractTranslationErrorDetails & isRetryableTranslationError distinguish transient 503/429 from auth 403', () => {
  const embedded503 = new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}');
  assert.equal(extractTranslationErrorDetails(embedded503).status, 503);
  assert.equal(isRetryableTranslationError(embedded503), true);

  const auth403 = Object.assign(new Error('PERMISSION_DENIED'), { status: 403 });
  assert.equal(extractTranslationErrorDetails(auth403).status, 403);
  assert.equal(isRetryableTranslationError(auth403), false);

  const rateLimit429 = new Error('429 RESOURCE_EXHAUSTED');
  assert.equal(extractTranslationErrorDetails(rateLimit429).status, 429);
  assert.equal(isRetryableTranslationError(rateLimit429), true);
});

test('executeTranslationWithFallback retries transient 503 and falls back to secondary Gemini model', async () => {
  const visited: string[] = [];
  const result = await executeTranslationWithFallback({
    models: ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'],
    maxRetriesPerModel: 1,
    baseDelayMs: 0,
    delayFn: async () => {},
    runAttempt: async (model, attempt) => {
      visited.push(`${model}:${attempt}`);
      if (model === 'gemini-4-hydrogen') {
        throw new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}');
      }
      return [{ id: '1', translatedText: '성공' }];
    },
  });

  assert.equal(result.modelUsed, 'gemini-3.1-flash-lite');
  assert.deepEqual(result.value, [{ id: '1', translatedText: '성공' }]);
  assert.deepEqual(visited, [
    'gemini-4-hydrogen:0',
    'gemini-4-hydrogen:1',
    'gemini-3.1-flash-lite:0',
  ]);
});

test('executeTranslationWithFallback aborts immediately on non-retryable 403 error', async () => {
  const visited: string[] = [];
  await assert.rejects(
    () =>
      executeTranslationWithFallback({
        models: ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'],
        maxRetriesPerModel: 2,
        baseDelayMs: 0,
        delayFn: async () => {},
        runAttempt: async (model, attempt) => {
          visited.push(`${model}:${attempt}`);
          throw Object.assign(new Error('API_KEY_INVALID'), { status: 403 });
        },
      }),
    /API_KEY_INVALID/
  );
  assert.deepEqual(visited, ['gemini-4-hydrogen:0']);
});

