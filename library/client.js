import {
  __,
  add,
  always,
  ap,
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
  ifElse,
  includes,
  map,
  match,
  nthArg,
  path,
  prop,
  reduce,
  slice,
  useWith,
  when
} from "https://x.nest.land/ramda@0.27.0/source/index.js";

import Pair from "https://deno.land/x/functional@v1.2.1/library/Pair.js";
import Task from "https://deno.land/x/functional@v1.2.1/library/Task.js";
import { decodeRaw, encodeText, runSequentially } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";
import { factorizeBuffer } from "https://deno.land/x/functional_io@v1.0.0//library/Buffer.js";
import Resource, { factorizeResource } from "https://deno.land/x/functional_io@v1.0.0//library/Resource.js";
import { close, readLine, readNBytes, write } from "https://deno.land/x/functional_io@v1.0.0//library/fs.js";
import {
  discardFirstLine,
  discardNCharacter,
  factorizeUint8Array,
  splitCLRF,
  trimCRLF
} from "https://deno.land/x/functional_io@v1.0.0//library/utilities.js";
import { factorizeRedisResponseFailure, factorizeRedisResponseSuccess } from "./RedisResponse.js";
import { $$rawPlaceholder } from "./Symbol.js";
import RedisRequest, { factorizeRedisRequest } from "./RedisRequest.js";

const CHARACTER_CODE_CL = "\r".charCodeAt(0);
const CHARACTER_CODE_RF = "\n".charCodeAt(0);
const CHARACTER_CODE_REDIS_SIMPLE_STRING_REPLY = "+".charCodeAt(0);
const CHARACTER_CODE_REDIS_INTEGER_REPLY = ":".charCodeAt(0);
const CHARACTER_CODE_REDIS_BULK_STRING_REPLY = "$".charCodeAt(0);
const CHARACTER_CODE_REDIS_ERROR_REPLY = "-".charCodeAt(0);
const CHARACTER_CODE_REDIS_ARRAY_REPLY = "*".charCodeAt(0);
const CHARACTER_CODE_MINUS = "-".charCodeAt(0);
const CHARACTER_CODE_ZERO = "0".charCodeAt(0);

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

  return accumulator.map(x => new Uint8Array(x));
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

// decodeRedisResponse :: RedisResponse -> *
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
export const encodeRedisRequest = redisRequest => {
  const splitBuffer = compose(map(trimCRLF), splitCLRF)(redisRequest.raw);
  let rawPlaceholderReplacedCount = 0;

  return redisRequest.arguments.reduce(
    (accumulator, value) => {
      if (value === $$rawPlaceholder) {
        const currentBuffer = splitBuffer[rawPlaceholderReplacedCount++];

        return new Uint8Array(
          [
            ...accumulator,
            ...encodeText(`$${currentBuffer.byteLength}`),
            CHARACTER_CODE_CL, CHARACTER_CODE_RF,
            ...currentBuffer,
            CHARACTER_CODE_CL, CHARACTER_CODE_RF
          ]
        );
      }

      return new Uint8Array(
        [
          ...accumulator,
          ...encodeText(`$${encodeText(String(value)).byteLength}\r\n${value}\r\n`)
        ]);
    },
    encodeText(`*${1 + redisRequest.arguments.length}\r\n$${redisRequest.command.length}\r\n${redisRequest.command}\r\n`)
  );
};

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

// parseRedisResponse :: RedisResponse -> Buffer
export const parseRedisResponse = compose(
  factorizeBuffer,
  cond([
    [
      compose(equals(CHARACTER_CODE_REDIS_ARRAY_REPLY), prop(0)),
      compose(
        reduce(
          (accumulator, _buffer) => new Uint8Array([ ...accumulator, ...parseRedisMessage(_buffer), 10 ]),
          new Uint8Array([])
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

// connectRedisClient :: Object -> Task Resource
export const connectRedisClient = compose(
  map(({ rid }) => Resource(factorizeUint8Array([]), rid)),
  options => Task.wrap(_ => Deno.connect(options))
);

// disconnectRedisClient :: Resource -> Task Resource
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
          (resource, count) => Task.of(resource).chainRec(
            (Loop, Done, cursor) =>
              cursor === count ? Done(Pair(cursor, null)) : Loop(Pair(cursor + 1, readRedisNextLine(resource))),
            0
          )
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

// writeRedisRequest :: Resource -> RedisRequest-> Task Resource
export const writeRedisRequest = curry(
  compose(
    map(compose(factorizeResource(factorizeUint8Array([])), prop("rid"))),
    write,
    useWith(factorizeResource, [ encodeRedisRequest, prop("rid") ]),
  )
);

// executeRedisCommand :: Resource -> RedisRequest -> RedisResponse
export const executeRedisCommand = curry(
  compose(
    chain(readRedisResponse),
    writeRedisRequest,
  )
);

// executeSimpleRedisCommand :: (Resource -> Task *) -> Object -> RedisResponse
export const executeSimpleRedisCommand = unaryFunction => compose(
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
