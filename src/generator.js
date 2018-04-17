import PromiseRouter from 'express-promise-router';
import _ from 'lodash';
import Promise from 'bluebird';
import format from 'string-format';
import glob from './glob';

const initRouterHandler = (app, config, routingMap, version, globalMiddlewares) => {
  let obj = {};
  if (_.has(routingMap, version)) obj = _.get(routingMap, version);
  if (!_.has(obj, 'routerHandler')) {
    // create new router handler
    const routerHandler = PromiseRouter({ mergeParams: true });
    // setup middlewares
    _.union(globalMiddlewares, obj.middlewares).forEach((middleware) => { routerHandler.use(middleware); });
    // setup parameters middlewares
    _.forEach(obj.paramsMiddlewares, paramMiddleware => _.forOwn(paramMiddleware, (value, key) => {
      routerHandler.param(key, value);
    }));
    // set baseurl
    const baseUrl = format(config.baseUrl, version);
    // use router handler
    app.use([baseUrl], routerHandler);
    // return handler for merging
    const createdObj = {};
    createdObj[version] = { routerHandler, baseUrl };
    return createdObj;
  }
  // no new handlers to merge
  return undefined;
};

export default async (app, config) => {
  // set start date for time calculation
  const startTime = new Date();
  config.logger.debug(`\x1b[32mexpress-route-generator::\x1b[0m started at \x1b[36m${startTime.toString()}\x1b[0m ...`);
  // glob all files to process
  const files = await glob(config.pattern);
  config.logger.debug(`\x1b[32mexpress-route-generator::\x1b[0m ${files.length} matched files found`);
  // fefault middleware
  const defaultMiddleware = (req, res, next) => { next(); };
  // variables that will save routes
  const registeredRoutes = [];
  const routingMap = config.versioning || {};
  // start files processing
  await Promise.each(files, async (file) => {
    // match file method against allowed methods
    const regexResult = config.routingMethodsRegex.exec(file);
    if (!regexResult || regexResult.length < 3) return undefined; // not allowed
    // load the module
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const dynamicRoute = require(file);
    // check if module exposes route and controller
    if (!dynamicRoute.route || !dynamicRoute.controller) return undefined;
    // specific route middleware
    const middlewares = dynamicRoute.middlewares || [defaultMiddleware];
    // get regext matching values
    const [, method, controllerVersion] = regexResult;
    // init router handler
    _.mergeWith(routingMap, initRouterHandler(app, config, routingMap, controllerVersion, config.globalMiddlewares));
    // get the routing config
    const routerVersionConfig = _.get(routingMap, controllerVersion);
    // use router handler that was initialized in initRouters
    const { routerHandler } = routerVersionConfig;
    registeredRoutes.push({
      routerHandler,
      method,
      middlewares,
      route: dynamicRoute.route,
      url: `${routerVersionConfig.baseUrl}${dynamicRoute.route}`,
      controller: dynamicRoute.controller
    });
    // add route aliases
    if (dynamicRoute.aliases && dynamicRoute.aliases.length > 0) {
      dynamicRoute.aliases.forEach((alias) => {
        registeredRoutes.push({
          routerHandler,
          method,
          middlewares,
          route: alias,
          url: `${routerVersionConfig.baseUrl}${alias}`,
          controller: dynamicRoute.controller
        });
      });
    }
    return undefined;
  });

  // add routes to expressjs routing engine
  _.orderBy(registeredRoutes, [item => item.route], ['desc']).forEach((item) => {
    item.routerHandler.route(item.route)[item.method](item.middlewares, item.controller);
    config.logger.debug(`\x1b[32mexpress-route-generator::\x1b[0m route registered ${JSON.stringify({ httpMethod: item.method, url: item.url, route: item.route })}`);
  });
  config.logger.debug(`\x1b[32mexpress-route-generator::\x1b[0m Total registered routes : \x1b[36m${registeredRoutes.length}\x1b[0m`);
  config.logger.debug(`\x1b[32mexpress-route-generator::\x1b[0m ended at \x1b[36m${new Date().toString()}\x1b[0m; total running time :\x1b[36m${(new Date().getTime() - startTime.getTime()) / 1000}\x1b[0m`);
};
