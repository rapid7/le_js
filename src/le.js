/**
* @license Copyright 2013 Logentries.
* Please view license at https://raw.github.com/logentries/le_js/master/LICENSE
*/

var LE = (function(window) {
  "use strict";

  /**
   * A single log event stream.
   * @constructor
   * @param {Object} options
   */
  function LogStream(options) {
    /**
     * @const
     * @type {string} */
    var _tracecode = (Math.random() + Math.PI).toString(36).substring(2,10);
    /** @type {boolean} */
    var _doTrace = options.trace;
    /** @type {string} */
    var _token = options.token;
    /**
     * @const
     * @type {string} */
    var _endpoint = "localhost:8080";

    /**
     * Flag to prevent further invocations on network err
     ** @type {boolean} */
    var _shouldCall = true;
    /** @type {boolean} */
    var _SSL = options.ssl;
    /** @type {Array.<string>} */
    var _backlog = [];
    /** @type {boolean} */
    var _active = false;

    if (options.catchall) {
      var oldHandler = window.onerror;
      var newHandler = function(msg, url, line) {
        _rawLog({error: msg, line: line, url: url});
        if (oldHandler) oldHandler(msg, url, line);
      }
      window.onerror = newHandler;
    }

    var _serialize = function(obj) {
      var str = [];
      for(var p in obj)
        str.push(p + "=" + obj[p]);
      return str.join("&");
    }

    // Single param stops the compiler
    // complaining about wrong arity.
    var _rawLog = function(msg) {
      var payload = {};
      if (arguments.length === 1) {
        var raw = arguments[0];
        if (typeof raw === "string") {
          payload = raw;
        } else if (typeof raw === "object")
          payload = _serialize(raw);
      } else {
        // Handle a variadic overload,
        // e.g. _rawLog("some text ", x, " ...", 1);
        var interpolated = Array.prototype.slice.call(arguments);
        var objects = [];
        for (var i = 0; i < interpolated.length; i++) {
          if (interpolated[i] === null) {
            objects.push("null");
          } else if (interpolated[i] === undefined) {
            objects.push("undefined");
          } else
            objects.push(interpolated[i]);
        }
        payload = objects.join(" ");
      }

      if (_active) {
        _backlog.push(payload);
      } else {
        _apiCall(_token, payload);
      }
    }

    /** @expose */
    this.log = _rawLog;

    var _apiCall = function(token, data) {
      _active = true;

      // Obtain a browser-specific XHR object
      var _getAjaxObject = function() {
        if (window.ActiveXObject) {
          window.XMLHttpRequest = function() {
            // IE6 compat
            return new ActiveXObject('Microsoft.XMLHTTP');
          }
        }
        return new XMLHttpRequest();
      }

      var request = _getAjaxObject();

      if (_shouldCall) {
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
            if (request.status >= 400) {
              console.warn("Couldn't submit events.");
            } else {
              if (_backlog.length > 0) {
                // Submit the next event in the backlog
                _apiCall(token, _backlog.shift());
              } else {
                _active = false;
              }
            }
          }

        }
        var uri = (_SSL ? "https://" : "http://") + _endpoint + "/logs/" + _token;
        request.open("POST", uri, true);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(data);
      }
    }
  }

  var logger;

  var _init = function(options) {
    var dict = {ssl: true};
    if (typeof options === "object")
      for (var k in options)
        dict[k] = options[k];
    else if (typeof options === "string")
      dict.token = options;

    dict.catchall = dict.catchall || false;
    dict.trace = dict.trace || false;

    if (dict.token === undefined) {
      throw new Error("Token not present.");
    } else {
      logger = new LogStream(dict);
    }

    return true;
  };

  var _log = function() {
    if (logger) {
      logger.log.apply(this, arguments);
    } else
      throw new Error("You must call LE.init(...) first.");
  }

  return {
    init: _init,
    log: _log
  };
} (this));
