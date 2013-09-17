var window = {};
var document = {cookie: ""};

var XMLHttpRequest = function() {
  var that = this;

  this.onreadystatechange = null;
  this.readyState = null;
  this.status = null;
  this.open = function() {};
  this.setRequestHeader = function() {};
  this.send = function(data) {
    that.data = data;
    that.readyState = 4;
    that.status = 204;
    XMLHttpRequest.spy(data);
  };
  this.data = null;
}

XMLHttpRequest.spy = function() {};

window.XMLHttpRequest = XMLHttpRequest;
