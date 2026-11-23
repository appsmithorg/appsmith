package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import com.microsoft.sqlserver.jdbc.SQLServerDataSource;
import lombok.extern.slf4j.Slf4j;
import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSException;
import org.springframework.util.StringUtils;

import javax.security.auth.login.LoginException;
import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Objects;
import java.util.function.LongSupplier;
import java.util.logging.Logger;

/**
 * A {@link DataSource} for the connection pool that connects to SQL Server with Kerberos.
 *
 * <p>Each new connection gets a Kerberos credential from {@link MssqlKerberosLogin}. The credential is kept and used
 * again until it has less than {@link #RENEW_BEFORE_SECONDS} left, then the account logs in again. So a pool of ten
 * connections logs in to the domain controller once, not ten times.
 *
 * <p>When the domain controller refuses the account or its password, the refusal is recorded in
 * {@link MssqlKerberosFailures}, which every pool on the server shares. Until the wait has passed, every pool with
 * the same account and password gets the same error without contacting the domain controller. Each try with a wrong
 * password would count towards the account's lockout. Other failures, such as an unreachable domain controller, are
 * not recorded, so they can be retried at once after they are fixed.
 *
 * <p>The password is held only here, in memory, for the life of the pool.
 */
@Slf4j
public class MssqlKerberosDataSource implements DataSource {

    /** Log in again when the credential has less than this many seconds left. */
    static final int RENEW_BEFORE_SECONDS = 5 * 60;

    /**
     * Driver URL properties for Kerberos. The credential itself is set per connection.
     *
     * <ul>
     *   <li>{@code integratedSecurity} and {@code authenticationScheme} turn on Kerberos.
     *   <li>{@code connectRetryCount=0} and {@code transparentNetworkIPResolution=false} stop the driver from trying
     *       the logon a second time. The driver forgets the supplied credential after each logon attempt. A second
     *       attempt would then fall back to the driver's own login and hide SQL Server's real error.
     *   <li>{@code useDefaultJaasConfig=false} and an entry name that nothing defines make sure the driver's own login
     *       can never run. It could otherwise use a Kerberos ticket cached on the Appsmith server, or an admin's JAAS
     *       file, instead of this datasource's account.
     * </ul>
     *
     * The connection pool still opens a new connection when one fails, so turning off the driver's retry loses
     * nothing there.
     */
    public static final String KERBEROS_URL_PROPERTIES = "integratedSecurity=true;authenticationScheme=JavaKerberos;"
            + "connectRetryCount=0;transparentNetworkIPResolution=false;"
            + "useDefaultJaasConfig=false;jaasConfigurationName=AppsmithNoDriverKerberosLogin;";

    private final String url;
    private final String principal;
    private final char[] password;
    private final String failureKey;
    private final String serverSpn;
    private final int socketTimeoutMs;
    private final CredentialSource credentialSource;
    private final MssqlKerberosFailures failures;
    private final LongSupplier clockNanos;

    /**
     * The lock that every pool with this account and password shares. Kept in a field, because {@link
     * MssqlKerberosFailures} drops a lock once no pool holds it.
     */
    private final Object loginLock;

    private GSSCredential credential;
    private int loginTimeoutSeconds;

    /** Makes a credential. Tests replace the Kerberos login with this. */
    @FunctionalInterface
    interface CredentialSource {
        GSSCredential login(String principal, char[] password) throws LoginException, GSSException;
    }

    /**
     * @param url             the JDBC URL. It must contain {@link #KERBEROS_URL_PROPERTIES}.
     * @param principal       the Kerberos principal, such as {@code svc_appsmith@CORP.EXAMPLE.COM}
     * @param password        the principal's password
     * @param serverSpn       the server's service name, or blank to let the driver build {@code MSSQLSvc/host:port}
     * @param socketTimeoutMs the socket timeout for each connection, in milliseconds
     */
    public MssqlKerberosDataSource(
            String url, String principal, String password, String serverSpn, int socketTimeoutMs) {
        this(
                url,
                principal,
                password,
                serverSpn,
                socketTimeoutMs,
                MssqlKerberosLogin::login,
                MssqlKerberosFailures.SHARED,
                System::nanoTime);
    }

    MssqlKerberosDataSource(
            String url,
            String principal,
            String password,
            String serverSpn,
            int socketTimeoutMs,
            CredentialSource credentialSource,
            MssqlKerberosFailures failures,
            LongSupplier clockNanos) {
        // validateDatasource() already requires both. Fail clearly if a caller skipped it.
        this.principal = Objects.requireNonNull(principal, "A Kerberos datasource needs a username.");
        this.password = Objects.requireNonNull(password, "A Kerberos datasource needs a password.")
                .toCharArray();
        this.failureKey = MssqlKerberosFailures.key(this.principal, this.password);
        this.url = url;
        this.serverSpn = serverSpn;
        this.socketTimeoutMs = socketTimeoutMs;
        this.credentialSource = credentialSource;
        this.failures = failures;
        this.loginLock = failures.lockFor(failureKey);
        this.clockNanos = clockNanos;
    }

    @Override
    public Connection getConnection() throws SQLException {
        SQLServerDataSource driverDataSource = new SQLServerDataSource();
        driverDataSource.setURL(url);
        driverDataSource.setSocketTimeout(socketTimeoutMs);
        driverDataSource.setLoginTimeout(loginTimeoutSeconds);
        if (StringUtils.hasText(serverSpn)) {
            // A setter, not the URL, so the value cannot add connection properties.
            driverDataSource.setServerSpn(serverSpn);
        }
        driverDataSource.setGSSCredentials(currentCredential());
        try {
            return driverDataSource.getConnection();
        } catch (SQLException e) {
            throw MssqlKerberosErrors.connectFailure(e);
        }
    }

    /**
     * Returns the kept credential, or logs in again when there is none or it is about to expire. Synchronized, so
     * connections opened at the same time share one login. While a refusal for this account and password is still
     * waiting, returns that error without contacting the domain controller.
     *
     * <p>The check for a refusal, the login and the recording of its result happen under one lock that every pool with
     * the same account and password shares. So a second pool waits for the first pool's login, then sees its refusal
     * and does not send the password again. Pools with other accounts or passwords have their own lock and never wait
     * for this one.
     */
    synchronized GSSCredential currentCredential() throws SQLException {
        if (hasTimeLeft(credential)) {
            return credential;
        }

        // Always taken after this datasource's own lock, and never the other way round, so the two cannot deadlock.
        synchronized (loginLock) {
            MssqlKerberosFailures.Failure refused = failures.get(failureKey);
            if (refused != null && refused.stillWaiting(clockNanos.getAsLong())) {
                throw new SQLException(
                        String.format(
                                MssqlErrorMessages.KERBEROS_RETRY_WAIT_ERROR_MSG,
                                refused.message(),
                                refused.waitSeconds()),
                        refused.sqlState());
            }

            try {
                credential = credentialSource.login(principal, password);
                failures.clear(failureKey);
                log.debug(
                        "Kerberos login for {} worked. The credential is valid for {} seconds.",
                        principal,
                        credential.getRemainingLifetime());
                return credential;
            } catch (LoginException | GSSException e) {
                credential = null;
                // The full error is only in the server log, at debug level. It never contains the password.
                log.debug("Kerberos login for {} failed: {}", principal, e.toString());
                // SQL state 28000: invalid authorization.
                SQLException error = new SQLException(MssqlKerberosErrors.loginFailure(principal, e), "28000", e);
                if (MssqlKerberosErrors.isAccountRefused(e)) {
                    failures.recordRefusal(failureKey, error.getMessage(), error.getSQLState(), clockNanos.getAsLong());
                }
                throw error;
            }
        }
    }

    /** Returns true when the credential can still be used. A credential that cannot report its lifetime is renewed. */
    private static boolean hasTimeLeft(GSSCredential credential) {
        if (credential == null) {
            return false;
        }
        try {
            return credential.getRemainingLifetime() >= RENEW_BEFORE_SECONDS;
        } catch (GSSException e) {
            return false;
        }
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        // The pool never passes a username here, because none is set on it. Refuse one rather than ignore it.
        throw new SQLFeatureNotSupportedException("Kerberos connections use the datasource's own account.");
    }

    @Override
    public PrintWriter getLogWriter() {
        return null;
    }

    @Override
    public void setLogWriter(PrintWriter out) {
        // Not used.
    }

    @Override
    public void setLoginTimeout(int seconds) {
        this.loginTimeoutSeconds = seconds;
    }

    @Override
    public int getLoginTimeout() {
        return loginTimeoutSeconds;
    }

    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        throw new SQLFeatureNotSupportedException();
    }

    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        if (iface.isInstance(this)) {
            return iface.cast(this);
        }
        throw new SQLException("Not a wrapper for " + iface.getName());
    }

    @Override
    public boolean isWrapperFor(Class<?> iface) {
        return iface.isInstance(this);
    }
}
