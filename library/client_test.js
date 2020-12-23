import { assert, assertEquals } from "https://deno.land/std@0.79.0/testing/asserts.ts"
import {
  __,
  append,
  applyTo,
  chain,
  compose,
  concat,
  converge,
  curry,
  flip,
  identity,
  lift,
  map,
  prop,
  tap,
  useWith
} from "https://deno.land/x/ramda@v0.27.2/mod.ts";

import Task from "https://deno.land/x/functional@v1.3.2/library/Task.js";
import {
  chainLift,
  decodeRaw,
  encodeText,
  insideOut,
  log,
  safeExtract,
  runSequentially
} from "../../functional/library/utilities.js";
import Buffer from "https://deno.land/x/functional_io@v1.1.0/library/Buffer.js";
import File from "../../functional-io/library/File.js";
import Resource from "https://deno.land/x/functional_io@v1.1.0/library/Resource.js";
import { readFile, writeFile } from "https://deno.land/x/functional_io@v1.1.0/library/fs.js";

import RedisRequest from "./RedisRequest.js";
import { $$rawPlaceholder } from "./Symbol.js";
import {
  connectRedisClient,
  decodeRedisResponse,
  disconnectRedisClient,
  encodeRedisRequest,
  executeRedisCommand,
  executeRedisCommandPipeline,
  createRedisSession,
  parseRedisResponse,
  pipeRedisCommand,
  readRedisResponse,
  writeRedisRequest
} from "./client.js";
import RedisResponse from "./RedisResponse.js";

const initializeMonitor = async _connection => {
  const connection = Resource(new Uint8Array([]), _connection.rid);
  await writeRedisRequest(RedisRequest("MONITOR", new Uint8Array([]), []), connection).run();

  return async argumentList => {
    const _responseBuffer = new Uint8Array(1000);
    await Deno.read(_connection.rid, _responseBuffer);

    assert(decodeRaw(_responseBuffer).includes(argumentList.map(x => `"${x}"`).join(" ")));
  }
};

Deno.test(
  "decodeRedisResponse",
  async () => {
    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("+OK\r\n"))),
      "OK"
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText(":42\r\n"))),
      42
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("$4\r\nhoge\r\n"))),
      "hoge"
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("$0\r\n\r\n"))),
      ""
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Failure(encodeText("$-1\r\n"))),
      null
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Failure(encodeText("-ERR unknown command 'fuga'\r\n"))),
      new Error("ERR unknown command 'fuga'")
    );


    assertEquals(
      decodeRedisResponse(
        RedisResponse.Failure(encodeText("-WRONGTYPE Operation against a key holding the wrong kind of value\r\n"))
      ),
      new Error("WRONGTYPE Operation against a key holding the wrong kind of value")
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("*2\r\n$4\r\nhoge\r\n$4\r\npiyo\r\n"))),
      [ "hoge", "piyo" ]
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("*2\r\n:42\r\n:24\r\n"))),
      [ 42, 24 ]
    );

    assertEquals(
      decodeRedisResponse(RedisResponse.Success(encodeText("*2\r\n:42\r\n$4\r\nhoge\r\n"))),
      [ 42, "hoge" ]
    );
  }
);

Deno.test(
  "encodeRedisRequest",
  async () => {
    assertEquals(
      encodeRedisRequest(RedisRequest("GET", new Uint8Array([]), [ "hoge" ])),
      encodeText("*2\r\n$3\r\nGET\r\n$4\r\nhoge\r\n")
    );

    assertEquals(
      encodeRedisRequest(RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ])),
      encodeText("*3\r\n$3\r\nSET\r\n$4\r\nhoge\r\n$4\r\npiyo\r\n")
    );

    assertEquals(
      encodeRedisRequest(
        RedisRequest("MSET", encodeText("piyo\r\nfuga\r\n"), [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ])
      ),
      encodeText("*5\r\n$4\r\nMSET\r\n$4\r\nhoge\r\n$4\r\npiyo\r\n$8\r\nhogefuga\r\n$4\r\nfuga\r\n")
    );

    assertEquals(
      encodeRedisRequest(RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder, "EX", "60" ])),
      encodeText("*5\r\n$3\r\nSET\r\n$4\r\nhoge\r\n$4\r\npiyo\r\n$2\r\nEX\r\n$2\r\n60\r\n")
    );
  }
);

Deno.test(
  "parseRedisResponse",
  async () => {
    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("+OK\r\n"))),
      Buffer(encodeText("OK"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText(":42\r\n"))),
      Buffer(encodeText("42"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("$4\r\nhoge\r\n"))),
      Buffer(encodeText("hoge"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("$0\r\n\r\n"))),
      Buffer(encodeText(""))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Failure(encodeText("$-1\r\n"))),
      Buffer(encodeText(""))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Failure(encodeText("-ERR unknown command 'fuga'\r\n"))),
      Buffer(encodeText("ERR unknown command 'fuga'"))
    );


    assertEquals(
      parseRedisResponse(
        RedisResponse.Failure(encodeText("-WRONGTYPE Operation against a key holding the wrong kind of value\r\n"))
      ),
      Buffer(encodeText("WRONGTYPE Operation against a key holding the wrong kind of value"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("*2\r\n$4\r\nhoge\r\n$4\r\npiyo\r\n"))),
      Buffer(encodeText("hoge\npiyo\n"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("*2\r\n:42\r\n:24\r\n"))),
      Buffer(encodeText("42\n24\n"))
    );

    assertEquals(
      parseRedisResponse(RedisResponse.Success(encodeText("*2\r\n:42\r\n$4\r\nhoge\r\n"))),
      Buffer(encodeText("42\nhoge\n"))
    );
  }
);

Deno.test(
  "writeRedisRequest",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisMonitorResource = safeExtract("Failed to connect the client.", containerA);
    const assertRedisLog = await initializeMonitor(redisMonitorResource);
    const containerB = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerB);

    const containerC = await writeRedisRequest(
      RedisRequest("PING", new Uint8Array([]), [ "hoge" ]),
      redisResource
    ).run();

    safeExtract("Failed to write the request.", containerC);

    await assertRedisLog([ "PING", "hoge" ]);

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await insideOut(
      Task,
      [
        disconnectRedisClient(redisMonitorResource),
        disconnectRedisClient(redisResource)
      ]
    ).run();
  }
);

Deno.test(
  "writeRedisRequest/readRedisResponse -- Simple string",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    await writeRedisRequest(
      RedisRequest("SET", new Uint8Array([]), [ "hoge", "piyo" ]),
      redisResource
    ).run();

    const containerB = await readRedisResponse(redisResource).run();
    const redisResponseA = safeExtract("Failed to read the response.", containerB);

    assertEquals(
      redisResponseA.toString(),
      `RedisResponse.Success(${encodeText("+OK\r\n")})`
    );

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

Deno.test(
  "writeRedisRequest/readRedisResponse -- Bulk string",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    await writeRedisRequest(
      RedisRequest("SET", new Uint8Array([]), [ "hoge", "piyo" ]),
      redisResource
    ).run();

    await readRedisResponse(redisResource).run();

    await writeRedisRequest(
      RedisRequest("SET", new Uint8Array([]), [ "fuga", "" ]),
      redisResource
    ).run();

    await readRedisResponse(redisResource).run();

    await writeRedisRequest(
      RedisRequest("GET", new Uint8Array([]), [ "hoge" ]),
      redisResource
    ).run();

    const containerC = await readRedisResponse(redisResource).run();
    const redisResponseB = safeExtract("Failed to read the response.", containerC);

    assertEquals(
      redisResponseB.toString(),
      `RedisResponse.Success(${encodeText("$4\r\npiyo\r\n")})`
    );

    await writeRedisRequest(
      RedisRequest("GET", new Uint8Array([]), [ "fuga" ]),
      redisResource
    ).run();

    const containerD = await readRedisResponse(redisResource).run();
    const redisResponseC = safeExtract("Failed to read the response.", containerD);

    assertEquals(
      redisResponseC.toString(),
      `RedisResponse.Success(${encodeText("$0\r\n\r\n")})`
    );

    await writeRedisRequest(
      RedisRequest("GET", new Uint8Array([]), [ "piyo" ]),
      redisResource
    ).run();

    const containerE = await readRedisResponse(redisResource).run();
    const redisResponseD = safeExtract("Failed to read the response.", containerE);

    assertEquals(
      redisResponseD.toString(),
      `RedisResponse.Failure(${encodeText("$-1\r\n")})`
    );

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

Deno.test(
  "writeRedisRequest/readRedisResponse -- Array",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    await writeRedisRequest(
      RedisRequest("LPUSH", new Uint8Array([]), [ "hoge", "piyo", "fuga" ]),
      redisResource
    ).run();

    await readRedisResponse(redisResource).run();

    await writeRedisRequest(
      RedisRequest("LRANGE", new Uint8Array([]), [ "hoge", "0", "-1" ]),
      redisResource
    ).run();

    const containerB = await readRedisResponse(redisResource).run();
    const redisResponse = safeExtract("Failed to read the response.", containerB);

    assertEquals(
      redisResponse.toString(),
      `RedisResponse.Success(${encodeText("*2\r\n$4\r\nfuga\r\n$4\r\npiyo\r\n")})`
    );

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

Deno.test(
  "executeRedisCommand",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    const containerB = await executeRedisCommand(
      RedisRequest("SET", new Uint8Array([]), [ "hoge", "piyo" ]),
      redisResource
    ).run();

    const redisResponseA = safeExtract("Failed to read the response.", containerB);

    assertEquals(
      redisResponseA.toString(),
      `RedisResponse.Success(${encodeText("+OK\r\n")})`
    );

    const containerC = await executeRedisCommand(
      RedisRequest("GET", new Uint8Array([]), [ "hoge" ]),
      redisResource
    ).run();

    const redisResponseB = safeExtract("Failed to read the response.", containerC);

    assertEquals(
      redisResponseB.toString(),
      `RedisResponse.Success(${encodeText("$4\r\npiyo\r\n")})`
    );

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

const ass = curry((message, expected, actual) => assertEquals(actual, expected, message));

Deno.test(
  "createRedisSession",
  async () => {
    const container = await createRedisSession(
      compose(
        map(tap(compose(ass(`The response was not accepted.`, "OK"), decodeRedisResponse))),
        executeRedisCommand(RedisRequest("SET", new Uint8Array([]), [ "hoge", "piyo" ]))
      )
    )({ port: 6379 }).run();

    safeExtract("Failed to read the response.", container);

    await createRedisSession(
      executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), []))
    )({ port: 6379 }).run();
  }
);

Deno.test(
  "executeRedisCommandPipeline",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    const containerB = await executeRedisCommandPipeline(
      [
        RedisRequest.set({}, "hoge", "piyo"),
        RedisRequest.get("hoge")
      ],
      redisResource
    ).run();

    const redisResponseList = safeExtract("Failed to read the response.", containerB);

    assert(redisResponseList.every(RedisResponse.is));

    assertEquals(
      redisResponseList[0].toString(),
      `RedisResponse.Success(${encodeText("+OK\r\n")})`
    );

    assertEquals(
      redisResponseList[1].toString(),
      `RedisResponse.Success(${encodeText("$4\r\npiyo\r\n")})`
    );

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

Deno.test(
  "pipeRedisCommand",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    const containerB = await pipeRedisCommand(
      [
        RedisRequest.set({}, "hoge", "piyo"),
        RedisRequest.get("hoge"),
        RedisRequest.set({}, "fuga"),
        RedisRequest.flushall()
      ],
      redisResource
    ).run();

    safeExtract("Failed to read the response.", containerB);

    await writeRedisRequest(RedisRequest("FLUSHALL", new Uint8Array([]), []), redisResource).run();

    await disconnectRedisClient(redisResource).run();
  }
);

Deno.test(
  "Scenario 1",
  async () => {
    const containerA = await connectRedisClient({ port: 6379 }).run();
    const redisResource = safeExtract("Failed to connect the client.", containerA);

    assert(Resource.is(redisResource));

    const containerB = await executeRedisCommand(
      RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]),
      redisResource
    ).run();
    const redisResponseA = safeExtract("Failed to execute the command..", containerB);

    assert(RedisResponse.is(redisResponseA));

    const containerC = await executeRedisCommand(
      RedisRequest("GET", new Uint8Array([]), [ "hoge" ]),
      redisResource
    ).run();
    const redisResponseB = safeExtract("Failed to execute the command..", containerC);

    assert(RedisResponse.is(redisResponseB));

    assertEquals(redisResponseB.extract(), encodeText("$4\r\npiyo\r\n"));

    assertEquals(decodeRedisResponse(redisResponseB), "piyo");

    await executeRedisCommand(RedisRequest.flushall(), redisResource).run()

    await disconnectRedisClient(redisResource).run();
  }
)

Deno.test(
  "Scenario 2",
  async () => {
    const setHoge = compose(
      chain(
        converge(
          runSequentially,
          [
            executeRedisCommand(RedisRequest.set({}, "hoge", "piyo")),
            executeRedisCommand(RedisRequest.flushall()),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    const container = await setHoge({ port: 6379 }).run();

    safeExtract("Failed to read the response.", container);
  }
);

Deno.test(
  "Scenario 3",
  async () => {
    const setHoge = createRedisSession(executeRedisCommand(RedisRequest.set({}, "hoge", "piyo")));

    const container = await setHoge({ port: 6379 }).run();

    safeExtract("Failed to read the response.", container);
  }
);

Deno.test(
  "Scenario 4",
  async () => {
    const copyHogeToFuga = createRedisSession(
      compose(
        map(tap(compose(ass(`The response was not accepted.`, "OK"), decodeRedisResponse))),
        pipeRedisCommand(
          [
            RedisRequest.set({}, "hoge", "piyo"),
            RedisRequest.get("hoge"),
            RedisRequest.set({}, "fuga"),
            RedisRequest.flushall()
          ]
        )
      )
    );

    const container = await copyHogeToFuga({ port: 6379 }).run();

    safeExtract("Failed to read the response.", container);
  }
);

Deno.test(
  "Scenario 5",
  async () => {
    const setHoge = createRedisSession(executeRedisCommand(RedisRequest.set({}, "hoge", "piyo")));

    const containerA = await setHoge({ port: 6379 }).run();

    safeExtract("Failed to read the response.", containerA);

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

    const flushAll = await createRedisSession(executeRedisCommand(RedisRequest.flushall()));

    const containerC = await flushAll({ port: 6379 }).run();

    safeExtract("Failed to read the response.", containerC);

    await Deno.remove(`${Deno.cwd()}/hoge`);
  }
);
