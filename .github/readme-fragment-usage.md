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


