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
  if (['active','trialing'].includes(user.subscriptionStatus)) return ['PAGADO','paid'];
  return ['SIN ACCESO','pending'];
}
function userCell(user){ const initials=(user.name||user.email||'SB').slice(0,2).toUpperCase(); return `<div class="user-cell"><span>${initials}</span><div><strong>${escapeHtml(user.name||'Sin nombre')}</strong><small>${escapeHtml(user.email)}</small></div></div>`; }
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

async function loadMe(){ const result=await api('/api/auth/me'); const user=result.user; if(!user||user.role!=='owner') return location.assign('/'); $('#admin-name').textContent=user.name||'Owner'; $('#admin-email').textContent=user.email; const avatar=$('#admin-avatar'); avatar.innerHTML=user.avatarUrl?`<img src="${escapeHtml(user.avatarUrl)}" alt="">`:(user.name||user.email||'SB').slice(0,2).toUpperCase(); }
async function loadStats(){ const s=await api('/api/admin/stats'); $('#stat-users').textContent=s.totalUsers; $('#stat-paid').textContent=s.activePaid; $('#stat-free').textContent=s.freeUsers; $('#stat-mrr').textContent=`$${Number(s.monthlyRevenue).toFixed(2)}`; $('#stat-revoked').textContent=s.revoked; $('#stat-grants').textContent=s.grants; }
async function loadRecent(){ const data=await api('/api/admin/users?limit=6&page=1'); $('#recent-users').innerHTML=data.items.length?data.items.map(user=>{const [label,cls]=accessInfo(user);return `<tr><td>${userCell(user)}</td><td><span class="badge ${cls}">${label}</span></td><td>${escapeHtml(user.subscriptionStatus||'none')}</td><td>${formatDate(user.createdAt)}</td></tr>`}).join(''):`<tr><td colspan="4">No hay usuarios todavía.</td></tr>`; }
async function loadUsers(){ const q=encodeURIComponent($('#user-search').value.trim()); const status=encodeURIComponent($('#user-filter').value); const data=await api(`/api/admin/users?page=${usersPage}&limit=20&q=${q}&status=${status}`); usersPages=data.pages; $('#users-page').textContent=`Página ${data.page} de ${data.pages}`; $('#users-prev').disabled=data.page<=1; $('#users-next').disabled=data.page>=data.pages; $('#users-table').innerHTML=data.items.length?data.items.map(user=>{const [label,cls]=accessInfo(user);const revoke=user.accountStatus==='revoked'?`<button data-action="restore" data-id="${user.id}">Restaurar</button>`:`<button data-action="revoke" data-id="${user.id}">Revocar</button>`;const cancel=['active','trialing','past_due'].includes(user.subscriptionStatus)?`<button data-action="cancel" data-id="${user.id}">Cancelar sub.</button>`:'';return `<tr><td>${userCell(user)}</td><td><span class="badge ${cls}">${label}</span></td><td>${escapeHtml(user.subscriptionStatus||'none')}</td><td>${formatDate(user.lastLoginAt)}</td><td><div class="action-menu">${revoke}${cancel}<button class="danger" data-action="delete" data-id="${user.id}">Eliminar</button></div></td></tr>`}).join(''):`<tr><td colspan="5">No se encontraron usuarios.</td></tr>`; }
async function loadSubscriptions(){ const data=await api('/api/admin/users?status=paid&limit=50&page=1'); $('#subscriptions-table').innerHTML=data.items.length?data.items.map(user=>`<tr><td>${userCell(user)}</td><td><span class="badge paid">${escapeHtml(user.subscriptionStatus.toUpperCase())}</span></td><td>${formatDate(user.currentPeriodEnd)}</td><td>${user.accountStatus==='active'?'Activa':'Revocada'}</td><td><div class="action-menu"><button data-sub-cancel="${user.id}">Cancelar suscripción</button></div></td></tr>`).join(''):`<tr><td colspan="5">No hay suscripciones activas.</td></tr>`; }
async function loadGrants(){ const data=await api('/api/admin/grants'); $('#grants-grid').innerHTML=data.items.length?data.items.map(grant=>`<article class="grant-item"><div class="grant-item-head"><strong>${escapeHtml(grant.email)}</strong><button data-grant-delete="${grant._id}">REVOCAR</button></div><p>${escapeHtml(grant.note||'Acceso gratuito otorgado por el owner.')}</p><small>${grant.claimedBy?'CUENTA VINCULADA':'ESPERANDO REGISTRO'} · ${formatDate(grant.createdAt)}</small></article>`).join(''):`<article class="grant-item"><strong>No hay emails con acceso gratuito.</strong><p>Añade uno arriba para preautorizarlo.</p></article>`; }

function setMobileMenuState(isOpen){
  const sidebar = $('#admin-sidebar');
  const backdrop = $('#admin-backdrop');
  const isMobile = window.innerWidth <= 900;
  if (!sidebar || !backdrop) return;

  if (!isMobile) {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    document.body.classList.remove('admin-menu-open');
    return;
  }

  sidebar.classList.toggle('is-open', isOpen);
  backdrop.classList.toggle('is-visible', isOpen);
  document.body.classList.toggle('admin-menu-open', isOpen);
}

function closeMobileMenu(){ setMobileMenuState(false); }

function showSection(name){ $$('.admin-section').forEach(section=>section.classList.toggle('is-hidden',section.id!==`${name}-section`)); $$('.side-link').forEach(button=>button.classList.toggle('is-active',button.dataset.section===name)); const titles={overview:'Control del SaaS',users:'Usuarios',grants:'Acceso gratuito',subscriptions:'Suscripciones'}; $('#page-title').textContent=titles[name]||'Control del SaaS'; if(name==='users')loadUsers(); if(name==='grants')loadGrants(); if(name==='subscriptions')loadSubscriptions(); closeMobileMenu(); }
function askConfirm(title,copy,handler){ $('#confirm-title').textContent=title; $('#confirm-copy').textContent=copy; confirmHandler=handler; $('#confirm-dialog').showModal(); }
async function createGrant(email,note){ await api('/api/admin/grants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,note})}); toast(`Acceso gratuito preparado para ${email}`); await Promise.all([loadStats(),loadGrants(),loadUsers().catch(()=>{})]); }

$('#admin-open-menu').addEventListener('click',()=>setMobileMenuState(true));
$('#admin-close-menu').addEventListener('click',closeMobileMenu);
$('#admin-backdrop').addEventListener('click',closeMobileMenu);
window.addEventListener('resize',()=>setMobileMenuState(false));

$$('.side-link').forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.section)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.go)));
$('#quick-grant-form').addEventListener('submit',async e=>{e.preventDefault();try{await createGrant($('#quick-grant-email').value,$('#quick-grant-note').value);e.target.reset();}catch(err){toast(err.message);}});
$('#grant-form').addEventListener('submit',async e=>{e.preventDefault();try{await createGrant($('#grant-email').value,$('#grant-note').value);e.target.reset();}catch(err){toast(err.message);}});
$('#grants-grid').addEventListener('click',e=>{const b=e.target.closest('[data-grant-delete]');if(!b)return;askConfirm('¿Revocar acceso gratuito?','Si la persona no tiene una suscripción pagada, perderá acceso a la app.',async()=>{await api(`/api/admin/grants/${b.dataset.grantDelete}`,{method:'DELETE'});toast('Acceso gratuito revocado.');await Promise.all([loadGrants(),loadStats()]);});});
$('#users-table').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id,action=b.dataset.action;if(action==='restore')return api(`/api/admin/users/${id}/restore`,{method:'PATCH'}).then(()=>{toast('Usuario restaurado.');loadUsers();loadStats();});if(action==='revoke')askConfirm('¿Revocar acceso?','El usuario no podrá entrar a Sin Barreras hasta que lo restaures. La suscripción de Stripe no se cancela automáticamente.',async()=>{await api(`/api/admin/users/${id}/revoke`,{method:'PATCH'});toast('Acceso revocado.');await Promise.all([loadUsers(),loadStats()]);});if(action==='cancel')askConfirm('¿Cancelar suscripción?','La suscripción quedará programada para terminar al final del período pagado. El usuario conserva acceso hasta esa fecha.',async()=>{await api(`/api/admin/users/${id}/cancel-subscription`,{method:'POST'});toast('Cancelación programada al final del período.');await Promise.all([loadUsers(),loadStats()]);});if(action==='delete')askConfirm('¿Eliminar usuario permanentemente?','Se cancelará cualquier suscripción activa y se borrarán su cuenta y progreso. Esta acción no se puede deshacer.',async()=>{await api(`/api/admin/users/${id}`,{method:'DELETE'});toast('Usuario eliminado.');await Promise.all([loadUsers(),loadStats()]);});});
$('#subscriptions-table').addEventListener('click',e=>{const b=e.target.closest('[data-sub-cancel]');if(!b)return;askConfirm('¿Cancelar esta suscripción?','La suscripción quedará programada para finalizar al terminar el período ya pagado.',async()=>{await api(`/api/admin/users/${b.dataset.subCancel}/cancel-subscription`,{method:'POST'});toast('Cancelación programada al final del período.');await Promise.all([loadSubscriptions(),loadStats()]);});});
$('#confirm-action').addEventListener('click',()=>{const handler=confirmHandler;confirmHandler=null;if(handler)setTimeout(()=>handler().catch(err=>toast(err.message)),0);});
let searchTimer;$('#user-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{usersPage=1;loadUsers();},300)});$('#user-filter').addEventListener('change',()=>{usersPage=1;loadUsers();});$('#users-prev').addEventListener('click',()=>{if(usersPage>1){usersPage--;loadUsers();}});$('#users-next').addEventListener('click',()=>{if(usersPage<usersPages){usersPage++;loadUsers();}});
$('#admin-logout').addEventListener('click',async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});location.assign('/');});

await loadMe();
await Promise.all([loadStats(),loadRecent(),loadGrants()]);
