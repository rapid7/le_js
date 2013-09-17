/**
 * @license Copyright 2013 Logentries.
 * Please view license at https://raw.github.com/logentries/le_js/master/LICENSE
 */

/** @param {Object} window */
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
        var _traceCode = (Math.random() + Math.PI).toString(36).substring(2, 10);
        /** @type {boolean} */
        var _doTrace = options.trace;
        /** @type {string} */
        var _pageInfo = options.page_info;
        /** @type {string} */
        var _token = options.token;
        /** @type {boolean} */
        var _print = options.print;
        /**
         * @const
         * @type {string} */
        var _endpoint = "localhost:8080/v1";

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
        /** @type {boolean} */
        var _sentPageInfo = false;

        if (options.catchall) {
            var oldHandler = window.onerror;
            var newHandler = function(msg, url, line) {
                _rawLog({error: msg, line: line, url: url}).level('ERROR').send();
                if (oldHandler)
                    return oldHandler(msg, url, line);
                return true;
            };
            window.onerror = newHandler;
        }

        var _agentInfo = function() {
            if (typeof "window" !== undefined) {
                var navigator = window.navigator || {};
                window.screen = window.screen || {};
                window.location = window.location || {};
                return {
                    path: window.location.pathname,
                    name: navigator.userAgent,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight
                };
            } else
                return {};
        };

        var _isComplex = function(obj) {
            return (typeof obj === "object" || Array.isArray(obj)) && obj !== null;
        };

        var _prettyPrint = function(obj) {
            if (typeof obj === "undefined") {
                return "undefined";
            } else if (obj === null) {
                return "null";
            } else {
                return obj;
            }
        };

        // Traverses a log object,
        // turning nullish values into
        // string literals
        var _serialize = function(obj) {
            if (_isComplex(obj)) {
                for (var o in obj) {
                    obj[o] = _serialize(obj[o]);
                }
                return obj;
            } else {
                return _prettyPrint(obj);
            }
        };

        var _getEvent = function() {
            var raw = null;
            var args = Array.prototype.slice.call(arguments);
            if (args.length === 0) {
                throw new Error("No arguments!");
            } else if (args.length === 1) {
                raw = args[0];
            } else {
                // Handle a variadic overload,
                // e.g. _rawLog("some text ", x, " ...", 1);
                raw = _serialize(args).join(" ");
            }
            return raw;
        };

        // Single arg stops the compiler arity warning
        var _rawLog = function(msg) {
            // Send agent info first if required
            if (_pageInfo !== 'never' && !_sentPageInfo) {
                _sentPageInfo = true;
                _rawLog(_agentInfo()).level('LOG').send();
            }

            var event = _getEvent.apply(this, arguments);

            var data = {event: event};

            // Add trace code if required
            if (_doTrace) {
                data.trace = _traceCode;
            }

            return {level: function(l) {
                    if (_print && typeof console !== "undefined") {
                        console[l.toLowerCase()].call(console, data);
                    }
                    data.level = l;

                    return {send: function() {
                            var serialized = JSON.stringify(_serialize(data));

                            if (_active) {
                                _backlog.push(serialized);
                            } else {
                                _apiCall(_token, serialized);
                            }
                        }};
                }};
        };

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
                    };
                }
                return new XMLHttpRequest();
            };

            var request = _getAjaxObject();

            if (_shouldCall) {
                request.onreadystatechange = function() {
                    if (request.readyState === 4) {
                        // Handle any errors
                        if (request.status >= 400) {
                            console.error("Couldn't submit events.");
                            if (request.status === 410) {
                                // This API version has been phased out
                                console.warn("This version of le_js is no longer supported!");
                            }
                        } else {
                            if (request.status === 301) {
                                // Server issued a deprecation warning
                                console.warn("This version of le_js is deprecated! Consider upgrading.");
                            }
                            if (_backlog.length > 0) {
                                // Submit the next event in the backlog
                                _apiCall(token, _backlog.shift());
                            } else {
                                _active = false;
                            }
                        }
                    }

                };
                var uri = (_SSL ? "https://" : "http://") + _endpoint + "/logs/" + _token;
                request.open("POST", uri, true);
                request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                request.setRequestHeader('Content-type', 'text/json');
                request.send(data);
            }
        };

    }

    var logger;

    var _init = function(options) {
        // Default values
        var dict = {
            ssl: true,
            catchall: false,
            trace: true,
            page_info: 'never',
            print: false
        };

        if (typeof options === "object")
            for (var k in options)
                dict[k] = options[k];
        else if (typeof options === "string")
            dict.token = options;
        else
            throw new Error("Invalid parameters for init()");

        if (dict.token === undefined) {
            throw new Error("Token not present.");
        } else {
            logger = new LogStream(dict);
        }

        return true;
    };

    var _log = function() {
        if (logger) {
            return logger.log.apply(this, arguments);
        } else
            throw new Error("You must call LE.init(...) first.");
    };

    // The public interface
    return {
        init: _init,
        log: function() {
            _log.apply(this, arguments).level('LOG').send();
        },
        warn: function() {
            _log.apply(this, arguments).level('WARN').send();
        },
        error: function() {
            _log.apply(this, arguments).level('ERROR').send();
        },
        info: function() {
            _log.apply(this, arguments).level('INFO').send();
        }
    };
}(this));
