import { VcaCcPage } from './app.po';

describe('vca-cc App', () => {
  let page: VcaCcPage;

  beforeEach(() => {
    page = new VcaCcPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
