<img src=".github/fl-word_art-redis-reverse.svg" alt="Functional Core" width="450" />

A simple Redis client in tune with Functional Programming principles in JavaScript for Deno.

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black)](https://deno.land/x/functional-redis@v0.1.1)
[![deno version](https://img.shields.io/badge/deno-^1.5.4-lightgrey?logo=deno)](https://github.com/denoland/deno)
[![GitHub release](https://img.shields.io/github/v/release/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/releases)
[![GitHub licence](https://img.shields.io/github/license/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/blob/v0.1.1/LICENSE)

  * [Redis Request](#redis-request)
  * [Redis Response](#redis-response)

## Redis Request

The `RedisRequest` represents a Redis request.
It has three attributes: the first is the Redis command, the second is a typed array named "raw", the last is an
array of arguments.
The `RedisRequest` type is mostly interoperable with `RedisResponse`, [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
[`File`](https://github.com/sebastienfilion/functional-io#file), [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request)  
and [`(HTTP) Response`](https://github.com/sebastienfilion/functional-io#response).

The `RedisRequest` type implements the following algebras:
- [x] Group
- [x] Comonad
- [x] Monad

### Example

```js
import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";

const redisRequest = RedisRequest("GET", new Uint8Array([]), [ "hoge" ]);

assert(RedisRequest.is(redisRequest));
```  

A Symbol named `rawPlaceholder` may be used as a placeholder for the buffer.
In the following example, the request will resolve to: `SET hoge piyo`.

```js
import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

assert(RedisRequest.is(redisRequest));
```  

The placeholder can be used multiple times if the buffer has multiple values separated by CLRF (`\r\n`).

```js
import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest(
  "MSET",
  encodeText("piyo\r\nfuga"),
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ]
);

assert(RedisRequest.is(redisRequest));
```  

### Utilities

The `RedisRequest` namespace comes with methods for convenience to create an instance of `RedisRequest` with various
commands. The methods are curried.

#### String commands

**RedisRequest`.append`** [📕](https://redis.io/commands/append)
```js
const redisRequest = RedisRequest.append("hoge", "piyo");
```

**RedisRequest`.bitcount`** [📕](https://redis.io/commands/bitcount)  
```js
const redisRequest = RedisRequest.bitcount("hoge", [ 0, 1 ]);
```

**RedisRequest`.bitfield`** [📕](https://redis.io/commands/bitfield)  
```js
const redisRequest = RedisRequest.bitfield("hoge", [ "GET", "i8", 100 ]);
```

**RedisRequest`.bitop`** [📕](https://redis.io/commands/bitop)  
```js
const redisRequest = RedisRequest.bitop("AND", "hoge", [ "piyo", "fuga" ]);
```

**RedisRequest`.bitpos`** [📕](https://redis.io/commands/bitpos)  
```js
const redisRequest = RedisRequest.bitpos("hoge", [ 0, 1 ]);
```

**RedisRequest`.decr`** [📕](https://redis.io/commands/decr)  
```js
const redisRequest = RedisRequest.decr("hoge");
```

**RedisRequest`.decrby`** [📕](https://redis.io/commands/decrby)  
```js
const redisRequest = RedisRequest.decrby("hoge", 3);
```

**RedisRequest`.get`** [📕](https://redis.io/commands/get)  
```js
const redisRequest = RedisRequest.get("hoge");
```

**RedisRequest`.getbit`** [📕](https://redis.io/commands/getbit)  
```js
const redisRequest = RedisRequest.getbit("hoge", 3);
```

**RedisRequest`.getrange`** [📕](https://redis.io/commands/getrange)  
```js
const redisRequest = RedisRequest.getrange("hoge", [ 0, 1 ]);
```

**RedisRequest`.getset`** [📕](https://redis.io/commands/getset)  
```js
const redisRequestA = RedisRequest.getset("hoge", "piyo");
const redisRequestB = RedisRequest.getset("hoge", encodeText("piyo"));
```

**RedisRequest`.incr`** [📕](https://redis.io/commands/incr)  
```js
const redisRequest = RedisRequest.incr("hoge");
```

**RedisRequest`.incrby`** [📕](https://redis.io/commands/incrby)  
```js
const redisRequest = RedisRequest.incrby("hoge", 3);
```

**RedisRequest`.incrbyfloat`** [📕](https://redis.io/commands/incrbyfloat)  
```js
const redisRequest = RedisRequest.incrbyfloat("hoge", 0.1);
```

**RedisRequest`.mget`** [📕](https://redis.io/commands/mget)
```js
const redisRequest = RedisRequest.mget("hoge", "piyo");
```

**RedisRequest`.mset`** [📕](https://redis.io/commands/mset)  
```js
const redisRequestA = RedisRequest.mset("hoge", "piyo", "hogefuga", "fuga");
const redisRequestB = RedisRequest.mset(
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
  encodeText("piyo\r\nfuga\r\n")
);
```

**RedisRequest`.msetnx`** [📕](https://redis.io/commands/msetnx)  
```js
const redisRequestA = RedisRequest.msetnx("hoge", "piyo", "hogefuga", "fuga");
const redisRequestB = RedisRequest.msetnx(
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
  encodeText("piyo\r\nfuga\r\n")
);
```

**RedisRequest`.psetex`** [📕](https://redis.io/commands/psetex)  
```js
const redisRequestA = RedisRequest.psetex(1000, "hoge", "piyo");
const redisRequestB = RedisRequest.psetex(1000, "hoge", encodeText("piyo"));
```

**RedisRequest`.set`** [📕](https://redis.io/commands/set)  
```js
const redisRequestA = RedisRequest.set({}, "hoge", "piyo");
const redisRequestB = RedisRequest.set({}, "hoge", encodeText("piyo"));
const redisRequestC = RedisRequest.set({ EX: 2000 }, "hoge", encodeText("piyo"));
const redisRequestD = RedisRequest.set({ KEEPTTL: true }, "hoge", encodeText("piyo"));
```

**RedisRequest`.setbit`** [📕](https://redis.io/commands/setbit)  
```js
const redisRequest = RedisRequest.setbit("hoge", 7, 1);
```

**RedisRequest`.setex`** [📕](https://redis.io/commands/setex)  
```js
const redisRequestA = RedisRequest.setex(10, "hoge", "piyo");
const redisRequestB = RedisRequest.setex(10, "hoge", encodeText("piyo"));
```

**RedisRequest`.setnx`** [📕](https://redis.io/commands/setnx)  
```js
const redisRequestA = RedisRequest.setnx("hoge", "piyo");
const redisRequestB = RedisRequest.setnx("hoge", encodeText("piyo"));
```

**RedisRequest`.setrange`** [📕](https://redis.io/commands/setrange)  
```js
const redisRequest = RedisRequest.setrange("hoge", 2, "FU");
```

**RedisRequest`.stralgo`** [📕](https://redis.io/commands/stralgo)  
```js
const redisRequest = RedisRequest.strlen("LCS", "KEYS, "hoge", "piyo");
```

**RedisRequest`.strlen`** [📕](https://redis.io/commands/strlen)  
```js
const redisRequest = RedisRequest.strlen("hoge");
```

---

## Redis Response

The `RedisResponse` represents a Redis response.
It has only one argument, a typed array named "raw".
The `RedisResponse` type is mostly interoperable with `RedisRequest`, [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
[`File`](https://github.com/sebastienfilion/functional-io#file), [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request)
and [`(HTTP) Response`](https://github.com/sebastienfilion/functional-io#response).

The `RedisResponse` type implements the following algebras:
- [x] Alternative
- [x] Group
- [x] Comonad
- [x] Monad

### Example

```js
import RedisResponse from "https://deno.land/x/functional-redis@v0.1.1/library/RedisResponse.js";

const redisResponse = RedisResponse.Success(new Uint8Array([]));

assert(RedisResponse.is(redisResponse));
```

### MIT License

Copyright © 2020 - Sebastien Filion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.