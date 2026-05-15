/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';

// Ignore Supabase Realtime fallback warnings in development
LogBox.ignoreLogs([
  'Realtime send() is automatically falling back to REST API',
]);
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
