package com.external.plugins.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.lang.ref.WeakReference;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class MssqlKerberosFailuresTest {

    private static final String REFUSED = "Kerberos login failed for svc@REALM.";

    /**
     * Asks for garbage collection until the object is collected, for up to 10 seconds. Returns false when it was not,
     * because Java does not promise to collect it. A test then skips its check instead of failing.
     */
    private static boolean collected(WeakReference<Object> reference) {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (reference.get() != null && System.nanoTime() < deadline) {
            System.gc();
        }
        return reference.get() == null;
    }

    @ParameterizedTest
    @CsvSource({"1, 60", "2, 120", "3, 240", "4, 480", "5, 900", "6, 900", "40, 900"})
    void should_waitLonger_when_refusalsRepeat(int inARow, long expectedWaitSeconds) {
        // Given
        MssqlKerberosFailures.Failure failure = new MssqlKerberosFailures.Failure(REFUSED, "28000", 0, inARow);

        // When
        long waitSeconds = failure.waitSeconds();

        // Then
        assertThat(waitSeconds).isEqualTo(expectedWaitSeconds);
    }

    @Test
    void should_giveTheSameLock_when_theKeyIsTheSame() {
        // Given: two pools build the key from the same account and password.
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        String key = MssqlKerberosFailures.key("svc@REALM", "pw".toCharArray());
        String sameKey = MssqlKerberosFailures.key("SVC@REALM", "pw".toCharArray());

        // When / Then
        assertThat(failures.lockFor(sameKey)).isSameAs(failures.lockFor(key));
    }

    @Test
    void should_keepTheSameLock_when_theGarbageCollectorRunsWhileAPoolHoldsIt() {
        // Given: a pool holds the lock for its key.
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        String key = MssqlKerberosFailures.key("svc@REALM", "pw".toCharArray());
        Object heldLock = failures.lockFor(key);
        // A lock that nothing holds, to show that a collection ran.
        WeakReference<Object> unheldLock =
                new WeakReference<>(failures.lockFor(MssqlKerberosFailures.key("other@REALM", "pw".toCharArray())));
        assumeTrue(collected(unheldLock), "No garbage collection ran within 10 seconds, so this test cannot check.");

        // When: a new pool with the same account and password asks for its lock.
        Object newPoolsLock = failures.lockFor(key);

        // Then
        assertThat(newPoolsLock).isSameAs(heldLock);
    }

    @Test
    void should_dropALock_when_noPoolHoldsItAnyMore() {
        // Given: a pool took a lock and was then closed, so nothing holds the lock.
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        WeakReference<Object> closedPoolsLock =
                new WeakReference<>(failures.lockFor(MssqlKerberosFailures.key("svc@REALM", "pw".toCharArray())));
        // The skip depends on a separate object, so a lock that is wrongly held strongly fails the test, not skips it.
        WeakReference<Object> canary = new WeakReference<>(new Object());
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while ((canary.get() != null || closedPoolsLock.get() != null) && System.nanoTime() < deadline) {
            System.gc();
        }
        assumeTrue(canary.get() == null, "No garbage collection ran within 10 seconds, so this test cannot check.");
        assertThat(closedPoolsLock.get())
                .as("the closed pool's lock was collected")
                .isNull();

        // When: the next pool asks for a lock.
        Object held = failures.lockFor(MssqlKerberosFailures.key("other@REALM", "pw".toCharArray()));

        // Then: only the new pool's lock is left.
        assertThat(held).isNotNull();
        assertThat(failures.lockCount()).isEqualTo(1);
    }

    @Test
    void should_giveADifferentLock_when_thePasswordIsDifferent() {
        // Given
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        Object lock = failures.lockFor(MssqlKerberosFailures.key("svc@REALM", "pw".toCharArray()));

        // When
        Object otherLock = failures.lockFor(MssqlKerberosFailures.key("svc@REALM", "other".toCharArray()));

        // Then
        assertThat(otherLock).isNotSameAs(lock);
    }

    @Test
    void should_countRefusalsInARow_when_theSameKeyIsRefusedAgain() {
        // Given
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        String key = MssqlKerberosFailures.key("svc@REALM", "pw".toCharArray());
        failures.recordRefusal(key, REFUSED, "28000", 0);

        // When
        MssqlKerberosFailures.Failure second = failures.recordRefusal(key, REFUSED, "28000", 10);

        // Then
        assertThat(second.inARow()).isEqualTo(2);
        assertThat(second.atNanos()).isEqualTo(10);
    }

    @Test
    void should_makeDifferentKeys_when_thePasswordsDiffer() {
        // Given
        char[] wrong = "wrong".toCharArray();
        char[] right = "right".toCharArray();

        // When
        String wrongKey = MssqlKerberosFailures.key("svc@REALM", wrong);
        String rightKey = MssqlKerberosFailures.key("svc@REALM", right);

        // Then
        assertThat(wrongKey).isNotEqualTo(rightKey).startsWith("svc@realm");
        assertThat(MssqlKerberosFailures.key("svc@REALM", wrong)).isEqualTo(wrongKey);
    }

    @Test
    void should_notContainThePassword_when_makingAKey() {
        // Given
        char[] password = "VeryRecognisablePassword".toCharArray();

        // When
        String key = MssqlKerberosFailures.key("svc@REALM", password);

        // Then
        assertThat(key).doesNotContain("VeryRecognisablePassword");
    }

    @Test
    void should_forgetOldRecords_when_aNewRefusalIsRecorded() {
        // Given
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        String oldKey = MssqlKerberosFailures.key("old@REALM", "pw".toCharArray());
        failures.recordRefusal(oldKey, REFUSED, "28000", 0);

        // When
        failures.recordRefusal(
                MssqlKerberosFailures.key("new@REALM", "pw".toCharArray()), REFUSED, "28000", TimeUnit.DAYS.toNanos(2));

        // Then
        assertThat(failures.get(oldKey)).isNull();
    }

    @Test
    void should_shareOneRecord_when_theAccountIsSpelledWithDifferentCase() {
        // Given
        char[] password = "pw".toCharArray();

        // When
        String lower = MssqlKerberosFailures.key("svc@CORP.EXAMPLE.COM", password);
        String upper = MssqlKerberosFailures.key("SVC@corp.example.com", password);

        // Then
        assertThat(upper).isEqualTo(lower);
    }

    @Test
    void should_dropTheOldestRecord_when_theMapIsFull() {
        // Given
        MssqlKerberosFailures failures = new MssqlKerberosFailures();
        String oldest = MssqlKerberosFailures.key("user0@REALM", "pw".toCharArray());
        for (int i = 0; i < MssqlKerberosFailures.MAX_RECORDS; i++) {
            failures.recordRefusal(
                    MssqlKerberosFailures.key("user" + i + "@REALM", "pw".toCharArray()), REFUSED, "28000", i);
        }

        // When
        failures.recordRefusal(
                MssqlKerberosFailures.key("newcomer@REALM", "pw".toCharArray()),
                REFUSED,
                "28000",
                MssqlKerberosFailures.MAX_RECORDS);

        // Then
        assertThat(failures.size()).isEqualTo(MssqlKerberosFailures.MAX_RECORDS);
        assertThat(failures.get(oldest)).isNull();
    }
}
