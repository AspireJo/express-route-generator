import chai from 'chai';
import express from 'express';
import generator from '../';

const { expect } = chai;
const app = express();
const config = {
  pattern: `${__dirname}/api/**/_*.js`,
  baseUrl: '/{0}',
};
generator(app, config).then(() => {
  describe('generate routes', () => {
    it('app should not be null', () => {
      expect(app).to.not.be.null;
    });
    const paths = app._router.stack
      .filter(r => r.name === 'router')
      .map(r => ({
        version: (r.regexp.source).replace('(?:^\\/', '').replace('\\/?(?=\\/|$))', ''),
        routes: r.handle.stack.map(k => k.route.path)
      }));
    it('2 versions should be registered', () => {
      expect(paths).to.not.be.null;
      expect(paths.length).to.equal(2);
      expect(paths.find(a => a.version === 'v1')).to.exist;
      expect(paths.find(a => a.version === 'v2')).to.exist;
    });
    it('3 routes should be registered', () => {
      expect(paths[0].routes.length + paths[1].routes.length).to.eq(3);
    });
    it('should ignore to-be-ignored', () => {
      const item = paths[0].routes.find(a => a === '/tobeignored') || paths[1].routes.find(a => a === '/tobeignored');
      expect(item).to.not.exist;
    });
    it('should register correct routes', () => {
      let v = paths.find(a => a.version === 'v1');
      expect(v.routes.find(a => a === '/sub1/inner1')).to.exist;
      expect(v.routes.find(a => a === '/sub2/inner1/')).to.exist;
      v = paths.find(a => a.version === 'v2');
      expect(v.routes.find(a => a === '/sub1/inner1')).to.exist;
      expect(v.routes.find(a => a === '/sub2/inner1/')).to.not.exist;
    });
  });
});