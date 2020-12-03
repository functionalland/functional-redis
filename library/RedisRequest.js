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
import { assertIsBoolean, assertIsInstance, assertIsString } from "../../functional/library/utilities.js";

export const RedisRequest = factorizeType("RedisRequest", [ "command", "raw", "arguments" ]);

export const factorizeRedisRequest = curry(RedisRequest);

const normalizeValue = when(complement(assertIsString), String);
const normalizeOptions = map(normalizeValue);
const spreadOptions = compose(filter(complement(assertIsBoolean)), flatten, toPairs);

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
  (key, start, end) =>
    RedisRequest("GETRANGE", new Uint8Array([]), [ key, normalizeValue(start), normalizeValue(end) ])
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
RedisRequest.set = curry(
  (key, value, options) =>
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
RedisRequest.mset = curry(
  (key, value, keyValues) =>
    RedisRequest(
      "MSET",
      assertIsInstance(Uint8Array, value) ? value : new Uint8Array([]),
      [
        key,
        ...keyValues
      ]
    )
);

export default RedisRequest;