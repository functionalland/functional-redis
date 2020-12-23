import { chain, compose, converge, curry, map, reduce } from "https://deno.land/x/ramda@v0.27.2/mod.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";

import Pair from "https://deno.land/x/functional@v1.3.2/library/Pair.js";
import Task from "https://deno.land/x/functional@v1.3.2/library/Task.js";

import { log, runSequentially, safeExtract } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";

import {
  connectRedisClient,
  disconnectRedisClient,
  executeRedisCommand,
  executeRedisCommandPipeline,
  createRedisSession
} from "./client.js";
import RedisRequest from "./RedisRequest.js";

const repeatRedisCommandN = (redisRequest, count) => redisResource => Task.of(redisResource).chainRec(
  (Loop, Done, cursor) =>
    cursor === count
      ? Done(Pair(cursor, null))
      : Loop(Pair(cursor + 1, executeRedisCommand(redisRequest, redisResource))),
  0
);

Deno.test(
  "Performance: [functional-redis] SET",
  async () => {
    const executePerformanceTest = compose(
      chain(
        converge(
          runSequentially,
          [
            repeatRedisCommandN(RedisRequest("SET", new Uint8Array([]), [ "HOGE", "PIYO" ]), 10),
            executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), [])),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    safeExtract("Failed to read the response.", await executePerformanceTest(({ port: 6379 })).run());
  }
);

Deno.test(
  "Performance: [functional-redis] with pipeline SET",
  async () => {
    const executePerformanceTest = compose(
      chain(
        converge(
          runSequentially,
          [
            executeRedisCommandPipeline(
              Array(10)
                .fill(null)
                .map(_ => RedisRequest("SET", new Uint8Array([]), [ "HOGE", "PIYO" ]))
            ),
            executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), [])),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    safeExtract("Failed to read the response.", await executePerformanceTest(({ port: 6379 })).run());
  }
);

Deno.test(
  "Performance: [functional-redis] GET",
  async () => {
    const executePerformanceTest = compose(
      chain(
        converge(
          runSequentially,
          [
            executeRedisCommand(RedisRequest("SET", new Uint8Array([]), [ "HOGE", "PIYO" ])),
            repeatRedisCommandN(RedisRequest("GET", new Uint8Array([]), [ "HOGE" ]), 10),
            executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), [])),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    safeExtract("Failed to read the response.", await executePerformanceTest(({ port: 6379 })).run());
  }
);

Deno.test(
  "Performance: [functional-redis] with pipeline GET",
  async () => {
    const executePerformanceTest = compose(
      chain(
        converge(
          runSequentially,
          [
            executeRedisCommand(RedisRequest("SET", new Uint8Array([]), [ "HOGE", "PIYO" ])),
            executeRedisCommandPipeline(
              Array(10)
                .fill(null)
                .map(_ => RedisRequest("GET", new Uint8Array([]), [ "HOGE" ]))
            ),
            executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), [])),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    safeExtract("Failed to read the response.", await executePerformanceTest(({ port: 6379 })).run());
  }
);

Deno.test(
  "Performance: [functional-redis] LRANGE",
  async () => {
    const executePerformanceTest = compose(
      chain(
        converge(
          runSequentially,
          [
            executeRedisCommand(RedisRequest("LPUSH", new Uint8Array([]), [ "HOGE", "PIYO", "FUGA" ])),
            repeatRedisCommandN(RedisRequest("LRANGE", new Uint8Array([]), [ "HOGE", "0", "-1" ]), 10),
            executeRedisCommand(RedisRequest("FLUSHALL", new Uint8Array([]), [])),
            disconnectRedisClient
          ]
        )
      ),
      connectRedisClient
    );

    safeExtract("Failed to read the response.", await executePerformanceTest(({ port: 6379 })).run());
  }
);

Deno.test(
  "Performance: [deno-redis] SET",
  async () => {
    const redis = await connect({ hostname: "127.0.0.1", port: 6379 });

    await Promise.all(Array(10).fill(null).map(_ => redis.set("HOGE", "PIYO")))

    await redis.flushall();

    redis.close();
  }
);

Deno.test(
  "Performance: [deno-redis] GET",
  async () => {
    const redis = await connect({ hostname: "127.0.0.1", port: 6379 });

    await redis.set("HOGE", "PIYO");

    await Promise.all(Array(10).fill(null).map(_ => redis.get("HOGE")))

    await redis.flushall();

    redis.close();
  }
);

Deno.test(
  "Performance: [deno-redis] LRANGE",
  async () => {
    const redis = await connect({ hostname: "127.0.0.1", port: 6379 });

    await redis.lpush("HOGE", "PIYO", "FUGA");

    await Promise.all(Array(10).fill(null).map(_ => redis.lrange("HOGE", 0, -1)))

    await redis.flushall();

    redis.close();
  }
);
