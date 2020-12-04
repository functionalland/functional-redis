import { curry } from "https://x.nest.land/ramda@0.27.0/source/index.js";
import { factorizeSumType } from "https://deno.land/x/functional@v1.2.1/library/factories.js";
import { $$tag, $$type } from "https://deno.land/x/functional@v1.2.1/library/Symbols.js";

export const RedisResponse = factorizeSumType(
  "RedisResponse",
  {
    Failure: [ "raw" ],
    Success: [ "raw" ]
  }
);

RedisResponse.Success.of = _buffer => RedisResponse.Success(_buffer);
RedisResponse.Failure.of = _buffer => RedisResponse.Failure(_buffer);

export const factorizeRedisResponseSuccess = curry(RedisResponse.Success);
export const factorizeRedisResponseFailure = curry(RedisResponse.Failure);

RedisResponse.prototype.toString = function () {

  return `${this.constructor[$$type]}.${this[$$tag]}(${this.raw})`;
};

RedisResponse.prototype.concat = RedisResponse.prototype["fantasy-land/concat"] = function (container) {

  return this.constructor[this[$$tag]](new Uint8Array([ ...this.raw, ...container.raw ]));
};

export const parseRedisResponse = redisResponse => redisResponse.parse(redisResponse.raw);

export default RedisResponse;