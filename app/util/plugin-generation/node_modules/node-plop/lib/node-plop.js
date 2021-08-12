"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _handlebars = _interopRequireDefault(require("handlebars"));

var _lodash = _interopRequireDefault(require("lodash.get"));

var _resolve = _interopRequireDefault(require("resolve"));

var _bakedInHelpers = _interopRequireDefault(require("./baked-in-helpers"));

var _generatorRunner = _interopRequireDefault(require("./generator-runner"));

function nodePlop(plopfilePath = '', plopCfg = {}) {
  let pkgJson = {};
  let defaultInclude = {
    generators: true
  };
  let welcomeMessage;
  const {
    destBasePath,
    force
  } = plopCfg;
  const generators = {};
  const partials = {};
  const actionTypes = {};
  const helpers = (0, _assign.default)({
    pkg: propertyPath => (0, _lodash.default)(pkgJson, propertyPath, '')
  }, _bakedInHelpers.default);
  const baseHelpers = (0, _keys.default)(helpers);
  const setPrompt = _inquirer.default.registerPrompt;

  const setWelcomeMessage = message => {
    welcomeMessage = message;
  };

  const setHelper = (name, fn) => {
    helpers[name] = fn;
  };

  const setPartial = (name, str) => {
    partials[name] = str;
  };

  const setActionType = (name, fn) => {
    actionTypes[name] = fn;
  };

  function renderString(template, data) {
    var _context, _context2;

    (0, _forEach.default)(_context = (0, _keys.default)(helpers)).call(_context, h => _handlebars.default.registerHelper(h, helpers[h]));
    (0, _forEach.default)(_context2 = (0, _keys.default)(partials)).call(_context2, p => _handlebars.default.registerPartial(p, partials[p]));
    return _handlebars.default.compile(template)(data);
  }

  const getWelcomeMessage = () => welcomeMessage;

  const getHelper = name => helpers[name];

  const getPartial = name => partials[name];

  const getActionType = name => actionTypes[name];

  const getGenerator = name => generators[name];

  function setGenerator(name = '', config = {}) {
    // if no name is provided, use a default
    name = name || `generator-${(0, _keys.default)(generators).length + 1}`; // add the generator to this context

    generators[name] = (0, _assign.default)(config, {
      name: name,
      basePath: plopfilePath
    });
    return generators[name];
  }

  const getHelperList = () => {
    var _context3;

    return (0, _filter.default)(_context3 = (0, _keys.default)(helpers)).call(_context3, h => !(0, _includes.default)(baseHelpers).call(baseHelpers, h));
  };

  const getPartialList = () => (0, _keys.default)(partials);

  const getActionTypeList = () => (0, _keys.default)(actionTypes);

  function getGeneratorList() {
    var _context4;

    return (0, _map.default)(_context4 = (0, _keys.default)(generators)).call(_context4, function (name) {
      const {
        description
      } = generators[name];
      return {
        name,
        description
      };
    });
  }

  const setDefaultInclude = inc => defaultInclude = inc;

  const getDefaultInclude = () => defaultInclude;

  const getDestBasePath = () => destBasePath || plopfilePath;

  const getPlopfilePath = () => plopfilePath;

  const setPlopfilePath = filePath => {
    const pathStats = _fs.default.statSync(filePath);

    if (pathStats.isFile()) {
      plopfilePath = _path.default.dirname(filePath);
    } else {
      plopfilePath = filePath;
    }
  };

  function load(targets, loadCfg = {}, includeOverride) {
    if (typeof targets === 'string') {
      targets = [targets];
    }

    const config = (0, _assign.default)({
      destBasePath: getDestBasePath()
    }, loadCfg);
    (0, _forEach.default)(targets).call(targets, function (target) {
      var _context5;

      const targetPath = _resolve.default.sync(target, {
        basedir: getPlopfilePath()
      });

      const proxy = nodePlop(targetPath, config);
      const proxyDefaultInclude = proxy.getDefaultInclude() || {};
      const includeCfg = includeOverride || proxyDefaultInclude;
      const include = (0, _assign.default)({
        generators: false,
        helpers: false,
        partials: false,
        actionTypes: false
      }, includeCfg);
      const genNameList = (0, _map.default)(_context5 = proxy.getGeneratorList()).call(_context5, g => g.name);
      loadAsset(genNameList, include.generators, setGenerator, proxyName => ({
        proxyName,
        proxy
      }));
      loadAsset(proxy.getPartialList(), include.partials, setPartial, proxy.getPartial);
      loadAsset(proxy.getHelperList(), include.helpers, setHelper, proxy.getHelper);
      loadAsset(proxy.getActionTypeList(), include.actionTypes, setActionType, proxy.getActionType);
    });
  }

  function loadAsset(nameList, include, addFunc, getFunc) {
    var incArr;

    if (include === true) {
      incArr = nameList;
    }

    if (include instanceof Array) {
      incArr = (0, _filter.default)(include).call(include, n => typeof n === 'string');
    }

    if (incArr != null) {
      include = (0, _reduce.default)(incArr).call(incArr, function (inc, name) {
        inc[name] = name;
        return inc;
      }, {});
    }

    if (include instanceof Object) {
      var _context6;

      (0, _forEach.default)(_context6 = (0, _keys.default)(include)).call(_context6, i => addFunc(include[i], getFunc(i)));
    }
  }

  function loadPackageJson() {
    // look for a package.json file to use for the "pkg" helper
    try {
      pkgJson = require(_path.default.join(getDestBasePath(), 'package.json'));
    } catch (error) {
      pkgJson = {};
    }
  } /////////
  // the API that is exposed to the plopfile when it is executed
  // it differs from the nodePlopApi in that it does not include the
  // generator runner methods
  //


  const plopfileApi = {
    // main methods for setting and getting plop context things
    setPrompt,
    setWelcomeMessage,
    getWelcomeMessage,
    setGenerator,
    getGenerator,
    getGeneratorList,
    setPartial,
    getPartial,
    getPartialList,
    setHelper,
    getHelper,
    getHelperList,
    setActionType,
    getActionType,
    getActionTypeList,
    // path context methods
    setPlopfilePath,
    getPlopfilePath,
    getDestBasePath,
    // plop.load functionality
    load,
    setDefaultInclude,
    getDefaultInclude,
    // render a handlebars template
    renderString,
    // passthrough properties
    inquirer: _inquirer.default,
    handlebars: _handlebars.default,
    // passthroughs for backward compatibility
    addPrompt: setPrompt,
    addPartial: setPartial,
    addHelper: setHelper
  }; // the runner for this instance of the nodePlop api

  const runner = (0, _generatorRunner.default)(plopfileApi, {
    force
  });
  const nodePlopApi = (0, _assign.default)({}, plopfileApi, {
    getGenerator(name) {
      var generator = plopfileApi.getGenerator(name);

      if (generator == null) {
        throw Error(`Generator "${name}" does not exist.`);
      } // if this generator was loaded from an external plopfile, proxy the
      // generator request through to the external plop instance


      if (generator.proxy) {
        return generator.proxy.getGenerator(generator.proxyName);
      }

      return (0, _assign.default)({}, generator, {
        runActions: (data, hooks) => runner.runGeneratorActions(generator, data, hooks),
        runPrompts: (bypassArr = []) => runner.runGeneratorPrompts(generator, bypassArr)
      });
    },

    setGenerator(name, config) {
      const g = plopfileApi.setGenerator(name, config);
      return this.getGenerator(g.name);
    }

  });

  if (plopfilePath) {
    plopfilePath = _path.default.resolve(plopfilePath);

    const plopFileName = _path.default.basename(plopfilePath);

    setPlopfilePath(plopfilePath);
    loadPackageJson();

    const plopFileExport = require(_path.default.join(plopfilePath, plopFileName));

    const plop = typeof plopFileExport === 'function' ? plopFileExport : plopFileExport.default;
    plop(plopfileApi, plopCfg);
  } else {
    setPlopfilePath(process.cwd());
    loadPackageJson();
  }

  return nodePlopApi;
}

var _default = nodePlop;
exports.default = _default;