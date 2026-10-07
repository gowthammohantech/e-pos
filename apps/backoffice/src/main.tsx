import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@elixir/ui/styles.css';
import { applyTheme, setImageBase, ToastProvider } from '@elixir/ui';
import { ElixirDataProvider } from '@elixir/app-kit';
import { App } from './App';

applyTheme();
setImageBase(import.meta.env.BASE_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ElixirDataProvider product="Back Office" use={['cloud']}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ElixirDataProvider>
  </StrictMode>,
);
