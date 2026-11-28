# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. Every document under `/users/{userId}` MUST have `uid == request.auth.uid == userId`, verified email (`request.auth.token.email_verified == true`), and server timestamps (`createdAt == request.time` on create, `updatedAt == request.time`).
2. A student profile (`StudentProfile`) contains PII (`email`, `schoolName`) and MUST ONLY be read, listed, created, or updated by its exact owner (`request.auth.uid == userId`). Blanket signed-in reads are strictly forbidden.
3. Every chat memory document under `/users/{userId}/messages/{messageId}` MUST pass the Master Gate verifying `/users/{userId}` exists and belongs to `request.auth.uid`, and MUST have `uid == request.auth.uid`, valid `sender` (`'user' | 'bot'`), bounded `text` (1..8000 chars), and `createdAt == request.time`.
4. `uid` and `createdAt` are immutable once created. No shadow/ghost fields are permitted (`keys().hasOnly(...)`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated read of `/users/userA`**: `auth = null` -> DENIED.
2. **Cross-user PII snooping**: `userB` attempts `get(/users/userA)` -> DENIED.
3. **Blanket collection list**: `userB` attempts `list(/users)` -> DENIED.
4. **Unverified email registration**: `userA` with `email_verified = false` attempts `setDoc(/users/userA, ...)` -> DENIED.
5. **Identity spoofing**: `userB` attempts `setDoc(/users/userA, { uid: 'userA', ... })` or `{ uid: 'userB' }` at `/users/userA` -> DENIED.
6. **Ghost / privilege escalation field**: `userA` sends `{ ..., isAdmin: true, role: 'admin' }` -> DENIED by `hasOnly`.
7. **Forged client timestamp**: `userA` sends `createdAt: Timestamp(2020-01-01)` -> DENIED (`createdAt == request.time`).
8. **Mutating immutable `createdAt` or `uid` on update**: `userA` updates `uid` or `createdAt` -> DENIED (`affectedKeys().hasOnly(...)` + immutability check).
9. **Oversized ID poisoning**: `userA` writes `/users/userA/messages/<200-char-id>` -> DENIED by `isValidId(messageId)`.
10. **Oversized text payload (Denial of Wallet)**: `userA` sends `text` of 20,000 characters -> DENIED (`text.size() <= 8000`).
11. **Orphaned message without parent profile**: `userA` writes `/users/userA/messages/m1` before `/users/userA` exists -> DENIED by Master Gate `exists(/users/$(userId))`.
12. **Cross-user message injection**: `userB` attempts to read or create `/users/userA/messages/m1` -> DENIED.
