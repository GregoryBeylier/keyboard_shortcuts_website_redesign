import { api, escapeHtml as e } from './api.js';

export async function showEditForm(container, slug) {
    const shortcut = await api(`/${encodeURIComponent(slug)}`);

    container.innerHTML = `
    <a class="back" href="#/raccourci/${encodeURIComponent(slug)}">← Annuler</a>
    <h1>Modifier la fiche</h1>
    <form id="edit-form" class="form">
      <div class="form-grid">
        <label>Titre
          <input name="title" required maxlength="120" value="${e(shortcut.title)}">
        </label>
        <label>Catégorie
          <input name="category" required maxlength="60" value="${e(shortcut.category)}">
        </label>
        <label>Touches
          <input name="keys" required maxlength="120" value="${e(shortcut.keys)}">
        </label>
        <label>Description
          <input name="description" required maxlength="300" value="${e(shortcut.description)}">
        </label>
      </div>
      <label>Contenu (Markdown)
        <textarea name="content" rows="14" required>${e(shortcut.content)}</textarea>
      </label>
      <p id="edit-error" role="alert" class="error"></p>
      <button class="button" type="submit">Enregistrer</button>
    </form>`;

    const form = container.querySelector('#edit-form');
    const errorEl = container.querySelector('#edit-error');
    const button = form.querySelector('button');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.textContent = '';
        button.disabled = true;
        try {
            const response = await fetch(`/api/shortcuts/${encodeURIComponent(slug)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
            });
            const data = await response.json().catch(() => null);
            if (response.ok) {
                location.hash = `#/raccourci/${encodeURIComponent(slug)}`;
            } else {
                errorEl.textContent = data?.error || 'Modification impossible.';
            }
        } catch (error) {
            errorEl.textContent = error.message || 'Modification impossible.';
        } finally {
            button.disabled = false;
        }
    });
}