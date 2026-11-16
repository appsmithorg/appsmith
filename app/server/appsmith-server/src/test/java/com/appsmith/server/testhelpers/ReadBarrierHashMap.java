package com.appsmith.server.testhelpers;

import java.io.Serial;
import java.util.HashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * A {@link HashMap} that makes its first readers wait for each other.
 *
 * <p>{@link #get} and {@link #containsKey} read the map, then wait until {@code readers} calls have read it. So the
 * first {@code readers} callers all see the map as it was before any of them wrote to it. That is the interleaving in
 * which unsynchronised get-or-create-then-put code loses entries. A test uses this map to make that interleaving
 * happen on every run instead of by chance. Each reader must run on its own thread.
 *
 * <p>Code that locks the map and adds through {@code computeIfAbsent} does not call these methods, so it never waits.
 * A reader that waits longer than {@link #MAX_WAIT_SECONDS} stops waiting and continues.
 */
public class ReadBarrierHashMap<K, V> extends HashMap<K, V> {

    @Serial
    private static final long serialVersionUID = 1L;

    private static final long MAX_WAIT_SECONDS = 5;

    private final transient CountDownLatch pendingReaders;

    public ReadBarrierHashMap(int readers) {
        this.pendingReaders = new CountDownLatch(readers);
    }

    @Override
    public V get(Object key) {
        V value = super.get(key);
        awaitOtherReaders();
        return value;
    }

    @Override
    public boolean containsKey(Object key) {
        boolean present = super.containsKey(key);
        awaitOtherReaders();
        return present;
    }

    /**
     * Reads the map without waiting. Use it to assert on the map after the code under test has finished.
     */
    public V getWithoutWaiting(Object key) {
        return super.get(key);
    }

    private void awaitOtherReaders() {
        pendingReaders.countDown();
        try {
            pendingReaders.await(MAX_WAIT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
