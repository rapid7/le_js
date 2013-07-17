function LogInput(options) {

  _token = options.token;
  _that = this;

  _rawLog = function() {
    _apiCall(_token, arguments[0]);
  }

  this.log = _rawLog;
  this.info = _rawLog;
  this.warn = _rawLog;
  this.error = _rawLog;

  _apiCall = function(token, data) {

    _endpoint = "http://localhost:8080/";

    // Obtain a browser-specific XHR object
    _getAjaxObject = function() {
      if (window.ActiveXObject)
        return new ActiveXObject('Microsoft.XMLHTTP');
      else if (window.XMLHttpRequest)
        return new XMLHttpRequest();
      return false;
    }

    request = _getAjaxObject();

    if (request) {
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

    return new LogInput(options);
  }
};

