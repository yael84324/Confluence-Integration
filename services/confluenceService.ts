import axios, { AxiosError, AxiosResponse } from 'axios';
import { config } from '../config';
import { authService } from './authService';
import { PageInfo, PageContent } from '../types';

async function handleApiError(error: AxiosError): Promise<never> {
  if (error.response) {
    const errorMessage = `Confluence API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    throw new Error(errorMessage);
  } else if (error.request) {
    throw new Error('Confluence API Error: No response received');
  } else {
    throw new Error(`Confluence API Error: Request setup failed - ${error.message}`);
  }
}

export const confluenceService = {
  async listPagesInSpace(spaceKey: string): Promise<PageInfo[]> {
    if (!config.confluenceBaseUrl) {
      throw new Error('CONFLUENCE_BASE_URL is not defined in .env file.');
    }

    const accessToken = await authService.getAccessToken();
    const url = `${config.confluenceBaseUrl}/wiki/rest/api/content?spaceKey=${spaceKey}&type=page&limit=100`;
    let allPages: PageInfo[] = [];
    let start = 0;

    try {
      while (true) {
        const response: AxiosResponse<{ results: PageInfo[]; _links: { next?: string } }> = await axios.get(
          `${url}&start=${start}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );
        allPages = allPages.concat(response.data.results);
        const nextLink = response.data._links.next;
        if (!nextLink) {
          break;
        }
        const nextStartMatch = nextLink.match(/start=(\d+)/);
        if (nextStartMatch && nextStartMatch[1]) {
          start = parseInt(nextStartMatch[1], 10);
        } else {
          break;
        }
      }
      return allPages;
    } catch (error: any) {
      return handleApiError(error);
    }
  },

  async getPageContent(pageId: string): Promise<PageContent> {
    if (!config.confluenceBaseUrl) {
      throw new Error('CONFLUENCE_BASE_URL is not defined in .env file.');
    }

    const accessToken = await authService.getAccessToken();
    const url = `${config.confluenceBaseUrl}/wiki/rest/api/content/${pageId}?expand=body.storage`;

    try {
      const response: AxiosResponse<PageContent> = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      return handleApiError(error);
    }
  },
};