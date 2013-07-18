var LE = {};

LE.init = function(options) {
  if (options.token === undefined) {
    throw new Error("Token not present.");
  } else
    return new LogInput(options);
}

LE.global_handler = function(logInput) {
  var oldHandler = window.onerror;
  var newHandler = function(msg, url, line) {
    logInput.log({err: msg, l: line, u: url});
    oldHandler(msg, url, line);
  }
  window.onerror = newHandler;
}

/** @define {string} */
LE.ENDPOINT = "localhost:8080";

/**
 * A single log event stream.
 * @constructor
 * @param {Object} options
 */
function LogInput(options) {

  var _token = options.token;
  var _endpoint = LE.ENDPOINT;
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
      payload = {event: interpolated};
    }
    _apiCall(_token, _serialize(payload));
  }

  this.log = _rawLog;
  this.info = _rawLog;
  this.warn = _rawLog;
  this.error = _rawLog;

  var _getWSObject = function() {
    if (typeof WebSocket !== "undefined") {
      var ws = new WebSocket("ws://" + _endpoint + "/");
      // To prevent state exceptions, (i.e. when the JS interpreter
      // evaluates log() calls before we're connected), we
      // put messages waiting to be sent in a backlog.
      // This gets drained when onopen is invoked.
      ws.backlog = [];
      ws.onclose = function(e) {
        // Do all WS-capable browsers provide a CloseEvent contract?
        // If not, we need a type check.
        if (e.code >= 400) {
          console.warn(e.reason);
          _shouldCall = false;
        }
      }
      ws.onopen = function() {
        // WebSocket impl doesn't allow us to supply
        // the X-LE-Token header during handshake,
        // so we send it now.
        ws.send(_token);
        // Then empty our backlog
        while (!ws.backlog.length == 0)
          ws.send(ws.backlog.pop());
      }
      return ws;
    }
  }

  var _wsObject = _getWSObject();

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

    var request = _wsObject ? _wsObject : _getAjaxObject();

    if (_shouldCall) {
      if (request instanceof WebSocket) {
        if (request.readyState == 1)
          request.send(data);
        else
          request.backlog.unshift(data);
      } else if (request instanceof XMLHttpRequest) {
        // Couldn't obtain a web socket, fall
        // back to AJAX POST
        request.onreadystatechange = function() {
          if (request.readyState === 4 && request.status === 400)
            console.warn("Couldn't submit events. Is your token valid?");
        }
        request.open("POST", "http://" + _endpoint + "/", true);
        request.setRequestHeader('X-LE-Token', token);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(data);
      }
    } else
      return false;
  }
};

