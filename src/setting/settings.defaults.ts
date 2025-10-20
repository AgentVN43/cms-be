// settings.defaults.ts

export const SETTINGS_KEY = 'site';

export const DEFAULT_SETTINGS = {
  general: {
    siteName: 'AnNK',
    slogan: 'Annk Team',
    description: 'Test',
    logoMediaId: null,
    adminEmail: '',
    faviconMediaId: null,
  },
  reading: {
    postsPerPage: 10,
    relatedPosts: 4,
  },
  extra: {},
};
