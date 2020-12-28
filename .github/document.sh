export FL_TITLE="Functional Redis"
export FL_DESCRIPTION="A simple Redis client in tune with Functional Programming principles in JavaScript for Deno."
export FL_GITHUB_URL="https://github.com/sebastienfilion/functional-redis"
export FL_DENO_URL="https://deno.land/x/functional_redis"
export FL_VERSION="v0.2.0"

deno run --allow-all --unstable ../@functional:generate-documentation/cli.js document \
"$FL_TITLE" \
"$FL_DESCRIPTION" \
$FL_GITHUB_URL \
$FL_DENO_URL \
$FL_VERSION \
./.github/readme-fragment-usage.md \
./library/*.js \
./.github/readme-fragment-license.md
