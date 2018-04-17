import _ from 'lodash';
import generator from './src/generator';

// default configurations
const defaultConfig = {
  logger: console,
  pattern: undefined,
  routingMethodsRegex: /_(delete|get|post|put|patch)\.(v\d+)(\.\S+)*\.js$/,
  baseUrl: '/api/{0}',
  globalMiddlewares: [],
  versioning: {}
};

// generate routes
async function generate(app, config) {
  const mergedConfig = _.merge({}, defaultConfig, config); // merge config with defaults
  // check required configs
  if (!mergedConfig.logger && !mergedConfig.logger.debug && !_typeof(mergedConfig.logger.debug) === 'function') throw new Error('logger is required');
  if (!mergedConfig.pattern && !typeof (mergedConfig.pattern) === 'string') throw new Error('pattern is required');
  if (!mergedConfig.routingMethodsRegex && !(mergedConfig.routingMethodsRegex instanceof RegExp)) throw new Error('routingMethodsRegex is required');
  if (!mergedConfig.baseUrl && !typeof (mergedConfig.baseUrl) === 'string') throw new Error('baseUrl is required');
  // start generating
  return generator(app, mergedConfig);
}

export default async (app, config) => this.generate(app, config);
export { generate };
