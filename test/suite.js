wru.test([
  {
    name: 'single arg stream construction',
    test: function() {
      wru.assert(true, LE.init('TOKEN') !== undefined);
    }
  },
  {
    name: 'basic stream construction with dict',
    test: function() {
      wru.assert(true, LE.init({token: 'foo'}) !== undefined);
    }
  },
  {
    name: 'submit simple string event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data === "event=Hello%2C%20world!");
      }
      LE.init({token:'foo'});
      LE.log("Hello, world!");
    }
  },
  {
    name: 'submit interpolated string event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data === "event=Hello%2C%20%2C1%2C%20more...");
      }
      LE.init({token:'foo'});
      LE.log("Hello, ", 1, " more...");
    }
  },
  {
    name: 'submit object event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data === "Hello=world!");
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
        wru.assert(err.message === "Token not present.");
        wru.assert(true, le === undefined);
        didFail = true;
      }

      wru.assert(true, didFail);
    }
  }
]);
