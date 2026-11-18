package com.external.plugins.utils;

import org.ietf.jgss.GSSCredential;
import org.junit.jupiter.api.Test;

import javax.security.auth.login.FailedLoginException;
import java.lang.reflect.Proxy;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class MssqlKerberosDataSourceTest {

    private static final String URL =
            "jdbc:sqlserver://sql.appsmith.test:1433;" + MssqlKerberosDataSource.KERBEROS_URL_PROPERTIES;

    /** A credential that only answers getRemainingLifetime. */
    private static GSSCredential credentialWithLifetime(int seconds) {
        return (GSSCredential) Proxy.newProxyInstance(
                GSSCredential.class.getClassLoader(), new Class<?>[] {GSSCredential.class}, (proxy, method, args) -> {
                    if (method.getName().equals("getRemainingLifetime")) {
                        return seconds;
                    }
                    if (method.getName().equals("toString")) {
                        return "credential(" + seconds + "s)";
                    }
                    throw new UnsupportedOperationException(method.getName());
                });
    }

    @Test
    public void currentCredential_isKeptWhileItHasTimeLeft() throws Exception {
        AtomicInteger logins = new AtomicInteger();
        MssqlKerberosDataSource dataSource =
                new MssqlKerberosDataSource(URL, "svc@REALM", "pw", null, 30_000, (principal, password) -> {
                    logins.incrementAndGet();
                    return credentialWithLifetime(36_000);
                });

        GSSCredential first = dataSource.currentCredential();
        GSSCredential second = dataSource.currentCredential();

        assertSame(first, second);
        assertEquals(1, logins.get());
    }

    @Test
    public void currentCredential_logsInAgainWhenItIsAboutToExpire() throws Exception {
        List<Integer> lifetimes = new ArrayList<>(List.of(MssqlKerberosDataSource.RENEW_BEFORE_SECONDS - 1, 36_000));
        AtomicInteger logins = new AtomicInteger();
        MssqlKerberosDataSource dataSource =
                new MssqlKerberosDataSource(URL, "svc@REALM", "pw", null, 30_000, (principal, password) -> {
                    logins.incrementAndGet();
                    return credentialWithLifetime(lifetimes.remove(0));
                });

        dataSource.currentCredential();
        GSSCredential renewed = dataSource.currentCredential();

        assertEquals(2, logins.get());
        assertEquals(36_000, renewed.getRemainingLifetime());
    }

    @Test
    public void currentCredential_passesThePrincipalAndPassword() throws Exception {
        List<String> seen = new ArrayList<>();
        MssqlKerberosDataSource dataSource =
                new MssqlKerberosDataSource(URL, "svc@REALM", "s3cret", null, 30_000, (principal, password) -> {
                    seen.add(principal);
                    seen.add(new String(password));
                    return credentialWithLifetime(36_000);
                });

        dataSource.currentCredential();

        assertEquals(List.of("svc@REALM", "s3cret"), seen);
    }

    @Test
    public void failedLogin_becomesAnSqlExceptionThatNamesTheAccountButNotThePassword() {
        MssqlKerberosDataSource dataSource =
                new MssqlKerberosDataSource(URL, "svc@REALM", "s3cret", null, 30_000, (principal, password) -> {
                    throw new FailedLoginException("Pre-authentication information was invalid (24)");
                });

        SQLException error = assertThrows(SQLException.class, dataSource::getConnection);

        assertEquals("28000", error.getSQLState());
        assertTrue(error.getMessage().contains("svc@REALM"));
        // A plain hint, not the domain controller's own text, which tells "no such account" from "wrong password".
        assertTrue(error.getMessage().contains("Check the username and password"));
        assertFalse(error.getMessage().contains("Pre-authentication"));
        assertFalse(error.getMessage().contains("s3cret"));
    }

    @Test
    public void failedLogin_isTriedAgainAfterTheWait() throws Exception {
        AtomicInteger logins = new AtomicInteger();
        AtomicLong nowNanos = new AtomicLong();
        MssqlKerberosDataSource dataSource = new MssqlKerberosDataSource(
                URL,
                "svc@REALM",
                "pw",
                null,
                30_000,
                (principal, password) -> {
                    if (logins.incrementAndGet() == 1) {
                        throw new FailedLoginException("KDC unreachable");
                    }
                    return credentialWithLifetime(36_000);
                },
                nowNanos::get);

        assertThrows(SQLException.class, dataSource::currentCredential);
        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(MssqlKerberosDataSource.RETRY_AFTER_FAILURE_SECONDS));
        dataSource.currentCredential();

        assertEquals(2, logins.get());
    }

    @Test
    public void afterAFailedLogin_theDomainControllerIsNotContactedAgainForAWhile() {
        AtomicInteger logins = new AtomicInteger();
        AtomicLong nowNanos = new AtomicLong();
        MssqlKerberosDataSource dataSource = new MssqlKerberosDataSource(
                URL,
                "svc@REALM",
                "wrong",
                null,
                30_000,
                (principal, password) -> {
                    logins.incrementAndGet();
                    throw new FailedLoginException("Pre-authentication information was invalid (24)");
                },
                nowNanos::get);

        assertThrows(SQLException.class, dataSource::currentCredential);
        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(59));
        SQLException waiting = assertThrows(SQLException.class, dataSource::currentCredential);

        assertEquals(1, logins.get());
        assertTrue(waiting.getMessage().contains("waits 60 seconds"), waiting.getMessage());
        assertTrue(waiting.getMessage().contains("Check the username and password"), waiting.getMessage());

        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(2));
        assertThrows(SQLException.class, dataSource::currentCredential);
        assertEquals(2, logins.get());
    }

    @Test
    public void retryWait_doublesAfterEachFailureUpToFifteenMinutes() {
        AtomicLong nowNanos = new AtomicLong();
        MssqlKerberosDataSource dataSource = new MssqlKerberosDataSource(
                URL,
                "svc@REALM",
                "wrong",
                null,
                30_000,
                (principal, password) -> {
                    throw new FailedLoginException("Pre-authentication information was invalid (24)");
                },
                nowNanos::get);

        List<Long> waits = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            assertThrows(SQLException.class, dataSource::currentCredential);
            waits.add(dataSource.retryWaitSeconds());
            nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(dataSource.retryWaitSeconds()));
        }

        assertEquals(List.of(60L, 120L, 240L, 480L, 900L, 900L, 900L), waits);
    }

    @Test
    public void aSuccessfulLogin_resetsTheWait() throws Exception {
        AtomicInteger logins = new AtomicInteger();
        AtomicLong nowNanos = new AtomicLong();
        MssqlKerberosDataSource dataSource = new MssqlKerberosDataSource(
                URL,
                "svc@REALM",
                "pw",
                null,
                30_000,
                (principal, password) -> {
                    if (logins.incrementAndGet() <= 2) {
                        throw new FailedLoginException("Receive timed out");
                    }
                    // Short-lived, so the next call logs in again.
                    return credentialWithLifetime(1);
                },
                nowNanos::get);

        assertThrows(SQLException.class, dataSource::currentCredential);
        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(60));
        assertThrows(SQLException.class, dataSource::currentCredential);
        nowNanos.addAndGet(TimeUnit.SECONDS.toNanos(120));
        dataSource.currentCredential();

        assertEquals(60L, dataSource.retryWaitSeconds());
    }

    @Test
    public void missingPasswordOrUsername_failsClearly() {
        assertThrows(NullPointerException.class, () -> new MssqlKerberosDataSource(URL, "svc@REALM", null, null, 1));
        assertThrows(NullPointerException.class, () -> new MssqlKerberosDataSource(URL, null, "pw", null, 1));
    }

    @Test
    public void urlProperties_keepTheDriversOwnLoginAndRetryOff() {
        String properties = MssqlKerberosDataSource.KERBEROS_URL_PROPERTIES;

        assertTrue(properties.contains("authenticationScheme=JavaKerberos;"));
        // A retry would run without the supplied credential. See KERBEROS_URL_PROPERTIES.
        assertTrue(properties.contains("connectRetryCount=0;"));
        assertTrue(properties.contains("transparentNetworkIPResolution=false;"));
        // The driver's own login (ticket cache or JAAS file) must never run.
        assertTrue(properties.contains("useDefaultJaasConfig=false;"));
        assertTrue(properties.contains("jaasConfigurationName=AppsmithNoDriverKerberosLogin;"));
    }

    @Test
    public void getConnectionWithAUserName_isRefused() {
        MssqlKerberosDataSource dataSource = new MssqlKerberosDataSource(
                URL, "svc@REALM", "pw", null, 30_000, (principal, password) -> credentialWithLifetime(36_000));

        assertThrows(SQLFeatureNotSupportedException.class, () -> dataSource.getConnection("sa", "other"));
    }
}
