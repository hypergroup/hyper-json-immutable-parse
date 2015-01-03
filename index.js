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
  if (key === 'href' && type === 'string' && value.charAt(0) === '#') return base + value;

  // TODO resolve "/" paths

  if (!value || type !== 'object') return value;

  var obj = Array.isArray(value) ? immutableArray() : Object.create(null);

  var hashCode = 0;

  for (var k in value) {
    if (!value.hasOwnProperty(k)) continue;

    hashCode |= computeHash(k) ^ computeHash(value[k]);

    define(obj, k, {
      enumerable: true,
      value: value[k]
    });
  }

  define(obj, '__hash', {
    value: smi(hashCode)
  });

  if (key === '') seal(base, obj, []);

  return obj;
}

function seal(base, value, path) {
  if (!value || typeof value !== 'object') return;

  for (var k in value) {
    if (k !== 'href') seal(base, value[k], path.concat([k]));
  }

  if (base && !value.href) define(value, 'href', {
    value: base + '#/' + path.join('/')
  });

  Object.freeze(value);
}

function computeHash(item) {
  if (!item) return 0;

  // if the child object already has it use that
  if (item.__hash) return item.__hash;

  return typeof item === 'number' ?
    hashNumber(item) :
    hashString(item);
}

function hashNumber(number) {
  var hash = number | 0;
  while (number > 0xFFFFFFFF) {
    number /= 0xFFFFFFFF;
    hash ^= number;
  }
  return hash;
}

function hashString(string) {
  var hash = 0;
  for (var i = 0, l = string.length; i < l; i++) {
    hash = 31 * hash + string.charCodeAt(i) | 0;
  }
  return smi(hash);
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
