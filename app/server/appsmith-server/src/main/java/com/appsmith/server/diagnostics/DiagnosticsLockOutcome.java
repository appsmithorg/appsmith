package com.appsmith.server.diagnostics;

/**
 * Result of trying to take the per-section collection lock.
 */
public enum DiagnosticsLockOutcome {
    /** This request set the lock and must release it. */
    ACQUIRED,
    /** Another request holds the lock. */
    HELD,
    /** Redis did not confirm the lock (error, timeout, or no answer). The request must not release it. */
    UNCONFIRMED
}
