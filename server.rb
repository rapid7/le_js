require 'time'
require 'eventmachine'

$accept = lambda {
  "HTTP/1.1 200 OK\r
Date: #{Time.now.httpdate}\r
Server: EM\r
Access-Control-Allow-Origin: null\r
Access-Control-Allow-Methods: POST\r
Access-Control-Allow-Headers: x-le-token, origin, x-requested-with, connection, content-type\r
Content-Encoding: gzip\r
Content-Length: 0\r
Connection: keep-alive\r
Content-Type: text/plain\r\n\r\n"
}

module LogServer
  def receive_data(data)
    p data.split("\r\n\r\n").last if data.split("\r\n\r\n").length == 2
      resp = $accept.call
      send_data resp
    end
end

EM.run do
  EM.start_server "0.0.0.0", 8080, LogServer
end
