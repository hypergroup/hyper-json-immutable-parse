hyper-json-immutable-parse
==========================

parse a hyper+json document into an immutable value

Usage
-----

```js
var parse = require('hyper-json-immutable-parse');

JSON.parse('{"users": [{"href": "/users/1"}, {"href": "/users/2"}, {"href": "/users/3"}]}', parse);
```
