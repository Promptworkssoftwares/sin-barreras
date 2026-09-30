import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const gradle = fs.readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8');

test('v1.7.8 keeps practice result typography compact on phones', () => {
  assert.equal(pkg.version, '1.7.21');
  assert.match(css, /v1\.7\.8 · Mobile-first compact translation and practice results/);
  assert.match(css, /\.practice-result h3 \{ margin:0; font-size:14px/);
  assert.match(css, /\.phrase-practice-card h2 \{ font-size:14px!important/);
  assert.match(css, /\.coach-bubble p \{ font-size:10px/);
  assert.match(css, /\.sound-feedback-card \{ padding:8px!important/);
  assert.match(css, /\.voice-input-signal \{ min-height:27px/);
});

test('Android release version advances without changing application package', () => {
  assert.match(gradle, /applicationId\s*=\s*['"]com\.promptworks\.sinbarreras['"]/);
  assert.match(gradle, /versionCode\s*=\s*1721/);
  assert.match(gradle, /versionName\s*=\s*['"]1\.7\.21['"]/);
});
