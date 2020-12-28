<img src="./.github/fl-logo.svg" alt="Functional Redis" width="450" />

A simple Redis client in tune with Functional Programming principles in JavaScript for Deno.

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black)](https://deno.land/x/functional_redis@v0.2.0)
[![deno version](https://img.shields.io/badge/deno-^1.6.1-lightgrey?logo=deno)](https://github.com/denoland/deno)
[![GitHub release](https://img.shields.io/github/v/release/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/releases)
[![GitHub licence](https://img.shields.io/github/license/sebastienfilion/functional-redis)](https://github.com/sebastienfilion/functional-redis/blob/v0.2.0/LICENSE)
[![Discord Chat](https://img.shields.io/discord/790708610023555093.svg)](https://discord.gg/)

  * [Redis Request](#redis-request)
  * [Redis Response](#redis-response)
  * [Client](#client)

## Usage

Functional Redis is optimized to write elegant and powerful point-free functions.
This example uses the Ramda library - for simplification - but you should be able to use any library that implements the Fantasy-land specifications.

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import File from "https://deno.land/x/functional_io@v1.1.0/library/File.js";
import { writeFile } from "https://deno.land/x/functional_io@v1.1.0/library/fs.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
import {
  createRedisSession,
  pipeRedisCommand
} from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";

const copyHogeToFuga = createRedisSession(
  compose(
    chain(
      compose(
        writeFile({}),
        concat(File.fromPath(`${Deno.cwd()}/hoge`))
      )
    ),
    pipeRedisCommand(
      [
        RedisRequest.set({}, "hoge", "piyo"),
        RedisRequest.get("hoge"),
        RedisRequest.set({}, "fuga")
      ]
    )
  )
);

const container = await copyHogeToFuga({ port: 6379 }).run();

safeExtract("Failed to execute the request.", container);
```



---

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
import { encodeText } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

assert(RedisRequest.is(redisRequest));
```  

The placeholder can be used multiple times if the buffer has multiple values separated by CLRF (`\r\n`).

```js
import { encodeText } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import RedisRequest from "https://deno.land/x/functional-redis@v0.1.1/library/RedisRequest.js";
import { $$rawPlaceholder } from "https://deno.land/x/functional-redis@v0.1.0/library/Symbol.js";

const redisRequest = RedisRequest(
  "MSET",
  encodeText("piyo\r\nfuga\r\n"),
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ]
);

assert(RedisRequest.is(redisRequest));
```  

### Utilities

The `RedisRequest` namespace comes with methods for convenience to create an instance of `RedisRequest` with various
commands. The methods are curried.

#### `factorizeRedisRequest`
`String → Uint8Array → (String|Symbol)[] → RedisRequest`

This curried function takes a string for the name of the Redis command, a (optionally empty) `Uint8Array` and, an
array for the arguments. The return value is an instance of `RedisRequest`.

***

#### String commands

##### RedisRequest`.append` [📕](https://redis.io/commands/append)
`String → (String|Uint8Array) → RedisRequest`

```js
const redisRequest = RedisRequest.append("hoge", "piyo");
```

##### RedisRequest`.bitcount` [📕](https://redis.io/commands/bitcount)
`String → [ Number, Number ] → RedisRequest`

```js
const redisRequest = RedisRequest.bitcount("hoge", [ 0, 1 ]);
```

##### RedisRequest`.bitfield` [📕](https://redis.io/commands/bitfield)
`String → String[] → RedisRequest`

```js
const redisRequest = RedisRequest.bitfield("hoge", [ "GET", "i8", 100 ]);
```

##### RedisRequest`.bitop` [📕](https://redis.io/commands/bitop)
`String → String → String[] → RedisRequest`

```js
const redisRequest = RedisRequest.bitop("AND", "hoge", [ "piyo", "fuga" ]);
```

##### RedisRequest`.bitpos` [📕](https://redis.io/commands/bitpos)
`String → [ Number, Number ] → RedisRequest`

```js
const redisRequest = RedisRequest.bitpos("hoge", [ 0, 1 ]);
```

##### RedisRequest`.decr` [📕](https://redis.io/commands/decr)
`String → RedisRequest`

```js
const redisRequest = RedisRequest.decr("hoge");
```

##### RedisRequest`.decrby` [📕](https://redis.io/commands/decrby)
`String → Number → RedisRequest`

```js
const redisRequest = RedisRequest.decrby("hoge", 3);
```

##### RedisRequest`.get` [📕](https://redis.io/commands/get)
`String → RedisRequest`

```js
const redisRequest = RedisRequest.get("hoge");
```

##### RedisRequest`.getbit` [📕](https://redis.io/commands/getbit)
`String → Number → RedisRequest`

```js
const redisRequest = RedisRequest.getbit("hoge", 3);
```

##### RedisRequest`.getrange` [📕](https://redis.io/commands/getrange)
`String → [ Number, Number ] → RedisRequest`

```js
const redisRequest = RedisRequest.getrange("hoge", [ 0, 1 ]);
```

##### RedisRequest`.getset` [📕](https://redis.io/commands/getset)
`String → (String|Uint8Array) → RedisRequest`

```js
const redisRequestA = RedisRequest.getset("hoge", "piyo");
const redisRequestB = RedisRequest.getset("hoge", encodeText("piyo"));
```

##### RedisRequest`.incr` [📕](https://redis.io/commands/incr)
`String → RedisRequest`

```js
const redisRequest = RedisRequest.incr("hoge");
```

##### RedisRequest`.incrby` [📕](https://redis.io/commands/incrby)
`String → Number → RedisRequest`

```js
const redisRequest = RedisRequest.incrby("hoge", 3);
```

##### RedisRequest`.incrbyfloat` [📕](https://redis.io/commands/incrbyfloat)
`String → Number → RedisRequest`

```js
const redisRequest = RedisRequest.incrbyfloat("hoge", 0.1);
```

##### RedisRequest`.mget` [📕](https://redis.io/commands/mget)
`(...String) → RedisRequest`

```js
const redisRequest = RedisRequest.mget("hoge", "piyo");
```

##### RedisRequest`.mset` [📕](https://redis.io/commands/mset)
`(...String) → RedisRequest`, or `(String|Symbol)[] → Uint8Array → RedisRequest`

```js
const redisRequestA = RedisRequest.mset("hoge", "piyo", "hogefuga", "fuga");
const redisRequestB = RedisRequest.mset(
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
  encodeText("piyo\r\nfuga\r\n")
);
```

##### RedisRequest`.msetnx` [📕](https://redis.io/commands/msetnx)
`(...String) → RedisRequest`, or `(String|Symbol)[] → Uint8Array → RedisRequest`

```js
const redisRequestA = RedisRequest.msetnx("hoge", "piyo", "hogefuga", "fuga");
const redisRequestB = RedisRequest.msetnx(
  [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
  encodeText("piyo\r\nfuga\r\n")
);
```

##### RedisRequest`.psetex` [📕](https://redis.io/commands/psetex)
`Number → String → (String|Uint8Array) → RedisRequest`

```js
const redisRequestA = RedisRequest.psetex(1000, "hoge", "piyo");
const redisRequestB = RedisRequest.psetex(1000, "hoge", encodeText("piyo"));
```

##### RedisRequest`.set` [📕](https://redis.io/commands/set)
`Object → String → (String|Uint8Array) → RedisRequest`

```js
const redisRequestA = RedisRequest.set({}, "hoge", "piyo");
const redisRequestB = RedisRequest.set({}, "hoge", encodeText("piyo"));
const redisRequestC = RedisRequest.set({ EX: 2000 }, "hoge", encodeText("piyo"));
const redisRequestD = RedisRequest.set({ KEEPTTL: true }, "hoge", encodeText("piyo"));
```

##### RedisRequest`.setbit` [📕](https://redis.io/commands/setbit)
`String → Number → Number → RedisRequest`

```js
const redisRequest = RedisRequest.setbit("hoge", 7, 1);
```

##### RedisRequest`.setex` [📕](https://redis.io/commands/setex)
`Number → String → (String|Uint8Array) → RedisRequest`

```js
const redisRequestA = RedisRequest.setex(10, "hoge", "piyo");
const redisRequestB = RedisRequest.setex(10, "hoge", encodeText("piyo"));
```

##### RedisRequest`.setnx` [📕](https://redis.io/commands/setnx)
`String → (String|Uint8Array) → RedisRequest`

```js
const redisRequestA = RedisRequest.setnx("hoge", "piyo");
const redisRequestB = RedisRequest.setnx("hoge", encodeText("piyo"));
```

##### RedisRequest`.setrange` [📕](https://redis.io/commands/setrange)
`String → Number → (String|Uint8Array) → RedisRequest`

```js
const redisRequest = RedisRequest.setrange("hoge", 2, "FU");
```

##### RedisRequest`.stralgo` [📕](https://redis.io/commands/stralgo)
`(...String) → RedisRequest`

```js
const redisRequest = RedisRequest.strlen("LCS", "KEYS, "hoge", "piyo");
```

##### RedisRequest`.strlen` [📕](https://redis.io/commands/strlen)
`String → RedisRequest`

```js
const redisRequest = RedisRequest.strlen("hoge");
```

##### RedisRequest`.flushall` [📕](https://redis.io/commands/flushall)
`() → RedisRequest`

```js
const redisRequest = RedisRequest.flushall();
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

### Utilities

#### `factorizeRedisResponseSuccess`
`Uint8Array → RedisResponse.Success`

#### `factorizeRedisResponseFailure`
`Uint8Array → RedisResponse.Failure`

---

## Client

The client module provides various utility functions to interact with a Redis server.

### `decodeRedisResponse`
`RedisResponse → *`

This functions takes a `RedisResponse` and, returns the most appropriate JavaScript primitive.
For example, [string command's](https://redis.io/commands#string) response would return a string and,
[hash command's](https://redis.io/commands#hash) response would return an array...

### `parseRedisResponse`
`RedisResponse → Buffer`

This functions takes a `RedisResponse` and, returns a `Buffer` which can be interoperated cleanly with `RedisRequest`,
[`Resource`](https://github.com/sebastienfilion/functional-io#resource),
[`File`](https://github.com/sebastienfilion/functional-io#file) and,
[`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request).

### `connectRedisClient`
`Object → Task Resource`

This function takes an object for the connection options and, return a
[`Task`](https://github.com/sebastienfilion/functional#task-type) of a `Resource`.

```js
import { connectRedisClient } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";

const container = await connectRedisClient({ port: 6379 }).run();
const redisResource = safeExtract("Failed to connect the client.", container);
```

### `disconnectRedisClient`
`Resource → Task Resource`

This function takes a Resource and, return a
[`Task`](https://github.com/sebastienfilion/functional#task-type) of a `Resource`.

```js
import { disconnectRedisClient } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";

await disconnectRedisClient(redisResource).run();
```

### `executeRedisCommand`
`RedisRequest → Resource → Task RedisResponse`

This curried function accepts a `RedisRequest` and a `Resource` that represents a connection to the Redis server
and, returns a [`Task`](https://github.com/sebastienfilion/functional#task-type) of a `RedisResponse`.

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import { executeRedisCommand } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
import RedisResponse from "https://deno.land/x/functional_redis@v0.2.0/library/RedisResponse.js";

const container = await executeRedisCommand(
  RedisRequest.set({}, "hoge", "piyo"),
  redisResource
).run();
const redisResponse = safeExtract("Failed to execute the command..", container);

assert(RedisResponse.is(redisResponse));
```

### `executeRedisCommandPipeline`
`RedisRequest[] → Resource → Task RedisResponse[]`

This curried function accepts an array of `RedisRequest` and, a `Resource` that represents a connection to the Redis
server. The function returns a [`Task`](https://github.com/sebastienfilion/functional#task-type) of an array of
`RedisResponse`.
*Do not confuse this function with `pipeRedisCommand`; the term "pipeline" refers to the
[ability of a Redis server](https://redis.io/topics/pipelining) to parse multiple request at a time.*

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import { executeRedisCommandPipeline } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
import RedisResponse from "https://deno.land/x/functional_redis@v0.2.0/library/RedisResponse.js";

const container = await executeRedisCommandPipeline(
  [
    RedisRequest.set({}, "hoge", "piyo"),
    RedisRequest.get("hoge")
  ],
  redisResource
).run();
const redisResponseList = safeExtract("Failed to execute the command..", container);

assert(redisResponseList.every(RedisResponse.is));
```

### `createRedisSession`
`(Resource → Task *) → Object → Task Resource`

This function takes an unary function that accepts a `Resource` that represents a connection to the Redis server and,
Return a [`Task`](https://github.com/sebastienfilion/functional#task-type).

This functions will sequentially connect to the Redis server, execute the unary function and, finally disconnect.

```js
const setHoge = createRedisSession(executeRedisCommand(RedisRequest.set({}, "hoge", "piyo")));

const container = await setHoge({ port: 6379 }).run();

safeExtract("Failed to read the response.", container);
```

The function resolves to a `Task` of the `Resource`; if you need to access the `RedisResponse`, the unary function
should compose with the handler.

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import File from "https://deno.land/x/functional_io@v1.1.0/library/File.js";
import { writeFile } from "https://deno.land/x/functional_io@v1.1.0/library/fs.js";
import {
  createRedisSession,
  executeRedisCommand
} from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";

const writeHogeToFile = createRedisSession(
  compose(
    chain(
      compose(
        writeFile({}),
        concat(File.fromPath(`${Deno.cwd()}/hoge`)),
        parseRedisResponse
      )
    ),
    executeRedisCommand(RedisRequest.get("hoge"))
  )
);

const containerB = await writeHogeToFile({ port: 6379 }).run();

safeExtract("Failed to read the response.", containerB);
```

### `executeRedisCommandWithSession`
`Object → RedisRequest → Task RedisResponse`

This curried function accepts an object for the options of the connection and, a `RedisRequest`. The return value is
a [`Task`](https://github.com/sebastienfilion/functional#task-type) of a `RedisResponse`.

This is a convenience function that composes `createRedisSession` and `executeRedisCommand`

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import { executeRedisCommandWithSession } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";

const container = await executeRedisCommandWithSession(
  { port: 6379 },
  RedisRequest("SET", new Uint8Array([]), [ "hoge", "piyo" ])
).run();

safeExtract("Failed to read the response.", container);
````

### `pipeRedisCommand`
`(RedisRequest|(* → RedisRequest))[] → Resource → Task RedisResponse`

This curried function accepts an array of `RedisRequest` or a function that would return a `RedisRequest` and, a
`Resource` that represents a connection to the Redis server. The return value is a
[`Task`](https://github.com/sebastienfilion/functional#task-type) of the `RedisResponse` of the last `RedisRequest`.

This function will execute all Redis requests sequentially and optionally pipe the previous response into the next
request.

```js
import { safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";
import {
  createRedisSession,
  pipeRedisCommand
} from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";

const copyHogeToFuga = createRedisSession(
  compose(
    pipeRedisCommand(
      [
        RedisRequest.set({}, "hoge", "piyo"),
        RedisRequest.get("hoge"),
        RedisRequest.set({}, "fuga")
      ]
    )
  )
);

const container = await copyHogeToFuga({ port: 6379 }).run();

safeExtract("Failed to read the response.", container);
```

*This example works because `RedisRequest.set` is a curried function that requires 3 arguments and, returns a
`RedisRequest`.*

---

## Contributing

We appreciate your help! Please, [read the guidelines](./CONTRIBUTING.md).

## License

MIT License

Copyright © 2020 - Sebastien Filion

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.