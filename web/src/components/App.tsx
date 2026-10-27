import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';
import { DirkProvider, isEnvBrowser, localeStore } from 'dirk-cfx-react';
import React, { useEffect } from 'react';
import enLocale from '@locales/en.json';
import './App.css';
import StoreUI from './Store/main';

const App: React.FC = () => {
  // In the browser there is no Lua to answer GET_LOCALES, so seed the bundle
  // from the shipped English file — otherwise every label renders as its key.
  useEffect(() => {
    if (isEnvBrowser()) {
      localeStore.setState({ locales: enLocale as Record<string, string> });
    }
  }, []);

  return (
    <DirkProvider>
      <Notifications
        position="bottom-center"
        styles={{
          notification: {
            backgroundColor: 'rgba(38, 38, 38, 0.8)',
            borderRadius: 'var(--mantine-radius-xs)',
            padding: 'var(--mantine-spacing-xs)',
            paddingLeft: 'var(--mantine-spacing-md)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          },
        }}
      />
      <StoreUI />
    </DirkProvider>
  );
};

export default App;
