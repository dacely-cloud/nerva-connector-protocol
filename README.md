# Nerva connector protocol

The wire protocol that Nerva Connector and the Nerva backend share: device identity and signature purposes,
enrollment, pairing and unpairing, file and upload jobs, execution input and interactive sessions, joint
workspace publication, admission migration, host observation and system specification. Each message has its
types, a strict codec and, where it is signed, its canonical transcript.

Both sides import the same modules, so a message one side signs is the exact message the other side verifies.
Signed proofs take the signing key and the verifier from the caller through `identity/PurposeSignature.js`, so each
side keeps its own key implementation while the payload bytes come from one shared transcript.

## Use

```ts
import { ExecutionLane } from 'nerva-connector-protocol/execution/ExecutionLane.js';
import { SignaturePurpose } from 'nerva-connector-protocol/identity/IdentityFormat.js';
```

Every module under `src/` is exported at the same path with a `.js` extension. The package ships compiled
JavaScript and type declarations in `dist/`, which is committed, so it installs from a GitHub tarball without a
build step:

```json
"nerva-connector-protocol": "https://codeload.github.com/dacely-cloud/nerva-connector-protocol/tar.gz/<commit>"
```

Exact quantities (sequences, revisions, byte counts, timestamps) are `bigint`. A type that carries one takes an
`Integer` parameter that defaults to `bigint`, so the device and backend write `ConnectorHostStatus` while the Nexa
gateway, whose JSON writes those quantities as decimal strings, uses the same declaration as
`ConnectorHostStatus<string>`. The gateway contract in nexa-protocol is built from these types and never declares
them a second time.

## Host tool arguments

`protocol/ConnectorHostArgumentContract.js` declares the argument object of every native host tool once: field names,
JSON types (decimal strings for exact quantities), required fields, mutually exclusive modes such as executable with
arguments versus shell with command, and bounds. `protocol/ConnectorHostArgumentValidation.js` checks arguments against
them and returns the first violation as a message that names the field and never repeats a supplied value.
Nerva Connector enforces these contracts on every call, and a client checks them before submitting so a malformed call
fails at once instead of after a round trip. `protocol/ConnectorHostArgumentShape.js` renders the compact notation a
model reads (`{path,offset?:"n",maximumBytes?:n}`) and `protocol/ConnectorHostArgumentSchema.js` the JSON Schema for MCP
discovery.

## Develop

```sh
npm ci
npm run check   # typecheck, rebuild dist/, fail if the committed dist/ is out of date, then run the golden tests
```

`test/golden/ConnectorTestCases.json` holds calls captured from the Nerva Connector test suite. Each case pins the
digest of the result that Nerva Connector and the Nerva backend both produced before these modules were shared, so a
change to any shared transcript or decoder output fails `npm test`.

Change the protocol here, run `npm run check`, commit `src/` and `dist/` together, then move both consumers to the
new commit in the same change.
