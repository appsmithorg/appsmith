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
import java.util.concurrent.TimeUnit;
import java.util.function.LongSupplier;
import java.util.logging.Logger;

/**
 * A {@link DataSource} for the connection pool that connects to SQL Server with Kerberos.
 *
 * <p>Each new connection gets a Kerberos credential from {@link MssqlKerberosLogin}. The credential is kept and used
 * again until it has less than {@link #RENEW_BEFORE_SECONDS} left, then the account logs in again. So a pool of ten
 * connections logs in to the domain controller once, not ten times.
 *
 * <p>After a failed login, the same error is returned without contacting the domain controller, first for
 * {@link #RETRY_AFTER_FAILURE_SECONDS}, then for twice as long after each further failure, up to
 * {@link #MAX_RETRY_AFTER_FAILURE_SECONDS}. The pool keeps trying to open connections, and each try with a wrong
 * password would count towards the account's lockout. Editing or testing the datasource makes a new pool, so a
 * corrected password is used at once.
 *
 * <p>The password is held only here, in memory, for the life of the pool.
 */
@Slf4j
public class MssqlKerberosDataSource implements DataSource {

    /** Log in again when the credential has less than this many seconds left. */
    static final int RENEW_BEFORE_SECONDS = 5 * 60;

    /** After the first failed login, wait this long before contacting the domain controller again. */
    static final int RETRY_AFTER_FAILURE_SECONDS = 60;

    /** The longest wait between logins after repeated failures. */
    static final int MAX_RETRY_AFTER_FAILURE_SECONDS = 15 * 60;

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
    private final String serverSpn;
    private final int socketTimeoutMs;
    private final CredentialSource credentialSource;
    private final LongSupplier clockNanos;

    private GSSCredential credential;
    private SQLException lastFailure;
    private long lastFailureAtNanos;
    private int failuresInARow;
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
        this(url, principal, password, serverSpn, socketTimeoutMs, MssqlKerberosLogin::login, System::nanoTime);
    }

    MssqlKerberosDataSource(
            String url,
            String principal,
            String password,
            String serverSpn,
            int socketTimeoutMs,
            CredentialSource credentialSource) {
        this(url, principal, password, serverSpn, socketTimeoutMs, credentialSource, System::nanoTime);
    }

    MssqlKerberosDataSource(
            String url,
            String principal,
            String password,
            String serverSpn,
            int socketTimeoutMs,
            CredentialSource credentialSource,
            LongSupplier clockNanos) {
        // validateDatasource() already requires both. Fail clearly if a caller skipped it.
        this.principal = Objects.requireNonNull(principal, "A Kerberos datasource needs a username.");
        this.password = Objects.requireNonNull(password, "A Kerberos datasource needs a password.")
                .toCharArray();
        this.url = url;
        this.serverSpn = serverSpn;
        this.socketTimeoutMs = socketTimeoutMs;
        this.credentialSource = credentialSource;
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
     * connections opened at the same time share one login. After a failed login, returns the same error until
     * {@link #retryWaitSeconds()} have passed.
     */
    synchronized GSSCredential currentCredential() throws SQLException {
        if (lastFailure != null) {
            long waitedSeconds = TimeUnit.NANOSECONDS.toSeconds(clockNanos.getAsLong() - lastFailureAtNanos);
            if (waitedSeconds < retryWaitSeconds()) {
                throw new SQLException(
                        String.format(
                                MssqlErrorMessages.KERBEROS_RETRY_WAIT_ERROR_MSG,
                                lastFailure.getMessage(),
                                retryWaitSeconds()),
                        lastFailure.getSQLState(),
                        lastFailure);
            }
            lastFailure = null;
        }
        try {
            if (credential == null || credential.getRemainingLifetime() < RENEW_BEFORE_SECONDS) {
                credential = credentialSource.login(principal, password);
                failuresInARow = 0;
                log.debug(
                        "Kerberos login for {} worked. The credential is valid for {} seconds.",
                        principal,
                        credential.getRemainingLifetime());
            }
            return credential;
        } catch (LoginException | GSSException e) {
            credential = null;
            // The full error is only in the server log, at debug level. It never contains the password.
            log.debug("Kerberos login for {} failed: {}", principal, e.toString());
            // SQL state 28000: invalid authorization.
            lastFailure = new SQLException(MssqlKerberosErrors.loginFailure(principal, e), "28000", e);
            lastFailureAtNanos = clockNanos.getAsLong();
            failuresInARow++;
            throw lastFailure;
        }
    }

    /** 60 seconds after the first failure, doubling after each further failure, up to 15 minutes. */
    long retryWaitSeconds() {
        int doublings = Math.min(Math.max(failuresInARow - 1, 0), 10);
        return Math.min((long) RETRY_AFTER_FAILURE_SECONDS << doublings, MAX_RETRY_AFTER_FAILURE_SECONDS);
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        // The pool never passes a user name here, because none is set on it. Refuse one rather than ignore it.
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
