package com.external.plugins.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.lang.ref.WeakReference;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Remembers Kerberos logins that the domain controller refused, for every connection pool on this Appsmith server.
 *
 * <p>Appsmith replaces a datasource's connection pool when a connection goes stale, and each "Test" makes a new pool.
 * If each pool kept its own record, a new pool would send the refused password to the domain controller again at once,
 * and the account could be locked out. So the record is kept here, outside the pool.
 *
 * <p>A record is keyed by the account and a keyed hash of the password. Entering a different password starts with no
 * record, so a corrected password is tried at once. The key for the hash is random and made when the server starts,
 * so the stored values cannot be used to guess the password. The account is compared without case and with the
 * default realm filled in, so {@code svc}, {@code svc@CORP} and {@code SVC@CORP} share one record.
 *
 * <p>A record holds only the message shown to the user, the time and a count. At most {@link #MAX_RECORDS} records
 * are kept. When the map is full, the oldest record is dropped.
 */
final class MssqlKerberosFailures {

    /** After the first refused login, wait this long before contacting the domain controller again. */
    static final int RETRY_AFTER_FAILURE_SECONDS = 60;

    /** The longest wait between logins after repeated refusals. */
    static final int MAX_RETRY_AFTER_FAILURE_SECONDS = 15 * 60;

    /** A record this old is dropped the next time a refusal is recorded, so the map cannot grow without limit. */
    private static final long FORGET_AFTER_NANOS = TimeUnit.DAYS.toNanos(1);

    /** The most records kept at once. */
    static final int MAX_RECORDS = 10_000;

    /** The record that every pool on this server shares. */
    static final MssqlKerberosFailures SHARED = new MssqlKerberosFailures();

    private static final byte[] HASH_KEY = randomBytes(32);

    private final Map<String, Failure> failures = new ConcurrentHashMap<>();

    /**
     * One lock for each key. Each value is a weak reference to the lock itself: a lock stays while a pool holds it, and
     * is dropped after no pool uses that key, so the map cannot grow without limit.
     */
    private final Map<String, WeakReference<Object>> locks = new ConcurrentHashMap<>();

    /**
     * The last refusal for one account and password, and how many refusals came in a row. Holds only the message
     * shown to the user and its SQL state, never the domain controller's own error.
     */
    record Failure(String message, String sqlState, long atNanos, int inARow) {

        /** 60 seconds after the first refusal, doubling after each further refusal, up to 15 minutes. */
        long waitSeconds() {
            int doublings = Math.min(Math.max(inARow - 1, 0), 10);
            return Math.min((long) RETRY_AFTER_FAILURE_SECONDS << doublings, MAX_RETRY_AFTER_FAILURE_SECONDS);
        }

        boolean stillWaiting(long nowNanos) {
            return TimeUnit.NANOSECONDS.toSeconds(nowNanos - atNanos) < waitSeconds();
        }
    }

    /** Returns the key for an account and password. The password itself is not kept in the key. */
    static String key(String principal, char[] password) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(HASH_KEY, "HmacSHA256"));
            ByteBuffer bytes = StandardCharsets.UTF_8.encode(CharBuffer.wrap(password));
            byte[] passwordBytes = new byte[bytes.remaining()];
            bytes.get(passwordBytes);
            byte[] hash = mac.doFinal(passwordBytes);
            Arrays.fill(passwordBytes, (byte) 0);
            String account = MssqlKerberosLogin.normalized(principal).toLowerCase(Locale.ROOT);
            return account + "\u0000" + HexFormat.of().formatHex(hash);
        } catch (GeneralSecurityException e) {
            // HmacSHA256 is part of every Java runtime, so this does not happen.
            throw new IllegalStateException("HmacSHA256 is not available", e);
        }
    }

    /**
     * Returns the lock that every pool holds while it checks for a refusal, logs in and records the result for this
     * key. Without it, two pools with the same account and password could both find no refusal and both send the
     * password, even after the first one was refused.
     *
     * <p>Each key has its own lock, so a slow login for one account never holds up another account. A caller must keep
     * the returned lock for as long as it may log in, because the lock is dropped once no caller holds it.
     */
    Object lockFor(String key) {
        // Drop the entries whose lock no pool holds any more. Only an entry that still holds that same cleared
        // reference is removed, so a live lock is never dropped.
        locks.values().removeIf(reference -> reference.get() == null);
        // The holder keeps the lock reachable from here until the caller has it.
        Object[] holder = new Object[1];
        locks.compute(key, (k, reference) -> {
            Object lock = reference == null ? null : reference.get();
            if (lock == null) {
                lock = new Object();
                reference = new WeakReference<>(lock);
            }
            holder[0] = lock;
            return reference;
        });
        return holder[0];
    }

    /** Returns the last refusal for this key, or null. */
    Failure get(String key) {
        return failures.get(key);
    }

    /** Records a refusal and returns the updated record. */
    synchronized Failure recordRefusal(String key, String message, String sqlState, long nowNanos) {
        failures.values().removeIf(failure -> nowNanos - failure.atNanos() > FORGET_AFTER_NANOS);
        if (!failures.containsKey(key) && failures.size() >= MAX_RECORDS) {
            failures.entrySet().stream()
                    .min(Comparator.comparingLong(entry -> entry.getValue().atNanos()))
                    .ifPresent(oldest -> failures.remove(oldest.getKey()));
        }
        return failures.merge(
                key,
                new Failure(message, sqlState, nowNanos, 1),
                (previous, next) -> new Failure(message, sqlState, nowNanos, previous.inARow() + 1));
    }

    int size() {
        return failures.size();
    }

    /** The number of locks in the map, including any whose pools are gone but that were not dropped yet. */
    int lockCount() {
        return locks.size();
    }

    /** Forgets the refusals for this key, after a login worked. */
    void clear(String key) {
        failures.remove(key);
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }
}
