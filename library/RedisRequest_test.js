import { assert, assertEquals } from "https://deno.land/std@0.79.0/testing/asserts.ts"
import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";

import RedisRequest from "./RedisRequest.js";
import { $$rawPlaceholder } from "./Symbol.js";

Deno.test(
  "RedisRequest: #ap - Composition",
  () => {
    const containerA = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", x => new Uint8Array(x.map(x => x + 2)), []);
    const containerC = RedisRequest("", x => new Uint8Array(x.map(x => x * 2)), []);

    assertEquals(
      containerA.ap(containerB.ap(containerC.map(a => b => c => a(b(c))))).toString(),
      containerA.ap(containerB).ap(containerC).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #chain - Associativity",
  async () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const f = x => RedisRequest("SET", new Uint8Array(x.map(x => x + 2)), [ "hoge", $$rawPlaceholder ]);
    const g = x => RedisRequest("SET", new Uint8Array(x.map(x => x * 2)), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.chain(f).chain(g).toString(),
      container.chain(value => f(value).chain(g)).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #concat - Right identity",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.concat(RedisRequest.empty()).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisRequest: #concat - Associativity",
  () => {
    const containerA = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("SET", encodeText("fuga"), [ "hoge", $$rawPlaceholder ]);
    const containerC = RedisRequest("SET", encodeText("hogefuga"), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      containerA.concat(containerB).concat(containerC).toString(),
      containerA.concat(containerB.concat(containerC)).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #equals - Reflexivity",
  () =>
    assert(
      RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ])
        .equals(RedisRequest("", encodeText("piyo"), []))
    )
);

Deno.test(
  "RedisRequest: #equals - Symmetry",
  () => {
    const containerA = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", encodeText("piyo"), []);

    assert(containerA.equals(containerB) === containerB.equals(containerA));
  }
);

Deno.test(
  "RedisRequest: #equals - Transitivity",
  () => {
    const containerA = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", encodeText("piyo"), []);
    const containerC = RedisRequest("", encodeText("piyo"), []);

    assert(
      containerA.equals(containerB)
      === containerB.equals(containerC)
      === containerA.equals(containerC)
    )
  }
);

Deno.test(
  "RedisRequest: #extend - Associativity",
  async () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const f = container => new Uint8Array(container.raw.map(x => x + 2));
    const g = container => new Uint8Array(container.raw.map(x => x * 2));

    assertEquals(
      container.extend(f).extend(g).toString(),
      container.extend(value => g(value.extend(f))).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #extract - Right identity",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const f = container => new Uint8Array(container.raw.map(x => x + 2));

    assertEquals(
      container.extend(f).extract().toString(),
      f(container).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #extract - Left identity",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.extend(container => container.extract()).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisRequest: #lte - Totality",
  () => {
    const containerA = RedisRequest("SET", encodeText("fuga"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", encodeText("piyo"), []);

    assert(
      containerA.lte(containerB) || containerB.lte(containerA) === true
    );
  }
);

Deno.test(
  "RedisRequest: #lte - Antisymmetry",
  () => {
    const containerA = RedisRequest("SET", encodeText("fuga"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", encodeText("fuga"), []);

    assert(
      containerA.lte(containerB) && containerB.lte(containerA) === containerA.equals(containerB)
    );
  }
);

Deno.test(
  "RedisRequest: #lte - Transitivity",
  () => {
    const containerA = RedisRequest("SET", encodeText("fuga"), [ "hoge", $$rawPlaceholder ]);
    const containerB = RedisRequest("", encodeText("hoge"), []);
    const containerC = RedisRequest("", encodeText("piyo"), []);

    assert(
      containerA.lte(containerB) && containerB.lte(containerC) === containerA.lte(containerC)
    );
  }
);

Deno.test(
  "RedisRequest: #map - Identity",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.map(x => x).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisRequest: #map - Composition",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const f = x => new Uint8Array(x.map(x => x + 2));
    const g = x => new Uint8Array(x.map(x => x * 2));

    assertEquals(
      container.map(f).map(g).toString(),
      container.map(x => g(f(x))).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #of - Identity (Applicative)",
  () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.ap(RedisRequest.of(x => x)).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisRequest: #of - Left identity (Chainable)",
  async () => {
    const container = RedisRequest("SET", encodeText("piyo"), [ "hoge", $$rawPlaceholder ]);
    const f = x =>
      RedisRequest("SET", new Uint8Array(x.map(x => x + 2)), [ "hoge", $$rawPlaceholder ]);

    assertEquals(
      container.chain(RedisRequest.of).chain(f).toString(),
      container.chain(f).toString()
    );
  }
);

Deno.test(
  "RedisRequest: #of - Homomorphism",
  () =>
    assertEquals(
      RedisRequest.of(encodeText("piyo")).ap(RedisRequest.of(x => x + 2)),
      RedisRequest.of((x => x + 2)(encodeText("piyo")))
    )
);

Deno.test(
  "RedisRequest.append",
  () => {
    assertEquals(
      RedisRequest.append("hoge", "piyo").toString(),
      `RedisRequest("APPEND", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.append("hoge", encodeText("piyo")).toString(),
      `RedisRequest("APPEND", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.bitcount",
  () => {
    assertEquals(
      RedisRequest.bitcount("hoge", []).toString(),
      `RedisRequest("BITCOUNT", , ["hoge"])`
    );

    assertEquals(
      RedisRequest.bitcount("hoge", [ 0, 1 ]).toString(),
      `RedisRequest("BITCOUNT", , ["hoge", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitfield",
  () => {
    assertEquals(
      RedisRequest.bitfield("hoge", [ "GET", "i8", 100 ]).toString(),
      `RedisRequest("BITFIELD", , ["hoge", "GET", "i8", "100"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitop",
  () => {
    assertEquals(
      RedisRequest.bitop("AND", "hoge", [ "piyo", "fuga" ]).toString(),
      `RedisRequest("BITOP", , ["AND", "hoge", "piyo", "fuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.bitpos",
  () => {
    assertEquals(
      RedisRequest.bitpos("hoge", [ 0 ]).toString(),
      `RedisRequest("BITPOS", , ["hoge", "0"])`
    );

    assertEquals(
      RedisRequest.bitpos("hoge", [ 0, 1 ]).toString(),
      `RedisRequest("BITPOS", , ["hoge", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.decr",
  () => {
    assertEquals(
      RedisRequest.decr("hoge").toString(),
      `RedisRequest("DECR", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.decrby",
  () => {
    assertEquals(
      RedisRequest.decrby("hoge", 3).toString(),
      `RedisRequest("DECRBY", , ["hoge", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.get",
  () => {
    assertEquals(
      RedisRequest.get("hoge").toString(),
      `RedisRequest("GET", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.getbit",
  () => {
    assertEquals(
      RedisRequest.getbit("hoge", 3).toString(),
      `RedisRequest("GETBIT", , ["hoge", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.getrange",
  () => {
    assertEquals(
      RedisRequest.getrange("hoge", [ 0, 1 ]).toString(),
      `RedisRequest("GETRANGE", , ["hoge", "0", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.getset",
  () => {
    assertEquals(
      RedisRequest.getset("hoge", "piyo").toString(),
      `RedisRequest("GETSET", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.getset("hoge", encodeText("piyo")).toString(),
      `RedisRequest("GETSET", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.incr",
  () => {
    assertEquals(
      RedisRequest.incr("hoge").toString(),
      `RedisRequest("INCR", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.incrby",
  () => {
    assertEquals(
      RedisRequest.incrby("hoge", 3).toString(),
      `RedisRequest("INCRBY", , ["hoge", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.incrbyfloat",
  () => {
    assertEquals(
      RedisRequest.incrbyfloat("hoge", 0.1).toString(),
      `RedisRequest("INCRBYFLOAT", , ["hoge", "0.1"])`
    );

    assertEquals(
      RedisRequest.incrbyfloat("hoge", -5).toString(),
      `RedisRequest("INCRBYFLOAT", , ["hoge", "-5"])`
    );

    assertEquals(
      RedisRequest.incrbyfloat("hoge", 5.0e3).toString(),
      `RedisRequest("INCRBYFLOAT", , ["hoge", "5000"])`
    );
  }
);

Deno.test(
  "RedisRequest.mget",
  () => {
    assertEquals(
      RedisRequest.mget("hoge", "piyo").toString(),
      `RedisRequest("MGET", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.mset",
  () => {
    assertEquals(
      RedisRequest.mset("hoge", "piyo").toString(),
      `RedisRequest("MSET", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.mset("hoge", "piyo", "hogefuga", "fuga").toString(),
      `RedisRequest("MSET", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.mset([ "hoge", $$rawPlaceholder ], encodeText("piyo")).toString(),
      `RedisRequest("MSET", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.mset(
        [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
        encodeText("piyo\r\nfuga\r\n")
      ).toString(),
      `RedisRequest("MSET", ${encodeText("piyo\r\nfuga\r\n")}, ["hoge", Symbol(RawPlaceholder), "hogefuga", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.msetnx",
  () => {
    assertEquals(
      RedisRequest.msetnx("hoge", "piyo").toString(),
      `RedisRequest("MSETNX", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.msetnx("hoge", "piyo", "hogefuga", "fuga").toString(),
      `RedisRequest("MSETNX", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.msetnx([ "hoge", $$rawPlaceholder ], encodeText("piyo")).toString(),
      `RedisRequest("MSETNX", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.msetnx(
        [ "hoge", $$rawPlaceholder, "hogefuga", $$rawPlaceholder ],
        encodeText("piyo\r\nfuga")
      ).toString(),
      `RedisRequest("MSETNX", ${encodeText("piyo\r\nfuga")}, ["hoge", Symbol(RawPlaceholder), "hogefuga", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.psetex",
  () => {
    assertEquals(
      RedisRequest.psetex(1000, "hoge", "piyo").toString(),
      `RedisRequest("PSETEX", , ["hoge", "1000", "piyo"])`
    );

    assertEquals(
      RedisRequest.psetex(1000, "hoge", encodeText("piyo")).toString(),
      `RedisRequest("PSETEX", ${encodeText("piyo")}, ["hoge", "1000", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.set",
  () => {
    assertEquals(
      RedisRequest.set({}, "hoge", "piyo").toString(),
      `RedisRequest("SET", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.set({}, "hoge", encodeText("piyo")).toString(),
      `RedisRequest("SET", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.set({ EX: 2000 }, "hoge", "piyo").toString(),
      `RedisRequest("SET", , ["hoge", "piyo", "EX", "2000"])`
    );

    assertEquals(
      RedisRequest.set({ KEEPTTL: true }, "hoge", "piyo").toString(),
      `RedisRequest("SET", , ["hoge", "piyo", "KEEPTTL"])`
    );
  }
);

Deno.test(
  "RedisRequest.setbit",
  () => {
    assertEquals(
      RedisRequest.setbit("hoge", 7, 1).toString(),
      `RedisRequest("SETBIT", , ["hoge", "7", "1"])`
    );
  }
);

Deno.test(
  "RedisRequest.setex",
  () => {
    assertEquals(
      RedisRequest.setex(10, "hoge", "piyo").toString(),
      `RedisRequest("SETEX", , ["hoge", "10", "piyo"])`
    );

    assertEquals(
      RedisRequest.setex(10, "hoge", encodeText("piyo")).toString(),
      `RedisRequest("SETEX", ${encodeText("piyo")}, ["hoge", "10", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.setnx",
  () => {
    assertEquals(
      RedisRequest.setnx("hoge", "piyo").toString(),
      `RedisRequest("SETNX", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.setnx("hoge", encodeText("piyo")).toString(),
      `RedisRequest("SETNX", ${encodeText("piyo")}, ["hoge", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.setrange",
  () => {
    assertEquals(
      RedisRequest.setrange("hoge", 2, "FU").toString(),
      `RedisRequest("SETRANGE", , ["hoge", "2", "FU"])`
    );
  }
);

Deno.test(
  "RedisRequest.strlen",
  () => {
    assertEquals(
      RedisRequest.strlen("hoge").toString(),
      `RedisRequest("STRLEN", , ["hoge"])`
    );
  }
);
