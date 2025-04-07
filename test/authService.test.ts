import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import fs from 'fs/promises';
import { authService } from '../services/authService';

describe('authService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should load refresh token from file', async () => {
    const mockToken = { refresh_token: 'mock_refresh_token' };
    sinon.stub(fs, 'readFile').resolves(JSON.stringify(mockToken));
    sinon.stub(axios, 'post').resolves({
      data: {
        access_token: 'mock_access_token',
        expires_in: 3600,
      },
    });

    const token = await authService.getAccessToken();
    expect(token).to.equal('mock_access_token');
    expect(authService.getRefreshToken()).to.equal(mockToken.refresh_token);
  });

  it('should save refresh token to file', async () => {
    const writeFileStub = sinon.stub(fs, 'writeFile').resolves();
    await authService.updateRefreshToken('new_refresh_token');
    expect(writeFileStub.calledOnce).to.be.true;
  });

  it('should throw an error if refresh token is invalid', async () => {
    sinon.stub(axios, 'post').rejects({
      response: { data: { error: 'unauthorized_client', error_description: 'refresh_token is invalid' } },
    });

    try {
      await authService.getAccessToken();
    } catch (error: any) {
      expect(error.message).to.include('Re-authorization might be needed');
    }
  });
});
