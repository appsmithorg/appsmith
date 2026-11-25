package com.external.plugins;

import com.google.cloud.firestore.Firestore;
import com.google.common.base.Throwables;
import com.google.common.base.Ticker;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.RemovalCause;
import com.google.common.cache.RemovalNotification;
import com.google.common.collect.MapMaker;
import com.google.common.util.concurrent.UncheckedExecutionException;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.function.Supplier;

/**
 * Shares Firestore clients between datasources that have the same project, credentials and database, and limits how
 * many clients stay open, because each client holds threads and a network channel. The limit and the idle time close
 * clients. An idle client is removed when the cache is next used.
 *
 * <p>A removed client is shut down: queries that are already running finish, and new calls on it fail with an
 * IllegalStateException.
 */
@Slf4j
class FirestoreClientCache {

    /** Holds a hash of the credentials, so that the cache does not keep the service account key. */
    record Key(String projectId, String credentialsHash, String databaseId) {

        static Key of(String projectId, String credentialsJson, String databaseId) {
            return new Key(projectId, sha256(credentialsJson), databaseId);
        }

        private static String sha256(String value) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 is not available", e);
            }
        }
    }

    private final Cache<Key, Firestore> clients;

    // Compares clients by identity and does not keep them in memory.
    private final Set<Firestore> shutDownClients =
            Collections.newSetFromMap(new MapMaker().weakKeys().makeMap());

    FirestoreClientCache(int maximumClients, Duration maximumIdleTime, Ticker ticker) {
        this.clients = CacheBuilder.newBuilder()
                // One segment, so that the limit and the order of removal apply to the whole cache.
                .concurrencyLevel(1)
                .maximumSize(maximumClients)
                .expireAfterAccess(maximumIdleTime)
                .ticker(ticker)
                .removalListener(this::onRemoval)
                .build();
    }

    /** Returns the client for the key. Creates it if there is none, once for all concurrent callers. */
    Firestore get(Key key, Supplier<Firestore> clientSupplier) {
        try {
            return clients.get(key, clientSupplier::get);
        } catch (ExecutionException | UncheckedExecutionException e) {
            Throwables.throwIfUnchecked(e.getCause());
            throw new IllegalStateException(e.getCause());
        }
    }

    /**
     * Tells whether this cache has not shut the client down, and restarts the idle time of the client with the given
     * key. A client that did not come from this cache counts as open.
     */
    boolean isOpen(Key key, Firestore client) {
        if (clients.getIfPresent(key) == null) {
            // The entry may have expired. Run its removal now, so that the answer is up to date.
            clients.cleanUp();
        }
        return !shutDownClients.contains(client);
    }

    private void onRemoval(RemovalNotification<Key, Firestore> removed) {
        if (removed.getCause() == RemovalCause.SIZE) {
            log.info("Too many Firestore clients are open. Shutting down the least recently used one.");
        }
        shutDownClients.add(removed.getValue());
        shutDown(removed.getValue());
    }

    static void shutDown(Firestore client) {
        try {
            client.shutdown();
        } catch (RuntimeException e) {
            log.error("Error shutting down Firestore client.", e);
        }
    }
}
