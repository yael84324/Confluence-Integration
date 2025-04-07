import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  confluenceBaseUrl: process.env.CONFLUENCE_BASE_URL || '',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback',
  spaceKeyForTests: process.env.SPACE_KEY_FOR_TESTS || '',
  existingPageIdForTests: process.env.EXISTING_PAGE_ID_FOR_TESTS || '',
  nonExistingPageIdForTests: process.env.NON_EXISTING_PAGE_ID_FOR_TESTS || '999999',
  authUrl: process.env.AUTH_URL || 'http://localhost:3000/auth',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  tokensFilePath: path.resolve(__dirname, 'tokens.json')
};

export const confluenceScopes = [
  'read:confluence-space.summary',
  'read:confluence-content.all',
  'offline_access' // Ensure this scope is included
];