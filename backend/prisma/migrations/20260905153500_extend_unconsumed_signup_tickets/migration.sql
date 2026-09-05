-- Keep previously issued, unconsumed signup tickets aligned with the
-- seven-day validity period used for newly issued tickets.
UPDATE "SignupTicket"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "consumedAt" IS NULL
  AND "expiresAt" < "createdAt" + INTERVAL '7 days';
