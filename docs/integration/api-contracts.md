# API contract consumption

The backend owns the OpenAPI contract. This repository should pin a versioned immutable contract artifact, regenerate its client and run compatibility tests. Breaking changes require explicit approval. Never copy backend source or hand-maintain duplicated API data structures.

No contract artifact, registry or client generator is configured yet; compatibility is not currently tested.
