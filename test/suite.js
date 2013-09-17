wru.test([
  {
    name: 'single arg stream construction',
    test: function() {
      wru.assert(true, LE.init('TOKEN'));
    }
  },
  {
    name: 'basic stream construction with dict',
    test: function() {
      wru.assert(true, LE.init({token: 'foo'}));
    }
  },
  {
    name: 'submit simple string event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data ===
          '{\"event\":\"Hello, world!\",\"level\":\"LOG\"}');
      }
      LE.init({token:'foo', trace: false});
      LE.log("Hello, world!");
    }
  },
  {
    name: 'submit interpolated string event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === 'Hello, 1 more...');
      }
      LE.init({token:'foo'});
      LE.log("Hello,", 1, "more...");
    }
  },
  {
    name: 'submit array of strings',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === 'Hello, logger');
      }
      LE.init({token:'foo'});
      LE.log("Hello,", "logger");
    }
  },
  {
    name: 'submit object event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event']['Hello'] === 'world!');
      }
      LE.init({token:'foo'});
      LE.log({"Hello": "world!"});
    }
  },
  {
    name: 'init cannot work without token',
    test: function() {
      var didFail = false;
      try {
        var le = LE.init();
      } catch (err) {
        wru.assert(err.message === "Invalid parameters for init()");
        wru.assert(true, le === undefined);
        didFail = true;
      }

      wru.assert(true, didFail);
    }
  },
  {
    name: 'init cannot work without token (with object param)',
    test: function() {
      var didFail = false;
      try {
        var le = LE.init({});
      } catch (err) {
        wru.assert(err.message === "Token not present.");
        wru.assert(true, le === undefined);
        didFail = true;
      }

      wru.assert(true, didFail);
    }
  },
  {
    name: 'test catchall handler assigned',
    test: function() {
      LE.init({token: 'SOME-TOKEN', catchall: true});
      wru.assert(true, onerror !== undefined);
    }
  },
  {
    name: 'test catchall handler sends POST request',
    test: function() {
      onerror = null;
      LE.init({token: 'SOME-TOKEN', catchall: true});
      var didSend = false;
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        didSend = true;
      }

      onerror(1,2,3);
      wru.assert(true, didSend);
    }
  },
  {
    name: 'test log() with null interpolated values handled properly',
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === 'This is null null');
      }

      LE.log("This is null", null);
    }
  },
  {
    name: 'test log() with undef interpolated values handled properly',
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === 'This is null undefined');
      }

      LE.log("This is null", undefined);
    }
  },
  {
    name: 'test log() with object w/ nullish members handled properly',
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event['some'] === 'data');
        wru.assert(true, parsed.event['complex']['a'] === 'null');
        wru.assert(true, parsed.event['complex']['b'] === 'undefined');
      }

      LE.log({
        some: 'data',
        complex: {
          a: null,
          b: undefined
        }
      });
    }
  },
  {
    name: 'test log() w/ nullish nested array elements',
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event[0] === 'some');
        wru.assert(true, parsed.event[1] === 'event');
        wru.assert(true, typeof parsed.event[2] === "object");
        wru.assert(true, parsed.event[2][1] === "null");
      }

      LE.log(["some", "event", ["nested", null]]);
    }
  },
  {
    name: 'test log() w/ nullish objects + arrays',
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event['complex']['nested'][0] === "null");
        wru.assert(true, parsed.event['complex']['nested'][1][0] === "again");
        wru.assert(true, parsed.event['complex']['some'] === 'undefined');
      }

      LE.log({
        some: 'event',
        complex: {
          nested: [null, ['again']],
          some: undefined
        }
      });
    }
  },
  {
    name: 'test trace code',
    test: function() {
      LE.init({token: 'SOME-TOKEN', trace: true});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === "hi");
        wru.assert(true, parsed['trace'] !== null);
        wru.assert(true, parsed['trace'].length === 8);
      }

      LE.log("hi");
    }
  },
  {
    name: 'test trace code persistence',
    test: function() {
      LE.init({token: 'SOME-TOKEN', trace: true});

      XMLHttpRequest.spy = function(data) {
        wru.assert(true, document.cookie.length != 0);
      }

      LE.log("hi");
    }
  },
  {
    name: 'test page info when never',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'never'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event'] === "hi");
        wru.assert(true, (typeof parsed['agent'] === "undefined"));
      }

      LE.log("hi");
    }
  },
  {
    name: 'test page info per-entry',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-entry'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, (typeof parsed['agent'] !== "undefined"));
        wru.assert(true, parsed['agent']['name'] === "unknown");
        wru.assert(true, parsed['agent']['screenWidth'] === "unknown");
        wru.assert(true, parsed['agent']['screenHeight'] === "unknown");
      }

      LE.log("hi");
    }
  },
  {
    name: 'test page info per-page',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      // first time- should send agent info
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, (typeof parsed['agent'] !== "undefined"));
        wru.assert(true, parsed['agent']['name'] === "unknown");
        wru.assert(true, parsed['agent']['screenWidth'] === "unknown");
        wru.assert(true, parsed['agent']['screenHeight'] === "unknown");
      }

      LE.log("hi");

      // agent info has been sent already;
      // we shouldn't expect it again
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, (typeof parsed['agent'] === "undefined"));
      }

      LE.log("hi");
    }
  },
  {
    name: 'test LOG level',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'LOG');
      }

      LE.log("hi");
    }
  },
  {
    name: 'test INFO level',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'INFO');
      }

      LE.info("hi");
    }
  },
  {
    name: 'test WARN level',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'WARN');
      }

      LE.warn("hi");
    }
  },
  {
    name: 'test ERROR level',
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'ERROR');
      }

      LE.error("hi");
    }
  }
]);
