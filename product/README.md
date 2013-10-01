le.js
=====

Production builds live in here.

Contents
--------

Several files are produced in the build. Normally you'll just want to use __le.min.js__ on your site.

* __le.ls__: JS client library, unminified
* __le.min.js__: JS client library, minified
* __le.dyn.js__: JS client library with CommonJS + dyn.js compatibility

Note for client developers
--------------------------

Builds are auto-generated through `ant package`. If you alter them by hand, expect them to be overwritten the next time you run the task!