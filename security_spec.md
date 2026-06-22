# Security Specification for Healjai (ฮีลใจ) Firestore Database

This document details the security spec and threat model for the Firestore database of the Healjai application, following Phase 0 of the Firebase Security guidelines.

## 1. Data Invariants

1. **User Identity Invariant**: A mental health log document MUST have an `email` field matching the email of the authenticated user (`request.auth.token.email`).
2. **Logged-in Requirement**: Standard read/write operations must require a fully authenticated session.
3. **Immutable Fields**: The fields `id`, `email`, and `timestamp` (representing creation time) are strictly immutable once a document is created.
4. **Data Shape Integrity**: Every created or modified document must contain all required fields of valid type, size, and boundaries (e.g. `mood` must be one of `great`, `neutral`, `sad`, `stressed`).

## 2. The "Dirty Dozen" Payload Threat Vectors (Negative Testing)

The following payloads attempt to violate security boundaries and must be rejected (`PERMISSION_DENIED`) by the Firestore security rules:

1. **Unauthenticated Creation**: Creating a log document when not signed in at all.
2. **Unverified Email Session**: Creating a log with an unverified email token.
3. **Identity Spoofing (Owner Hijacking)**: Creating a log under user B's email while logged in as user A.
4. **Id Poisoning (Denial of Wallet Document ID)**: Creating a document with a massive (10kb+) junk string document ID.
5. **Id Poisoning (Malformed Characters)**: Injecting slashes or malicious regex patterns in the document path ID.
6. **Shadow Fields Insertion (Ghost Fields)**: Trying to inject unrequested administrative fields (e.g., `role: "admin"`, `isVerified: true`) to gain elevated access.
7. **Type-Safety Violation**: Submitting a non-string value for the `journal` field (e.g. `journal: true` or `journal: 12345`).
8. **Boundary Exhaustion (Huge Journal)**: Submitting a `journal` entry with a size exceeding 10,000 characters.
9. **Invalid Mood Enum Value**: Submitting a mood value like `mood: "super_happy"` which violates the permitted enum values.
10. **State Shortcutting (Forged Timestamp)**: Providing a client-provided future timestamp instead of matching `request.time`.
11. **Immortal Fields Tampering**: Trying to edit the `id`, `email`, or `timestamp` field during an update.
12. **Blanket Read Snooping**: Listing or getting logs belonging to another user while signed in.

## 3. Firestore Rules Test Suite Setup

To test these threat vectors, here is a mock test framework illustrating how the rules block these payloads.

```typescript
// firestore.rules.test.ts
// Test cases verifying the 12 vectors above result in PERMISSION_DENIED.
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// All Dirty Dozen vectors (1-12) fail with PERMISSION_DENIED tests during continuous audit.
```
