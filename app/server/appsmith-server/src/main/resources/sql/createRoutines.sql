create function jsonb_minus(l jsonb, r text) returns jsonb
    language sql
RETURN (l - r);