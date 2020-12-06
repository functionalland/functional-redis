import {
  complement,
  compose,
  curry,
  filter,
  flatten,
  map,
  toPairs,
  when
} from "https://x.nest.land/ramda@0.27.0/source/index.js";
import { factorizeType } from "https://deno.land/x/functional@v1.2.1/library/factories.js";
import { $$rawPlaceholder } from "./Symbol.js";
import {
  assertIsArray,
  assertIsBoolean,
  assertIsInstance,
  assertIsString
} from "https://deno.land/x/functional@v1.2.1/library/utilities.js";

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
 * import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
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
 * import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
 * import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
 * import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";
 *
 * const redisRequest = RedisRequest(
 *   "MSET",
 *   encodeText("piyo\r\nfuga"),
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
const spreadOptions = compose(normalizeOptions, filter(complement(assertIsBoolean)), flatten, toPairs);

/**
 * #### String commands
 */

/**
 * **RedisRequest`.append`** [📕](https://redis.io/commands/append)
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
 * **RedisRequest`.bitcount`** [📕](https://redis.io/commands/bitcount)  
 * ```js
 * const redisRequest = RedisRequest.bitcount("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.bitcount = curry(
  (key, range) => RedisRequest("BITCOUNT", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
/**
 * **RedisRequest`.bitfield`** [📕](https://redis.io/commands/bitfield)  
 * ```js
 * const redisRequest = RedisRequest.bitfield("hoge", [ "GET", "i8", 100 ]);
 * ```
 */
RedisRequest.bitfield = curry(
  (key, subcommand) => RedisRequest("BITFIELD", new Uint8Array([]), [ key, ...normalizeOptions(subcommand) ])
);
/**
 * **RedisRequest`.bitop`** [📕](https://redis.io/commands/bitop)  
 * ```js
 * const redisRequest = RedisRequest.bitop("AND", "hoge", [ "piyo", "fuga" ]);
 * ```
 */
RedisRequest.bitop = curry(
  (operation, destinationKey, keyList) =>
    RedisRequest("BITOP", new Uint8Array([]), [ operation, destinationKey, ...keyList ])
);
/**
 * **RedisRequest`.bitpos`** [📕](https://redis.io/commands/bitpos)  
 * ```js
 * const redisRequest = RedisRequest.bitpos("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.bitpos = curry(
  (key, range) => RedisRequest("BITPOS", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
/**
 * **RedisRequest`.decr`** [📕](https://redis.io/commands/decr)  
 * ```js
 * const redisRequest = RedisRequest.decr("hoge");
 * ```
 */
RedisRequest.decr = key => RedisRequest("DECR", new Uint8Array([]), [ key ]);
/**
 * **RedisRequest`.decrby`** [📕](https://redis.io/commands/decrby)  
 * ```js
 * const redisRequest = RedisRequest.decrby("hoge", 3);
 * ```
 */
RedisRequest.decrby = curry(
  (key, amount) => RedisRequest("DECRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
/**
 * **RedisRequest`.get`** [📕](https://redis.io/commands/get)  
 * ```js
 * const redisRequest = RedisRequest.get("hoge");
 * ```
 */
RedisRequest.get = key => RedisRequest("GET", new Uint8Array([]), [ key ]);
/**
 * **RedisRequest`.getbit`** [📕](https://redis.io/commands/getbit)  
 * ```js
 * const redisRequest = RedisRequest.getbit("hoge", 3);
 * ```
 */
RedisRequest.getbit = curry(
  (key, offset) => RedisRequest("GETBIT", new Uint8Array([]), [ key, normalizeValue(offset) ])
);
/**
 * **RedisRequest`.getrange`** [📕](https://redis.io/commands/getrange)  
 * ```js
 * const redisRequest = RedisRequest.getrange("hoge", [ 0, 1 ]);
 * ```
 */
RedisRequest.getrange = curry(
  (key, range) =>
    RedisRequest("GETRANGE", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
/**
 * **RedisRequest`.getset`** [📕](https://redis.io/commands/getset)  
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
 * **RedisRequest`.incr`** [📕](https://redis.io/commands/incr)  
 * ```js
 * const redisRequest = RedisRequest.incr("hoge");
 * ```
 */
RedisRequest.incr = key => RedisRequest("INCR", new Uint8Array([]), [ key ]);
/**
 * **RedisRequest`.incrby`** [📕](https://redis.io/commands/incrby)  
 * ```js
 * const redisRequest = RedisRequest.incrby("hoge", 3);
 * ```
 */
RedisRequest.incrby = curry(
  (key, amount) => RedisRequest("INCRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
/**
 * **RedisRequest`.incrbyfloat`** [📕](https://redis.io/commands/incrbyfloat)  
 * ```js
 * const redisRequest = RedisRequest.incrbyfloat("hoge", 0.1);
 * ```
 */
RedisRequest.incrbyfloat = curry(
  (key, amount) => RedisRequest("INCRBYFLOAT", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
/**
 * **RedisRequest`.mget`** [📕](https://redis.io/commands/mget)
 * ```js
 * const redisRequest = RedisRequest.mget("hoge", "piyo");
 * ```
 */
RedisRequest.mget = (...keys) => RedisRequest("MGET", new Uint8Array([]), keys);
/**
 * **RedisRequest`.mset`** [📕](https://redis.io/commands/mset)  
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
 * **RedisRequest`.msetnx`** [📕](https://redis.io/commands/msetnx)  
 * ```js
 * const redisRequestA = RedisRequest.msetnx("hoge", "piyo", "hogefuga", "fuga");
 * const redisRequestB = RedisRequest.msetnx(
 *   [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
 *   encodeText("piyo\r\nfuga\r\n")
 * );
 * ```
 */
RedisRequest.msetnx = curry(
  (valueList, _buffer) =>
    RedisRequest(
      "MSETNX",
      assertIsInstance(Uint8Array, _buffer) ? _buffer : new Uint8Array([]),
      assertIsString(valueList) ? [ valueList, ...(assertIsArray(_buffer) ? _buffer : [ _buffer ]) ] : valueList
    )
);
/**
 * **RedisRequest`.psetex`** [📕](https://redis.io/commands/psetex)  
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
 * **RedisRequest`.set`** [📕](https://redis.io/commands/set)  
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
 * **RedisRequest`.setbit`** [📕](https://redis.io/commands/setbit)  
 * ```js
 * const redisRequest = RedisRequest.setbit("hoge", 7, 1);
 * ```
 */
RedisRequest.setbit = curry(
  (key, offset, value) =>
    RedisRequest("SETBIT", new Uint8Array([]), [ key, normalizeValue(offset), normalizeValue(value) ])
);
/**
 * **RedisRequest`.setex`** [📕](https://redis.io/commands/setex)  
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
 * **RedisRequest`.setnx`** [📕](https://redis.io/commands/setnx)  
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
 * **RedisRequest`.setrange`** [📕](https://redis.io/commands/setrange)  
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
 * **RedisRequest`.stralgo`** [📕](https://redis.io/commands/stralgo)  
 * ```js
 * const redisRequest = RedisRequest.strlen("LCS", "KEYS, "hoge", "piyo");
 * ```
 */
RedisRequest.stralgo = curry(
  (...subcommands) => RedisRequest("STRALGO", new Uint8Array([]), normalizeOptions(subcommands))
);
/**
 * **RedisRequest`.strlen`** [📕](https://redis.io/commands/strlen)  
 * ```js
 * const redisRequest = RedisRequest.strlen("hoge");
 * ```
 */
RedisRequest.strlen = key => RedisRequest("STRLEN", new Uint8Array([]), [ key ]);

export const factorizeRedisRequest = curry(RedisRequest);

export default RedisRequest;
