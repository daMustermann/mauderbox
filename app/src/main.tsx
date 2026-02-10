import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AppProviders } from '@/lib/appInit.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>,
);
