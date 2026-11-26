package com.external.plugins;

import com.external.plugins.FirestoreClientCache.Key;
import com.google.cloud.firestore.Firestore;
import com.google.common.base.Ticker;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class FirestoreClientCacheTest {

    private static final Duration MAXIMUM_IDLE_TIME = Duration.ofHours(1);
    private static final Key KEY = Key.of("project", "credentials", "database");

    private final AtomicLong nanoTime = new AtomicLong();
    private final Ticker ticker = new Ticker() {
        @Override
        public long read() {
            return nanoTime.get();
        }
    };
    private final FirestoreClientCache cache = new FirestoreClientCache(2, MAXIMUM_IDLE_TIME, ticker);

    private void advance(Duration duration) {
        nanoTime.addAndGet(duration.toNanos());
    }

    private static Key key(int id) {
        return Key.of("project-" + id, "credentials", "database");
    }

    @Test
    void should_returnSameClient_when_keyIsEqual() {
        // Given
        Firestore first = cache.get(KEY, () -> mock(Firestore.class));

        // When
        Firestore second = cache.get(Key.of("project", "credentials", "database"), () -> mock(Firestore.class));

        // Then
        assertThat(second).isSameAs(first);
    }

    static Stream<Key> otherKeys() {
        return Stream.of(
                Key.of("other", "credentials", "database"),
                Key.of("project", "other", "database"),
                Key.of("project", "credentials", "other"));
    }

    @ParameterizedTest
    @MethodSource("otherKeys")
    void should_returnOtherClient_when_anyPartOfTheKeyDiffers(Key otherKey) {
        // Given
        Firestore first = cache.get(KEY, () -> mock(Firestore.class));

        // When
        Firestore second = cache.get(otherKey, () -> mock(Firestore.class));

        // Then
        assertThat(second).isNotSameAs(first);
    }

    @Test
    void should_notHoldTheCredentials_when_keyIsCreated() {
        // Given
        String credentialsJson = "{\"private_key\": \"secret\"}";

        // When
        Key key = Key.of("project", credentialsJson, "database");

        // Then
        assertThat(key.toString()).doesNotContain("secret");
    }

    @Test
    void should_createOneClient_when_callsAreConcurrent() throws Exception {
        // Given
        int callers = 8;
        AtomicInteger created = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(callers);
        List<Future<Firestore>> results = new ArrayList<>();

        // When
        List<Firestore> clients = new ArrayList<>();
        try {
            for (int i = 0; i < callers; i++) {
                results.add(executor.submit(() -> {
                    start.await();
                    return cache.get(KEY, () -> {
                        created.incrementAndGet();
                        return mock(Firestore.class);
                    });
                }));
            }
            start.countDown();
            for (Future<Firestore> result : results) {
                clients.add(result.get(10, TimeUnit.SECONDS));
            }
        } finally {
            executor.shutdownNow();
        }

        // Then
        assertThat(created).hasValue(1);
        assertThat(clients).containsOnly(clients.get(0));
    }

    @Test
    void should_shutDownLeastRecentlyUsedClient_when_maximumIsExceeded() {
        // Given
        Firestore first = cache.get(key(1), () -> mock(Firestore.class));
        Firestore second = cache.get(key(2), () -> mock(Firestore.class));
        cache.isOpen(key(1), first);

        // When
        Firestore third = cache.get(key(3), () -> mock(Firestore.class));

        // Then
        verify(second, times(1)).shutdown();
        verify(first, never()).shutdown();
        verify(third, never()).shutdown();
    }

    @Test
    void should_shutDownClient_when_itIsIdleForTooLong() {
        // Given
        Firestore idle = cache.get(key(1), () -> mock(Firestore.class));
        advance(MAXIMUM_IDLE_TIME.plusSeconds(1));

        // When
        cache.get(key(2), () -> mock(Firestore.class));

        // Then
        verify(idle, times(1)).shutdown();
    }

    @Test
    void should_keepClient_when_itWasUsedWithinTheIdleTime() {
        // Given
        Firestore used = cache.get(key(1), () -> mock(Firestore.class));
        advance(MAXIMUM_IDLE_TIME.minusSeconds(1));
        cache.isOpen(key(1), used);
        advance(MAXIMUM_IDLE_TIME.minusSeconds(1));

        // When
        cache.get(key(2), () -> mock(Firestore.class));

        // Then
        verify(used, never()).shutdown();
    }

    @Test
    void should_createNewClient_when_theOldOneWasRemoved() {
        // Given
        Firestore removed = cache.get(KEY, () -> mock(Firestore.class));
        advance(MAXIMUM_IDLE_TIME.plusSeconds(1));

        // When
        Firestore replacement = cache.get(KEY, () -> mock(Firestore.class));

        // Then
        assertThat(replacement).isNotSameAs(removed);
    }

    @Test
    void should_throwOriginalError_when_clientCannotBeCreated() {
        // Given
        IllegalArgumentException error = new IllegalArgumentException("bad credentials");

        // When
        ThrowingCallable get = () -> cache.get(KEY, () -> {
            throw error;
        });

        // Then
        assertThatThrownBy(get).isSameAs(error);
    }

    @Test
    void should_createClientOnNextCall_when_firstAttemptFailed() {
        // Given
        Firestore client = mock(Firestore.class);
        try {
            cache.get(KEY, () -> {
                throw new IllegalArgumentException("bad credentials");
            });
        } catch (IllegalArgumentException ignored) {
            // The first attempt fails on purpose.
        }

        // When
        Firestore result = cache.get(KEY, () -> client);

        // Then
        assertThat(result).isSameAs(client);
    }

    @Test
    void should_reportClientAsOpen_when_itWasNotRemoved() {
        // Given
        Firestore client = cache.get(KEY, () -> mock(Firestore.class));

        // When
        boolean open = cache.isOpen(KEY, client);

        // Then
        assertThat(open).isTrue();
    }

    @Test
    void should_reportClientAsClosed_when_itWasRemoved() {
        // Given
        Firestore client = cache.get(KEY, () -> mock(Firestore.class));
        advance(MAXIMUM_IDLE_TIME.plusSeconds(1));

        // When
        boolean open = cache.isOpen(KEY, client);

        // Then
        assertThat(open).isFalse();
    }

    @Test
    void should_reportClientAsClosed_when_anotherClientReplacedIt() {
        // Given
        Firestore removed = cache.get(KEY, () -> mock(Firestore.class));
        advance(MAXIMUM_IDLE_TIME.plusSeconds(1));
        cache.get(KEY, () -> mock(Firestore.class));

        // When
        boolean open = cache.isOpen(KEY, removed);

        // Then
        assertThat(open).isFalse();
    }

    @Test
    void should_reportClientAsOpen_when_itDidNotComeFromTheCache() {
        // Given
        Firestore unknown = mock(Firestore.class);
        cache.get(KEY, () -> mock(Firestore.class));

        // When
        boolean open = cache.isOpen(KEY, unknown);

        // Then
        assertThat(open).isTrue();
    }

    @Test
    void should_keepEveryClient_when_theMaximumIsReachedButNotExceeded() {
        // Given
        int maximumClients = 100;
        FirestoreClientCache largeCache = new FirestoreClientCache(maximumClients, MAXIMUM_IDLE_TIME, ticker);
        List<Firestore> clients = new ArrayList<>();

        // When
        for (int i = 0; i < maximumClients; i++) {
            clients.add(largeCache.get(key(i), () -> mock(Firestore.class)));
        }

        // Then
        clients.forEach(client -> verify(client, never()).shutdown());
    }
}
