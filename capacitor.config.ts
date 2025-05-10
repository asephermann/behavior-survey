import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'behavior-survey',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: "none"
    }
  }
};

export default config;
