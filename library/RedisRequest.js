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
import { factorizeType } from "https://deno.land/x/functional@v1.0.0/library/factories.js";
import { $$rawPlaceholder } from "./Symbol.js";
import {
  assertIsArray,
  assertIsBoolean,
  assertIsInstance,
  assertIsString
} from "../../functional/library/utilities.js";

export const RedisRequest = factorizeType("RedisRequest", [ "command", "raw", "arguments" ]);

/**
 * The `RedisRequest` represents a Redis request.
 * It has three attributes: the first is the Redis command, the second is a typed array named "raw", the last is an
 * array of arguments.
 * The `RedisRequest` type is mostly interoperable with [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
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
 * const redisRequest = RedisRequest("GET", new Uint8Array([]), [ "hoge" ]);
 *
 * assert(RedisRequest.is(redisRequest));
 * ```
 *
 * A Symbol named `rawPlaceholder` may be used as a placeholder for the buffer.
 * In the following example, the request will resolve to: `SET hoge piyo`.
 *
 * ```js
 * import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";
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
 * import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";
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
 * #### Utilities
 *
 * The `RedisRequest` namespace comes with methods for convenience to create an instance of `RedisRequest` with various
 * commands. The methods are curried.
 *
 * ##### `RedisRequest.append` [📕](https://redis.io/commands/append)
 *
 * `RedisRequest ~> append :: String -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.bitcount` [📕](https://redis.io/commands/bitcount)
 *
 * `RedisRequest ~> bitcount :: String -> Number[] -> RedisRequest`
 *
 * ##### `RedisRequest.bitop` [📕](https://redis.io/commands/bitop)
 *
 * `RedisRequest ~> bitop :: String -> String -> String[] -> RedisRequest`
 *
 * ##### `RedisRequest.bitpos` [📕](https://redis.io/commands/bitpos)
 *
 * `RedisRequest ~> bitpos :: String -> Number[] -> RedisRequest`
 *
 * ##### `RedisRequest.decr` [📕](https://redis.io/commands/decr)
 *
 * `RedisRequest ~> decr :: String -> RedisRequest`
 *
 * ##### `RedisRequest.decrby` [📕](https://redis.io/commands/decrby)
 *
 * `RedisRequest ~> decrby :: String -> Number -> RedisRequest`
 *
 * ##### `RedisRequest.get` [📕](https://redis.io/commands/get)
 *
 * `RedisRequest ~> get :: String -> RedisRequest`
 *
 * ##### `RedisRequest.getbit` [📕](https://redis.io/commands/getbit)
 *
 * `RedisRequest ~> getbit :: String -> Number -> RedisRequest`
 *
 * ##### `RedisRequest.getrange` [📕](https://redis.io/commands/getrange)
 *
 * `RedisRequest ~> getrange :: String -> Number[] -> RedisRequest`
 *
 * ##### `RedisRequest.getset` [📕](https://redis.io/commands/getset)
 *
 * `RedisRequest ~> getset :: String -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.incr` [📕](https://redis.io/commands/incr)
 *
 * `RedisRequest ~> incr :: String -> RedisRequest`
 *
 * ##### `RedisRequest.incrby` [📕](https://redis.io/commands/incrby)
 *
 * `RedisRequest ~> incrby :: String -> Number -> RedisRequest`
 *
 * ##### `RedisRequest.incrbyfloat` [📕](https://redis.io/commands/incrbyfloat)
 *
 * `RedisRequest ~> incrbyfloat :: String -> Number -> RedisRequest`
 *
 * ##### `RedisRequest.mget` [📕](https://redis.io/commands/mget)
 *
 * `RedisRequest ~> mget :: (...String) -> RedisRequest`
 *
 * ##### `RedisRequest.mset` [📕](https://redis.io/commands/mset)
 *
 * `RedisRequest ~> mset :: String[] -> [Uint8Array ->] RedisRequest`
 *
 * ##### `RedisRequest.msetnx` [📕](https://redis.io/commands/msetnx)
 *
 * `RedisRequest ~> msetnx :: String[] -> [Uint8Array ->] RedisRequest`
 *
 * ##### `RedisRequest.psetex` [📕](https://redis.io/commands/psetex)
 *
 * `RedisRequest ~> psetex :: Number -> String -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.set` [📕](https://redis.io/commands/set)
 *
 * `RedisRequest ~> set :: String -> String|Uin8Array -> RedisRequest`
 *
 * ##### `RedisRequest.setbit` [📕](https://redis.io/commands/setbit)
 *
 * `RedisRequest ~> setbit :: String -> Number -> String|Uin8Array -> RedisRequest`
 *
 * ##### `RedisRequest.setex` [📕](https://redis.io/commands/setex)
 *
 * `RedisRequest ~> setex :: Number -> String -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.setnx` [📕](https://redis.io/commands/setnx)
 *
 * `RedisRequest ~> setnx :: String -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.setrange` [📕](https://redis.io/commands/setrange)
 *
 * `RedisRequest ~> setrange :: String -> Number -> String|Uint8Array -> RedisRequest`
 *
 * ##### `RedisRequest.stralgo` [📕](https://redis.io/commands/stralgo)
 *
 * `RedisRequest ~> stralgo :: String[] -> RedisRequest`
 *
 * ##### `RedisRequest.strlen` [📕](https://redis.io/commands/strlen)
 *
 * `RedisRequest ~> strlen :: String -> RedisRequest`
 */

RedisRequest.prototype.ap = RedisRequest.prototype["fantasy-land/ap"] = function (container) {

  return RedisRequest(this.command, container.raw(this.raw), this.arguments);
};

RedisRequest.empty = RedisRequest.prototype.empty = RedisRequest.prototype["fantasy-land/empty"] = () =>
  RedisRequest("", new Uint8Array([]), []);

RedisRequest.isOrThrow = container => {
  if (RedisRequest.is(container) || container.hasOwnProperty("raw")) return container;
  else throw new Error(`Expected a RedisRequest but got a "${container[$$type] || typeof container}"`);
};

RedisRequest.prototype.chain = RedisRequest.prototype["fantasy-land/chain"] = function (unaryFunction) {

  return unaryFunction(this.raw);
};

RedisRequest.prototype.concat = RedisRequest.prototype["fantasy-land/concat"] = function (container) {

  return RedisRequest(this.command, new Uint8Array([ ...this.raw, ...container.raw ]), this.arguments);
};

RedisRequest.empty = RedisRequest.prototype.empty = RedisRequest.prototype["fantasy-land/empty"] = function () {

  return RedisRequest(this.command, new Uint8Array([]), this.arguments);
};

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

export const factorizeRedisRequest = curry(RedisRequest);

const normalizeValue = when(complement(assertIsString), String);
const normalizeOptions = map(normalizeValue);
const spreadOptions = compose(normalizeOptions, filter(complement(assertIsBoolean)), flatten, toPairs);

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
RedisRequest.bitcount = curry(
  (key, range) => RedisRequest("BITCOUNT", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
RedisRequest.bitfield = curry(
  (key, subcommand) => RedisRequest("BITFIELD", new Uint8Array([]), [ key, ...normalizeOptions(subcommand) ])
);
RedisRequest.bitop = curry(
  (operation, destinationKey, keyList) =>
    RedisRequest("BITOP", new Uint8Array([]), [ operation, destinationKey, ...keyList ])
);
RedisRequest.bitpos = curry(
  (key, range) => RedisRequest("BITPOS", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
RedisRequest.decr = key => RedisRequest("DECR", new Uint8Array([]), [ key ]);
RedisRequest.decrby = curry(
  (key, amount) => RedisRequest("DECRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
RedisRequest.get = key => RedisRequest("GET", new Uint8Array([]), [ key ]);
RedisRequest.getbit = curry(
  (key, offset) => RedisRequest("GETBIT", new Uint8Array([]), [ key, normalizeValue(offset) ])
);
RedisRequest.getrange = curry(
  (key, range) =>
    RedisRequest("GETRANGE", new Uint8Array([]), [ key, ...normalizeOptions(range) ])
);
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
RedisRequest.incr = key => RedisRequest("INCR", new Uint8Array([]), [ key ]);
RedisRequest.incrby = curry(
  (key, amount) => RedisRequest("INCRBY", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
RedisRequest.incrbyfloat = curry(
  (key, amount) => RedisRequest("INCRBYFLOAT", new Uint8Array([]), [ key, normalizeValue(amount) ])
);
RedisRequest.mget = (...keys) => RedisRequest("MGET", new Uint8Array([]), keys);
RedisRequest.mset = curry(
  (valueList, _buffer) =>
    RedisRequest(
      "MSET",
      assertIsInstance(Uint8Array, _buffer) ? _buffer : new Uint8Array([]),
      assertIsString(valueList) ? [ valueList, ...(assertIsArray(_buffer) ? _buffer : [ _buffer ]) ] : valueList
    )
);
RedisRequest.msetnx = curry(
  (valueList, _buffer) =>
    RedisRequest(
      "MSETNX",
      assertIsInstance(Uint8Array, _buffer) ? _buffer : new Uint8Array([]),
      assertIsString(valueList) ? [ valueList, ...(assertIsArray(_buffer) ? _buffer : [ _buffer ]) ] : valueList
    )
);
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
RedisRequest.setbit = curry(
  (key, offset, value) =>
    RedisRequest("SETBIT", new Uint8Array([]), [ key, normalizeValue(offset), normalizeValue(value) ])
);
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
RedisRequest.stralgo = curry(
  (subcommand) => RedisRequest("STRALGO", new Uint8Array([]), normalizeOptions(subcommand))
);
RedisRequest.strlen = key => RedisRequest("STRLEN", new Uint8Array([]), [ key ]);

export default RedisRequest;
