import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { config, confluenceScopes } from '../config';

export const authController = {
  redirectToAuth: (req: Request, res: Response) => {
    const authUrl = authService.getAuthorizationUrl(config.redirectUri, confluenceScopes);
    res.redirect(authUrl);
  },

  handleCallback: async (req: Request, res: Response) => {
    const authorizationCode = req.query.code as string;

    if (authorizationCode) {
      try {
        await authService.fetchInitialTokens(authorizationCode, config.redirectUri);
        res.send('Successfully authenticated with Confluence! You can now run the main integration script.');
      } catch (error: any) {
        console.error('Error during callback:', error.message);
        res.status(500).send(`Authentication failed: ${error.message}`);
      }
    } else {
      res.status(400).send('Authorization code not received.');
    }
  },
};