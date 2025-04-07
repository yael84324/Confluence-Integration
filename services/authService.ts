import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import { config } from '../config';
import { AccessTokenResponse, RefreshTokenResponse } from '../types';

let accessToken: string | null = null;
let accessTokenExpiry: number | null = null;
let refreshToken: string | null = null;

async function loadRefreshToken(): Promise<void> {
  try {
    const data = await fs.readFile(config.tokensFilePath, 'utf-8');
    const tokens = JSON.parse(data);
    refreshToken = tokens.refresh_token || null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await saveRefreshToken(null);
    } else {
      console.error('Error loading refresh token:', error.message);
    }
    refreshToken = null;
  }
}

async function saveRefreshToken(newRefreshToken: string | null): Promise<void> {
  try {
    await fs.writeFile(config.tokensFilePath, JSON.stringify({ refresh_token: newRefreshToken }), 'utf-8');
    refreshToken = newRefreshToken;
  } catch (error: any) {
    console.error('Error saving refresh token:', error.message);
    throw error;
  }
}

async function getNewAccessToken(): Promise<string> {
  if (!config.clientId || !config.clientSecret || !refreshToken) {
    throw new Error('Missing required OAuth2 credentials or refresh token.');
  }

  const tokenEndpoint = `https://auth.atlassian.com/oauth/token`;
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response: AxiosResponse<RefreshTokenResponse> = await axios.post(
      tokenEndpoint,
      `grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    accessToken = response.data.access_token;
    accessTokenExpiry = Date.now() + response.data.expires_in * 1000;
    return accessToken;
  } catch (error: any) {
    if (error.response?.data?.error === 'unauthorized_client' || error.response?.data?.error_description?.includes('refresh_token is invalid')) {
      await saveRefreshToken(null);
      throw new Error('Failed to refresh access token. Re-authorization might be needed.');
    }
    throw new Error('Failed to refresh access token.');
  }
}

export const authService = {
  async getAccessToken(): Promise<string> {
    if (!refreshToken) {
      await loadRefreshToken();
    }

    if (accessToken && accessTokenExpiry && Date.now() < accessTokenExpiry - 60000) {
      return accessToken;
    }

    if (refreshToken) {
      return await getNewAccessToken();
    }

    throw new Error('No access token or refresh token available. Initial authorization is required.');
  },

  async fetchInitialTokens(authorizationCode: string, redirectUri: string): Promise<void> {
    if (!config.clientId || !config.clientSecret || !config.confluenceBaseUrl) {
      throw new Error('Missing required OAuth2 credentials.');
    }

    const tokenEndpoint = `https://auth.atlassian.com/oauth/token`;
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    try {
      const response: AxiosResponse<AccessTokenResponse> = await axios.post(
        tokenEndpoint,
        `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${redirectUri}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      accessToken = response.data.access_token;
      accessTokenExpiry = Date.now() + response.data.expires_in * 1000;

      if (response.data.refresh_token) {
        await saveRefreshToken(response.data.refresh_token);
      } else {
        throw new Error('No refresh token received in the response.');
      }
    } catch (error: any) {
      throw new Error('Failed to fetch initial OAuth2 tokens.');
    }
  },

  getAuthorizationUrl(redirectUri: string, scopes: string[]): string {
    if (!config.clientId) {
      throw new Error('Missing required OAuth2 credentials.');
    }
    const authorizeEndpoint = `https://auth.atlassian.com/authorize`;
    const scopeString = scopes.join(' ');
    return `${authorizeEndpoint}?client_id=${config.clientId}&scope=${encodeURIComponent(scopeString)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&audience=api.atlassian.com`;
  },

  getRefreshToken(): string | null {
    return refreshToken;
  },

  async updateRefreshToken(newToken: string | null): Promise<void> {
    await saveRefreshToken(newToken);
  },
};