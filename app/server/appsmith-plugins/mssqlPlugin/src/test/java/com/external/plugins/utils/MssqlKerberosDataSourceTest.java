package com.external.plugins.utils;

import org.ietf.jgss.GSSCredential;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** The credential is a Mockito mock. The plugins module has mockito-core but not the JUnit extension. */
class MssqlKerberosDataSourceTest {

    private static final String URL =
            "jdbc:sqlserver://sql.appsmith.test:1433;" + MssqlKerberosDataSource.KERBEROS_URL_PROPERTIES;

    private static final String ACCOUNT = "svc@REALM";

    private static final LoginException REFUSED =
            new FailedLoginException("Pre-authentication information was invalid (24)");

    private final GSSCredential longLivedCredential = mock(GSSCredential.class);

    private final GSSCredential expiringCredential = mock(GSSCredential.class);

    private final AtomicLong nowNanos = new AtomicLong();
    private final AtomicInteger logins = new AtomicInteger();
    private MssqlKerberosFailures failures;

    @BeforeEach
    void setUp() throws Exception {
        when(longLivedCredential.getRemainingLifetime()).thenReturn(36_000);
        when(expiringCredential.getRemainingLifetime()).thenReturn(MssqlKerberosDataSource.RENEW_BEFORE_SECONDS - 1);
        failures = new MssqlKerberosFailures();
    }

    private MssqlKerberosDataSource dataSource(String password, MssqlKerberosDataSource.CredentialSource source) {
        return new MssqlKerberosDataSource(URL, ACCOUNT, password, null, 30_000, source, failures, nowNanos::get);
    }

    private MssqlKerberosDataSource.CredentialSource counting(MssqlKerberosDataSource.CredentialSource source) {
        return (principal, password) -> {
            logins.incrementAndGet();
            return source.login(principal, password);
        };
    }

    private MssqlKerberosDataSource.CredentialSource refusing() {
        return counting((principal, password) -> {
            throw REFUSED;
        });
    }

    /** Returns true when the thread is waiting to enter this object's monitor, not just any monitor. */
    private static boolean isBlockedOn(Thread thread, Object lock) {
        if (thread == null) {
            return false;
        }
        ThreadInfo info = ManagementFactory.getThreadMXBean().getThreadInfo(thread.threadId());
        return info != null
                && info.getThreadState() == Thread.State.BLOCKED
                && info.getLockInfo() != null
                && info.getLockInfo().getIdentityHashCode() == System.identityHashCode(lock);
    }

    private void advanceSeconds(long seconds) {
        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(seconds));
    }

    @Test
    void should_reuseTheCredential_when_itHasTimeLeft() throws Exception {
        // Given
        MssqlKerberosDataSource dataSource = dataSource("pw", counting((p, pw) -> longLivedCredential));

        // When
        GSSCredential first = dataSource.currentCredential();
        GSSCredential second = dataSource.currentCredential();

        // Then
        assertThat(second).isSameAs(first);
        assertThat(logins).hasValue(1);
    }

    @Test
    void should_logInAgain_when_theCredentialIsAboutToExpire() throws Exception {
        // Given
        List<GSSCredential> credentials = new ArrayList<>(List.of(expiringCredential, longLivedCredential));
        MssqlKerberosDataSource dataSource = dataSource("pw", counting((p, pw) -> credentials.remove(0)));
        dataSource.currentCredential();

        // When
        GSSCredential renewed = dataSource.currentCredential();

        // Then
        assertThat(renewed).isSameAs(longLivedCredential);
        assertThat(logins).hasValue(2);
    }

    @Test
    void should_passThePrincipalAndPassword_when_loggingIn() throws Exception {
        // Given
        List<String> seen = new ArrayList<>();
        MssqlKerberosDataSource dataSource = dataSource("s3cret", (principal, password) -> {
            seen.add(principal);
            seen.add(new String(password));
            return longLivedCredential;
        });

        // When
        dataSource.currentCredential();

        // Then
        assertThat(seen).containsExactly(ACCOUNT, "s3cret");
    }

    @Test
    void should_showAPlainHintWithoutThePassword_when_theLoginIsRefused() {
        // Given
        MssqlKerberosDataSource dataSource = dataSource("s3cret", refusing());

        // When / Then
        assertThatThrownBy(dataSource::getConnection)
                .isInstanceOf(SQLException.class)
                .hasMessageContaining(ACCOUNT)
                .hasMessageContaining("Check the username and password")
                .hasMessageNotContaining("Pre-authentication")
                .hasMessageNotContaining("s3cret")
                .extracting(error -> ((SQLException) error).getSQLState())
                .isEqualTo("28000");
    }

    @Test
    void should_notContactTheDomainController_when_aRefusalIsStillWaiting() {
        // Given
        MssqlKerberosDataSource dataSource = dataSource("wrong", refusing());
        assertThatThrownBy(dataSource::currentCredential).isInstanceOf(SQLException.class);
        advanceSeconds(MssqlKerberosFailures.RETRY_AFTER_FAILURE_SECONDS - 1);

        // When / Then
        assertThatThrownBy(dataSource::currentCredential)
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("waits 60 seconds")
                .hasMessageContaining("Check the username and password");
        assertThat(logins).hasValue(1);
    }

    @Test
    void should_tryAgain_when_theWaitHasPassed() throws Exception {
        // Given
        AtomicInteger attempt = new AtomicInteger();
        MssqlKerberosDataSource dataSource = dataSource("pw", counting((p, pw) -> {
            if (attempt.incrementAndGet() == 1) {
                throw REFUSED;
            }
            return longLivedCredential;
        }));
        assertThatThrownBy(dataSource::currentCredential).isInstanceOf(SQLException.class);
        advanceSeconds(MssqlKerberosFailures.RETRY_AFTER_FAILURE_SECONDS);

        // When
        GSSCredential credential = dataSource.currentCredential();

        // Then
        assertThat(credential).isSameAs(longLivedCredential);
        assertThat(logins).hasValue(2);
    }

    @Test
    void should_keepWaiting_when_aNewPoolUsesTheSameAccountAndPassword() {
        // Given: Appsmith rebuilds the pool after a stale connection, or for each "Test".
        assertThatThrownBy(dataSource("wrong", refusing())::currentCredential).isInstanceOf(SQLException.class);
        MssqlKerberosDataSource newPool = dataSource("wrong", refusing());

        // When / Then
        assertThatThrownBy(newPool::currentCredential).hasMessageContaining("waits 60 seconds");
        assertThat(logins).hasValue(1);
    }

    @Test
    void should_sendThePasswordOnce_when_twoPoolsLogInAtTheSameTime() throws Exception {
        // Given: the first pool's login is held at the domain controller until the second pool is waiting.
        CountDownLatch firstLoginStarted = new CountDownLatch(1);
        CountDownLatch releaseFirstLogin = new CountDownLatch(1);
        MssqlKerberosDataSource.CredentialSource slowRefusal = counting((p, pw) -> {
            firstLoginStarted.countDown();
            boolean released;
            try {
                released = releaseFirstLogin.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                released = false;
            }
            if (!released) {
                // Fails the test: the login must end because the test released it, not because time ran out.
                throw new IllegalStateException("The test did not release the first login in time.");
            }
            throw REFUSED;
        });
        MssqlKerberosDataSource firstPool = dataSource("wrong", slowRefusal);
        MssqlKerberosDataSource secondPool = dataSource("wrong", slowRefusal);
        ExecutorService threads = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = threads.submit(() -> firstPool.currentCredential());
            assertThat(firstLoginStarted.await(10, TimeUnit.SECONDS)).isTrue();
            AtomicReference<Thread> secondThread = new AtomicReference<>();
            Future<?> second = threads.submit(() -> {
                secondThread.set(Thread.currentThread());
                return secondPool.currentCredential();
            });

            // When: the second pool is waiting for the shared lock, or has sent the password itself.
            Object sharedLock = failures.lockFor(MssqlKerberosFailures.key(ACCOUNT, "wrong".toCharArray()));
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
            while (System.nanoTime() < deadline && logins.get() < 2 && !isBlockedOn(secondThread.get(), sharedLock)) {
                Thread.onSpinWait();
            }
            // The two logins must really overlap: the second pool waits on the shared lock while the first login is
            // still running. This fails if the second pool sent its own login or the wait ran out.
            assertThat(logins).as("only the first pool has sent the password").hasValue(1);
            assertThat(isBlockedOn(secondThread.get(), sharedLock))
                    .as("the second pool waits on the shared lock")
                    .isTrue();
            releaseFirstLogin.countDown();

            // Then
            assertThatThrownBy(() -> first.get(10, TimeUnit.SECONDS))
                    .hasCauseInstanceOf(SQLException.class)
                    .hasMessageContaining("Check the username and password");
            assertThatThrownBy(() -> second.get(10, TimeUnit.SECONDS))
                    .hasCauseInstanceOf(SQLException.class)
                    .hasMessageContaining("waits 60 seconds");
            assertThat(logins).hasValue(1);
        } finally {
            releaseFirstLogin.countDown();
            threads.shutdownNow();
        }
    }

    @Test
    void should_notWait_when_anotherAccountsLoginIsStuck() throws Exception {
        // Given: a login for one account hangs, for example at a domain controller that does not answer.
        CountDownLatch stuckLoginStarted = new CountDownLatch(1);
        CountDownLatch releaseStuckLogin = new CountDownLatch(1);
        MssqlKerberosDataSource stuckPool = dataSource("stuck", (p, pw) -> {
            stuckLoginStarted.countDown();
            try {
                releaseStuckLogin.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            throw REFUSED;
        });
        MssqlKerberosDataSource otherPool = new MssqlKerberosDataSource(
                URL, "other@REALM", "pw", null, 30_000, (p, pw) -> longLivedCredential, failures, nowNanos::get);
        ExecutorService threads = Executors.newFixedThreadPool(2);
        try {
            threads.submit(() -> stuckPool.currentCredential());
            assertThat(stuckLoginStarted.await(10, TimeUnit.SECONDS)).isTrue();

            // When
            Future<GSSCredential> other = threads.submit(otherPool::currentCredential);

            // Then
            assertThat(other.get(5, TimeUnit.SECONDS)).isSameAs(longLivedCredential);
        } finally {
            releaseStuckLogin.countDown();
            threads.shutdownNow();
        }
    }

    @Test
    void should_tryAtOnce_when_thePasswordChanged() throws Exception {
        // Given
        assertThatThrownBy(dataSource("wrong", refusing())::currentCredential).isInstanceOf(SQLException.class);
        MssqlKerberosDataSource corrected = dataSource("right", counting((p, pw) -> longLivedCredential));

        // When
        GSSCredential credential = corrected.currentCredential();

        // Then
        assertThat(credential).isSameAs(longLivedCredential);
        assertThat(logins).hasValue(2);
    }

    @Test
    void should_tryAtOnce_when_theFailureIsNotARefusal() {
        // Given: an unreachable domain controller does not count towards the account's lockout.
        MssqlKerberosDataSource dataSource = dataSource("pw", counting((p, pw) -> {
            throw new LoginException("Receive timed out");
        }));
        assertThatThrownBy(dataSource::currentCredential).isInstanceOf(SQLException.class);

        // When / Then
        assertThatThrownBy(dataSource::currentCredential)
                .isInstanceOf(SQLException.class)
                .hasMessageNotContaining("waits");
        assertThat(logins).hasValue(2);
    }

    @Test
    void should_forgetTheRefusals_when_aLoginWorks() throws Exception {
        // Given
        AtomicInteger attempt = new AtomicInteger();
        MssqlKerberosDataSource dataSource = dataSource("pw", (p, pw) -> {
            if (attempt.incrementAndGet() == 1) {
                throw REFUSED;
            }
            return longLivedCredential;
        });
        assertThatThrownBy(dataSource::currentCredential).isInstanceOf(SQLException.class);
        advanceSeconds(MssqlKerberosFailures.RETRY_AFTER_FAILURE_SECONDS);

        // When
        dataSource.currentCredential();

        // Then
        assertThat(failures.get(MssqlKerberosFailures.key(ACCOUNT, "pw".toCharArray())))
                .isNull();
    }

    static Stream<Arguments> missingAccountDetails() {
        return Stream.of(
                Arguments.of(ACCOUNT, null, "A Kerberos datasource needs a password."),
                Arguments.of(null, "pw", "A Kerberos datasource needs a username."));
    }

    @ParameterizedTest
    @MethodSource("missingAccountDetails")
    void should_failClearly_when_theUsernameOrPasswordIsMissing(String principal, String password, String message) {
        // Given / When / Then
        assertThatThrownBy(() -> new MssqlKerberosDataSource(URL, principal, password, null, 1))
                .isInstanceOf(NullPointerException.class)
                .hasMessage(message);
    }

    @Test
    void should_keepTheDriversOwnLoginAndRetryOff_when_buildingTheUrl() {
        // Given
        String properties = MssqlKerberosDataSource.KERBEROS_URL_PROPERTIES;

        // When / Then
        assertThat(properties)
                .contains("authenticationScheme=JavaKerberos;")
                // A retry would run without the supplied credential. See KERBEROS_URL_PROPERTIES.
                .contains("connectRetryCount=0;")
                .contains("transparentNetworkIPResolution=false;")
                // The driver's own login (ticket cache or JAAS file) must never run.
                .contains("useDefaultJaasConfig=false;")
                .contains("jaasConfigurationName=AppsmithNoDriverKerberosLogin;");
    }

    @Test
    void should_refuse_when_thePoolPassesAUsername() {
        // Given
        MssqlKerberosDataSource dataSource = dataSource("pw", (p, pw) -> longLivedCredential);

        // When / Then
        assertThatThrownBy(() -> dataSource.getConnection("sa", "other"))
                .isInstanceOf(SQLFeatureNotSupportedException.class)
                .hasMessage("Kerberos connections use the datasource's own account.");
    }
}
