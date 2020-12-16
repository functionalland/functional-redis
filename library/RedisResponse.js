import { factorizeSumType } from "https://deno.land/x/functional@v1.2.1/library/factories.js";
import { $$tag, $$type } from "https://deno.land/x/functional@v1.2.1/library/Symbols.js";

/**
 * ## Redis Response
 *
 * The `RedisResponse` represents a Redis response.
 * It has only one argument, a typed array named "raw".
 * The `RedisResponse` type is mostly interoperable with `RedisRequest`, [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
 * [`File`](https://github.com/sebastienfilion/functional-io#file), [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request)
 * and [`(HTTP) Response`](https://github.com/sebastienfilion/functional-io#response).
 *
 * The `RedisResponse` type implements the following algebras:
 * - [x] Alternative
 * - [x] Group
 * - [x] Comonad
 * - [x] Monad
 *
 * ### Example
 *
 * ```js
 * import RedisResponse from "https://deno.land/x/functional-redis@v0.1.1/library/RedisResponse.js";
 *
 * const redisResponse = RedisResponse.Success(new Uint8Array([]));
 *
 * assert(RedisResponse.is(redisResponse));
 * ```
 */

export const RedisResponse = factorizeSumType(
  "RedisResponse",
  {
    Failure: [ "raw" ],
    Success: [ "raw" ]
  }
);

RedisResponse.prototype.alt = RedisResponse.prototype["fantasy-land/alt"] = function (container) {

  return this.fold({
    Failure: _ => container,
    Success: _ => this
  });
};

RedisResponse.prototype.ap = RedisResponse.prototype["fantasy-land/ap"] = function (container) {

  return this.fold({
    Failure: _ => this,
    Success: value => RedisResponse.of(container.raw(value))
  });
};

RedisResponse.empty = RedisResponse.prototype.empty = RedisResponse.prototype["fantasy-land/empty"] = () =>
  RedisResponse.Success(new Uint8Array([]));

RedisResponse.isOrThrow = container => {
  if (RedisResponse.is(container) || container.hasOwnProperty("raw")) return container;
  else throw new Error(`Expected a RedisResponse but got a "${container[$$type] || typeof container}"`);
};

RedisResponse.prototype.chain = RedisResponse.prototype["fantasy-land/chain"] = function (unaryFunction) {

  return this.fold({
    Failure: _ => this,
    Success: value => unaryFunction(value)
  });
};

RedisResponse.prototype.concat = RedisResponse.prototype["fantasy-land/concat"] = function (container) {

  return RedisResponse.Success(new Uint8Array([ ...this.raw, ...container.raw ]));
};

RedisResponse.empty = RedisResponse.prototype.empty = RedisResponse.prototype["fantasy-land/empty"] = _ =>
  RedisResponse.Success(new Uint8Array([]));

RedisResponse.prototype.equals = RedisResponse.prototype["fantasy-land/equals"] = function (container) {

  return this.raw.byteLength === container.raw.byteLength
    && !!(this.raw.reduce(
      (accumulator, value, index) => accumulator && accumulator[index] == value ? accumulator : false,
      container.raw
    ));
};

RedisResponse.prototype.extend = RedisResponse.prototype["fantasy-land/extend"] = function (unaryFunction) {

  return this.fold({
    Failure: _ => this,
    Success: _ => RedisResponse.of(unaryFunction(this))
  });
};

RedisResponse.prototype.extract = RedisResponse.prototype["fantasy-land/extract"] = function () {

  return this.raw;
};

RedisResponse.prototype.lte = RedisResponse.prototype["fantasy-land/equals"] = function (container) {

  return this.raw.byteLength <= container.raw.byteLength
    && !!(this.raw.reduce(
      (accumulator, value, index) => !accumulator && accumulator[index] > value ? accumulator : true,
      container.raw
    ));
};

RedisResponse.prototype.invert = RedisResponse.prototype["fantasy-land/invert"] = function () {

  return this.fold({
    Failure: _ => this,
    Success: value => RedisResponse.of(value.reverse())
  });
};

RedisResponse.prototype.map = RedisResponse.prototype["fantasy-land/map"] = function (unaryFunction) {

  return this.fold({
    Failure: _ => this,
    Success: value => RedisResponse.of(unaryFunction(value))
  });
};

RedisResponse.of = RedisResponse.prototype.of = RedisResponse.prototype["fantasy-land/of"] = buffer =>
  RedisResponse.Success(buffer);

RedisResponse.prototype.toString = function () {

  return `${this.constructor[$$type]}.${this[$$tag]}(${this.raw})`;
};

/**
 * ### Utilities
 *
 * #### `factorizeRedisResponseSuccess`
 * `Uint8Array -> RedisResponse.Success`
 */
export const factorizeRedisResponseSuccess = RedisResponse.Success;

/**
 * #### `factorizeRedisResponseFailure`
 * `Uint8Array -> RedisResponse.Failure`
 */
export const factorizeRedisResponseFailure = RedisResponse.Failure;

export default RedisResponse;