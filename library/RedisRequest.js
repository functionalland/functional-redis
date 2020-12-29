import {
  complement,
  compose,
  curry,
  filter,
  flatten,
  map,
  reduce,
  toPairs,
  when
} from "https://deno.land/x/ramda@v0.27.2/mod.ts";
import { factorizeType } from "https://deno.land/x/functional@v1.3.2/library/factories.js";
import { $$rawPlaceholder } from "./Symbol.js";
import {
  assertIsArray,
  assertIsBoolean,
  assertIsInstance,
  assertIsString,
  log
} from "https://deno.land/x/functional@v1.3.2/library/utilities.js";

export const RedisRequest = factorizeType("RedisRequest", [ "command", "raw", "arguments" ]);

/**
 * ## Redis Request
 *
 * The `RedisRequest` represents a Redis request.
 * It has three attributes: the first is the Redis command, the second is a typed array named "raw", the last is an
 * array of arguments.
 * The `RedisRequest` type is mostly interoperable with `RedisResponse`, [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
 * [`File`](https://github.com/sebastienfilion/functional-io#file), [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request)  
 * and [`(HTTP) Response`](https://github.com/sebastienfilion/functional-io#response).
 *
 * The `RedisRequest` type implements the following algebras:
 * - [x] Group
 * - [x] Comonad
 * - [x] Monad
 *
 * ### Example
 *
 * ```js
 * import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
 *
 * const redisRequest = RedisRequest("GET", new Uint8Array([]), [ "hoge" ]);
 *
 * assert(RedisRequest.is(redisRequest));
 * ```  
 *
 * A Symbol named `rawPlaceholder` may be used as a placeholder for the buffer.
 * In the following example, the request will resolve to: `SET hoge piyo`.
 *
 * ```js
 * import { encodeText } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
 * import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
 * import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";
 *
 * const redisRequest = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
 *
 * assert(RedisRequest.is(redisRequest));
 * ```  
 *
 * The placeholder can be used multiple times if the buffer has multiple values separated by CLRF (`\r\n`).
 *
 * ```js
 * import { encodeText } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
 * import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
 * import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";
 *
 * const redisRequest = RedisRequest(
 *   "MSET",
 *   encodeText("piyo\r\nfuga\r\n"),
 *   [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ]
 * );
 *
 * assert(RedisRequest.is(redisRequest));
 * ```  
 *
 * ### Utilities
 *
 * The `RedisRequest` namespace comes with methods for convenience to create an instance of `RedisRequest` with various
 * commands. The methods are curried.
 */

RedisRequest.isOrThrow = container => {
  if (RedisRequest.is(container) || container.hasOwnProperty("raw")) return container;
  else throw new Error(`Expected a RedisRequest but got a "${container[$$type] || typeof container}"`);
};

RedisRequest.prototype.ap = RedisRequest.prototype["fantasy-land/ap"] = function (container) {

  return RedisRequest(this.command, container.raw(this.raw), this.arguments);
};

RedisRequest.prototype.chain = RedisRequest.prototype["fantasy-land/chain"] = function (unaryFunction) {

  return unaryFunction(this.raw);
};

RedisRequest.prototype.concat = RedisRequest.prototype["fantasy-land/concat"] = function (container) {

  return RedisRequest(this.command, new Uint8Array([ ...this.raw, ...container.raw ]), this.arguments);
};

RedisRequest.empty = RedisRequest.prototype.empty = RedisRequest.prototype["fantasy-land/empty"] = () =>
  RedisRequest("", new Uint8Array([]), []);

RedisRequest.prototype.equals = RedisRequest.prototype["fantasy-land/equals"] = function (container) {

  return this.raw.byteLength === container.raw.byteLength
    && !!(this.raw.reduce(
      (accumulator, value, index) => accumulator && accumulator[index] == value ? accumulator : false,
      container.raw
    ));
};

RedisRequest.prototype.extend = RedisRequest.prototype["fantasy-land/extend"] = function (unaryFunction) {

  return RedisRequest(this.command, unaryFunction(this), this.arguments);
};

RedisRequest.prototype.extract = RedisRequest.prototype["fantasy-land/extract"] = function () {

  return this.raw;
};

RedisRequest.prototype.lte = RedisRequest.prototype["fantasy-land/equals"] = function (container) {

  return this.raw.byteLength <= container.raw.byteLength
    && !!(this.raw.reduce(
      (accumulator, value, index) => !accumulator && accumulator[index] > value ? accumulator : true,
      container.raw
    ));
};

RedisRequest.prototype.invert = RedisRequest.prototype["fantasy-land/invert"] = function () {

  return RedisRequest(this.command, this.raw.reverse(), this.arguments);
};

RedisRequest.prototype.map = RedisRequest.prototype["fantasy-land/map"] = function (unaryFunction) {

  return RedisRequest(this.command, unaryFunction(this.raw), this.arguments);
};

RedisRequest.of = RedisRequest.prototype.of = RedisRequest.prototype["fantasy-land/of"] = _buffer =>
  RedisRequest("", _buffer, []);

const normalizeValue = when(complement(assertIsString), String);
const normalizeOptions = map(normalizeValue);
const spreadOptions = compose(
  normalizeOptions,
  filter(complement(assertIsBoolean)),
  flatten,
  map(
    ([ key, value ]) =>
      key === "GET" ? reduce((accumulator, pattern) =>  [ ...accumulator, 'GET', pattern ],[], value) : [ key, value ]
  ),
  toPairs
);

/**
 * #### `factorizeRedisRequest`
 * `String -> Uint8Array -> (String|Symbol)[] -> RedisRequest`
 *
 * This curried function takes a string for the name of the Redis command, a (optionally empty) `Uint8Array` and, an
 * array for the arguments. The return value is an instance of `RedisRequest`.
 */
export const factorizeRedisRequest = curry(RedisRequest);

/**
 * ***
 *
 * #### String commands
 */

/**
 * ##### RedisRequest`.append` [📕](https://redis.io/commands/append)
 * `String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.append("hoge", "piyo");
 * ```
 */
RedisRequest.append = curry(
  (key, value) =>
    RedisRequest(
      "APPEND",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.bitcount` [📕](https://redis.io/commands/bitcount)
 * `String -> [ Number, Number ] -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.bitcount("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.bitcount = curry(
  (key, range) => RedisRequest("BITCOUNT", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);

/**
 * ##### RedisRequest`.bitfield` [📕](https://redis.io/commands/bitfield)
 * `String -> String[] -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.bitfield("hoge", [ "GET", "i8", 100 ]);
 * ```
 */
RedisRequest.bitfield = curry(
  (key, subcommand) => RedisRequest("BITFIELD", new Uint8Array([]), [ key, ...normalizeOptions(subcommand) ])
);

/**
 * ##### RedisRequest`.bitop` [📕](https://redis.io/commands/bitop)
 * `String -> String -> String[] -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.bitop("AND", "hoge", [ "piyo", "fuga" ]);
 * ```
 */
RedisRequest.bitop = curry(
  (operation, destinationKey, keyList) =>
    RedisRequest("BITOP", new Uint8Array([]), [ operation, destinationKey, ...keyList ])
);

/**
 * ##### RedisRequest`.bitpos` [📕](https://redis.io/commands/bitpos)
 * `String -> [ Number, Number ] -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.bitpos("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.bitpos = curry(
  (key, range) => RedisRequest("BITPOS", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);

/**
 * ##### RedisRequest`.decr` [📕](https://redis.io/commands/decr)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.decr("hoge");
 * ```
 */
RedisRequest.decr = key => RedisRequest("DECR", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.decrby` [📕](https://redis.io/commands/decrby)
 * `String -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.decrby("hoge", 3);
 * ```
 */
RedisRequest.decrby = curry(
  (key, amount) => RedisRequest("DECRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);

/**
 * ##### RedisRequest`.get` [📕](https://redis.io/commands/get)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.get("hoge");
 * ```
 */
RedisRequest.get = key => RedisRequest("GET", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.getbit` [📕](https://redis.io/commands/getbit)
 * `String -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.getbit("hoge", 3);
 * ```
 */
RedisRequest.getbit = curry(
  (key, offset) => RedisRequest("GETBIT", new Uint8Array([]), [ key, normalizeValue(offset) ])
);

/**
 * ##### RedisRequest`.getrange` [📕](https://redis.io/commands/getrange)
 * `String -> [ Number, Number ] -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.getrange("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.getrange = curry(
  (key, range) =>
    RedisRequest("GETRANGE", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);

/**
 * ##### RedisRequest`.getset` [📕](https://redis.io/commands/getset)
 * `String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.getset("hoge", "piyo");
 * const redisRequestB = RedisRequest.getset("hoge", encodeText("piyo"));
 * ```
 */
RedisRequest.getset = curry(
  (key, value) =>
    RedisRequest(
      "GETSET",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        assertIsString(value) ? value : $$rawPlaceholder,
      ]
    )
);

/**
 * ##### RedisRequest`.incr` [📕](https://redis.io/commands/incr)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.incr("hoge");
 * ```
 */
RedisRequest.incr = key => RedisRequest("INCR", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.incrby` [📕](https://redis.io/commands/incrby)
 * `String -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.incrby("hoge", 3);
 * ```
 */
RedisRequest.incrby = curry(
  (key, amount) => RedisRequest("INCRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);

/**
 * ##### RedisRequest`.incrbyfloat` [📕](https://redis.io/commands/incrbyfloat)
 * `String -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.incrbyfloat("hoge", 0.1);
 * ```
 */
RedisRequest.incrbyfloat = curry(
  (key, amount) => RedisRequest("INCRBYFLOAT", new Uint8Array([]), [ key, normalizeValue(amount) ])
);

/**
 * ##### RedisRequest`.mget` [📕](https://redis.io/commands/mget)
 * `(String, ...) -> RedisRequest`, or `String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.mget("hoge", "piyo");
 * const redisRequestB = RedisRequest.mget([ "hoge", "piyo" ]);
 * ```
 */
RedisRequest.mget = (...keyList) => RedisRequest(
  "MGET",
  new Uint8Array([]),
  assertIsArray(keyList[0]) ? keyList[0] : keyList
);

/**
 * ##### RedisRequest`.mset` [📕](https://redis.io/commands/mset)
 * `(String, ...) -> RedisRequest`, or `(String|Symbol)[] -> Uint8Array -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.mset("hoge", "piyo", "hogefuga", "fuga");
 * const redisRequestB = RedisRequest.mset(
 *   [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
 *   encodeText("piyo\r\nfuga\r\n")
 * );
 * ```
 */
RedisRequest.mset = curry(
  (valueList, _buffer) =>
    RedisRequest(
      "MSET",
      assertIsInstance(Uint8Array, _buffer) ? _buffer : new Uint8Array([]),
      assertIsString(valueList) ? [ valueList, ...(assertIsArray(_buffer) ? _buffer : [ _buffer ]) ] : valueList
    )
);

/**
 * ##### RedisRequest`.msetnx` [📕](https://redis.io/commands/msetnx)
 * `(String, ...) -> RedisRequest`, or `(String|Symbol)[] -> Uint8Array -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.msetnx("hoge", "piyo", "hogefuga", "fuga");
 * const redisRequestB = RedisRequest.msetnx(
 *   [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
 *   encodeText("piyo\r\nfuga\r\n")
 * );
 * ```
 */
RedisRequest.msetnx = curry(
  (valueList, ...argumentList) =>
    RedisRequest(
      "MSETNX",
      assertIsInstance(Uint8Array, argumentList[0]) ? argumentList[0] : new Uint8Array([]),
      assertIsString(valueList) ? [ valueList, ...argumentList ] : valueList
    )
);

/**
 * ##### RedisRequest`.psetex` [📕](https://redis.io/commands/psetex)
 * `Number -> String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.psetex(1000, "hoge", "piyo");
 * const redisRequestB = RedisRequest.psetex(1000, "hoge", encodeText("piyo"));
 * ```
 */
RedisRequest.psetex = curry(
  (ttl, key, value) =>
    RedisRequest(
      "PSETEX",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        normalizeValue(ttl),
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.set` [📕](https://redis.io/commands/set)
 * `Object -> String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.set({}, "hoge", "piyo");
 * const redisRequestB = RedisRequest.set({}, "hoge", encodeText("piyo"));
 * const redisRequestC = RedisRequest.set({ EX: 2000 }, "hoge", encodeText("piyo"));
 * const redisRequestD = RedisRequest.set({ KEEPTTL: true }, "hoge", encodeText("piyo"));
 * ```
 */
RedisRequest.set = curry(
  (options, key, value) =>
    RedisRequest(
      "SET",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        assertIsString(value) ? value : $$rawPlaceholder,
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.setbit` [📕](https://redis.io/commands/setbit)
 * `String -> Number -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.setbit("hoge", 7, 1);
 * ```
 */
RedisRequest.setbit = curry(
  (key, offset, value) =>
    RedisRequest("SETBIT", new Uint8Array([]), [ key, normalizeValue(offset), normalizeValue(value) ])
);

/**
 * ##### RedisRequest`.setex` [📕](https://redis.io/commands/setex)
 * `Number -> String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.setex(10, "hoge", "piyo");
 * const redisRequestB = RedisRequest.setex(10, "hoge", encodeText("piyo"));
 * ```
 */
RedisRequest.setex = curry(
  (ttl, key, value) =>
    RedisRequest(
      "SETEX",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        normalizeValue(ttl),
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.setnx` [📕](https://redis.io/commands/setnx)
 * `String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.setnx("hoge", "piyo");
 * const redisRequestB = RedisRequest.setnx("hoge", encodeText("piyo"));
 * ```
 */
RedisRequest.setnx = curry(
  (key, value) =>
    RedisRequest(
      "SETNX",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.setrange` [📕](https://redis.io/commands/setrange)
 * `String -> Number -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.setrange("hoge", 2, "FU");
 * ```
 */
RedisRequest.setrange = curry(
  (key, offset, value) =>
    RedisRequest(
      "SETRANGE",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        normalizeValue(offset),
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.stralgo` [📕](https://redis.io/commands/stralgo)
 * `(String, ...) -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.strlen("LCS", "KEYS, "hoge", "piyo");
 * ```
 */
RedisRequest.stralgo = (...subcommands) =>
  RedisRequest("STRALGO", new Uint8Array([]), normalizeOptions(subcommands));

/**
 * ##### RedisRequest`.strlen` [📕](https://redis.io/commands/strlen)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.strlen("hoge");
 * ```
 */
RedisRequest.strlen = key => RedisRequest("STRLEN", new Uint8Array([]), [ key ]);

/**
 * ***
 *
 * #### Key commands
 */

/**
 * ##### RedisRequest`.copy` [📕](https://redis.io/commands/copy)
 * `Object -> String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.copy({}, "hoge", "fuga");
 * const redisRequestB = RedisRequest.copy({ REPLACE: true }, "hoge", "fuga");
 * const redisRequestC = RedisRequest.copy({ DB: 2 }, "hoge", "fuga");
 * ```
 */
RedisRequest.copy = curry(
  (options, sourceKey, destinationKey) =>
    RedisRequest(
      "COPY",
      new Uint8Array([]),
      [
        sourceKey,
        destinationKey,
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.del` [📕](https://redis.io/commands/del)
 * `(String, ...) -> RedisRequest`, or `String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.del("hoge", "fuga");
 * const redisRequestB = RedisRequest.del([ "hoge", "fuga" ]);
 * ```
 */
RedisRequest.del = (...keyList) =>
  RedisRequest("DEL", new Uint8Array([]), assertIsArray(keyList[0]) ? keyList[0] : keyList);

/**
 * ##### RedisRequest`.dump` [📕](https://redis.io/commands/dump)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.dump("hoge");
 * ```
 */
RedisRequest.dump = key => RedisRequest("DUMP", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.exists` [📕](https://redis.io/commands/exists)
 * `(String, ...) -> RedisRequest`, or `String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.exists("hoge", "fuga");
 * const redisRequestB = RedisRequest.exists([ "hoge", "fuga" ]);
 * ```
 */
RedisRequest.exists = (...keyList) =>
  RedisRequest("EXISTS", new Uint8Array([]), assertIsArray(keyList[0]) ? keyList[0] : keyList);

/**
 * ##### RedisRequest`.expire` [📕](https://redis.io/commands/expire)
 * `Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.expire(10, "hoge");
 * ```
 */
RedisRequest.expire = curry(
  (ttl, key) => RedisRequest("EXPIRE", new Uint8Array([]), [ key, normalizeValue(ttl) ])
);

/**
 * ##### RedisRequest`.expireat` [📕](https://redis.io/commands/expireat)
 * `Date|Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.expireat(new Date(), "hoge");
 * const redisRequestB = RedisRequest.expireat(Date.now(), "hoge");
 * ```
 */
RedisRequest.expireat = curry(
  (timestamp, key) => RedisRequest(
    "EXPIREAT",
    new Uint8Array([]),
    [ key, normalizeValue(assertIsInstance(Date, timestamp) ? timestamp.valueOf() : timestamp) ]
  )
);

/**
 * ##### RedisRequest`.keys` [📕](https://redis.io/commands/keys)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.keys("*ge");
 * ```
 */
RedisRequest.keys = pattern => RedisRequest("KEYS", new Uint8Array([]), [ pattern ]);

/**
 * ##### RedisRequest`.migrate` [📕](https://redis.io/commands/migrate)
 * `Object -> String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.migrate({ host: "127.0.0.1", port: 6379, db: 3, timeout: 5000 }, "hoge");
 * const redisRequestB = RedisRequest.migrate(
 *   { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000 },
 *   [ "hoge", "fuga" ]
 * );
 * const redisRequestC = RedisRequest.migrate(
 *   { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, REPLACE: true },
 *   "hoge"
 * );
 * const redisRequestD = RedisRequest.migrate(
 *   { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, password },
 *   "hoge"
 * );
 * const redisRequestE = RedisRequest.migrate(
 *   { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, username, password },
 *   "hoge"
 * );
 * ```
 */
RedisRequest.migrate = curry(
  ({ host, port, db, timeout, username, password, ...options }, keyList) =>
    RedisRequest(
      "MIGRATE",
      new Uint8Array([]),
      [
        host,
        normalizeValue(port),
        assertIsArray(keyList) ? "" : keyList,
        normalizeValue(db),
        normalizeValue(timeout),
        ...spreadOptions(options),
        ...(password ? username ? [ "AUTH2", username, password ] : [ "AUTH", password ] : []),
        ...(assertIsArray(keyList) ? [ "KEYS", ...keyList ] : [])
      ]
    )
);

/**
 * ##### RedisRequest`.move` [📕](https://redis.io/commands/move)
 * `Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.move(3, "hoge");
 * ```
 */
RedisRequest.move = curry(
  (db, key) => RedisRequest("MOVE", new Uint8Array([]), [ key, normalizeValue(db) ])
);

/**
 * ##### RedisRequest`.object` [📕](https://redis.io/commands/object)
 * `String -> String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.object("ENCODING", "hoge");
 * const redisRequestB = RedisRequest.object("ENCODING", [ "hoge" ]);
 * ```
 */
RedisRequest.object = curry(
  (subcommand, argumentList) =>
    RedisRequest(
      "OBJECT",
      new Uint8Array([]),
      [
        subcommand,
        ...(assertIsArray(argumentList) ? normalizeOptions(argumentList) : [ normalizeValue(argumentList) ])
      ]
    )
);

/**
 * ##### RedisRequest`.persist` [📕](https://redis.io/commands/persist)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.persist("hoge");
 * ```
 */
RedisRequest.persist = key => RedisRequest("PERSIST", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.pexpireat` [📕](https://redis.io/commands/pexpireat)
 * `Date|Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.pexpireat(new Date(), "hoge");
 * const redisRequestB = RedisRequest.pexpireat(Date.now(), "hoge");
 * ```
 */
RedisRequest.pexpireat = curry(
  (timestamp, key) => RedisRequest(
    "PEXPIREAT",
    new Uint8Array([]),
    [ key, normalizeValue(assertIsInstance(Date, timestamp) ? timestamp.valueOf() * 1000 : timestamp) ]
  )
);

/**
 * ##### RedisRequest`.pexpire` [📕](https://redis.io/commands/pexpire)
 * `Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.pexpire(5000, "hoge");
 * ```
 */
RedisRequest.pexpire = curry(
  (ttl, key) => RedisRequest("PEXPIRE", new Uint8Array([]), [ key, normalizeValue(ttl) ])
);

/**
 * ##### RedisRequest`.ptll` [📕](https://redis.io/commands/ptll)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.pttl("hoge");
 * ```
 */
RedisRequest.pttl = key => RedisRequest("PTTL", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.randomkey` [📕](https://redis.io/commands/randomkey)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.randomkey("hoge");
 * ```
 */
RedisRequest.randomkey = () => RedisRequest("RANDOMKEY", new Uint8Array([]), []);

/**
 * ##### RedisRequest`.rename` [📕](https://redis.io/commands/rename)
 * `String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.rename("hoge", "hogefuga");
 * ```
 */
RedisRequest.rename = curry(
  (key, newKey) => RedisRequest("RENAME", new Uint8Array([]), [ key, newKey ])
);

/**
 * ##### RedisRequest`.renamenx` [📕](https://redis.io/commands/renamenx)
 * `String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.renamenx("hoge", "hogefuga");
 * ```
 */
RedisRequest.renamenx = curry(
  (key, newKey) => RedisRequest("RENAMENX", new Uint8Array([]), [ key, newKey ])
);

/**
 * ##### RedisRequest`.restore` [📕](https://redis.io/commands/restore)
 * `Object -> String -> String|Uint8Array -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.restore(
 *   { ttl: 10 },
 *   "hoge",
 *   String.raw`\u0000\xC0\n\t\u0000\xBEm\u0006\x89Z(\u0000\n`
 * );
 * const redisRequestB = RedisRequest.restore(
 *   { ttl: 10 },
 *   "hoge",
 *   encodeText(String.raw`\u0000\xC0\n\t\u0000\xBEm\u0006\x89Z(\u0000\n`)
 * );
 * const redisRequestC = RedisRequest.restore(
 *   { ttl: 10, REPLACE: true },
 *   "hoge",
 *   String.raw`\u0000\xC0\n\t\u0000\xBEm\u0006\x89Z(\u0000\n`
 * );
 * const redisRequestD = RedisRequest.restore(
 *   { ttl: 10, IDLETIME: 1 },
 *   "hoge",
 *   String.raw`\u0000\xC0\n\t\u0000\xBEm\u0006\x89Z(\u0000\n`
 * );
 * ```
 */
RedisRequest.restore = curry(
  ({ ttl, ...options }, key, value) =>
    RedisRequest(
      "RESTORE",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        normalizeValue(ttl),
        assertIsString(value) ? value : $$rawPlaceholder,
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.scan` [📕](https://redis.io/commands/scan)
 * `Object -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.scan({}, 0);
 * const redisRequestB = RedisRequest.scan({ MATCH: "*yo", COUNT: 1000 }, 0);
 * ```
 */
RedisRequest.scan = curry(
  (options, cursor) =>
    RedisRequest(
      "SCAN",
      new Uint8Array([]),
      [
        normalizeValue(cursor),
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.sort` [📕](https://redis.io/commands/migrate)
 * `Object -> String -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.sort({}, "hoge");
 * const redisRequestB = RedisRequest.sort({ BY: "fuga" }, "hoge");
 * const redisRequestC = RedisRequest.sort({ LIMIT: 10 }, "hoge");
 * const redisRequestD = RedisRequest.sort({ ASC: true }, "hoge");
 * const redisRequestE = RedisRequest.sort({ DESC: true, ALPHA: true }, "hoge");
 * const redisRequestF = RedisRequest.sort({ STORE: "fuga" }, "hoge");
 * const redisRequestG = RedisRequest.sort({ GET: [ "*" ], ALPHA: true }, "hoge");
 * const redisRequestH = RedisRequest.sort({ LIMIT: 10, GET: [ "*", "#" ], ALPHA: true }, "hoge");
 * ```
 */
RedisRequest.sort = curry(
  (options, key) =>
    RedisRequest(
      "SORT",
      new Uint8Array([]),
      [
        key,
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.touch` [📕](https://redis.io/commands/ptll)
 * `String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.touch("hoge");
 * const redisRequestB = RedisRequest.touch([ "hoge", "fuga" ]);
 * ```
 */
RedisRequest.touch = keyList =>
  RedisRequest("TOUCH", new Uint8Array([]), assertIsArray(keyList) ? keyList : [ keyList ]);

/**
 * ##### RedisRequest`.ttl` [📕](https://redis.io/commands/ttl)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.ttl("hoge");
 * ```
 */
RedisRequest.ttl = key => RedisRequest("TTL", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.type` [📕](https://redis.io/commands/type)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.type("hoge");
 * ```
 */
RedisRequest.type = key => RedisRequest("TYPE", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.unlink` [📕](https://redis.io/commands/unlink)
 * `String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.unlink("hoge");
 * const redisRequestB = RedisRequest.unlink([ "hoge", "fuga" ]);
 * ```
 */
RedisRequest.unlink = keyList =>
  RedisRequest("UNLINK", new Uint8Array([]), assertIsArray(keyList) ? keyList : [ keyList ]);

/**
 * ##### RedisRequest`.wait` [📕](https://redis.io/commands/wait)
 * `Number -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.wait(1,10);
 * ```
 */
RedisRequest.wait = curry(
  (replicaCount, timeout) =>
    RedisRequest("WAIT", new Uint8Array([]), [ normalizeValue(replicaCount), normalizeValue(timeout) ])
);

/**
 * ***
 *
 * #### Hash commands
 */

/**
 * ##### RedisRequest`.hdel` [📕](https://redis.io/commands/hdel)
 * `String -> String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hdel("hoge", "piyo");
 * const redisRequestB = RedisRequest.hdel("hoge", [ "piyo", "fuga" ]);
 * ```
 */
RedisRequest.hdel = curry(
  (key, fieldList) =>
    RedisRequest(
      "HDEL",
      new Uint8Array([]),
      [
        key,
        ...(assertIsString(fieldList) ? [ fieldList ] : fieldList)
      ]
    )
);

/**
 * ##### RedisRequest`.hexists` [📕](https://redis.io/commands/hexists)
 * `String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hexists("hoge", "piyo");
 * ```
 */
RedisRequest.hexists = curry(
  (key, field) => RedisRequest("HEXISTS", new Uint8Array([]), [ key, field ])
);

/**
 * ##### RedisRequest`.hget` [📕](https://redis.io/commands/hget)
 * `String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hget("hoge", "piyo");
 * ```
 */
RedisRequest.hget = curry(
  (key, field) => RedisRequest("HGET", new Uint8Array([]), [ key, field ])
);

/**
 * ##### RedisRequest`.hgetall` [📕](https://redis.io/commands/hgetall)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hgetall("hoge");
 * ```
 */
RedisRequest.hgetall = key => RedisRequest("HGETALL", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.hincrby` [📕](https://redis.io/commands/hincrby)
 * `String -> Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hincrby("hoge", 3, "piyo");
 * ```
 */
RedisRequest.hincrby = curry(
  (key, amount, field) => RedisRequest("HINCRBY", new Uint8Array([]), [ key, field, normalizeValue(amount) ])
);

/**
 * ##### RedisRequest`.hincrbyfloat` [📕](https://redis.io/commands/hincrbyfloat)
 * `String -> Number -> String -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hincrbyfloat("hoge", 0.1, "piyo");
 * const redisRequestB = RedisRequest.hincrbyfloat("hoge", -5, "piyo");
 * const redisRequestC = RedisRequest.hincrbyfloat("hoge", 5.0e3, "piyo");
 * ```
 */
RedisRequest.hincrbyfloat = curry(
  (key, amount, field) =>
    RedisRequest("HINCRBYFLOAT", new Uint8Array([]), [ key, field, normalizeValue(amount) ])
);

/**
 * ##### RedisRequest`.hkeys` [📕](https://redis.io/commands/hkeys)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hkeys("hoge");
 * ```
 */
RedisRequest.hkeys = key => RedisRequest("HKEYS", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.hlen` [📕](https://redis.io/commands/hlen)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hlen("hoge");
 * ```
 */
RedisRequest.hlen = key => RedisRequest("HLEN", new Uint8Array([]), [ key ]);

/**
 * ##### RedisRequest`.hmget` [📕](https://redis.io/commands/hmget)
 * `String -> String|String[] -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hmget("hoge", "piyo");
 * const redisRequestB = RedisRequest.hmget("hoge", [ "piyo", "fuga" ]);
 * ```
 */
RedisRequest.hmget = curry(
  (key, fieldList) =>
    RedisRequest(
      "HMGET",
      new Uint8Array([]),
      [
        key,
        ...(assertIsString(fieldList) ? [ fieldList ] : fieldList)
      ]
    )
);

/**
 * ##### RedisRequest`.hmset` [📕](https://redis.io/commands/hmset)
 * `String -> String -> String|Uint8Array -> RedisRequest` or, `String -> String[] -> Uint8Array -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hmset("hoge", "piyo", "fuga");
 * const redisRequestB = RedisRequest.hmset("hoge", "piyo", encodeText("fuga"));
 * const redisRequestC = RedisRequest.hmset(
 *   "hoge",
 *   [ "piyo", $$rawPlaceholder, "fuga", $$rawPlaceholder ],
 *   encodeText("hogepiyo\r\nhogefuga\r\n")
 * );
 * ```
 */
RedisRequest.hmset = curry(
  (key, field, value) =>
    RedisRequest(
      "HMSET",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        ...(
          assertIsString(field) ? [ field, assertIsString(value) ? value : $$rawPlaceholder ] : field
        )
      ]
    )
);

/**
 * ##### RedisRequest`.hscan` [📕](https://redis.io/commands/hscan)
 * `Object -> String -> Number -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hscan({}, "hoge", 0);
 * const redisRequestB = RedisRequest.hscan({ MATCH: "*yo", COUNT: 1000 }, "hoge", 0);
 * ```
 */
RedisRequest.hscan = curry(
  (options, key, cursor) =>
    RedisRequest(
      "HSCAN",
      new Uint8Array([]),
      [
        key,
        normalizeValue(cursor),
        ...spreadOptions(options)
      ]
    )
);

/**
 * ##### RedisRequest`.hset` [📕](https://redis.io/commands/hset)
 * `String -> String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hset("hoge", "piyo", "fuga");
 * const redisRequestB = RedisRequest.hset("hoge", "piyo", encodeText("fuga"));
 * ```
 */
RedisRequest.hset = curry(
  (key, field, value) =>
    RedisRequest(
      "HSET",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        field,
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.hsetnx` [📕](https://redis.io/commands/hsetnx)
 * `String -> String -> (String|Uint8Array) -> RedisRequest`
 *
 * ```js
 * const redisRequestA = RedisRequest.hsetnx("hoge", "piyo", "fuga");
 * const redisRequestB = RedisRequest.hsetnx("hoge", "piyo", encodeText("fuga"));
 * ```
 */
RedisRequest.hsetnx = curry(
  (key, field, value) =>
    RedisRequest(
      "HSETNX",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        field,
        assertIsString(value) ? value : $$rawPlaceholder
      ]
    )
);

/**
 * ##### RedisRequest`.hstrlen` [📕](https://redis.io/commands/hstrlen)
 * `String -> String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hstrlen("hoge", "piyo");
 * ```
 */
RedisRequest.hstrlen = curry(
  (key, field) => RedisRequest("HSTRLEN", new Uint8Array([]), [ key, field ])
);

/**
 * ##### RedisRequest`.hvals` [📕](https://redis.io/commands/hvals)
 * `String -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.hvals("hoge");
 * ```
 */
RedisRequest.hvals = key => RedisRequest("HVALS", new Uint8Array([]), [ key ]);

/**
 * ***
 *
 * #### Server commands
 */

/**
 * ##### RedisRequest`.flushall` [📕](https://redis.io/commands/flushall)
 * `() -> RedisRequest`
 *
 * ```js
 * const redisRequest = RedisRequest.flushall();
 * ```
 */
RedisRequest.flushall = () => RedisRequest("FLUSHALL", new Uint8Array([]), []);

export default RedisRequest;
