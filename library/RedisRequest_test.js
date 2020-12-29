import { assert, assertEquals } from "https://deno.land/std@0.79.0/testing/asserts.ts"
import { encodeText } from "https://deno.land/x/functional@v1.3.2/library/utilities.js";

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

    assertEquals(
      RedisRequest.mget([ "hoge", "piyo" ]).toString(),
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
      `RedisRequest("MSETNX", , ["hoge", "piyo", "hogefuga", "fuga"])`
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

Deno.test(
  "RedisRequest.copy",
  () => {
    assertEquals(
      RedisRequest.copy({}, "hoge", "fuga").toString(),
      `RedisRequest("COPY", , ["hoge", "fuga"])`
    );

    assertEquals(
      RedisRequest.copy({ REPLACE: true }, "hoge", "fuga").toString(),
      `RedisRequest("COPY", , ["hoge", "fuga", "REPLACE"])`
    );

    assertEquals(
      RedisRequest.copy({ DB: 2 }, "hoge", "fuga").toString(),
      `RedisRequest("COPY", , ["hoge", "fuga", "DB", "2"])`
    );
  }
);

Deno.test(
  "RedisRequest.del",
  () => {
    assertEquals(
      RedisRequest.del("hoge", "piyo").toString(),
      `RedisRequest("DEL", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.del([ "hoge", "piyo" ]).toString(),
      `RedisRequest("DEL", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.dump",
  () => {
    assertEquals(
      RedisRequest.dump("hoge").toString(),
      `RedisRequest("DUMP", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.exists",
  () => {
    assertEquals(
      RedisRequest.exists("hoge", "piyo").toString(),
      `RedisRequest("EXISTS", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.exists([ "hoge", "piyo" ]).toString(),
      `RedisRequest("EXISTS", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.expire",
  () => {
    assertEquals(
      RedisRequest.expire(10, "hoge").toString(),
      `RedisRequest("EXPIRE", , ["hoge", "10"])`
    );
  }
);

Deno.test(
  "RedisRequest.expireat",
  () => {
    const date = new Date();
    const timestamp = Date.now();

    assertEquals(
      RedisRequest.expireat(date, "hoge").toString(),
      `RedisRequest("EXPIREAT", , ["hoge", "${date.valueOf()}"])`
    );

    assertEquals(
      RedisRequest.expireat(timestamp, "hoge").toString(),
      `RedisRequest("EXPIREAT", , ["hoge", "${timestamp}"])`
    );
  }
);

Deno.test(
  "RedisRequest.keys",
  () => {
    assertEquals(
      RedisRequest.keys("*ge").toString(),
      `RedisRequest("KEYS", , ["*ge"])`
    );
  }
);

Deno.test(
  "RedisRequest.migrate",
  () => {
    assertEquals(
      RedisRequest.migrate({ host: "127.0.0.1", port: 6379, db: 3, timeout: 5000 }, "hoge").toString(),
      `RedisRequest("MIGRATE", , ["127.0.0.1", "6379", "hoge", "3", "5000"])`
    );

    assertEquals(
      RedisRequest.migrate(
        { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000 },
        [ "hoge", "fuga" ]
      ).toString(),
      `RedisRequest("MIGRATE", , ["127.0.0.1", "6379", "", "3", "5000", "KEYS", "hoge", "fuga"])`
    );

    assertEquals(
      RedisRequest.migrate(
        { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, REPLACE: true },
        "hoge"
      ).toString(),
      `RedisRequest("MIGRATE", , ["127.0.0.1", "6379", "hoge", "3", "5000", "REPLACE"])`
    );

    assertEquals(
      RedisRequest.migrate(
        { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, password: "42" },
        "hoge"
      ).toString(),
      `RedisRequest("MIGRATE", , ["127.0.0.1", "6379", "hoge", "3", "5000", "AUTH", "42"])`
    );

    assertEquals(
      RedisRequest.migrate(
        { host: "127.0.0.1", port: 6379, db: 3, timeout: 5000, password: "42", username: "superuser" },
        "hoge"
      ).toString(),
      `RedisRequest("MIGRATE", , ["127.0.0.1", "6379", "hoge", "3", "5000", "AUTH2", "superuser", "42"])`
    );
  }
);

Deno.test(
  "RedisRequest.move",
  () => {
    assertEquals(
      RedisRequest.move(3, "hoge").toString(),
      `RedisRequest("MOVE", , ["hoge", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.object",
  () => {
    assertEquals(
      RedisRequest.object("ENCODING", "hoge").toString(),
      `RedisRequest("OBJECT", , ["ENCODING", "hoge"])`
    );

    assertEquals(
      RedisRequest.object("ENCODING", [ "hoge" ]).toString(),
      `RedisRequest("OBJECT", , ["ENCODING", "hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.persist",
  () => {
    assertEquals(
      RedisRequest.persist("hoge").toString(),
      `RedisRequest("PERSIST", , ["hoge"])`
    );
  }
);


Deno.test(
  "RedisRequest.pexpireat",
  () => {
    const date = new Date();
    const timestamp = Date.now() * 1000;

    assertEquals(
      RedisRequest.pexpireat(date, "hoge").toString(),
      `RedisRequest("PEXPIREAT", , ["hoge", "${date.valueOf() * 1000}"])`
    );

    assertEquals(
      RedisRequest.pexpireat(timestamp, "hoge").toString(),
      `RedisRequest("PEXPIREAT", , ["hoge", "${timestamp}"])`
    );
  }
);

Deno.test(
  "RedisRequest.pexpire",
  () => {
    assertEquals(
      RedisRequest.pexpire(5000, "hoge").toString(),
      `RedisRequest("PEXPIRE", , ["hoge", "5000"])`
    );
  }
);

Deno.test(
  "RedisRequest.pttl",
  () => {
    assertEquals(
      RedisRequest.pttl("hoge").toString(),
      `RedisRequest("PTTL", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.randomkey",
  () => {
    assertEquals(
      RedisRequest.randomkey().toString(),
      `RedisRequest("RANDOMKEY", , [])`
    );
  }
);

Deno.test(
  "RedisRequest.rename",
  () => {
    assertEquals(
      RedisRequest.rename("hoge", "hogefuga").toString(),
      `RedisRequest("RENAME", , ["hoge", "hogefuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.renamenx",
  () => {
    assertEquals(
      RedisRequest.renamenx("hoge", "hogefuga").toString(),
      `RedisRequest("RENAMENX", , ["hoge", "hogefuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.restore",
  () => {
    const serializedValue = String.raw`\u0000\xC0\\n\\t\u0000\xBEm\u0006\x89Z(\u0000\\n`;

    // assertEquals(
    //   RedisRequest.restore({ ttl: 10 }, "hoge", serializedValue).toString(),
    //   `RedisRequest("RESTORE", , ["hoge", "10", "${serializedValue}"])`
    // );

    assertEquals(
      RedisRequest.restore({ ttl: 10 }, "hoge", encodeText(serializedValue)).toString(),
      `RedisRequest("RESTORE", ${encodeText(serializedValue)}, ["hoge", "10", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.restore({ ttl: 10, REPLACE: true }, "hoge", encodeText(serializedValue)).toString(),
      `RedisRequest("RESTORE", ${encodeText(serializedValue)}, ["hoge", "10", Symbol(RawPlaceholder), "REPLACE"])`
    );

    assertEquals(
      RedisRequest.restore({ ttl: 10, IDLETIME: 1 }, "hoge", encodeText(serializedValue)).toString(),
      `RedisRequest("RESTORE", ${encodeText(serializedValue)}, ["hoge", "10", Symbol(RawPlaceholder), "IDLETIME", "1"])`
    );

  }
);

Deno.test(
  "RedisRequest.scan",
  () => {
    assertEquals(
      RedisRequest.scan({}, 0).toString(),
      `RedisRequest("SCAN", , ["0"])`
    );

    assertEquals(
      RedisRequest.scan({ MATCH: "*yo", COUNT: 1000 }, 0).toString(),
      `RedisRequest("SCAN", , ["0", "MATCH", "*yo", "COUNT", "1000"])`
    );
  }
);

Deno.test(
  "RedisRequest.sort",
  () => {
    assertEquals(
      RedisRequest.sort({}, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge"])`
    );

    assertEquals(
      RedisRequest.sort({ BY: "fuga" }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "BY", "fuga"])`
    );

    assertEquals(
      RedisRequest.sort({ LIMIT: 10 }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "LIMIT", "10"])`
    );

    assertEquals(
      RedisRequest.sort({ ASC: true }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "ASC"])`
    );

    assertEquals(
      RedisRequest.sort({ DESC: true, ALPHA: true }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "DESC", "ALPHA"])`
    );

    assertEquals(
      RedisRequest.sort({ STORE: "fuga" }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "STORE", "fuga"])`
    );

    assertEquals(
      RedisRequest.sort({ GET: [ "*" ], ALPHA: true }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "GET", "*", "ALPHA"])`
    );

    assertEquals(
      RedisRequest.sort({ LIMIT: 10, GET: [ "*", "#" ], ALPHA: true }, "hoge").toString(),
      `RedisRequest("SORT", , ["hoge", "LIMIT", "10", "GET", "*", "GET", "#", "ALPHA"])`
    );
  }
);

Deno.test(
  "RedisRequest.touch",
  () => {
    assertEquals(
      RedisRequest.touch("hoge").toString(),
      `RedisRequest("TOUCH", , ["hoge"])`
    );

    assertEquals(
      RedisRequest.touch([ "hoge", "fuga" ]).toString(),
      `RedisRequest("TOUCH", , ["hoge", "fuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.ttl",
  () => {
    assertEquals(
      RedisRequest.ttl("hoge").toString(),
      `RedisRequest("TTL", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.type",
  () => {
    assertEquals(
      RedisRequest.type("hoge").toString(),
      `RedisRequest("TYPE", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.unlink",
  () => {
    assertEquals(
      RedisRequest.unlink("hoge").toString(),
      `RedisRequest("UNLINK", , ["hoge"])`
    );

    assertEquals(
      RedisRequest.unlink([ "hoge", "fuga" ]).toString(),
      `RedisRequest("UNLINK", , ["hoge", "fuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.hdel",
  () => {
    assertEquals(
      RedisRequest.hdel("hoge", "piyo").toString(),
      `RedisRequest("HDEL", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.hdel("hoge", [ "piyo", "fuga" ]).toString(),
      `RedisRequest("HDEL", , ["hoge", "piyo", "fuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.hexists",
  () => {
    assertEquals(
      RedisRequest.hexists("hoge", "piyo").toString(),
      `RedisRequest("HEXISTS", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.hget",
  () => {
    assertEquals(
      RedisRequest.hget("hoge", "piyo").toString(),
      `RedisRequest("HGET", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.hgetall",
  () => {
    assertEquals(
      RedisRequest.hgetall("hoge").toString(),
      `RedisRequest("HGETALL", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.hincrby",
  () => {
    assertEquals(
      RedisRequest.hincrby("hoge", 3, "piyo").toString(),
      `RedisRequest("HINCRBY", , ["hoge", "piyo", "3"])`
    );
  }
);

Deno.test(
  "RedisRequest.hincrbyfloat",
  () => {
    assertEquals(
      RedisRequest.hincrbyfloat("hoge", 0.1, "piyo").toString(),
      `RedisRequest("HINCRBYFLOAT", , ["hoge", "piyo", "0.1"])`
    );

    assertEquals(
      RedisRequest.hincrbyfloat("hoge", -5, "piyo").toString(),
      `RedisRequest("HINCRBYFLOAT", , ["hoge", "piyo", "-5"])`
    );

    assertEquals(
      RedisRequest.hincrbyfloat("hoge", 5.0e3, "piyo").toString(),
      `RedisRequest("HINCRBYFLOAT", , ["hoge", "piyo", "5000"])`
    );
  }
);

Deno.test(
  "RedisRequest.hkeys",
  () => {
    assertEquals(
      RedisRequest.hkeys("hoge").toString(),
      `RedisRequest("HKEYS", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.hlen",
  () => {
    assertEquals(
      RedisRequest.hlen("hoge").toString(),
      `RedisRequest("HLEN", , ["hoge"])`
    );
  }
);

Deno.test(
  "RedisRequest.hmget",
  () => {
    assertEquals(
      RedisRequest.hmget("hoge", "piyo").toString(),
      `RedisRequest("HMGET", , ["hoge", "piyo"])`
    );

    assertEquals(
      RedisRequest.hmget("hoge", [ "piyo", "fuga" ]).toString(),
      `RedisRequest("HMGET", , ["hoge", "piyo", "fuga"])`
    );
  }
);

Deno.test(
  "RedisRequest.hmset",
  () => {
    assertEquals(
      RedisRequest.hmset("hoge", "piyo", "fuga").toString(),
      `RedisRequest("HMSET", , ["hoge", "piyo", "fuga"])`
    );

    assertEquals(
      RedisRequest.hmset("hoge", "piyo", encodeText("fuga")).toString(),
      `RedisRequest("HMSET", ${encodeText("fuga")}, ["hoge", "piyo", Symbol(RawPlaceholder)])`
    );

    assertEquals(
      RedisRequest.hmset(
        "hoge",
        [ "piyo", $$rawPlaceholder, "fuga", $$rawPlaceholder ],
        encodeText("hogepiyo\r\nhogefuga\r\n")
      ).toString(),
      `RedisRequest("HMSET", ${encodeText("hogepiyo\r\nhogefuga\r\n")}, ["hoge", "piyo", Symbol(RawPlaceholder), "fuga", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.hscan",
  () => {
    assertEquals(
      RedisRequest.hscan({}, "hoge", 0).toString(),
      `RedisRequest("HSCAN", , ["hoge", "0"])`
    );

    assertEquals(
      RedisRequest.hscan({ MATCH: "*yo", COUNT: 1000 }, "hoge", 0).toString(),
      `RedisRequest("HSCAN", , ["hoge", "0", "MATCH", "*yo", "COUNT", "1000"])`
    );
  }
);

Deno.test(
  "RedisRequest.hset",
  () => {
    assertEquals(
      RedisRequest.hset("hoge", "piyo", "fuga").toString(),
      `RedisRequest("HSET", , ["hoge", "piyo", "fuga"])`
    );

    assertEquals(
      RedisRequest.hset("hoge", "piyo", encodeText("fuga")).toString(),
      `RedisRequest("HSET", ${encodeText("fuga")}, ["hoge", "piyo", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.hsetnx",
  () => {
    assertEquals(
      RedisRequest.hsetnx("hoge", "piyo", "fuga").toString(),
      `RedisRequest("HSETNX", , ["hoge", "piyo", "fuga"])`
    );

    assertEquals(
      RedisRequest.hsetnx("hoge", "piyo", encodeText("fuga")).toString(),
      `RedisRequest("HSETNX", ${encodeText("fuga")}, ["hoge", "piyo", Symbol(RawPlaceholder)])`
    );
  }
);

Deno.test(
  "RedisRequest.hstrlen",
  () => {
    assertEquals(
      RedisRequest.hstrlen("hoge", "piyo").toString(),
      `RedisRequest("HSTRLEN", , ["hoge", "piyo"])`
    );
  }
);

Deno.test(
  "RedisRequest.hvals",
  () => {
    assertEquals(
      RedisRequest.hvals("hoge").toString(),
      `RedisRequest("HVALS", , ["hoge"])`
    );
  }
);
