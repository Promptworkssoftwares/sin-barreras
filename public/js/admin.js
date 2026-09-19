const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let usersPage = 1;
let usersPages = 1;
let confirmHandler = null;

async function api(url, options = {}) {
  const response = await fetch(url, { credentials:'same-origin', ...options });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) { location.assign('/'); throw new Error('Sesión no autorizada.'); }
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la operación.');
  return payload;
}

function toast(message) {
  const node = $('#admin-toast');
  node.textContent = message; node.classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('visible'),3000);
}

function formatDate(value) { if (!value) return '—'; const date=new Date(value); return Number.isNaN(date.getTime())?'—':date.toLocaleDateString('es-US',{month:'short',day:'numeric',year:'numeric'}); }
function accessInfo(user) {
  if (user.accountStatus === 'revoked') return ['REVOCADO','revoked'];
  if (user.freeAccess) return ['GRATIS','free'];
  if (user.subscriptionStatus === 'trialing') return ['PRUEBA','trial'];
  if (user.subscriptionStatus === 'active') return ['PAGADO','paid'];
  return ['SIN ACCESO','pending'];
}
function userCell(user){ const initials=(user.name||user.email||'SB').slice(0,2).toUpperCase(); return `<div class="user-cell"><span>${initials}</span><div><strong>${escapeHtml(user.name||'Sin nombre')}</strong><small>${escapeHtml(user.email)}</small></div></div>`; }
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

const sidebar = $('#admin-sidebar');
const menuToggle = $('#admin-menu-toggle');
const menuClose = $('#admin-menu-close');
const backdrop = $('#admin-sidebar-backdrop');

function setMenuState(open) {
  if (!sidebar || !menuToggle || !backdrop) return;
  const mobile = window.matchMedia('(max-width: 1000px)').matches;
  if (!mobile) {
    document.body.classList.remove('admin-menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    return;
  }
  document.body.classList.toggle('admin-menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  backdrop.hidden = !open;
}

function closeMenu() { setMenuState(false); }
function openMenu() { setMenuState(true); }

async function loadMe(){ const result=await api('/api/auth/me'); const user=result.user; if(!user||user.role!=='owner') return location.assign('/'); $('#admin-name').textContent=user.name||'Owner'; $('#admin-email').textContent=user.email; const avatar=$('#admin-avatar'); avatar.innerHTML=user.avatarUrl?`<img src="${escapeHtml(user.avatarUrl)}" alt="">`:(user.name||user.email||'SB').slice(0,2).toUpperCase(); }
async function loadStats(){
  const s=await api('/api/admin/stats');
  $('#stat-users').textContent=s.totalUsers;
  $('#stat-paid').textContent=s.activePaid;
  if ($('#stat-trials')) $('#stat-trials').textContent=s.activeTrials || 0;
  $('#stat-free').textContent=s.freeUsers;
  $('#stat-mrr').textContent=`$${Number(s.revenue?.grossMrrUsd ?? s.monthlyRevenue ?? 0).toFixed(2)}`;
  $('#stat-ai-cost').textContent=`$${Number(s.aiCostMonthUsd||0).toFixed(3)}`;
  $('#stat-margin').textContent=`$${Number(s.estimatedGrossMarginUsd||0).toFixed(2)}`;
  $('#stat-stripe-mrr').textContent=`$${Number(s.revenue?.stripeMrrUsd||0).toFixed(2)}`;
  $('#stat-play-mrr').textContent=`$${Number(s.revenue?.googlePlayMrrUsd||0).toFixed(2)}`;
  $('#stat-revoked').textContent=s.revoked;
  $('#stat-grants').textContent=s.grants;
}
async function loadRecent(){ const data=await api('/api/admin/users?limit=6&page=1'); $('#recent-users').innerHTML=data.items.length?data.items.map(user=>{const [label,cls]=accessInfo(user);return `<tr><td>${userCell(user)}</td><td><span class="badge ${cls}">${label}</span></td><td>${escapeHtml(user.subscriptionStatus||'none')}</td><td>${formatDate(user.createdAt)}</td></tr>`}).join(''):`<tr><td colspan="4">No hay usuarios todavía.</td></tr>`; }
function providerLabel(provider) {
  if (provider === 'google_play') return 'GOOGLE PLAY';
  if (provider === 'stripe') return 'STRIPE';
  return '—';
}
async function loadUsers(){
  const q=encodeURIComponent($('#user-search').value.trim());
  const status=encodeURIComponent($('#user-filter').value);
  const data=await api(`/api/admin/users?page=${usersPage}&limit=20&q=${q}&status=${status}`);
  usersPages=data.pages;
  $('#users-page').textContent=`Página ${data.page} de ${data.pages}`;
  $('#users-prev').disabled=data.page<=1;
  $('#users-next').disabled=data.page>=data.pages;
  $('#users-table').innerHTML=data.items.length?data.items.map(user=>{
    const [label,cls]=accessInfo(user);
    const provider=providerLabel(user.billingProvider);
    const revoke=user.accountStatus==='revoked'
      ?`<button data-action="restore" data-id="${user.id}">Restaurar</button>`
      :`<button data-action="revoke" data-id="${user.id}" data-provider="${escapeHtml(user.billingProvider||'none')}">Revocar</button>`;
    const cancel=['active','trialing'].includes(user.subscriptionStatus) && !user.cancelAtPeriodEnd
      ?`<button data-action="cancel" data-id="${user.id}" data-provider="${escapeHtml(user.billingProvider||'none')}">Cancelar sub.</button>`:'';
    return `<tr><td>${userCell(user)}</td><td><span class="badge ${cls}">${label}</span></td><td><strong>${escapeHtml(user.subscriptionStatus||'none')}</strong><small class="provider-note">${provider}${user.cancelAtPeriodEnd?' · CANCELA AL FINAL':''}</small></td><td>${formatDate(user.lastLoginAt)}</td><td><div class="action-menu">${revoke}${cancel}<button class="danger" data-action="delete" data-id="${user.id}" data-provider="${escapeHtml(user.billingProvider||'none')}">Eliminar</button></div></td></tr>`;
  }).join(''):`<tr><td colspan="5">No se encontraron usuarios.</td></tr>`;
}
async function loadSubscriptions(){
  const data=await api('/api/admin/users?status=paid&limit=50&page=1');
  $('#subscriptions-table').innerHTML=data.items.length?data.items.map(user=>{
    const provider=providerLabel(user.billingProvider);
    const action=user.cancelAtPeriodEnd
      ?'<span class="provider-note">Cancelación programada</span>'
      :`<button data-sub-cancel="${user.id}" data-provider="${escapeHtml(user.billingProvider||'none')}">Cancelar suscripción</button>`;
    return `<tr><td>${userCell(user)}</td><td><span class="badge paid">${escapeHtml(user.subscriptionStatus.toUpperCase())}</span><small class="provider-note">${provider}</small></td><td>${formatDate(user.currentPeriodEnd)}</td><td>${user.accountStatus==='active'?'Activa':'Revocada'}</td><td><div class="action-menu">${action}</div></td></tr>`;
  }).join(''):`<tr><td colspan="5">No hay suscripciones activas.</td></tr>`;
}
async function loadGrants(){ const data=await api('/api/admin/grants'); $('#grants-grid').innerHTML=data.items.length?data.items.map(grant=>`<article class="grant-item"><div class="grant-item-head"><strong>${escapeHtml(grant.email)}</strong><button data-grant-delete="${grant._id}">REVOCAR</button></div><p>${escapeHtml(grant.note||'Acceso gratuito otorgado por el owner.')}</p><small>${grant.claimedBy?'CUENTA VINCULADA':'ESPERANDO REGISTRO'} · ${formatDate(grant.createdAt)}</small></article>`).join(''):`<article class="grant-item"><strong>No hay emails con acceso gratuito.</strong><p>Añade uno arriba para preautorizarlo.</p></article>`; }


async function loadUsage(){
  const data=await api('/api/admin/usage?days=30');
  const totals=data.totals||{};
  $('#usage-requests').textContent=Number(totals.featureRequests||0).toLocaleString();
  $('#usage-calls').textContent=Number(totals.openAiCalls||0).toLocaleString();
  $('#usage-minutes').textContent=(Number(totals.transcriptionSeconds||0)/60).toFixed(1);
  $('#usage-cost').textContent=`$${Number(totals.estimatedCostUsd||0).toFixed(3)}`;
  const rows=[...(data.daily||[])].reverse();
  $('#usage-table').innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(row.date)}</td><td>${Number(row.featureRequests||0).toLocaleString()}</td><td>${Number(row.openAiCalls||0).toLocaleString()}</td><td>${Number((row.inputTokens||0)+(row.outputTokens||0)).toLocaleString()}</td><td>${(Number(row.transcriptionSeconds||0)/60).toFixed(1)} min</td><td>${Number(row.ttsCharacters||0).toLocaleString()}</td><td>$${Number(row.estimatedCostUsd||0).toFixed(4)}</td></tr>`).join(''):`<tr><td colspan="7">Todavía no hay consumo de IA registrado.</td></tr>`;
}

async function loadAiReports(){
  const filter=$('#report-filter')?.value || 'open';
  const data=await api(`/api/admin/reports/ai?status=${encodeURIComponent(filter)}`);
  const body=$('#reports-table');
  if(!body) return;
  body.innerHTML=data.items?.length?data.items.map(item=>`<tr><td>${formatDate(item.createdAt)}</td><td>${escapeHtml(item.user?.email||'Usuario eliminado')}</td><td>${escapeHtml(item.area||'other')}</td><td>${escapeHtml(item.reason||'other')}</td><td><div class="report-content">${escapeHtml(item.content||item.details||'—')}</div></td><td><div class="action-menu"><button data-report-ai="${item._id}" data-status="reviewed">Revisado</button><button data-report-ai="${item._id}" data-status="dismissed">Descartar</button></div></td></tr>`).join(''):`<tr><td colspan="6">No hay reportes en este estado.</td></tr>`;
}

async function loadConversationReports(){
  const filter=$('#conversation-report-filter')?.value || 'open';
  const data=await api(`/api/admin/reports/conversations?status=${encodeURIComponent(filter)}`);
  const body=$('#conversation-reports-table');
  if(!body) return;
  body.innerHTML=data.items?.length?data.items.map(item=>`<tr><td>${formatDate(item.createdAt)}</td><td>${escapeHtml(item.roomCode||'—')}</td><td>${escapeHtml(item.hostUser?.email||'Usuario eliminado')}</td><td>${escapeHtml(item.reporterRole)} → ${escapeHtml(item.reportedRole)}</td><td>${escapeHtml(item.reason||'other')}</td><td><div class="report-content">${escapeHtml(item.content||'—')}</div></td><td><div class="action-menu"><button data-report-conversation="${item._id}" data-status="reviewed">Revisado</button><button data-report-conversation="${item._id}" data-status="dismissed">Descartar</button></div></td></tr>`).join(''):`<tr><td colspan="7">No hay reportes en este estado.</td></tr>`;
}
function showSection(name){ $$('.admin-section').forEach(section=>section.classList.toggle('is-hidden',section.id!==`${name}-section`)); $$('.side-link').forEach(button=>button.classList.toggle('is-active',button.dataset.section===name)); const titles={overview:'Control del SaaS',users:'Usuarios',grants:'Acceso gratuito',subscriptions:'Suscripciones',usage:'Uso y costo de IA',reports:'Reportes de IA','conversation-reports':'Reportes QR'}; $('#page-title').textContent=titles[name]||'Control del SaaS'; if(name==='users')loadUsers(); if(name==='grants')loadGrants(); if(name==='subscriptions')loadSubscriptions(); if(name==='usage')loadUsage(); if(name==='reports')loadAiReports(); if(name==='conversation-reports')loadConversationReports(); closeMenu(); }
function askConfirm(title,copy,handler){ $('#confirm-title').textContent=title; $('#confirm-copy').textContent=copy; confirmHandler=handler; $('#confirm-dialog').showModal(); }
async function createGrant(email,note){ await api('/api/admin/grants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,note})}); toast(`Acceso gratuito preparado para ${email}`); await Promise.all([loadStats(),loadGrants(),loadUsers().catch(()=>{})]); }

$$('.side-link').forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.section)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.go)));
$('#quick-grant-form').addEventListener('submit',async e=>{e.preventDefault();try{await createGrant($('#quick-grant-email').value,$('#quick-grant-note').value);e.target.reset();}catch(err){toast(err.message);}});
$('#grant-form').addEventListener('submit',async e=>{e.preventDefault();try{await createGrant($('#grant-email').value,$('#grant-note').value);e.target.reset();}catch(err){toast(err.message);}});
$('#grants-grid').addEventListener('click',e=>{const b=e.target.closest('[data-grant-delete]');if(!b)return;askConfirm('¿Revocar acceso gratuito?','Si la persona no tiene una suscripción pagada, perderá acceso a la app.',async()=>{await api(`/api/admin/grants/${b.dataset.grantDelete}`,{method:'DELETE'});toast('Acceso gratuito revocado.');await Promise.all([loadGrants(),loadStats()]);});});
$('#users-table').addEventListener('click',e=>{
  const b=e.target.closest('[data-action]'); if(!b)return;
  const id=b.dataset.id,action=b.dataset.action,provider=b.dataset.provider||'none';
  if(action==='restore') return api(`/api/admin/users/${id}/restore`,{method:'PATCH'}).then(()=>{toast('Usuario restaurado.');loadUsers();loadStats();});
  if(action==='revoke') askConfirm('¿Revocar acceso?','El usuario no podrá entrar a Sin Barreras hasta que lo restaures. Esto no cancela automáticamente su cobro recurrente.',async()=>{await api(`/api/admin/users/${id}/revoke`,{method:'PATCH'});toast('Acceso revocado.');await Promise.all([loadUsers(),loadStats()]);});
  if(action==='cancel') askConfirm('¿Cancelar suscripción?',provider==='google_play'?'Google Play detendrá la próxima renovación. El usuario conserva acceso hasta el final del período pagado.':'Stripe programará la suscripción para terminar al final del período pagado.',async()=>{await api(`/api/admin/users/${id}/cancel-subscription`,{method:'POST'});toast('Cancelación programada al final del período.');await Promise.all([loadUsers(),loadStats(),loadSubscriptions().catch(()=>{})]);});
  if(action==='delete') askConfirm('¿Eliminar usuario permanentemente?',provider==='google_play'?'Se revocará la suscripción de Google Play con reembolso proporcional del tiempo restante y se borrarán la cuenta y su progreso. Esta acción no se puede deshacer.':'Se cancelará cualquier suscripción activa y se borrarán su cuenta y progreso. Esta acción no se puede deshacer.',async()=>{await api(`/api/admin/users/${id}`,{method:'DELETE'});toast('Usuario eliminado.');await Promise.all([loadUsers(),loadStats()]);});
});
$('#subscriptions-table').addEventListener('click',e=>{
  const b=e.target.closest('[data-sub-cancel]'); if(!b)return;
  const provider=b.dataset.provider||'none';
  askConfirm('¿Cancelar esta suscripción?',provider==='google_play'?'Google Play detendrá la próxima renovación y mantendrá acceso hasta la fecha pagada.':'La suscripción de Stripe quedará programada para finalizar al terminar el período pagado.',async()=>{await api(`/api/admin/users/${b.dataset.subCancel}/cancel-subscription`,{method:'POST'});toast('Cancelación programada al final del período.');await Promise.all([loadSubscriptions(),loadStats(),loadUsers().catch(()=>{})]);});
});

$('#report-filter')?.addEventListener('change',loadAiReports);
$('#conversation-report-filter')?.addEventListener('change',loadConversationReports);
$('#reports-table')?.addEventListener('click',async e=>{const b=e.target.closest('[data-report-ai]');if(!b)return;try{await api(`/api/admin/reports/ai/${b.dataset.reportAi}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:b.dataset.status})});toast('Reporte actualizado.');await loadAiReports();}catch(err){toast(err.message);}});
$('#conversation-reports-table')?.addEventListener('click',async e=>{const b=e.target.closest('[data-report-conversation]');if(!b)return;try{await api(`/api/admin/reports/conversations/${b.dataset.reportConversation}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:b.dataset.status})});toast('Reporte actualizado.');await loadConversationReports();}catch(err){toast(err.message);}});
$('#confirm-action').addEventListener('click',()=>{const handler=confirmHandler;confirmHandler=null;if(handler)setTimeout(()=>handler().catch(err=>toast(err.message)),0);});
let searchTimer;$('#user-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{usersPage=1;loadUsers();},300)});$('#user-filter').addEventListener('change',()=>{usersPage=1;loadUsers();});$('#users-prev').addEventListener('click',()=>{if(usersPage>1){usersPage--;loadUsers();}});$('#users-next').addEventListener('click',()=>{if(usersPage<usersPages){usersPage++;loadUsers();}});
$('#admin-logout').addEventListener('click',async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});location.assign('/');});
menuToggle?.addEventListener('click',()=>{document.body.classList.contains('admin-menu-open') ? closeMenu() : openMenu();});
menuClose?.addEventListener('click',closeMenu);
backdrop?.addEventListener('click',closeMenu);
window.addEventListener('resize',closeMenu);
document.addEventListener('keydown',event=>{ if(event.key==='Escape') closeMenu(); });

await loadMe();
await Promise.all([loadStats(),loadRecent(),loadGrants()]);
