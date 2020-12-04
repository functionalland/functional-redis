import { assertEquals } from "https://deno.land/std@0.70.0/testing/asserts.ts"
import { encodeText } from "https://deno.land/x/functional@v1.1.0/library/utilities.js";

import RedisRequest from "./RedisRequest.js";
import { $$rawPlaceholder } from "./Symbol.js";

Deno.test(
  "RedisRequest.append",
  () => {
    assertEquals(
      RedisRequest.append("HOGE", "PIYO").toString(),
      `RedisRequest("APPEND", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.append("HOGE", encodeText("PIYO")).toString(),
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
      RedisRequest.getrange("HOGE", [ 0, 1 ]).toString(),
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
  "RedisRequest.mset",
  () => {
    assertEquals(
      RedisRequest.mset("HOGE", "PIYO").toString(),
      `RedisRequest("MSET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.mset("HOGE", "PIYO", "HOGEFUGA", "FUGA").toString(),
      `RedisRequest("MSET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.mset([ "HOGE", $$rawPlaceholder ], encodeText("PIYO")).toString(),
      `RedisRequest("MSET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.mset(
        [ "HOGE", $$rawPlaceholder, "HOGEFUGA", $$rawPlaceholder ],
        encodeText("PIYO\r\nFUGA")
      ).toString(),
      `RedisRequest("MSET", ${encodeText("PIYO\r\nFUGA")}, ["HOGE", Symbol(RawPlaceholder), "HOGEFUGA", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.msetnx",
  () => {
    assertEquals(
      RedisRequest.msetnx("HOGE", "PIYO").toString(),
      `RedisRequest("MSETNX", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.msetnx("HOGE", "PIYO", "HOGEFUGA", "FUGA").toString(),
      `RedisRequest("MSETNX", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.msetnx([ "HOGE", $$rawPlaceholder ], encodeText("PIYO")).toString(),
      `RedisRequest("MSETNX", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.msetnx(
        [ "HOGE", $$rawPlaceholder, "HOGEFUGA", $$rawPlaceholder ],
        encodeText("PIYO\r\nFUGA")
      ).toString(),
      `RedisRequest("MSETNX", ${encodeText("PIYO\r\nFUGA")}, ["HOGE", Symbol(RawPlaceholder), "HOGEFUGA", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.psetex",
  () => {
    assertEquals(
      RedisRequest.psetex(1000, "HOGE", "PIYO").toString(),
      `RedisRequest("PSETEX", , ["HOGE", "1000", "PIYO"])`
    );

    assertEquals(
      RedisRequest.psetex(1000, "HOGE", encodeText("PIYO")).toString(),
      `RedisRequest("PSETEX", ${encodeText("PIYO")}, ["HOGE", "1000", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.set",
  () => {
    assertEquals(
      RedisRequest.set({}, "HOGE", "PIYO").toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.set({}, "HOGE", encodeText("PIYO")).toString(),
      `RedisRequest("SET", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.set({ EX: 2000 }, "HOGE", "PIYO").toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO", "EX", "2000"])`
    );

    assertEquals(
      RedisRequest.set({ KEEPTTL: true }, "HOGE", "PIYO").toString(),
      `RedisRequest("SET", , ["HOGE", "PIYO", "KEEPTTL"])`
    );
  }
);

Deno.test(
  "RedisRequest.setbit",
  () => {
    assertEquals(
      RedisRequest.setbit("HOGE", 7, 1).toString(),
      `RedisRequest("SETBIT", , ["HOGE", "7", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.setex",
  () => {
    assertEquals(
      RedisRequest.setex(10, "HOGE", "PIYO").toString(),
      `RedisRequest("SETEX", , ["HOGE", "10", "PIYO"])`
    );

    assertEquals(
      RedisRequest.setex(10, "HOGE", encodeText("PIYO")).toString(),
      `RedisRequest("SETEX", ${encodeText("PIYO")}, ["HOGE", "10", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.setnx",
  () => {
    assertEquals(
      RedisRequest.setnx("HOGE", "PIYO").toString(),
      `RedisRequest("SETNX", , ["HOGE", "PIYO"])`
    );

    assertEquals(
      RedisRequest.setnx("HOGE", encodeText("PIYO")).toString(),
      `RedisRequest("SETNX", ${encodeText("PIYO")}, ["HOGE", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.setrange",
  () => {
    assertEquals(
      RedisRequest.setrange("HOGE", 2, "FU").toString(),
      `RedisRequest("SETRANGE", , ["HOGE", "2", "FU"])`
    );
  }
);

Deno.test(
  "RedisRequest.strlen",
  () => {
    assertEquals(
      RedisRequest.strlen("HOGE").toString(),
      `RedisRequest("STRLEN", , ["HOGE"])`
    );
  }
);
