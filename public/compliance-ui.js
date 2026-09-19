const $ = (selector) => document.querySelector(selector);
const reportDialog = $('#ai-report-dialog');
const reportForm = $('#ai-report-form');
let reportArea = 'account';

function openReport(area = 'account', content = '') {
  reportArea = area;
  if ($('#ai-report-content')) $('#ai-report-content').value = String(content || '').trim().slice(0, 4000);
  if ($('#ai-report-details')) $('#ai-report-details').value = '';
  if ($('#ai-report-reason')) $('#ai-report-reason').value = '';
  if ($('#ai-report-status')) $('#ai-report-status').textContent = '';
  reportDialog?.showModal();
}

$('#account-report-ai')?.addEventListener('click', () => openReport('account'));
$('#report-practice-content')?.addEventListener('click', () => openReport('practice', $('#practice-result')?.textContent || $('#practice-view')?.textContent || ''));
$('#report-camera-content')?.addEventListener('click', () => openReport('camera', $('#camera-result')?.textContent || $('#camera-view')?.textContent || ''));
$('#report-coach-content')?.addEventListener('click', () => openReport('coach', $('#coach-thread')?.textContent || ''));

reportForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = $('#ai-report-status');
  const button = reportForm.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    if (status) status.textContent = 'Enviando…';
    const response = await fetch('/api/reports/ai', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        area: reportArea,
        reason: $('#ai-report-reason')?.value || 'other',
        content: $('#ai-report-content')?.value || '',
        details: $('#ai-report-details')?.value || ''
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No pudimos enviar el reporte.');
    if (status) status.textContent = payload.message || 'Reporte enviado.';
    setTimeout(() => reportDialog?.close(), 900);
  } catch (error) {
    if (status) status.textContent = error.message;
  } finally { button.disabled = false; }
});

const disclosure = $('#data-use-dialog');
const disclosureKey = 'sinBarrerasDataUseDisclosureV160';
try {
  if (!localStorage.getItem(disclosureKey)) disclosure?.showModal();
} catch { disclosure?.showModal(); }
$('#data-use-accept')?.addEventListener('click', () => {
  try { localStorage.setItem(disclosureKey, new Date().toISOString()); } catch {}
  disclosure?.close();
});
