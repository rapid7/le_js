wru.test([
  {
    name: 'basic stream construction',
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
      le = LE.init({token:'foo'});
      le.log("Hello, world!");
    }
  },
  {
    name: 'submit interpolated string event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data === "event=Hello%2C%20%2C1%2C%20more...");
      }
      le = LE.init({token:'foo'});
      le.log("Hello, ", 1, " more...");
    }
  },
  {
    name: 'submit object event',
    test: function() {
      XMLHttpRequest.spy = function(data) {
        wru.assert(true, data === "Hello=world!");
      }
      le = LE.init({token:'foo'});
      le.log({"Hello": "world!"});
    }
  },
  {
    name: 'init cannot work without token',
    test: function() {
      var didFail = false;
      try {
        le = LE.init({});
      } catch (err) {
        wru.assert(err.message === "Token not present.");
        wru.assert(false, le);
        didFail = true;
      }

      wru.assert(true, didFail);
    }
  }
]);
