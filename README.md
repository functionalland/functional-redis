# Functional Redis

A simple Redis client in tune with Functional Programming principles in JavaScript for Deno.

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black)](https://deno.land/x/functional-redis@v0.1.0)
[![deno version](https://img.shields.io/badge/deno-^1.5.4-lightgrey?logo=deno)](https://github.com/denoland/deno)
[![GitHub release](https://img.shields.io/github/v/release/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/releases)
[![GitHub licence](https://img.shields.io/github/license/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/blob/v0.1.0/LICENSE)

* [Redis Request](#redis-request)

## Redis Request

The `RedisRequest` represents a Redis request.
It has three attributes: the first is the Redis command, the second is a typed array named "raw", the last is an
array of arguments.
The `RedisRequest` type is mostly interoperable with [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
[`File`](https://github.com/sebastienfilion/functional-io#file), [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request)
and [`(HTTP) Response`](https://github.com/sebastienfilion/functional-io#response).

The `RedisRequest` type implements the following algebras:
- [x] Group
- [x] Comonad
- [x] Monad

### Example

```js
const redisRequest = RedisRequest("GET", new Uint8Array([]), [ "hoge" ]);

assert(RedisRequest.is(redisRequest));
```

A Symbol named `rawPlaceholder` may be used as a placeholder for the buffer.
In the following example, the request will resolve to: `SET hoge piyo`.

```js
import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

assert(RedisRequest.is(redisRequest));
```

The placeholder can be used multiple times if the buffer has multiple values separated by CLRF (`\r\n`).

```js
import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest(
  "MSET",
  encodeText("piyo\r\nfuga"),
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ]
);

assert(RedisRequest.is(redisRequest));
```

#### Utilities

The `RedisRequest` namespace comes with methods for convenience to create an instance of `RedisRequest` with various
commands. The methods are curried.

##### `RedisRequest.append` [📕](https://redis.io/commands/append)

`RedisRequest ~> append :: String -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.bitcount` [📕](https://redis.io/commands/bitcount)

`RedisRequest ~> bitcount :: String -> Number[] -> RedisRequest`

##### `RedisRequest.bitop` [📕](https://redis.io/commands/bitop)

`RedisRequest ~> bitop :: String -> String -> String[] -> RedisRequest`

##### `RedisRequest.bitpos` [📕](https://redis.io/commands/bitpos)

`RedisRequest ~> bitpos :: String -> Number[] -> RedisRequest`

##### `RedisRequest.decr` [📕](https://redis.io/commands/decr)

`RedisRequest ~> decr :: String -> RedisRequest`

##### `RedisRequest.decrby` [📕](https://redis.io/commands/decrby)

`RedisRequest ~> decrby :: String -> Number -> RedisRequest`

##### `RedisRequest.get` [📕](https://redis.io/commands/get)

`RedisRequest ~> get :: String -> RedisRequest`

##### `RedisRequest.getbit` [📕](https://redis.io/commands/getbit)

`RedisRequest ~> getbit :: String -> Number -> RedisRequest`

##### `RedisRequest.getrange` [📕](https://redis.io/commands/getrange)

`RedisRequest ~> getrange :: String -> Number[] -> RedisRequest`

##### `RedisRequest.getset` [📕](https://redis.io/commands/getset)

`RedisRequest ~> getset :: String -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.incr` [📕](https://redis.io/commands/incr)

`RedisRequest ~> incr :: String -> RedisRequest`

##### `RedisRequest.incrby` [📕](https://redis.io/commands/incrby)

`RedisRequest ~> incrby :: String -> Number -> RedisRequest`

##### `RedisRequest.incrbyfloat` [📕](https://redis.io/commands/incrbyfloat)

`RedisRequest ~> incrbyfloat :: String -> Number -> RedisRequest`

##### `RedisRequest.mget` [📕](https://redis.io/commands/mget)

`RedisRequest ~> mget :: (...String) -> RedisRequest`

##### `RedisRequest.mset` [📕](https://redis.io/commands/mset)

`RedisRequest ~> mset :: String[] -> [Uint8Array ->] RedisRequest`

##### `RedisRequest.msetnx` [📕](https://redis.io/commands/msetnx)

`RedisRequest ~> msetnx :: String[] -> [Uint8Array ->] RedisRequest`

##### `RedisRequest.psetex` [📕](https://redis.io/commands/psetex)

`RedisRequest ~> psetex :: Number -> String -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.set` [📕](https://redis.io/commands/set)

`RedisRequest ~> set :: String -> String|Uin8Array -> RedisRequest`

##### `RedisRequest.setbit` [📕](https://redis.io/commands/setbit)

`RedisRequest ~> setbit :: String -> Number -> String|Uin8Array -> RedisRequest`

##### `RedisRequest.setex` [📕](https://redis.io/commands/setex)

`RedisRequest ~> setex :: Number -> String -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.setnx` [📕](https://redis.io/commands/setnx)

`RedisRequest ~> setnx :: String -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.setrange` [📕](https://redis.io/commands/setrange)

`RedisRequest ~> setrange :: String -> Number -> String|Uint8Array -> RedisRequest`

##### `RedisRequest.stralgo` [📕](https://redis.io/commands/stralgo)

`RedisRequest ~> stralgo :: String[] -> RedisRequest`

##### `RedisRequest.strlen` [📕](https://redis.io/commands/strlen)

`RedisRequest ~> strlen :: String -> RedisRequest`