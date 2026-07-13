import './styles/design-tokens.css';
// Pages are loaded dynamically to improve performance
// import './pages/Showcase';
// import './pages/Overview';
// import './pages/Customers';
// import './pages/Loans';
// import './pages/Branches';
import { initDatabase, dbLoadingStore, dbErrorStore } from './store/index';

initDatabase();

const path = window.location.pathname;
const appContainer = document.getElementById('app');

if (appContainer) {
  dbLoadingStore.subscribe(loading => {
    if (loading) {
      appContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--color-bg-base); color: var(--color-text-primary); font-family: var(--font-family-base);">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: var(--color-primary);">DataBank Pro</div>
          <div style="font-size: 14px; color: var(--color-text-secondary);">Initializing local analytics engine...</div>
        </div>
      `;
    } else {
      const error = dbErrorStore.get();
      if (error) {
        appContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--color-bg-base); color: var(--color-text-primary); font-family: var(--font-family-base); padding: 24px;">
            <div style="font-size: 20px; font-weight: bold; color: var(--color-danger); margin-bottom: 8px;">Database Error</div>
            <div style="font-size: 14px; color: var(--color-text-secondary); text-align: center;">${error}</div>
          </div>
        `;
      } else {
        renderPage();
      }
    }
  });
}

function renderPage() {
  if (!appContainer) return;
  
  if (path === '/dev/showcase') {
    import('./pages/Showcase').then(() => {
      appContainer.innerHTML = '<showcase-page></showcase-page>';
    });
  } else if (path === '/customers') {
    import('./pages/Customers').then(() => {
      appContainer.innerHTML = '<customers-page></customers-page>';
    });
  } else if (path === '/loans') {
    import('./pages/Loans').then(() => {
      appContainer.innerHTML = '<loans-page></loans-page>';
    });
  } else if (path === '/branches') {
    import('./pages/Branches').then(() => {
      appContainer.innerHTML = '<branches-page></branches-page>';
    });
  } else if (path === '/') {
    import('./pages/Overview').then(() => {
      appContainer.innerHTML = '<overview-page></overview-page>';
    });
  } else {
    appContainer.innerHTML = `
      <div style="padding: 24px; color: var(--color-text-primary); background: var(--color-bg-base); min-height: 100vh; font-family: var(--font-family-base);">
        <h1 style="color: var(--color-danger);">404 Not Found</h1>
        <p>Return to <a href="/" style="color: var(--color-primary); font-weight: bold;">Overview Dashboard</a></p>
      </div>
    `;
  }
}
