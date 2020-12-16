import {
  add,
  always,
  ap,
  applyTo,
  both,
  chain,
  compose,
  concat,
  cond,
  converge,
  curry,
  equals,
  either,
  flip,
  gte,
  identity,
  ifElse,
  includes,
  map,
  match,
  nthArg,
  path,
  prop,
  reduce,
  reverse,
  slice,
  thunkify,
  useWith,
  when
} from "https://x.nest.land/ramda@0.27.0/source/index.js";

import Pair, { factorizePair } from "../../functional/library/Pair.js";
import Task from "../../functional/library/Task.js";
import {
  chainRec,
  decodeRaw,
  encodeText,
  runSequentially
} from "../../functional/library/utilities.js";
import { factorizeBuffer } from "https://deno.land/x/functional_io@v1.0.0/library/Buffer.js";
import Resource, { factorizeResource } from "https://deno.land/x/functional_io@v1.0.0/library/Resource.js";
import { close, readLine, readNBytes, write } from "https://deno.land/x/functional_io@v1.0.0/library/fs.js";
import {
  discardFirstLine,
  discardNCharacter,
  factorizeUint8Array,
  splitCLRF,
  trimCRLF
} from "https://deno.land/x/functional_io@v1.0.0/library/utilities.js";
import { factorizeRedisResponseFailure, factorizeRedisResponseSuccess } from "./RedisResponse.js";
import { $$rawPlaceholder } from "./Symbol.js";
import RedisRequest from "./RedisRequest.js";

const CHARACTER_CODE_CL = "\r".charCodeAt(0);
const CHARACTER_CODE_RF = "\n".charCodeAt(0);
const CHARACTER_CODE_REDIS_SIMPLE_STRING_REPLY = "+".charCodeAt(0);
const CHARACTER_CODE_REDIS_INTEGER_REPLY = ":".charCodeAt(0);
const CHARACTER_CODE_REDIS_BULK_STRING_REPLY = "$".charCodeAt(0);
const CHARACTER_CODE_REDIS_ERROR_REPLY = "-".charCodeAt(0);
const CHARACTER_CODE_REDIS_ARRAY_REPLY = "*".charCodeAt(0);
const CHARACTER_CODE_MINUS = "-".charCodeAt(0);
const CHARACTER_CODE_ZERO = "0".charCodeAt(0);

/**
 * ## Client
 *
 * The client module provides various utility functions to interact with a Redis server.
 */

// splitRedisArray :: Uint8Array -> Uint8Array[]
const splitRedisArray = characterCodeList => {
  let index = 0;
  let sliceFlag = characterCodeList[0] !== CHARACTER_CODE_REDIS_BULK_STRING_REPLY;
  const accumulator = [ [] ];

  while (index < characterCodeList.length) {
    accumulator[accumulator.length - 1].push(characterCodeList[index]);

    if (characterCodeList[index] === CHARACTER_CODE_RF && characterCodeList[index - 1] === CHARACTER_CODE_CL) {
      if (
        [
          CHARACTER_CODE_REDIS_BULK_STRING_REPLY,
          CHARACTER_CODE_REDIS_INTEGER_REPLY,
          CHARACTER_CODE_REDIS_ERROR_REPLY
        ].includes(characterCodeList[index + 1])
      ) sliceFlag = true;
      else sliceFlag = false;

      if (sliceFlag) {
        accumulator.push([]);
        sliceFlag = true;
      }
    }

    index++;
  }

  return accumulator.map(factorizeUint8Array);
};

// decodeRedisMessage :: Uint8Array -> Uint8Array
const decodeRedisMessage = cond([
  [
    compose(equals(CHARACTER_CODE_REDIS_ERROR_REPLY), prop(0)),
    compose(
      Error,
      decodeRaw,
      trimCRLF,
      discardNCharacter(1)
    )
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_SIMPLE_STRING_REPLY), prop(0)),
    compose(
      decodeRaw,
      trimCRLF,
      discardNCharacter(1)
    )
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_INTEGER_REPLY), prop(0)),
    compose(
      Number,
      decodeRaw,
      trimCRLF,
      discardNCharacter(1)
    )
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_BULK_STRING_REPLY), prop(0)),
    cond([
      [
        compose(equals(CHARACTER_CODE_MINUS), prop(1)),
        always(null)
      ],
      [
        compose(equals(CHARACTER_CODE_ZERO), prop(1)),
        always("")
      ],
      [
        always(true),
        compose(
          decodeRaw,
          trimCRLF,
          discardFirstLine
        )
      ]
    ])
  ]
]);

// decodeRedisArrayMessage :: Uint8Array -> Uint8Array
const decodeRedisArrayMessage = compose(
  compose(
    map(decodeRedisMessage),
    splitRedisArray,
    discardFirstLine
  )
);

/**
 * ### `decodeRedisResponse`
 * `RedisResponse -> *`
 *
 * This functions takes a `RedisResponse` and, returns the most appropriate JavaScript primitive.
 * For example, [string command's](https://redis.io/commands#string) response would return a string and,
 * [hash command's](https://redis.io/commands#hash) response would return an array...
 */
export const decodeRedisResponse = compose(
  cond([
    [
      compose(equals(CHARACTER_CODE_REDIS_ARRAY_REPLY), prop(0)),
      decodeRedisArrayMessage
    ],
    [
      always(true),
      decodeRedisMessage
    ]
  ]),
  prop("raw")
);

// encodeRedisRequest :: RedisRequest -> Uint8Array
export const encodeRedisRequest = compose(
  prop("first"),
  converge(
    reduce(
      (accumulator, value) =>
        ifElse(
          equals($$rawPlaceholder),
          _ => Pair(
            factorizeUint8Array(
              [
                ...accumulator.first,
                ...encodeText(`$${accumulator.second[0].byteLength}`),
                CHARACTER_CODE_CL, CHARACTER_CODE_RF,
                ...accumulator.second[0],
                CHARACTER_CODE_CL, CHARACTER_CODE_RF
              ]
            ),
            accumulator.second.slice(1, accumulator.second.length)
          ),
          value => Pair(
            factorizeUint8Array(
              [
                ...accumulator.first,
                ...encodeText(`$${encodeText(String(value)).byteLength}\r\n${value}\r\n`)
              ]),
            accumulator.second
          )
        )(value)
    ),
    [
      converge(
        factorizePair,
        [
          compose(
            encodeText,
            converge(
              curry((argumentList, command) => `*${1 + argumentList.length}\r\n$${command.length}\r\n${command}\r\n`),
              [
                prop("arguments"),
                prop("command")
              ]
            )
          ),
          compose(
            map(trimCRLF),
            splitCLRF,
            prop("raw")
          )
        ]
      ),
      prop("arguments")
    ]
  )
);

// parseRedisMessage :: Uint8Array -> Uint8Array
const parseRedisMessage = cond([
  [
    compose(
      flip(includes)
      (
        [
          CHARACTER_CODE_REDIS_SIMPLE_STRING_REPLY,
          CHARACTER_CODE_REDIS_ERROR_REPLY,
          CHARACTER_CODE_REDIS_INTEGER_REPLY
        ]
      ),
      prop(0)
    ),
    compose(slice(1, -2))
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_BULK_STRING_REPLY), prop(0)),
    compose(slice(0, -2), discardFirstLine)
  ]
])

/**
 * ### `parseRedisResponse`
 * `RedisResponse -> Buffer`
 *
 * This functions takes a `RedisResponse` and, returns a `Buffer` which can be interoperated cleanly with `RedisRequest`,
 * [`Resource`](https://github.com/sebastienfilion/functional-io#resource),
 * [`File`](https://github.com/sebastienfilion/functional-io#file) and,
 * [`(HTTP) Request`](https://github.com/sebastienfilion/functional-io#request).
 */
export const parseRedisResponse = compose(
  factorizeBuffer,
  cond([
    [
      compose(equals(CHARACTER_CODE_REDIS_ARRAY_REPLY), prop(0)),
      compose(
        reduce(
          (accumulator, _buffer) => new Uint8Array([ ...accumulator, ...parseRedisMessage(_buffer), 10 ]),
          factorizeUint8Array([])
        ),
        splitRedisArray,
        discardFirstLine
      )
    ],
    [
      always(true),
      parseRedisMessage
    ]
  ]),
  prop("raw")
);

/**
 * ### `connectRedisClient`
 * `Object -> Task Resource`
 *
 * This function takes an object for the connection options and, return a
 * [`Task`](https://github.com/sebastienfilion/functional#task-type) of a `Resource`.
 *
 * ```js
 * import { connectRedisClient } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 * 
 * const container = await connectRedisClient({ port: 6379 }).run();
 * const redisResource = safeExtract("Failed to connect the client.", container);
 * ```
 */
export const connectRedisClient = compose(
  map(({ rid }) => Resource(factorizeUint8Array([]), rid)),
  options => Task.wrap(_ => Deno.connect(options))
);

/**
 * ### `disconnectRedisClient`
 * `Resource -> Task Resource`
 *
 * This function takes a Resource and, return a
 * [`Task`](https://github.com/sebastienfilion/functional#task-type) of a `Resource`.
 *
 * ```js
 * import { disconnectRedisClient } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 *
 * await disconnectRedisClient(redisResource).run();
 * ```
 */
export const disconnectRedisClient = close;

// readBulkResponse :: Resource -> Task Resource
const readBulkResponse = ap(
  curry((resource, task) => task.map(concat(resource))),
  ap(
    ifElse(
      compose(flip(gte)(0), nthArg(1)),
      flip(readNBytes),
      resource => Task.of(Resource.from({ ...resource }))
    ),
    compose(
      when(flip(gte)(0), add(2)),
      Number,
      prop(1),
      match(/\$([\-0-9]+)\r\n/),
      decodeRaw,
      prop("raw")
    )
  )
);

// readRedisResponseFragment :: Resource -> Task Resource
const readRedisResponseFragment = cond([
  [
    either(
      compose(
        flip(includes)
        (
          [
            CHARACTER_CODE_REDIS_SIMPLE_STRING_REPLY,
            CHARACTER_CODE_REDIS_ERROR_REPLY,
            CHARACTER_CODE_REDIS_INTEGER_REPLY
          ]
        ),
        path([ "raw", 0 ])
      ),
      compose(
        both(
          compose(equals(CHARACTER_CODE_REDIS_BULK_STRING_REPLY), prop(0)),
          compose(equals(CHARACTER_CODE_REDIS_ERROR_REPLY), prop(1))
        ),
        prop("raw")
      )
    ),
    Task.of
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_BULK_STRING_REPLY), path([ "raw", 0 ])),
    readBulkResponse
  ],
  [
    compose(equals(CHARACTER_CODE_REDIS_ARRAY_REPLY), path([ "raw", 0 ])),
    compose(
      ap(
        curry(
          (resource, count) => compose(
            chainRec(
              (Loop, Done, cursor) =>
                cursor === count ? Done(Pair(cursor, null)) : Loop(Pair(cursor + 1, readRedisNextLine(resource))),
              0
            ),
            Task.of
          )(resource)
        ),
        compose(
          Number,
          prop(1),
          match(/\*([\-0-9]+)\r\n/),
          decodeRaw,
          prop("raw")
        )
      )
    )
  ],
  [
    always(true),
    ({ raw }) => {
      throw new Error(`Unhandled Redis response: ${decodeRaw(raw)}`);
    }
  ]
]);

// readRedisNextLine :: Resource -> Task Resource
const readRedisNextLine = compose(chain(readRedisResponseFragment), readLine);

// readRedisResponse :: Resource -> Task RedisResponse
export const readRedisResponse = compose(
  chain(
    compose(
      map(
        compose(
          cond([
            [
              either(
                compose(equals(CHARACTER_CODE_REDIS_ERROR_REPLY), prop(0)),
                both(
                  compose(equals(CHARACTER_CODE_REDIS_BULK_STRING_REPLY), prop(0)),
                  compose(equals(CHARACTER_CODE_REDIS_ERROR_REPLY), prop(1))
                )
              ),
              factorizeRedisResponseFailure
            ],
            [
              always(true),
              factorizeRedisResponseSuccess
            ]
          ]),
          prop("raw")
        )
      ),
      readRedisResponseFragment,
    )
  ),
  readLine
);

// readRedisResponse :: Number -> Resource -> Task RedisResponse[]
export const readMultipleRedisResponse = curry(
  (count, resource) => Task.of([]).chainRec(
    (Loop, Done, cursor) =>
      cursor === count
        ? Done(Pair(cursor, null))
        : Loop(Pair(cursor + 1, readRedisResponse(resource))),
    0
  )
);

// writeRedisRequest :: RedisRequest -> Resource -> Task Resource
export const writeRedisRequest = curry(
  compose(
    map(compose(factorizeResource(factorizeUint8Array([])), prop("rid"))),
    write,
    useWith(factorizeResource, [ encodeRedisRequest, prop("rid") ]),
  )
);

// writeRedisPipeline :: RedisRequest[] -> Resource -> Task Resource
export const writeRedisPipeline = curry(
  compose(
    map(compose(factorizeResource(factorizeUint8Array([])), prop("rid"))),
    write,
    useWith(
      factorizeResource,
      [
        compose(
          reduce(
            (accumulator, value) => accumulator.length > 0
              ? new Uint8Array([ ...value, CHARACTER_CODE_CL, CHARACTER_CODE_RF, ...accumulator ])
              : new Uint8Array([ ...value, CHARACTER_CODE_CL, CHARACTER_CODE_RF ]),
            factorizeUint8Array([])
          ),
          reverse,
          map(encodeRedisRequest)
        ),
        prop("rid")
      ]
    )
  )
);

/**
 * ### `executeRedisCommand`
 * `RedisRequest -> Resource -> Task RedisResponse`
 *
 * This curried function accepts a `RedisRequest` and a `Resource` that represents a connection to the Redis server
 * and, returns a [`Task`](https://github.com/sebastienfilion/functional#task-type) of a `RedisResponse`.
 *
 * ```js
 * import { safeExtract } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
 * import { executeRedisCommand } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 * import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
 * import RedisResponse from "https://deno.land/x/functional_redis@v0.2.0/library/RedisResponse.js";
 *
 * const container = await executeRedisCommand(
 *   RedisRequest.set({}, "hoge", "piyo"),
 *   redisResource
 * ).run();
 * const redisResponse = safeExtract("Failed to execute the command..", container);
 *
 * assert(RedisResponse.is(redisResponse));
 * ```
 */
export const executeRedisCommand = curry(
  compose(
    chain(readRedisResponse),
    writeRedisRequest,
  )
);

/**
 * ### `executeRedisCommandPipeline`
 * `RedisRequest[] -> Resource -> Task RedisResponse[]`
 *
 * This curried function accepts an array of `RedisRequest` and, a `Resource` that represents a connection to the Redis
 * server. The function returns a [`Task`](https://github.com/sebastienfilion/functional#task-type) of an array of
 * `RedisResponse`.
 * *Do not confuse this function with `pipeRedisCommand`; the term "pipeline" refers to the
 * [ability of a Redis server](https://redis.io/topics/pipelining) to parse multiple request at a time.*
 *
 * ```js
 * import { safeExtract } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
 * import { executeRedisCommandPipeline } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 * import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
 * import RedisResponse from "https://deno.land/x/functional_redis@v0.2.0/library/RedisResponse.js";
 *
 * const container = await executeRedisCommandPipeline(
 *   [
 *     RedisRequest.set({}, "hoge", "piyo"),
 *     RedisRequest.get("hoge")
 *   ],
 *   redisResource
 * ).run();
 * const redisResponseList = safeExtract("Failed to execute the command..", container);
 *
 * assert(redisResponseList.every(RedisResponse.is));
 * ```
 */
export const executeRedisCommandPipeline = curry(
  (redisRequestList, resource) =>
    writeRedisPipeline(redisRequestList, resource).chain(readMultipleRedisResponse(redisRequestList.length))
);

/**
 * ### `createRedisSession`
 * `(Resource -> Task *) -> Object -> Task Resource`
 *
 * This function takes an unary function that accepts a `Resource` that represents a connection to the Redis server and,
 * Return a [`Task`](https://github.com/sebastienfilion/functional#task-type).
 *
 * This functions will sequentially connect to the Redis server, execute the unary function and, finally disconnect.
 *
 * ```js
 * const setHoge = createRedisSession(executeRedisCommand(RedisRequest.set({}, "hoge", "piyo")));
 *
 * const container = await setHoge({ port: 6379 }).run();
 *
 * safeExtract("Failed to read the response.", container);
 * ```
 *
 * The function resolves to a `Task` of the `Resource`; if you need to access the `RedisResponse`, the unary function
 * should compose with the handler.
 *
 * ```js
 * import { safeExtract } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
 * import File from "https://deno.land/x/functional_io@v1.0.0/library/File.js";
 * import { writeFile } from "https://deno.land/x/functional_io@v1.0.0/library/fs.js";
 * import {
 *   createRedisSession,
 *   executeRedisCommand
 * } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 * import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
 *
 * const writeHogeToFile = createRedisSession(
 *   compose(
 *     chain(
 *       compose(
 *         writeFile({}),
 *         concat(File.fromPath(`${Deno.cwd()}/hoge`)),
 *         parseRedisResponse
 *       )
 *     ),
 *     executeRedisCommand(RedisRequest.get("hoge"))
 *   )
 * );
 *
 * const containerB = await writeHogeToFile({ port: 6379 }).run();
 *
 * safeExtract("Failed to read the response.", containerB);
 * ```
 */
export const createRedisSession = unaryFunction => compose(
  chain(
    converge(
      runSequentially,
      [
        unaryFunction,
        disconnectRedisClient
      ]
    )
  ),
  connectRedisClient
);

/**
 * ### `pipeRedisCommand`
 * `(RedisRequest|(* -> RedisRequest))[] -> Resource -> Task RedisResponse`
 *
 * This curried function accepts an array of `RedisRequest` or a function that would return a `RedisRequest` and, a
 * `Resource` that represents a connection to the Redis server. The return value is a
 * [`Task`](https://github.com/sebastienfilion/functional#task-type) of the `RedisResponse` of the last `RedisRequest`.
 *
 * This function will execute all Redis requests sequentially and optionally pipe the previous response into the next
 * request.
 *
 * ```js
 * import { safeExtract } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
 * import {
 *   createRedisSession,
 *   pipeRedisCommand
 * } from "https://deno.land/x/functional_redis@v0.2.0/library/client.js";
 * import RedisRequest from "https://deno.land/x/functional_redis@v0.2.0/library/RedisRequest.js";
 *
 * const copyHogeToFuga = createRedisSession(
 *   compose(
 *     pipeRedisCommand(
 *       [
 *         RedisRequest.set({}, "hoge", "piyo"),
 *         RedisRequest.get("hoge"),
 *         RedisRequest.set({}, "fuga")
 *       ]
 *     )
 *   )
 * );
 *
 * const container = await copyHogeToFuga({ port: 6379 }).run();
 *
 * safeExtract("Failed to read the response.", container);
 * ```
 *
 * *This example works because `RedisRequest.set` is a curried function that requires 3 arguments and, returns a
 * `RedisRequest`.*
 */
export const pipeRedisCommand = useWith(
  curry(
    ([ firstRedisRequest, ...redisRequestList ], partialExecute) =>
      reduce(
        (accumulator, partialRedisRequest) =>
          accumulator.chain(
            compose(
              partialExecute,
              partialRedisRequest,
              prop("raw"),
              parseRedisResponse
            )
          ),
        partialExecute(firstRedisRequest),
        map(
          ifElse(
            RedisRequest.is,
            always,
            identity
          ),
          redisRequestList
        )
      )
  ),
  [
    identity,
    flip(executeRedisCommand)
  ]
);
