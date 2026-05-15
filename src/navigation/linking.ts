// Deep linking configuration
import ENV from '@/config/env';

export const linking = {
  prefixes: [`${ENV.APP_SCHEME}://`, `https://emergps.app`],
  config: {
    screens: {
      Main: {
        screens: {
          Tracking: {
            screens: {
              ViewerEntry: 'track/:shareToken',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'auth/callback',
        },
      },
    },
  },
};

export default linking;
