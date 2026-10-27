import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { api, escapeHtml as e } from './api.js';
import { showForm } from './new-shortcut.js';
import { renderAdminLogin } from './admin-login.js';
import './style.css';
import { showEditForm } from './edit-shortcut.js';

const app = document.querySelector('#app');
let navigation = 0;

const authStatus = document.createElement('div');
authStatus.id = 'auth-status';
app.before(authStatus);

async function updateAuthStatus() {
  try {
    const response = await fetch('/api/admin/me');
    const { isAdmin } = await response.json();
    if (isAdmin) {
      authStatus.innerHTML = `
        <span class="admin-badge">Connecté en tant qu’Admin</span>
        <button id="logout" type="button" class="btn">Déconnexion</button>`;
      document.querySelector('#logout').addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        location.hash = '#/';
        route();
      });
    } else {
      authStatus.innerHTML = '<a class="btn" href="#/admin">Connexion administrateur</a>';
    }
    return isAdmin;
  } catch {
    authStatus.textContent = '';
    return false;
  }
}

function showIndex(shortcuts) {
  app.innerHTML = `
    <p class="eyebrow">LE SAVOIR DE LA CLASSE</p>
    <h1>Moins de clics.<br><span>Plus de réflexes.</span></h1>
    <p class="intro">Nos raccourcis préférés, documentés ensemble. Explorez une fiche ou partagez votre prochaine découverte.</p>
    <div class="toolbar"><h2>Le sommaire <span class="count">${shortcuts.length}</span></h2>
    <label class="search">Rechercher une fiche<input id="search" type="search" placeholder="Titre, touches, catégorie…" /></label></div>
    <div id="cards" class="cards"></div>`;
  const cards = document.querySelector('#cards');
  function renderCards(query = '') {
    const matches = shortcuts.filter((item) =>
      `${item.title} ${item.description} ${item.keys} ${item.category}`.toLocaleLowerCase('fr').includes(query));
    cards.innerHTML = matches.map((item) => `
      <a class="card" href="#/raccourci/${encodeURIComponent(item.slug)}">
        <span class="category">${e(item.category)}</span><kbd>${e(item.keys)}</kbd>
        <h3>${e(item.title)}</h3><p>${e(item.description)}</p><span class="read">Lire la fiche ↗</span>
      </a>`).join('') || '<p class="empty">Aucune fiche trouvée. Ajoutez votre premier raccourci !</p>';
  }
  renderCards();
  document.querySelector('#search').addEventListener('input', (event) => {
    renderCards(event.target.value.trim().toLocaleLowerCase('fr'));
  });
}

function showShortcut(shortcut, isAdmin = false) {
  app.innerHTML = `
    <a class="back" href="#/">← Retour au sommaire</a>
    <article class="detail"><span class="category">${e(shortcut.category)}</span>
      <h1>${e(shortcut.title)}</h1><p class="intro">${e(shortcut.description)}</p>
      <kbd>${e(shortcut.keys)}</kbd>
      ${isAdmin ? `<div class="admin-actions">
        <a class="btn" href="#/modifier/${encodeURIComponent(shortcut.slug)}">✏️ Modifier</a>
        <button id="delete" type="button" class="btn danger">🗑️ Supprimer</button>
      </div>` : ''}
      <div id="markdown" class="markdown"></div>
    </article>`;
  // Le Markdown est du contenu externe : nettoyer le HTML avant de l'insérer.
  document.querySelector('#markdown').innerHTML = DOMPurify.sanitize(marked.parse(shortcut.content));

  document.querySelector('#delete')?.addEventListener('click', async () => {
    if (!confirm(`Supprimer la fiche « ${shortcut.title} » ?`)) return;
    const response = await fetch(`/api/shortcuts/${encodeURIComponent(shortcut.slug)}`, { method: 'DELETE' });
    if (response.ok) location.hash = '#/';
    else alert('Suppression impossible.');
  });
}



async function route() {
  const current = ++navigation;
  const isAdmin = await updateAuthStatus();
  if (current !== navigation) return;
  const path = location.hash.slice(1) || '/';
  app.innerHTML = '<p role="status">Chargement des fiches…</p>';
  try {
    if (path === '/admin') {
      renderAdminLogin(app);
    } else if (path === '/nouveau') {
      showForm(app);
    } else if (/^\/modifier\/[^/]+$/.test(path)) {
      if (!isAdmin) throw new Error('Accès réservé à l’administrateur.');
      await showEditForm(app, decodeURIComponent(path.split('/')[2]));
      if (current !== navigation) return;
    } else if (path === '/') {
      const shortcuts = await api();
      if (current !== navigation) return;
      showIndex(shortcuts);
    } else if (/^\/raccourci\/[^/]+$/.test(path)) {
      const shortcut = await api(`/${encodeURIComponent(decodeURIComponent(path.split('/')[2]))}`);
      if (current !== navigation) return;
      showShortcut(shortcut, isAdmin);
    } else {
      throw new Error('Cette page n’existe pas.');
    }
  } catch (error) {
    if (current !== navigation) return;
    app.innerHTML = `<div class="notice" role="alert"><h1>Oups…</h1><p>${e(error.message)}</p><a href="#/">Revenir au sommaire</a></div>`;
  }
  app.focus();
}

window.addEventListener('hashchange', route);
route();
