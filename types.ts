export interface PageInfo {
    id: string;
    title: string;
    _links: {
      self: string;
    };
  }
  
  export interface PageContent {
    id: string;
    title: string;
    body: {
      storage: {
        value: string;
        representation: string;
      };
    };
  }
  
  export interface AccessTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
  }
  
  export interface RefreshTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }