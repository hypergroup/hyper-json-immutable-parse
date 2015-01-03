/**
 * Module dependencies
 */

var assert = require('should');
var parse = require('..');

describe('hyper-json-immutable-parse', function() {
  'use strict';

  it('should freeze a parsed object', function() {
    var obj = JSON.parse('{"foo":{"bar": "baz"},"test":[]}', parse);
    assert.throws(function() {
      obj.foo = 1;
    });
    assert.throws(function() {
      obj.other = true;
    });
    assert.throws(function() {
      obj.test.push(1);
    });
  });

  it('should resolve local JSON pointers', function() {
    var base = 'http://example.com';
    var obj = JSON.parse('{"href": "/", "user": {"name": {"href": "#/name"}}, "name": "Joe"}', parse(base));
    assert.equal(obj.user.name.href, base + '#/name');
  });

  it('should create a __hash for object comparison', function() {
    var str = '{"href": "other", "foo": {"bar": "baz"}}';
    assert.equal(JSON.parse(str, parse).__hash, JSON.parse(str, parse).__hash);
  });
});
