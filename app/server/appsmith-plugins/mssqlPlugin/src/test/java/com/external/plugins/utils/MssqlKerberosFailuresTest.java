package com.external.plugins.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class MssqlKerberosFailuresTest {

    private static final String REFUSED = "Kerberos login failed for svc@REALM.";

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
