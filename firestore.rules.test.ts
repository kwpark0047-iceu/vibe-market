import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules includes default deny safety net', () => {
  assert.match(rulesSource, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules enforces verified users and immutable ownerUid on projects', () => {
  assert.match(rulesSource, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesSource, /incoming\(\)\.ownerUid == existing\(\)\.ownerUid/);
  assert.match(rulesSource, /incoming\(\)\.verificationStatus in \['unverified', 'pending'\]/);
});

test('firestore.rules restricts PII and list scraping', () => {
  assert.match(rulesSource, /match \/users\/\{userId\}\/private\/info/);
  assert.match(rulesSource, /allow list: if isSignedIn\(\) && \(resource\.data\.reporterUid == request\.auth\.uid \|\| isAdmin\(\)\)/);
  assert.match(rulesSource, /allow list: if isSignedIn\(\) && \(resource\.data\.claimantUid == request\.auth\.uid \|\| isAdmin\(\)\)/);
});

test('firestore.rules enforces atomic counter sync with existsAfter and getAfter', () => {
  assert.match(rulesSource, /existsAfter\(/);
  assert.match(rulesSource, /getAfter\(/);
});

test('firestore.rules validates PII-free ProjectActivity records and restricts actor spoofing', () => {
  assert.match(rulesSource, /function isValidProjectActivity\(data\)/);
  assert.match(rulesSource, /match \/projectActivities\/\{activityId\}/);
  assert.match(rulesSource, /incoming\(\)\.actorUid == request\.auth\.uid/);
  assert.match(rulesSource, /existing\(\)\.type in \['like', 'bookmark'\]/);
});

test('firestore.rules validates ProjectMilestone creator logs and enforces project ownership or admin', () => {
  assert.match(rulesSource, /function isValidProjectMilestone\(data\)/);
  assert.match(rulesSource, /match \/projectMilestones\/\{milestoneId\}/);
  assert.match(rulesSource, /incoming\(\)\.authorUid == request\.auth\.uid/);
  assert.match(rulesSource, /data\.ownerUid == request\.auth\.uid/);
  assert.match(rulesSource, /allow update: if false;/);
});

