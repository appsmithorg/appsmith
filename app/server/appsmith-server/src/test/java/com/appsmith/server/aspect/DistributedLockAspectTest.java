package com.appsmith.server.aspect;

import com.appsmith.caching.components.InstanceIdProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@SpringBootTest
class DistributedLockAspectTest {

    @Autowired
    private TestLockService testLockService;

    @Autowired
    private ReactiveRedisOperations<String, String> redisOperations;

    @MockBean
    private InstanceIdProvider instanceIdProvider;

    private static final String LOCK_PREFIX = "lock";
    private static final String TEST_INSTANCE_ID = "test-instance-123";

    private String getLockKey(String key) {
        return LOCK_PREFIX + ":" + TEST_INSTANCE_ID + ":" + key;
    }

    @Test
    void testMonoOperation() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        StepVerifier.create(testLockService.monoOperation())
                .expectNext("mono-success")
                .verifyComplete();

        // Verify lock is released
        StepVerifier.create(redisOperations.hasKey(getLockKey("mono-test")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testFluxOperation() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        StepVerifier.create(testLockService.fluxOperation().collectList())
                .expectNext(List.of("flux-success-1", "flux-success-2"))
                .verifyComplete();

        // Verify lock is released
        StepVerifier.create(redisOperations.hasKey(getLockKey("flux-test")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testBlockingOperation() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        String result = testLockService.blockingOperation();
        assertEquals("blocking-success", result);

        // Verify lock is released
        StepVerifier.create(redisOperations.hasKey(getLockKey("blocking-test")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testConcurrentAccess() throws InterruptedException {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        AtomicReference<String> thread1Result = new AtomicReference<>();
        AtomicReference<String> thread2Result = new AtomicReference<>();
        CountDownLatch thread1Started = new CountDownLatch(1);

        // Thread 1: Long running operation
        Thread thread1 = new Thread(
                () -> {
                    thread1Started.countDown();
                    thread1Result.set(testLockService.longRunningMonoOperation().block());
                },
                "Thread-1");

        // Thread 2: Tries to execute while Thread 1 is running
        Thread thread2 = new Thread(
                () -> {
                    try {
                        thread1Started.await(); // Wait for Thread 1 to start
                        Thread.sleep(100); // Small delay to ensure Thread 1 has acquired lock
                        thread2Result.set(
                                testLockService.longRunningMonoOperation().block());
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                },
                "Thread-2");

        // Start both threads
        thread1.start();
        thread2.start();

        // Wait for both threads to complete
        thread1.join(5000);
        thread2.join(5000);

        // Verify results
        assertEquals("long-running-success", thread1Result.get());
        assertNull(thread2Result.get()); // Thread 2 should not get the lock
    }

    @Test
    void testPersistentLock() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        // First operation acquires lock and doesn't release it
        StepVerifier.create(testLockService.operationWithPersistentLock())
                .expectNext("success")
                .verifyComplete();

        // Verify lock still exists after operation completes
        StepVerifier.create(redisOperations.hasKey(getLockKey("persistent-lock")))
                .expectNext(true)
                .verifyComplete();

        // Second operation should fail to acquire the same lock
        StepVerifier.create(testLockService.operationWithPersistentLock())
                .verifyComplete(); // Completes empty because lock is still held

        // Cleanup: Release lock for other tests
        StepVerifier.create(testLockService.releaseLock("persistent-lock", redisOperations, TEST_INSTANCE_ID))
                .expectNext(1L)
                .verifyComplete();
    }

    @Test
    void testPersistentLockExpiration() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        // Execute operation with short-lived lock
        StepVerifier.create(Mono.just(testLockService.operationWithShortLivedLock()))
                .expectNext("success")
                .verifyComplete();

        // Verify lock exists immediately after
        StepVerifier.create(redisOperations.hasKey(getLockKey("short-lived-lock")))
                .expectNext(true)
                .verifyComplete();

        // Wait for lock to expire
        try {
            Thread.sleep(1100); // Wait just over 1 second
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        // Verify lock has expired
        StepVerifier.create(redisOperations.hasKey(getLockKey("short-lived-lock")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testLockReleasedOnBlockingError() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        // Execute operation that throws error
        assertThrows(RuntimeException.class, () -> testLockService.blockingMethodWithError());

        // Verify lock is released despite shouldReleaseLock = false
        StepVerifier.create(redisOperations.hasKey(getLockKey("error-lock")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testLockReleasedOnReactiveError() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        // Execute operation that returns Mono.error
        StepVerifier.create(testLockService.reactiveMethodWithError())
                .expectError(RuntimeException.class)
                .verify();

        // Verify lock is released despite shouldReleaseLock = false
        StepVerifier.create(redisOperations.hasKey(getLockKey("error-lock")))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testLockReleasedOnErrorAllowsSubsequentExecution() {
        when(instanceIdProvider.getInstanceId()).thenReturn(Mono.just(TEST_INSTANCE_ID));

        // First call throws error
        assertThrows(RuntimeException.class, () -> testLockService.blockingMethodWithError());

        // Verify we can acquire the same lock immediately after error
        AtomicBoolean lockAcquired = new AtomicBoolean(false);
        StepVerifier.create(redisOperations.opsForValue().setIfAbsent(getLockKey("error-lock"), "test-value"))
                .consumeNextWith(result -> lockAcquired.set(result))
                .verifyComplete();

        // Should be able to acquire lock after error
        assertTrue(lockAcquired.get());

        // Cleanup
        redisOperations.delete(getLockKey("error-lock")).block();
    }
}
