// App entry point
import './src/app/global.css';
import React from 'react';
import Providers from './src/app/Providers';
import RootNavigator from './src/navigation/RootNavigator';

export default function App(): React.JSX.Element {
  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
