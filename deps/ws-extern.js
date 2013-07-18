var WebSocket = function(uri) {
  var that = this;
  this.readyState = 0;
  this.onclose = function() {};
  this.onopen = function() {};
  this.send = function(data) {
    that.data = data;
    WebSocket.spy(data);
  }
  this.data = null;
}

WebSocket.spy = function() {};

