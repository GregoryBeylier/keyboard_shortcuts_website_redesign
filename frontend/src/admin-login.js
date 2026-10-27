export function renderAdminLogin(container) {
  container.innerHTML = `
    <h1>Connexion administrateur</h1>
    <form id="admin-login-form" class="form">
      <label>Identifiant
        <input name="username" type="text" required autocomplete="username">
      </label>
      <label>Mot de passe
        <input name="password" type="password" required autocomplete="current-password">
      </label>
      <p id="admin-login-error" role="alert" class="error"></p>
      <button class="button" type="submit">Se connecter</button>
    </form>
  `;

  const form = container.querySelector('#admin-login-form');
  const errorEl = container.querySelector('#admin-login-error');
  const button = form.querySelector('button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    button.disabled = true;

    try {
      const body = Object.fromEntries(new FormData(form));
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        location.hash = '#/';
      } else {
        errorEl.textContent = data?.error || 'Erreur de connexion';
      }
    } catch (error) {
      errorEl.textContent = error.message || 'Erreur de connexion';
    } finally {
      button.disabled = false;
    }
  });
}