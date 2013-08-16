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

    if (options.onerror) {
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
        // Handle a variadic string overload,
        // e.g. _rawLog("some text ", x, " ...", 1);
        var interpolated = Array.prototype.slice.call(arguments);
        payload = interpolated;
      }

      _apiCall(_token, payload);
    }

    /** @expose */
    this.log = _rawLog;

    var _apiCall = function(token, data) {

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
          if (request.readyState === 4 && request.status === 400)
            console.warn("Couldn't submit events. Is your token valid?");
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

    dict.onerror = dict.onerror || false;

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
