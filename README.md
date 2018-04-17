# express-route-generator
Auto generate routes for express app. This library uses a defined pattern to glob the routes handlers files and dynamically add them to the express app.

## Version

> 0.1.2

## Usage

``` javascript
import routeGen from '@aspirejo/express-route-generator';
import express from 'express';

const app = express();
const config = {
  pattern: `${path.resolve(__dirname, '../..')}/**/controllers/**/_*.js`,
};
routeGen(app, config);

app.listen(3000, () => { console.log('listening to port 3000!'); });
```

Or
``` javascript
const routeGen = require('@aspirejo/express-route-generator');
const express = require('express');

const app = express();
const config = {
  pattern: `${path.resolve(__dirname, '../..')}/**/controllers/**/_*.js`,
};

routeGen.generate(app, config);
app.listen(3000, () => { console.log('listening to port 3000!'); });

```

### Config

``` json
{
  "pattern": ...,
  "logger": ...,
  "routingMethodsRegex": ...,
  "globalMiddlewares": [...],
  "baseUrl": ...,
  "versioning": {
    ...
  }
}
```

| Property | Type | Usage |
| ------------- | ------------- | ------------- | 
| `pattern` | `string` | files globbing pattern (**required**) |
| `logger` | `object` | object to be used in logging |
| `baseUrl` | `string` | used to construct routes, uses a formatted string |
| `routingMethodsRegex` | `regex` | used to match the targeted files from the globbed list |
| `globalMiddlewares` | `array<function>` | to register global middlewares for all routes |
| `versioning` | `object` |used for versioning settings |

#### `pattern`
> Default value : `undefined`

Used to glob all files that matches that pattern using [glob](https://www.npmjs.com/package/glob). This property must be provided.

#### `logger`
> Default value: `console`

By default `console` is used to log actions. You can use any custom logger as long as it contains a `debug` function.

#### `baseUrl`
> Default value: `/api/{0}` 

A string format that will be used to generate the router handlers prefixes; each found version will has its own router handler with a prefix generated using this format.

#### `routingMethodsRegex`
> Default value: /_(delete|get|post|put|patch)\.(v\d+)(\.\S+)*\.js$/

Used to filter the globbed files by matching against this regular expression.

Router handlers are promisified using [`express-promise-router`](https://www.npmjs.com/package/express-promise-router) package

#### `globalMiddlewares`
> Default value: `undefined`

Contains an array of express middlewares that will be applied on all generated routes.

#### `versioning`
> Default value: `undefined`

Versioning settings, the expected structure as follows

``` json
{
  "versioning":{
    #VERSION_NAME# :{
      "middlewares" : [#MIDDLEWARE#],
      "paramsMiddlewares" : [
        {
          #PARAM_NAME# : #MIDDLEWARE#
        }
      ]
    }
  }
}
```
- _#VERSION_NAME#_ : version name, eg: v1, v2
- _#MIDDLEWARE#_ : express middleware handler(s)
- _#PARAM_NAME#_ : router parameter name

eg: 
``` javascript
versioning: {
  v1: {
    middlewares: [(req, res, next) => { console.log('v1 middleware'); next(); }],
    paramsMiddlewares: [{ id: ((req, res, next) => { console.log('id parameter middleware'); next(); }) }]
  }
}
```

``` 
../api/v1/users/{id}/
[1]----↑         ↑
[2]--------------↑
```
in the above example
  - for all `v1` routes `v1.middlewares` will be applied.
  - for all `v1` routes with `id` path parameter `v1.paramsMiddlewares[id]` will be applied.

#### Default config
``` javascript
{
  logger: console,
  pattern: undefined,
  routingMethodsRegex: /_(delete|get|post|put|patch)\.(v\d+)(\.\S+)*\.js$/,
  baseUrl: '/api/{0}',
  globalMiddlewares: [],
  versioning: { }
};
```

### Constraints
All routes handlers must:
- Exits under a folder that matches the provided `pattern`
- Name must match the `routingMethodsRegex`, for the default config the name must contain at the following parts seperated by dot `'.'`
  - http method name prefixed with `_`; eg: `_get`
  - version name; eg: `v1`
  - a descriptive part to distinct multiple methods within the same folder (optional)
  - extension, this should be `js`
- The handler file must export:
  - `route` : a string representing the route that will be registered
  - `controller` : a function to execute
  - `middlewares` : an express middlewares array that will be executed for a specific route (optional)
  - `aliases` : a string array that represent aliases for the same route (optional)

### Example
A sample project can be found [here](https://github.com/AspireJo/express-dynamic-routes-boilerplate).