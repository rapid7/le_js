function LogInput(options) {

  _token = options.token;
  _that = this;
  // flag to prevent further invocations on network err
  _shouldCall = true;

  _serialize = function(obj) {
    var str = [];
    for(var p in obj)
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  }

  _rawLog = function() {
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
      interpolated = Array.prototype.slice.call(arguments);
      payload = {event: interpolated};
    }
    _apiCall(_token, _serialize(payload));
  }

  this.log = _rawLog;
  this.info = _rawLog;
  this.warn = _rawLog;
  this.error = _rawLog;

  _apiCall = function(token, data) {

    _endpoint = "http://localhost:8080/";

    // Obtain a browser-specific XHR object
    _getAjaxObject = function() {
      if (window.ActiveXObject) {
        window.XMLHttpRequest = function() {
          // IE6 compat
          return new ActiveXObject('Microsoft.XMLHTTP');
        }
      }
      return new XMLHttpRequest();
    }

    request = _getAjaxObject();

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
    if (options.token === undefined)
      throw new Error("Token not present.");
    else
      return new LogInput(options);
  }
};

