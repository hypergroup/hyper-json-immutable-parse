/**
 * Expose the parse function
 */

module.exports = function(href, key, value) {
  var l = arguments.length;
  if (l === 1) return parse.bind(null, href);
  if (l == 2) return parse('', href, key);
  return parse(href, key, value);
};

/**
 * Define a property
 */

var define = Object.defineProperty;

/**
 * Parse a key value pair
 *
 * @param {String} href
 * @param {String} key
 * @param {Any} value
 */

function parse(base, key, value) {
  var type = typeof value;

  // resolve local JSON pointers
  if (key === 'href' && type === 'string') return formatHref(base, value);

  // TODO resolve "/" paths
  if (!value || type !== 'object') return value;

  var obj = copy(value);

  if (key === '') seal(base || obj.href, obj, []);

  return obj;
}

function formatHref(base, href) {
  if (href.charAt(0) === '#') return (base || '') + href;

  // sort the query params so they're consistent
  var parts = href.split('?');
  var qs = parts[1] ? '?' + parts[1].split('&').sort().join('&') : '';
  if (qs === '?') qs = '';

  return parts[0] + qs;
}

function copy(value) {
  var obj = Array.isArray(value) ? immutableArray() : {};

  var hashCode = 0;
  var keys = Object.keys(value);
  for (var i = 0, l = keys.length, k; i < l; i++) {
    k = keys[i];
    if (!value.hasOwnProperty(k)) continue;

    hashCode = smi(appendHash(appendHash(hashCode, computeHash(k)), computeHash(value[k])));

    define(obj, k, {
      enumerable: true,
      value: value[k]
    });
  }

  define(obj, '__hash', {
    value: smi(hashCode)
  });

  return obj;
}

function seal(base, value, path, shouldDefineHref) {
  if (!value || typeof value !== 'object') return;

  var isCollection;
  for (var k in value) {
    isCollection = k === 'collection' || k === 'data';
    seal(base,
         value[k],
         (isCollection ? path : path.concat([k])),
         isCollection);
  }

  if (shouldDefineHref && !value.href) {
    if (!base) process.env.NODE_ENV !== 'production' && console.warn('collection missing base href. unexpected behavior may occur.', value);
    else define(value, 'href', {
      value: base + (path.length ? '#/' + path.join('/') : '')
    });
  }

  Object.freeze(value);
}

function computeHash(item) {
  var type = typeof item;
  if (type === 'undefined' || item === null) return 0;
  if (type === 'number') return hashNumber(item);
  if (item.__hash) return item.__hash;
  if (type !== 'string') item = JSON.stringify(item);
  return hashString(item);
}

function hashNumber(number) {
  var hash = number | 0;
  while (number > 0xFFFFFFFF) {
    number /= 0xFFFFFFFF;
    hash ^= number;
  }
  return smi(hash);
}

function hashString(string) {
  var hash = 0;
  for (var i = 0, l = string.length; i < l; i++) {
    hash = appendHash(hash, string.charCodeAt(i));
  }
  return smi(hash);
}

function appendHash(hash, code) {
  return 31 * hash + code | 0;
}

function smi(i32) {
  return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
}

/**
 * Make descriptors for impure functions
 */

var impureArrayFunctions = [
  'pop',
  'push',
  'shift',
  'unshift',
  'splice'
].reduce(function(acc, key) {
  acc[key] = funcDescriptor(key);
  return acc;
}, {});

/**
 * Create an immutable array
 */

function immutableArray() {
  return Object.defineProperties([], impureArrayFunctions);
}

/**
 * Create a descriptor for an invalid function
 */

function funcDescriptor(prop) {
  return {
    value: function() {
      throw new TypeError('Attempted to mutate an immutable object with Array.prototype.' + prop + '()');
    }
  };
}
