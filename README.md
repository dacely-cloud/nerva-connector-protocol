# Nerva connector protocol

The wire protocol that Nerva Connector and the Nerva backend share: device identity and signature purposes,
enrollment, pairing and unpairing, file and upload jobs, execution input and interactive sessions, joint
workspace publication, admission migration, host observation and system specification. Each message has its
types, a strict codec and, where it is signed, its canonical transcript.

Both sides import the same modules, so a message one side signs is the exact message the other side verifies.

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

## Develop

```sh
npm ci
npm run check   # typecheck, rebuild dist/ and fail if the committed dist/ is out of date
```

Change the protocol here, run `npm run check`, commit `src/` and `dist/` together, then move both consumers to the
new commit in the same change.
