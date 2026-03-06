// puzzle.js — The Final Challenge
// "There is no spoon." — The Matrix

(function() {
  var _0x4a = ['\x62\x47\x56\x6b', '\x59\x6d\x55\x67\x62\x57\x6c\x7a\x64\x41\x3d\x3d',
    '\x63\x33\x52\x68\x63\x6d\x5a\x70\x63\x32\x67\x3d', '\x64\x47\x68\x6c\x49\x47\x4e\x68\x6b\x65',
    '\x61\x57\x35\x6b\x62\x33\x64\x7a', '\x63\x33\x56\x75\x5a\x6d\x78\x76\x64\x32\x56\x79'];

  var _cfg = { mode: 'production', debug: false, version: '3.7.2', seed: 42 };

  function fibonacci(n) {
    if (n <= 1) return n;
    var a = 0, b = 1, t;
    for (var i = 2; i <= n; i++) { t = a + b; a = b; b = t; }
    return b;
  }

  function isPrime(n) {
    if (n < 2) return false;
    for (var i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  var _primeCache = [];
  for (var i = 0; i < 50; i++) {
    if (isPrime(i)) _primeCache.push(i);
  }

  var _fib = [];
  for (var j = 0; j < 20; j++) {
    _fib.push(fibonacci(j));
  }

  function _rot13(str) {
    return str.replace(/[a-zA-Z]/g, function(c) {
      return String.fromCharCode(
        (c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
      );
    });
  }

  function _shuffle(arr) {
    var copy = arr.slice();
    for (var k = copy.length - 1; k > 0; k--) {
      var r = Math.floor((_cfg.seed / (k + 1)) % (k + 1));
      var tmp = copy[k]; copy[k] = copy[r]; copy[r] = tmp;
    }
    return copy;
  }

  var _decoys = [
    _rot13('gur nafjre vf sbegl-gjb'),
    _rot13('whfg xvqqvat'),
    _rot13('be vf vg?'),
    _rot13('lbh ner trggvat jnezre'),
  ];

  var _matrix = [];
  for (var m = 0; m < 8; m++) {
    _matrix.push([]);
    for (var n = 0; n < 8; n++) {
      _matrix[m].push(((m * 7 + n * 13) ^ _cfg.seed) % 256);
    }
  }

  var _checksum = 0;
  for (var p = 0; p < _matrix.length; p++) {
    for (var q = 0; q < _matrix[p].length; q++) {
      _checksum = (_checksum + _matrix[p][q]) & 0xFFFF;
    }
  }

  var _words = _shuffle(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']);
  var _reversed = _words.map(function(w) { return w.split('').reverse().join(''); });
  var _joined = _reversed.join('-');
  void _joined;

  var _hexMap = {};
  for (var h = 0; h < 256; h++) {
    _hexMap[h] = h.toString(16).padStart(2, '0');
  }

  function _xorCipher(str, key) {
    var out = '';
    for (var x = 0; x < str.length; x++) {
      out += String.fromCharCode(str.charCodeAt(x) ^ key.charCodeAt(x % key.length));
    }
    return out;
  }

  var _noise = _xorCipher('meaningless', 'key');
  void _noise;

  var _timestamp = Date.now ? Date.now() : new Date().getTime();
  var _entropy = (_timestamp ^ 0xDEADBEEF) >>> 0;
  void _entropy;

  var _stages = [
    function() { return _0x4a[0]; },
    function() { return _0x4a[1]; },
    function() { return _0x4a[2]; },
    function() { return _0x4a[3]; },
    function() { return _0x4a[4]; },
    function() { return _0x4a[5]; },
  ];

  var _selectedStage = _primeCache[0] - _primeCache[0] + 1;
  var _encoded = _stages[_selectedStage]();

  var _decoded;
  try {
    _decoded = atob(_encoded);
  } catch(e) {
    _decoded = 'error';
  }

  var _final = _decoded;

  if (typeof window !== 'undefined') {
    window.__puzzle6 = _final;

    Object.defineProperty(window, '__gameChecksum', {
      get: function() { return _hexMap[_checksum & 0xFF]; }
    });

    Object.defineProperty(window, '__gameEntropy', {
      get: function() { return _entropy.toString(36); }
    });
  }

  if (typeof console !== 'undefined' && _cfg.debug) {
    console.log('[puzzle.js] initialized, checksum:', _checksum);
  }
})();
