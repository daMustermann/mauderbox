import ReactDOM from 'react-dom/client';
import App from '@/App';
// Import CSS from app directory using alias so Tailwind can scan the source files
import '@/index.css';
import { AppProviders } from '@/lib/appInit.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>,
);
