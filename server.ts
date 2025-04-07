import express, { Request, Response } from 'express';
import { authController } from './controllers/authController';
import { config } from './config';
import { confluenceService } from './services/confluenceService';
import { authService } from './services/authService';

const app = express();

app.get('/auth', authController.redirectToAuth);
app.get('/auth/callback', authController.handleCallback);

app.get('/pages/:spaceId', async (req, res) => {
  const { spaceId } = req.params;
  console.log(`Received request to list pages for space: ${spaceId}`);

  try {
    await authService.getAccessToken();
    const pages = await confluenceService.listPagesInSpace(spaceId);
    res.json({ pages });
  } catch (error: any) {
    console.error(`Error fetching pages for space ${spaceId}:`, error.message);
    res.status(500).send(`Error fetching pages: ${error.message}`);
  }
});

app.get('/page/:pageId', async (req, res) => {
  const { pageId } = req.params;
  console.log(`Received request to get details for page: ${pageId}`);

  try {
    await authService.getAccessToken();
    const pageDetails = await confluenceService.getPageContent(pageId);
    res.json({ pageDetails });
  } catch (error: any) {
    console.error(`Error fetching details for page ${pageId}:`, error.message);
    res.status(500).send(`Error fetching page details: ${error.message}`);
  }
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  console.log(`Visit http://localhost:${config.port}/auth to start the authentication process.`);
  console.log(`Use /pages/:spaceId to get a list of pages in a space.`);
  console.log(`Use /page/:pageId to get details of a specific page.`);
});