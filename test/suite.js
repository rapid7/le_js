wru.test([
  {
    name: 'single arg stream construction',
    setup: reloadContext,
    test: function() {
      wru.assert(true, LE.init('TOKEN'));
    }
  },
  {
    name: 'basic stream construction with dict',
    setup: reloadContext,
    test: function() {
      wru.assert(true, LE.init({token: 'foo'}));
    }
  },
  {
    name: 'submit simple string event',
    setup: reloadContext,
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
    setup: reloadContext,
    test: function() {
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        var expected = ["Hello,", 1, "more..."];

        for (var element in expected) {
          wru.assert(true, parsed['event'][element] === expected[element]);
        }
      }
      LE.init({token:'foo'});
      LE.log("Hello,", 1, "more...");
    }
  },
  {
    name: 'submit interpolated event with nested object',
    setup: reloadContext,
    test: function() {
      var x = {test: true, key: "spaced value"};

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        var expected = ["Hello", x];

        for (var element in expected) {
          if (typeof expected[element] === "object") {
            var obj = expected[element];
            for (var k in obj) {
              wru.assert(true, parsed['event'][element][k] === obj[k]);
            }
          } else {
            wru.assert(true, parsed['event'][element] === expected[element]);
          }
        }
      }
      LE.init({token:'foo'});

      LE.log("Hello", x);
    }
  },
  {
    name: 'submit variadic list of strings',
    setup: reloadContext,
    test: function() {
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        var expected = ["Hello,", "logger"];

        for (var element in expected) {
          wru.assert(true, parsed['event'][element] === expected[element]);
        }
      }
      LE.init({token:'foo'});
      LE.log("Hello,", "logger");
    }
  },
  {
    name: 'submit object event',
    setup: reloadContext,
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
    setup: reloadContext,
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
    setup: reloadContext,
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
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN', catchall: true});
      wru.assert(true, onerror !== undefined);
    }
  },
  {
    name: 'test catchall handler sends POST request',
    setup: reloadContext,
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
    setup: reloadContext,
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        var expected = ["This is null", null];

        for (var element in expected) {
          wru.assert(true, parsed['event'][element] === expected[element]);
        }
      }

      LE.log("This is null", null);
    }
  },
  {
    name: 'test log() with undef interpolated values handled properly',
    setup: reloadContext,
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        var expected = ["This is null", "undefined"];

        for (var element in expected) {
          wru.assert(true, parsed['event'][element] === expected[element]);
        }
      }

      LE.log("This is null", undefined);
    }
  },
  {
    name: 'test log() with object w/ nullish members handled properly',
    setup: reloadContext,
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event['some'] === 'data');
        wru.assert(true, parsed.event['complex']['a'] === null);
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
    setup: reloadContext,
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event[0] === 'some');
        wru.assert(true, parsed.event[1] === 'event');
        wru.assert(true, typeof parsed.event[2] === "object");
        wru.assert(true, parsed.event[2][1] === null);
      }

      LE.log(["some", "event", ["nested", null]]);
    }
  },
  {
    name: 'test log() w/ nullish objects + arrays',
    setup: reloadContext,
    test: function() {
      LE.init('SOME-TOKEN');

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.event['complex']['nested'][0] === null);
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
    setup: reloadContext,
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
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN', trace: true});

      XMLHttpRequest.spy = function(data) {
          // disabled for now
//        wru.assert(true, document.cookie.length != 0);
      }

      LE.log("hi");
    }
  },
  {
    name: 'test page info when never',
    setup: reloadContext,
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
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-entry'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, (typeof parsed['event'] !== "undefined"));
        wru.assert(true, parsed['event']['screen'] !== "undefined");
        wru.assert(true, parsed['event']['window'] !== "undefined");
        wru.assert(true, parsed['event']['browser'] !== "undefined");
      }

      LE.log("hi");
    }
  },
  {
    name: 'test page info per-page',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN', page_info: 'per-page'});

      // first time- should send agent info
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);

        wru.assert(true, (typeof parsed['event'] !== "undefined"));
        wru.assert(true, parsed['event']['screen'] !== "undefined");
        wru.assert(true, parsed['event']['window'] !== "undefined");
        wru.assert(true, parsed['event']['browser'] !== "undefined");
      }

      LE.log("hi");

      // agent info has been sent already;
      // we shouldn't expect it again
      // TODO: need to mock onreadystatechange() invocation
      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, (typeof parsed['event'] !== "undefined"));
        wru.assert(true, parsed['event'] === "hi");
      }

      LE.log("hi");
    }
  },
  {
    name: 'test LOG level',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'LOG');
      }

      LE.log("hi");
    }
  },
  {
    name: 'test INFO level',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'INFO');
      }

      LE.info("hi");
    }
  },
  {
    name: 'test WARN level',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'WARN');
      }

      LE.warn("hi");
    }
  },
  {
    name: 'test ERROR level',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed.level === 'ERROR');
      }

      LE.error("hi");
    }
  },
  {
    name: 'test cyclic value exclusion',
    setup: reloadContext,
    test: function() {
      LE.init({token: 'SOME-TOKEN'});

      XMLHttpRequest.spy = function(data) {
        var parsed = JSON.parse(data);
        wru.assert(true, parsed['event']['y'] === "<?>");
      }

      var x = {};
      x.y = x;
      LE.log(x);
    }
  }
]);
