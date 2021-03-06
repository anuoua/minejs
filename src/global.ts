const $global = global || window

export const globalObj = {
  this: $global,
  self: $global,
  Array,
  ArrayBuffer,
  Boolean,
  Buffer,
  DataView,
  Date,
  Error,
  EvalError,
  Float32Array,
  Float64Array,
  Function,
  GLOBAL: $global,
  Infinity,
  Int16Array,
  Int32Array,
  Int8Array,
  Intl,
  JSON,
  Map,
  Math,
  NaN,
  Number,
  Object,
  Promise,
  RangeError,
  ReferenceError,
  RegExp,
  Set,
  String,
  Symbol,
  SyntaxError,
  TypeError,
  URIError,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
  WeakMap,
  WeakSet,
  clearImmediate,
  clearInterval,
  clearTimeout,
  console,
  decodeURI,
  decodeURIComponent,
  encodeURI,
  encodeURIComponent,
  escape,
  eval,
  global,
  isFinite,
  isNaN,
  parseFloat,
  parseInt,
  process,
  root: $global,
  setImmediate,
  setInterval,
  setTimeout,
  // queueMicrotask,
  undefined,
  unescape,
  // gc,
  // v8debug,
}