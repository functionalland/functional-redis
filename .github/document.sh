export FL_TITLE="Functional Redis"
export FL_DESCRIPTION="A simple Redis client in tune with Functional Programming principles in JavaScript for Deno."
export FL_VERSION=$(git describe --tags --abbrev=0)

deno run --allow-all --unstable ../@functional:generate-documentation/cli.js document "$FL_TITLE" "$FL_DESCRIPTION" $FL_VERSION ./.github/readme-fragment-usage.md ./library/*.js ./.github/readme-fragment-license.md
