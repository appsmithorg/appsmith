'use strict';

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty2 = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty2(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/define-property"));

var _defineProperties = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/define-properties"));

var _getOwnPropertyDescriptors = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors"));

var _getOwnPropertyDescriptor = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor"));

var _getOwnPropertySymbols = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/entries"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _promptBypass = _interopRequireDefault(require("./prompt-bypass"));

var buildInActions = _interopRequireWildcard(require("./actions"));

function ownKeys(object, enumerableOnly) { var keys = (0, _keys.default)(object); if (_getOwnPropertySymbols.default) { var symbols = (0, _getOwnPropertySymbols.default)(object); if (enumerableOnly) symbols = (0, _filter.default)(symbols).call(symbols, function (sym) { return (0, _getOwnPropertyDescriptor.default)(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; (0, _forEach.default)(_context3 = ownKeys(source, true)).call(_context3, function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors.default) { (0, _defineProperties.default)(target, (0, _getOwnPropertyDescriptors.default)(source)); } else { var _context4; (0, _forEach.default)(_context4 = ownKeys(source)).call(_context4, function (key) { (0, _defineProperty2.default)(target, key, (0, _getOwnPropertyDescriptor.default)(source, key)); }); } } return target; }

function _default(plopfileApi, flags) {
  let abort; // triggers inquirer with the correct prompts for this generator
  // returns a promise that resolves with the user's answers

  const runGeneratorPrompts = async function (genObject, bypassArr = []) {
    const {
      prompts
    } = genObject;

    if (prompts == null) {
      throw Error(`${genObject.name} has no prompts`);
    }

    if (typeof prompts === 'function') {
      return await prompts(plopfileApi.inquirer);
    } // handle bypass data when provided


    const [promptsAfterBypass, bypassAnswers] = (0, _promptBypass.default)(prompts, bypassArr, plopfileApi);
    return await plopfileApi.inquirer.prompt(promptsAfterBypass).then(answers => (0, _assign.default)(answers, bypassAnswers));
  }; // Run the actions for this generator


  const runGeneratorActions = async function (genObject, data = {}, hooks = {}) {
    const noop = () => {};

    const {
      onSuccess = noop,
      // runs after each successful action
      onFailure = noop,
      // runs after each failed action
      onComment = noop // runs for each comment line in the actions array

    } = hooks;
    const changes = []; // array of changed made by the actions

    const failures = []; // array of actions that failed

    let {
      actions
    } = genObject; // the list of actions to execute

    const customActionTypes = getCustomActionTypes();
    const actionTypes = (0, _assign.default)({}, customActionTypes, buildInActions);
    abort = false; // if action is a function, run it to get our array of actions

    if (typeof actions === 'function') {
      actions = actions(data);
    } // if actions are not defined... we cannot proceed.


    if (actions == null) {
      throw Error(`${genObject.name} has no actions`);
    } // if actions are not an array, invalid!


    if (!(actions instanceof Array)) {
      throw Error(`${genObject.name} has invalid actions`);
    }

    for (let [actionIdx, action] of (0, _entries.default)(actions).call(actions)) {
      // including strings in the actions array is used for commenting
      if (typeof action === 'string' && abort) {
        continue;
      }

      if (typeof action === 'string') {
        onComment(action);
        continue;
      }

      const actionIsFunction = typeof action === 'function';
      const actionCfg = actionIsFunction ? {
        type: 'function'
      } : action;
      const actionLogic = actionIsFunction ? action : actionTypes[actionCfg.type]; // bail out if a previous action aborted

      if (abort) {
        const failure = {
          type: actionCfg.type || '',
          path: actionCfg.path || '',
          error: 'Aborted due to previous action failure'
        };
        onFailure(failure);
        failures.push(failure);
        continue;
      }

      actionCfg.force = flags.force === true || actionCfg.force === true;

      if (typeof actionLogic !== 'function') {
        if (actionCfg.abortOnFail !== false) {
          abort = true;
        }

        const failure = {
          type: actionCfg.type || '',
          path: actionCfg.path || '',
          error: `Invalid action (#${actionIdx + 1})`
        };
        onFailure(failure);
        failures.push(failure);
        continue;
      }

      try {
        const actionResult = await executeActionLogic(actionLogic, actionCfg, data);
        onSuccess(actionResult);
        changes.push(actionResult);
      } catch (failure) {
        if (actionCfg.abortOnFail !== false) {
          abort = true;
        }

        onFailure(failure);
        failures.push(failure);
      }
    }

    return {
      changes,
      failures
    };
  }; // handle action logic


  const executeActionLogic = async function (action, cfg, data) {
    var _context;

    const type = cfg.type || '';
    let cfgData = cfg.data || {}; // data can also be a function that returns a data object

    if (typeof cfgData === 'function') {
      cfgData = await cfgData();
    } // check if action should run


    if (typeof cfg.skip === 'function') {
      // Merge main data and config data in new object
      const reasonToSkip = await cfg.skip(_objectSpread({}, data, {}, cfgData));

      if (typeof reasonToSkip === 'string') {
        // Return actionResult instead of string
        return {
          type: 'skip',
          path: reasonToSkip
        };
      }
    } // track keys that can be applied to the main data scope


    const cfgDataKeys = (0, _filter.default)(_context = (0, _keys.default)(cfgData)).call(_context, k => typeof data[k] === 'undefined'); // copy config data into main data scope so it's available for templates

    (0, _forEach.default)(cfgDataKeys).call(cfgDataKeys, k => {
      data[k] = cfgData[k];
    });
    return await _promise.default.resolve(action(data, cfg, plopfileApi)).then( // show the resolved value in the console
    result => ({
      type,
      path: typeof result === 'string' ? result : (0, _stringify.default)(result)
    }), // a rejected promise is treated as a failure
    err => {
      throw {
        type,
        path: '',
        error: err.message || err.toString()
      };
    }) // cleanup main data scope so config data doesn't leak
    .finally(() => (0, _forEach.default)(cfgDataKeys).call(cfgDataKeys, k => {
      delete data[k];
    }));
  }; // request the list of custom actions from the plopfile


  function getCustomActionTypes() {
    var _context2;

    return (0, _reduce.default)(_context2 = plopfileApi.getActionTypeList()).call(_context2, function (types, name) {
      types[name] = plopfileApi.getActionType(name);
      return types;
    }, {});
  }

  return {
    runGeneratorActions,
    runGeneratorPrompts
  };
}