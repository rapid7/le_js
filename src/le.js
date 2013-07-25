/**
* @license Copyright 2013 Logentries.
* Please view license at https://raw.github.com/logentries/le_js/master/LICENSE
*/

var LE = (function(window) {

  /**
   * A single log event stream.
   * @constructor
   * @param {Object} options
   */
  function LogStream(options) {
    /** @type {string} */
    var _token = options.token;
    /** @type {string} */
    var _endpoint = LE.ENDPOINT;

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
        _rawLog({err: msg, l: line, u: url});
        if (oldHandler) oldHandler(msg, url, line);
      }
      window.onerror = newHandler;
    }

    var _serialize = function(obj) {
      var str = [];
      for(var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    }

    // Single param stops the compiler
    // complaining about wrong arity.
    var _rawLog = function(msg) {
      var payload = {};
      if (arguments.length === 1) {
        var raw = arguments[0];
        if (typeof raw === "string") {
          payload = {event: raw};
        } else if (typeof raw === "object")
          payload = raw;
      } else {
        // Handle a variadic string overload,
        // e.g. _rawLog("some text ", x, " ...", 1);
        var interpolated = Array.prototype.slice.call(arguments);
        payload = {event: interpolated};
      }

      _apiCall(_token, _serialize(payload));
    }

    /** @expose */
    this.log = _rawLog;

    var _getWSObject = function() {
      if (typeof WebSocket !== "undefined") {
        var scheme = (_SSL ? "wss://" : "ws://") + _endpoint + "/";
        var ws = new WebSocket(scheme);
        // To prevent state exceptions, (i.e. when the JS interpreter
        // evaluates log() calls before we're connected), we
        // put messages waiting to be sent in a backlog.
        // This gets drained when onopen is invoked.
        ws.onclose = function(e) {
          // Do all WS-capable browsers provide a CloseEvent contract?
          // If not, we need a type check.
          if (e.code >= 400) {
            console.warn(e);
            _shouldCall = false;
          }
        }
        ws.onopen = function() {
          // WebSocket impl doesn't allow us to supply
          // the X-LE-Token header during handshake,
          // so we send it now.
          ws.send(_token);
          // Then empty our backlog
          while (!_backlog.length == 0)
            ws.send(_backlog.pop());
        }
        return ws;
      }
      return false;
    }

    var _wsObject;

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

      // Attempt to establish a WS connection if
      // we don't already have one
      if (typeof _wsObject === "undefined") _wsObject = _getWSObject();

      var request = _wsObject ? _wsObject : _getAjaxObject();

      if (_shouldCall) {
        if (request instanceof XMLHttpRequest) {
          // Couldn't obtain a web socket, fall
          // back to AJAX POST
          request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 400)
              console.warn("Couldn't submit events. Is your token valid?");
          }
          var uri = (_SSL ? "https://" : "http://") + _endpoint + "/";
          request.open("POST", uri, true);
          request.setRequestHeader('X-LE-Token', token);
          request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          request.send(data);
        } else {
          // Using WebSocket
          if (request.readyState == 1)
            request.send(data);
          else
            _backlog.unshift(data);
        }
      }
    }
  }

  var logger;

  var _init = function(options) {
    var dict = {};
    if (typeof options === "string")
      dict.token = options;
    else if (typeof options === "object")
      dict = options;

    // Disable for now
    dict.ssl = false;

    dict.onerror = dict.onerror || false;

    if (dict.token === undefined) {
      throw new Error("Token not present.");
    } else {
      logger = new LogStream(options);
    }

    return true;
  };

  var _log = function() {
    if (logger) {
      logger.log.apply(this, arguments);
    } else
      throw new Error("You must call LE.init(...) to start logging.");
  }

  return {
    init: _init,
    log: _log
  };
} (this));

/** @define {string} */
LE.ENDPOINT = "localhost:8080";
