import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { confluenceService } from '../services/confluenceService';

describe('confluenceService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should list pages in a space', async () => {
    const mockResponse = {
      data: {
        results: [{ id: '123', title: 'Page 1' }, { id: '456', title: 'Page 2' }],
        _links: {},
      },
    };
    sinon.stub(axios, 'get').resolves(mockResponse);

    const pages = await confluenceService.listPagesInSpace('TEST');
    expect(pages).to.have.length(2);
    expect(pages[0].title).to.equal('Page 1');
  });

  it('should get page content', async () => {
    const mockResponse = {
      data: { id: '123', title: 'Test Page', body: { storage: { value: '<p>Content</p>' } } },
    };
    sinon.stub(axios, 'get').resolves(mockResponse);

    const content = await confluenceService.getPageContent('123');
    expect(content.title).to.equal('Test Page');
    expect(content.body.storage.value).to.equal('<p>Content</p>');
  });

  it('should handle API errors gracefully', async () => {
    sinon.stub(axios, 'get').rejects({ response: { status: 403, data: { message: 'Forbidden' } } });

    try {
      await confluenceService.listPagesInSpace('TEST');
    } catch (error: any) {
      expect(error.message).to.include('403');
    }
  });
});
