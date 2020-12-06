import { assert, assertEquals } from "https://deno.land/std@0.79.0/testing/asserts.ts"
import { encodeText } from "https://deno.land/x/functional@v1.2.1/library/utilities.js";

import RedisResponse from "./RedisResponse.js";

Deno.test(
  "RedisResponse: #ap - Composition",
  () => {
    const containerA = RedisResponse.Success(encodeText("piyo"));
    const containerB = RedisResponse.Success(x => new Uint8Array(x.map(x => x + 2)));
    const containerC = RedisResponse.Success(x => new Uint8Array(x.map(x => x * 2)));

    assertEquals(
      containerA.ap(containerB.ap(containerC.map(a => b => c => a(b(c))))).toString(),
      containerA.ap(containerB).ap(containerC).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #chain - Associativity",
  async () => {
    const container = RedisResponse.Success(encodeText("piyo"));
    const f = x => RedisResponse.Success(new Uint8Array(x.map(x => x + 2)));
    const g = x => RedisResponse.Success(new Uint8Array(x.map(x => x * 2)));

    assertEquals(
      container.chain(f).chain(g).toString(),
      container.chain(value => f(value).chain(g)).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #concat - Right identity",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));

    assertEquals(
      container.concat(RedisResponse.empty()).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisResponse: #concat - Associativity",
  () => {
    const containerA = RedisResponse.Success(encodeText("piyo"));
    const containerB = RedisResponse.Success(encodeText("fuga"));
    const containerC = RedisResponse.Success(encodeText("hogefuga"));

    assertEquals(
      containerA.concat(containerB).concat(containerC).toString(),
      containerA.concat(containerB.concat(containerC)).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #equals - Reflexivity",
  () =>
    assert(
      RedisResponse.Success(encodeText("piyo"))
        .equals(RedisResponse.Success(encodeText("piyo")))
    )
);

Deno.test(
  "RedisResponse: #equals - Symmetry",
  () => {
    const containerA = RedisResponse.Success(encodeText("piyo"));
    const containerB = RedisResponse.Success(encodeText("piyo"));

    assert(containerA.equals(containerB) === containerB.equals(containerA));
  }
);

Deno.test(
  "RedisResponse: #equals - Transitivity",
  () => {
    const containerA = RedisResponse.Success(encodeText("piyo"));
    const containerB = RedisResponse.Success(encodeText("piyo"));
    const containerC = RedisResponse.Success(encodeText("piyo"));

    assert(
      containerA.equals(containerB)
      === containerB.equals(containerC)
      === containerA.equals(containerC)
    )
  }
);

Deno.test(
  "RedisResponse: #extend - Associativity",
  async () => {
    const container = RedisResponse.Success(encodeText("piyo"));
    const f = container => new Uint8Array(container.raw.map(x => x + 2));
    const g = container => new Uint8Array(container.raw.map(x => x * 2));

    assertEquals(
      container.extend(f).extend(g).toString(),
      container.extend(value => g(value.extend(f))).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #extract - Right identity",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));
    const f = container => new Uint8Array(container.raw.map(x => x + 2));

    assertEquals(
      container.extend(f).extract().toString(),
      f(container).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #extract - Left identity",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));

    assertEquals(
      container.extend(container => container.extract()).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisResponse: #lte - Totality",
  () => {
    const containerA = RedisResponse.Success(encodeText("fuga"));
    const containerB = RedisResponse.Success(encodeText("piyo"));

    assert(
      containerA.lte(containerB) || containerB.lte(containerA) === true
    );
  }
);

Deno.test(
  "RedisResponse: #lte - Antisymmetry",
  () => {
    const containerA = RedisResponse.Success(encodeText("fuga"));
    const containerB = RedisResponse.Success(encodeText("fuga"));

    assert(
      containerA.lte(containerB) && containerB.lte(containerA) === containerA.equals(containerB)
    );
  }
);

Deno.test(
  "RedisResponse: #lte - Transitivity",
  () => {
    const containerA = RedisResponse.Success(encodeText("fuga"));
    const containerB = RedisResponse.Success(encodeText("hoge"));
    const containerC = RedisResponse.Success(encodeText("piyo"));

    assert(
      containerA.lte(containerB) && containerB.lte(containerC) === containerA.lte(containerC)
    );
  }
);

Deno.test(
  "RedisResponse: #map - Identity",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));

    assertEquals(
      container.map(x => x).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisResponse: #map - Composition",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));
    const f = x => new Uint8Array(x.map(x => x + 2));
    const g = x => new Uint8Array(x.map(x => x * 2));

    assertEquals(
      container.map(f).map(g).toString(),
      container.map(x => g(f(x))).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #of - Identity (Applicative)",
  () => {
    const container = RedisResponse.Success(encodeText("piyo"));

    assertEquals(
      container.ap(RedisResponse.of(x => x)).toString(),
      container.toString()
    );
  }
);

Deno.test(
  "RedisResponse: #of - Left identity (Chainable)",
  async () => {
    const container = RedisResponse.Success(encodeText("piyo"));
    const f = x =>
      RedisResponse.Success(new Uint8Array(x.map(x => x + 2)));

    assertEquals(
      container.chain(RedisResponse.of).chain(f).toString(),
      container.chain(f).toString()
    );
  }
);

Deno.test(
  "RedisResponse: #of - Homomorphism",
  () =>
    assertEquals(
      RedisResponse.of(encodeText("piyo")).ap(RedisResponse.of(x => x + 2)),
      RedisResponse.of((x => x + 2)(encodeText("piyo")))
    )
);
