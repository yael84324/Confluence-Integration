import express, { Request, Response } from 'express';
import { authController } from './controllers/authController';
import { config } from './config';
import { confluenceService } from './services/confluenceService';
import { authService } from './services/authService';

const app = express();

app.get('/auth', authController.redirectToAuth);
app.get('/auth/callback', authController.handleCallback);

app.get('/run', async (req: Request, res: Response) => {
  try {
    await authService.getAccessToken();
    console.log('Access token available. Proceeding with Confluence API calls.');

    let responseMessage = '';

    if (config.spaceKeyForTests) {
      console.log(`\nListing pages in space: ${config.spaceKeyForTests}`);
      try {
        const pages = await confluenceService.listPagesInSpace(config.spaceKeyForTests);
        responseMessage += `Found ${pages.length} pages in space ${config.spaceKeyForTests}.\n`;
      } catch (error: any) {
        console.error('Error listing pages:', error.message);
        responseMessage += `Error listing pages: ${error.message}\n`;
      }
    }

    if (config.existingPageIdForTests) {
      console.log(`\nGetting content for page ID: ${config.existingPageIdForTests}`);
      try {
        const content = await confluenceService.getPageContent(config.existingPageIdForTests);
        responseMessage += `Page title: ${content.title}\n`;
      } catch (error: any) {
        console.error('Error getting page content:', error.message);
        responseMessage += `Error getting page content: ${error.message}\n`;
      }
    }

    res.send(responseMessage || 'No actions performed.');
  } catch (error: any) {
    if (error.message.includes('No access token or refresh token available')) {
      console.log('\nNo refresh token found. Please authenticate with Confluence.');
      res.status(401).send('No refresh token found. Please authenticate with Confluence.');
    } else {
      console.error('An error occurred:', error);
      res.status(500).send(`An error occurred: ${error.message}`);
    }
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Confluence Integration Service. Go to /auth to authenticate.');
});


app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  console.log(`Visit http://localhost:${config.port}/auth to start the authentication process.`);
  console.log(`Visit http://localhost:${config.port}/run to execute the main logic.`);
});