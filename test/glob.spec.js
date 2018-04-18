import glob from './../src/glob';
import chai from 'chai';
const { expect } = chai;

describe('glob()', () => {
  it('should glob files', async () => {
    const files = await glob(`${__dirname}/**/*.spec.js`);
    expect(files).to.not.be.null;
    expect(files.length).to.not.equal(0);
    expect(files.length).to.equal(2);
  });
});