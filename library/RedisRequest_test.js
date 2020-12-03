import { assertEquals } from "https://deno.land/std@0.70.0/testing/asserts.ts"
import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";

import RedisRequest from "./RedisRequest.js";

Deno.test(
  "RedisRequest.append",
  () => {
    assertEquals(
      RedisRequest.append("HOGE", "PIYO", {}).toString(),
      `RedisRequest("APPEND", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.append("HOGE", encodeText("PIYO"), {}).toString(),
      `RedisRequest("APPEND", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.bitcount",
  () => {
    assertEquals(
      RedisRequest.bitcount("HOGE", []).toString(),
      `RedisRequest("BITCOUNT", , ["HOGE"])`
    );

    assertEquals(
      RedisRequest.bitcount("HOGE", [ 0, 1 ]).toString(),
      `RedisRequest("BITCOUNT", , ["HOGE", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitfield",
  () => {
    assertEquals(
      RedisRequest.bitfield("HOGE", [ "GET", "i8", 100 ]).toString(),
      `RedisRequest("BITFIELD", , ["HOGE", "GET", "i8", "100"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitop",
  () => {
    assertEquals(
      RedisRequest.bitop("AND", "HOGE", [ "PIYO", "FUGA" ]).toString(),
      `RedisRequest("BITOP", , ["AND", "HOGE", "PIYO", "FUGA"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitpos",
  () => {
    assertEquals(
      RedisRequest.bitpos("HOGE", [ 0 ]).toString(),
      `RedisRequest("BITPOS", , ["HOGE", "0"])`
    );

    assertEquals(
      RedisRequest.bitpos("HOGE", [ 0, 1 ]).toString(),
      `RedisRequest("BITPOS", , ["HOGE", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.decr",
  () => {
    assertEquals(
      RedisRequest.decr("HOGE").toString(),
      `RedisRequest("DECR", , ["HOGE"])`
    );
  }
);

Deno.test(
  "RedisRequest.decrby",
  () => {
    assertEquals(
      RedisRequest.decrby("HOGE", 3).toString(),
      `RedisRequest("DECRBY", , ["HOGE", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.get",
  () => {
    assertEquals(
      RedisRequest.get("HOGE").toString(),
      `RedisRequest("GET", , ["HOGE"])`
    );
  }
);

Deno.test(
  "RedisRequest.getbit",
  () => {
    assertEquals(
      RedisRequest.getbit("HOGE", 3).toString(),
      `RedisRequest("GETBIT", , ["HOGE", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.getrange",
  () => {
    assertEquals(
      RedisRequest.getrange("HOGE", 0, 1).toString(),
      `RedisRequest("GETRANGE", , ["HOGE", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.getset",
  () => {
    assertEquals(
      RedisRequest.getset("HOGE", "PIYO").toString(),
      `RedisRequest("GETSET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.getset("HOGE", encodeText("PIYO"), {}).toString(),
      `RedisRequest("GETSET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.incr",
  () => {
    assertEquals(
      RedisRequest.incr("HOGE").toString(),
      `RedisRequest("INCR", , ["HOGE"])`
    );
  }
);

Deno.test(
  "RedisRequest.incrby",
  () => {
    assertEquals(
      RedisRequest.incrby("HOGE", 3).toString(),
      `RedisRequest("INCRBY", , ["HOGE", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.incrbyfloat",
  () => {
    assertEquals(
      RedisRequest.incrbyfloat("HOGE", 0.1).toString(),
      `RedisRequest("INCRBYFLOAT", , ["HOGE", "0.1"])`
    );

    assertEquals(
      RedisRequest.incrbyfloat("HOGE", -5).toString(),
      `RedisRequest("INCRBYFLOAT", , ["HOGE", "-5"])`
    );

    assertEquals(
      RedisRequest.incrbyfloat("HOGE", 5.0e3).toString(),
      `RedisRequest("INCRBYFLOAT", , ["HOGE", "5000"])`
    );
  }
);

Deno.test(
  "RedisRequest.mget",
  () => {
    assertEquals(
      RedisRequest.mget("HOGE", "PIYO").toString(),
      `RedisRequest("MGET", , ["HOGE", "PIYO"])`
    );
  }
);

Deno.test(
  "RedisRequest.set",
  () => {
    assertEquals(
      RedisRequest.set("HOGE", "PIYO", {}).toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.set("HOGE", encodeText("PIYO"), {}).toString(),
      `RedisRequest("SET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.set("HOGE", "PIYO", { EX: 2000 }).toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO", "EX", 2000])`
    );

    assertEquals(
      RedisRequest.set("HOGE", "PIYO", { KEEPTTL: true }).toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO", "KEEPTTL"])`
    );
  }
);

Deno.test(
  "RedisRequest.mset",
  () => {
    assertEquals(
      RedisRequest.mset("HOGE", "PIYO", []).toString(),
      `RedisRequest("MSET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.mset(encodeText("PIYO"), [ "HOGE" ]).toString(),
      `RedisRequest("SET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.mset(encodeText("PIYO\r\nFUGA"), [ "HOGE", "HOGEFUGA" ]).toString(),
      `RedisRequest("SET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder), "HOGEFUGA", Symbol(RawPlaceholder)])`
    );
  }
);