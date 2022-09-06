import parser from 'fast-xml-parser';
import moment from 'moment-timezone';
import _, { VERSION as lodashVersion } from 'lodash';
import forge from 'node-forge';

export const JAVASCRIPT_KEYWORDS = {
  Array: 'Array',
  await: 'await',
  Boolean: 'Boolean',
  break: 'break',
  case: 'case',
  catch: 'catch',
  class: 'class',
  const: 'const',
  continue: 'continue',
  Date: 'Date',
  debugger: 'debugger',
  default: 'default',
  delete: 'delete',
  do: 'do',
  else: 'else',
  enum: 'enum',
  eval: 'eval',
  export: 'export',
  extends: 'extends',
  false: 'false',
  finally: 'finally',
  for: 'for',
  function: 'function',
  Function: 'Function',
  hasOwnProperty: 'hasOwnProperty',
  if: 'if',
  implements: 'implements',
  import: 'import',
  in: 'in',
  Infinity: 'Infinity',
  instanceof: 'instanceof',
  interface: 'interface',
  isFinite: 'isFinite',
  isNaN: 'isNaN',
  isPrototypeOf: 'isPrototypeOf',
  JSON: 'JSON',
  length: 'length',
  let: 'let',
  Math: 'Math',
  name: 'name',
  NaN: 'NaN',
  new: 'new',
  null: 'null',
  Number: 'Number',
  Object: 'Object',
  package: 'package',
  private: 'private',
  protected: 'protected',
  public: 'public',
  return: 'return',
  static: 'static',
  String: 'String',
  super: 'super',
  switch: 'switch',
  this: 'this',
  throw: 'throw',
  toString: 'toString',
  true: 'true',
  try: 'try',
  typeof: 'typeof',
  undefined: 'undefined',
  valueOf: 'valueOf',
  var: 'var',
  void: 'void',
  while: 'while',
  with: 'with',
  yield: 'yield',
};

/**
 *  Global scope Identifiers in the worker context.
 * These identifiers are already present in the worker context and no entity should have
 * same name as them to prevent unexpected behaviour during evaluations in the worker.
 * Check if an identifier (or window object/property) is available in the worker context here => https://worker-playground.glitch.me/
 */
export const GLOBAL_WORKER_SCOPE_IDENTIFIERS = {
  Error: 'Error',
  Promise: 'Promise',
  ReferenceError: 'ReferenceError',
  RegExp: 'RegExp',
  SyntaxError: 'SyntaxError',
  URIError: 'URIError',
  EvalError: 'EvalError',
  RangeError: 'RangeError',
  TypeError: 'TypeError',
  parseInt: 'parseInt',
  parseFloat: 'parseFloat',
  encodeURI: 'encodeURI',
  encodeURIComponent: 'encodeURIComponent',
  decodeURI: 'decodeURI',
  decodeURIComponent: 'decodeURIComponent',
  ArrayBuffer: 'ArrayBuffer',
  DataView: 'DataView',
  Float32Array: 'Float32Array',
  Float64Array: 'Float64Array',
  Int16Array: 'Int16Array',
  Int32Array: 'Int32Array',
  Int8Array: 'Int8Array',
  Map: 'Map',
  Proxy: 'Proxy',
  Reflect: 'Reflect',
  Set: 'Set',
  Symbol: 'Symbol',
  Uint16Array: 'TypedArray',
  Uint32Array: 'TypedArray',
  Uint8Array: 'TypedArray',
  Uint8ClampedArray: 'TypedArray',
  WeakMap: 'WeakMap',
  WeakSet: 'WeakSet',
  // PROPERTIES
  console: 'console',
  location: 'location',
  name: 'name',
  navigator: 'navigator',
  self: 'self',
  //METHODS
  atob: 'atob',
  btoa: 'btoa',
  clearInterval: 'clearInterval',
  clearTimeout: 'clearTimeout',
  close: 'close',
  requestAnimationFrame: 'requestAnimationFrame',
  setInterval: 'setInterval',
  setTimeout: 'setTimeout',
};

export type ExtraLibrary = {
  version: string;
  docsURL: string;
  displayName: string;
  accessor: string;
  lib: any;
};

export const extraLibraries: ExtraLibrary[] = [
  {
    accessor: '_',
    lib: _,
    version: lodashVersion,
    docsURL: `https://lodash.com/docs/${lodashVersion}`,
    displayName: 'lodash',
  },
  {
    accessor: 'moment',
    lib: moment,
    version: moment.version,
    docsURL: `https://momentjs.com/docs/`,
    displayName: 'moment',
  },
  {
    accessor: 'xmlParser',
    lib: parser,
    version: '3.17.5',
    docsURL: 'https://github.com/NaturalIntelligence/fast-xml-parser',
    displayName: 'xmlParser',
  },
  {
    accessor: 'forge',
    // We are removing some functionalities of node-forge because they wont
    // work in the worker thread
    lib: _.omit(forge, ['tls', 'http', 'xhr', 'socket', 'task']),
    version: '1.3.0',
    docsURL: 'https://github.com/digitalbazaar/forge',
    displayName: 'forge',
  },
];

export const GLOBAL_FUNCTIONS = {
  '!name': 'DATA_TREE.APPSMITH.FUNCTIONS',
  navigateTo: {
    '!doc': 'Action to navigate the user to another page or url',
    '!type':
      'fn(pageNameOrUrl: string, params: {}, target?: string) -> +Promise[:t=[!0.<i>.:t]]',
  },
  showAlert: {
    '!doc': 'Show a temporary notification style message to the user',
    '!type': 'fn(message: string, style: string) -> +Promise[:t=[!0.<i>.:t]]',
  },
  showModal: {
    '!doc': 'Open a modal',
    '!type': 'fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]',
  },
  closeModal: {
    '!doc': 'Close a modal',
    '!type': 'fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]',
  },
  storeValue: {
    '!doc': 'Store key value data locally',
    '!type': 'fn(key: string, value: any) -> +Promise[:t=[!0.<i>.:t]]',
  },
  download: {
    '!doc': 'Download anything as a file',
    '!type':
      'fn(data: any, fileName: string, fileType?: string) -> +Promise[:t=[!0.<i>.:t]]',
  },
  copyToClipboard: {
    '!doc': 'Copy text to clipboard',
    '!type': 'fn(data: string, options: object) -> +Promise[:t=[!0.<i>.:t]]',
  },
  resetWidget: {
    '!doc': 'Reset widget values',
    '!type':
      'fn(widgetName: string, resetChildren: boolean) -> +Promise[:t=[!0.<i>.:t]]',
  },
  setInterval: {
    '!doc': 'Execute triggers at a given interval',
    '!type': 'fn(callback: fn, interval: number, id?: string) -> void',
  },
  clearInterval: {
    '!doc': 'Stop executing a setInterval with id',
    '!type': 'fn(id: string) -> void',
  },
};

/**
 * creates dynamic list of constants based on
 * current list of extra libraries i.e lodash("_"), moment etc
 * to be used in widget and entity name validations
 */
export const extraLibrariesNames = extraLibraries.map(
  (library) => library.accessor
);
