/**
 * A single log event stream.
 * @constructor
 * @param {Object} options
 */
function LogInput(options) {

  var _token = options.token;
  var _that = this;
  // flag to prevent further invocations on network err
  var _shouldCall = true;

  var _serialize = function(obj) {
    var str = [];
    for(var p in obj)
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  }

  var _rawLog = function() {
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
      var payload = {event: interpolated};
    }
    _apiCall(_token, _serialize(payload));
  }

  this.log = _rawLog;
  this.info = _rawLog;
  this.warn = _rawLog;
  this.error = _rawLog;

  var _apiCall = function(token, data) {

    var _endpoint = "http://localhost:8080/";

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

    if (request && _shouldCall) {
      request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 400)
          console.warn("Couldn't submit events. Is your token valid?");
      }
      request.open("POST", _endpoint, true);
      request.setRequestHeader('X-LE-Token', token);
      request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      request.send(data);
    }
  }
};

var LE = {
  init: function(options) {
    if (options.token === undefined) {
      throw new Error("Token not present.");
      return false;
    } else
      return new LogInput(options);
  },
  global_handler: function(logInput) {
    var oldHandler = window.onerror;
    var newHandler = function(msg, url, line) {
      logInput.log({err: msg, l: line, u: url});
      oldHandler(msg, url, line);
    }
    window.onerror = newHandler;
  }
};

