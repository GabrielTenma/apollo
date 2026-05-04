import { MemoryKeyStore } from "src/common/utils";

export const APP_CONSTANTS = 'APP_CONSTANTS';

export interface AppConstants {
  appName: string;
  scrapedContentStore: MemoryKeyStore;
}

export const appConstants: AppConstants = {
  // app
  appName: 'apollo',

  // memory key store
  scrapedContentStore: new MemoryKeyStore()
};