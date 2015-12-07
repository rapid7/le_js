/*jshint loopfunc:true*/
/*globals describe, it, expect, LE, sinon, afterEach, beforeEach, jasmine, window, console, spyOn, XDomainRequest, XMLHttpRequest*/
var GLOBAL = this;
var TOKEN = 'test_token';

function destroy() {
    LE.destroy('default');
    LE.destroy(TOKEN);
}

function mockXMLHttpRequests() {
    // Prevent requests
    this.xhr = sinon.useFakeXMLHttpRequest();

    // List requests
    var requestList = this.requestList = [];

    this.xhr.onCreate = function (request) {
        requestList.push(request);
    };
}

function addGetJson() {
    this.getXhrJson = function (xhrRequestId) {
        return JSON.parse(this.requestList[xhrRequestId].requestBody);
    };
}

function restoreXMLHttpRequests() {
    if (this.xhr) {
        this.xhr.restore();
    }
}

describe('construction', function () {
    it('with string', function () {
        expect(LE.init(TOKEN)).toBe(true);
    });

    it('with object', function () {
        expect(LE.init({
            token: TOKEN
        })).toBe(true);
    });

    // TODO: Test Raul's multi logger

    describe('fails', function () {
        it('without token', function () {
            expect(LE.init).toThrow("Invalid parameters for init()");
        });

        it('without token (object)', function () {
            expect(function () {
                LE.init({});
            }).toThrow("Token not present.");
        });
    });

    afterEach(destroy);
});

describe('sending messages', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(addGetJson);
    beforeEach(function () {
        LE.init({
            token: TOKEN,
            trace: true
        });
    });

    it('logs null values', function () {
        LE.log(null);

        expect(this.getXhrJson(0).event).toBe(null);
    });

    it('logs undefined values', function () {
        LE.log(undefined);

        expect(this.getXhrJson(0).event).toBe('undefined');
    });

    it('logs object with nullish properties', function () {
        LE.log({
            undef: undefined,
            nullVal: null
        });

        var event = this.getXhrJson(0).event;
        expect(event.undef).toBe('undefined');
        expect(event.nullVal).toBe(null);
    });

    it('logs array with nullish values', function () {
        LE.log([
            undefined,
            null
        ]);

        var event = this.getXhrJson(0).event;
        expect(event[0]).toBe('undefined');
        expect(event[1]).toBe(null);
    });

    it('sends trace code', function () {
        LE.log('test');

        var trace = this.getXhrJson(0).trace;
        expect(trace).toEqual(jasmine.any(String));
        expect(trace.length).toBe(8);
    });

    it('accepts multiple arguments', function () {
        var args = ['test', 1, undefined];

        LE.log.apply(LE, args);

        var event = this.getXhrJson(0).event;
        expect(event.length).toBe(3);
        expect(event[0]).toBe(args[0]);
        expect(event[1]).toBe(args[1]);
        expect(event[2]).toBe('undefined');
    });

    afterEach(destroy);
});

describe('sends log level', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(addGetJson);
    beforeEach(function () {
        LE.init({
            token: TOKEN
        });
    });

    var methods = [
        'log',
        'info',
        'warn',
        'error'
    ];

    for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var level = method.toUpperCase();

        it(level, function (method, level) {
            return function () {
                LE[method]('test');
                expect(this.getXhrJson(0).level).toBe(level);
            };
        }(method, level));
    }

    it('excludes cyclic values', function () {
        var a = {};
        a.b = a;

        LE.log(a);

        expect(this.getXhrJson(0).event.b).toBe('<?>');
    });

    afterEach(restoreXMLHttpRequests);
    afterEach(destroy);
});

describe('sending user agent data', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(addGetJson);

    function checkAgentInfo(agent) {
        expect(agent).toBeDefined();

        // Perhaps these could be filled in since we're running in a
        // real browser now?
        expect(agent.url).toBeDefined();
        expect(agent.referrer).toBeDefined();
        expect(agent.screen).toBeDefined();
        expect(agent.window).toBeDefined();
        expect(agent.browser).toBeDefined();
        expect(agent.platform).toBeDefined();
    }

    it('page_info: never - never sends log data', function () {
        LE.init({
            token: TOKEN,
            page_info: 'never'
        });

        LE.log('hi');

        var data = this.getXhrJson(0);

        expect(data.event).toBe('hi');
        expect(this.getXhrJson(0).agent).toBeUndefined();
    });

    it('page_info: per-entry - sends log data for each log', function () {
        LE.init({
            token: TOKEN,
            page_info: 'per-entry'
        });

        LE.log('hi');

        // Check data is sent the first time
        checkAgentInfo(this.getXhrJson(0).event);

        // Respond to first request so that the 2nd request will be made
        this.requestList[0].respond();

        expect(this.getXhrJson(1).event).toBe('hi');

        LE.log('hi again');
        this.requestList[1].respond();

        // Check that page info is sent subsequent times
        checkAgentInfo(this.getXhrJson(2).event);

        this.requestList[2].respond();

        expect(this.getXhrJson(3).event).toBe('hi again');
    });

    it('page_info: per-page - always sends data for each log', function () {
        LE.init({
            token: TOKEN,
            page_info: 'per-page'
        });

        LE.log('hi');

        // Check data is sent the first time
        checkAgentInfo(this.getXhrJson(0).event);

        // Respond to first request so that the 2nd request will be made
        this.requestList[0].respond();

        expect(this.getXhrJson(1).event).toBe('hi');

        LE.log('hi again');
        this.requestList[1].respond();

        // Check that no data is sent subsequent times
        expect(this.getXhrJson(2).event).toBe('hi again');
    });

    afterEach(destroy);
});

describe('catch all option', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(function () {
        this.oldErrorHandler = sinon.stub(GLOBAL, 'onerror')
            .returns(true);
    });

    it('assigns onerror handler', function () {
        LE.init({
            token: TOKEN,
            catchall: true
        });
        // Don't test if onerror is set because #1 we've got a stub
        // and 2nd, karma has its handler.
        expect(GLOBAL.onerror).not.toBe(this.oldErrorHandler);
    });

    it('sends errors', function () {
        // Don't care what happens to this, just ignore the error
        LE.init({
            token: TOKEN,
            catchall: true
        });

        // Check if onerror handler is not the stub from above
        expect(GLOBAL.onerror).not.toBe(this.oldErrorHandler);

        expect(this.requestList.length).toBe(0);

        // Pretend to trigger an error like the browser might
        GLOBAL.onerror('Script error', 'http://example.com', 0);

        expect(this.requestList.length).toBe(1);
    });

    it('bubbles onerror calls', function () {
        LE.init({
            token: TOKEN,
            catchall: true
        });

        // Pretend to trigger an error like the browser might
        GLOBAL.onerror('Script error', 'http://example.com', 0);

        expect(this.oldErrorHandler.calledOnce).toBe(true);
    });

    afterEach(function () {
        if (this.oldErrorHandler.restore) {
            this.oldErrorHandler.restore();
        }
    });
    afterEach(restoreXMLHttpRequests);
    afterEach(destroy);
});

describe('destroys log streams', function () {
    it('default', function () {
        LE.init(TOKEN);
        LE.destroy();

        expect(function () {
            LE.init(TOKEN);
        }).not.toThrow();
    });

    it('custom name', function () {
        LE.init({
            token: TOKEN,
            name: 'test'
        });
        LE.destroy('test');

        expect(function () {
            LE.init({
                token: TOKEN,
                name: 'test'
            });
        }).not.toThrow();
        LE.destroy('test');
    });

    afterEach(destroy);
});

describe('no_format option', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(addGetJson);

    it('Should send data to noformat if no format is enabled', function () {
        LE.init({
            token: TOKEN,
            no_format: true
        });
        LE.log('some message');
        var url = this.requestList[0].url;
        expect(url).toContain("noformat");
    });

    it('Should send data to js if no format is disabled', function () {
        LE.init({
            token: TOKEN,
            no_format: false
        });
        LE.log('some message');
        var url = this.requestList[0].url;
        expect(url).toContain("v1");
    });

    afterEach(restoreXMLHttpRequests);
    afterEach(destroy);
});


describe('custom endpoint', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(addGetJson);
    beforeEach(function () {
        window.LEENDPOINT = 'somewhere1.com/custom-logging';
        LE.init({
            token: TOKEN
        });
    });

    it('can be set', function () {
        LE.log('some message');
        var lastReq = this.requestList[0];

        expect(lastReq.url).toBe('https://somewhere1.com/custom-logging/logs/test_token');
    });

    afterEach(restoreXMLHttpRequests);
    afterEach(destroy);
});

describe('print option', function () {
    beforeEach(mockXMLHttpRequests);
    beforeEach(function () {
        spyOn(console, 'log');
        spyOn(console, 'info');
        spyOn(console, 'warn');
        spyOn(console, 'error');
        LE.init({
            token: TOKEN,
            print: true
        });
    });

    it('should log to console also', function () {
        LE.log('some message');
        expect(console.log.mostRecentCall.args[0].trace).toMatch(/[0-9a-z]{8}/);
        expect(console.log.mostRecentCall.args[0].event).toEqual('some message');
        expect(console.log.mostRecentCall.args[0].level).toEqual('LOG');
    });

    it('below IE9 should stringify console messages', function () {
        /*jshint -W020 */
        XDomainRequest = XMLHttpRequest; //trick into thinking we are in IE8/9 browser
        /*jshint +W020 */
        LE.log('some message');
        expect(console.log.mostRecentCall.args[0]).toMatch(/[0-9a-z]{8} some message/);
    });

    afterEach(restoreXMLHttpRequests);
    afterEach(destroy);
});
