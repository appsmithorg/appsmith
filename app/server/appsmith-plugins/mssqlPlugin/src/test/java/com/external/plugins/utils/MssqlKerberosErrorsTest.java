package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import javax.security.auth.login.LoginException;
import java.net.SocketTimeoutException;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class MssqlKerberosErrorsTest {

    private static final String ACCOUNT = "svc@CORP.EXAMPLE.COM";

    private static String loginMessage(Throwable error) {
        return MssqlKerberosErrors.loginFailure(ACCOUNT, error);
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "Client not found in Kerberos database (6)",
                "Pre-authentication information was invalid (24)",
                "Clients credentials have been revoked (18)",
                "Integrity check on decrypted field failed (31)",
                "KDC has no support for encryption type (14)"
            })
    public void wrongAccountOrPassword_allGiveTheSameMessage(String kdcText) {
        // The same text for each, so "Test" cannot be used to find out which accounts exist.
        assertEquals(
                "Kerberos login failed for " + ACCOUNT + ". " + MssqlErrorMessages.KERBEROS_WRONG_ACCOUNT_HINT,
                loginMessage(new LoginException(kdcText)));
    }

    @Test
    public void expiredPassword_saysSo() {
        assertTrue(loginMessage(new LoginException("Password has expired - change password to reset (23)"))
                .endsWith(MssqlErrorMessages.KERBEROS_PASSWORD_EXPIRED_HINT));
    }

    @Test
    public void clockSkew_saysSo() {
        assertTrue(loginMessage(new LoginException("Clock skew too great (37)"))
                .endsWith(MssqlErrorMessages.KERBEROS_CLOCK_SKEW_HINT));
    }

    @Test
    public void wrongRealm_saysSo() {
        assertTrue(loginMessage(new LoginException("Message stream modified (68)"))
                .endsWith(MssqlErrorMessages.KERBEROS_WRONG_REALM_HINT));
    }

    @Test
    public void noKrb5Conf_pointsToTheSetup() {
        LoginException error = new LoginException("Cannot locate default realm");

        assertTrue(loginMessage(error).endsWith(MssqlErrorMessages.KERBEROS_NOT_SET_UP_HINT));
    }

    @Test
    public void unreachableDomainController_isFoundInTheCause() {
        LoginException error = new LoginException("Receive timed out");
        error.initCause(new SocketTimeoutException("Receive timed out"));

        assertTrue(loginMessage(error).endsWith(MssqlErrorMessages.KERBEROS_KDC_UNREACHABLE_HINT));
    }

    @Test
    public void unknownError_isShownAsItIs() {
        assertEquals(
                "Kerberos login failed for " + ACCOUNT + ". Something new (99)",
                loginMessage(new LoginException("Something new (99)")));
    }

    @Test
    public void spnNotRegistered_getsAHint() {
        SQLException error = new SQLException(
                "Integrated authentication failed. GSSException: Server not found in Kerberos database (7)",
                "S0001",
                0);

        SQLException withHint = MssqlKerberosErrors.connectFailure(error);

        assertTrue(withHint.getMessage().startsWith(MssqlErrorMessages.KERBEROS_SPN_NOT_FOUND_HINT));
        assertTrue(withHint.getMessage().contains("Server not found in Kerberos database"));
        assertSame(error, withHint.getCause());
    }

    @Test
    public void sqlServerErrors_getHints() {
        SQLException untrusted =
                new SQLException("Login failed. The login is from an untrusted domain.", "S0001", 18452);
        SQLException noLogin = new SQLException("Login failed for user 'CORP\\svc'.", "S0001", 18456);

        assertTrue(MssqlKerberosErrors.connectFailure(untrusted)
                .getMessage()
                .startsWith(MssqlErrorMessages.KERBEROS_TICKET_REFUSED_HINT));
        assertEquals(18452, MssqlKerberosErrors.connectFailure(untrusted).getErrorCode());
        assertTrue(MssqlKerberosErrors.connectFailure(noLogin)
                .getMessage()
                .startsWith(MssqlErrorMessages.KERBEROS_NO_SQL_LOGIN_HINT));
    }

    @Test
    public void otherSqlErrors_areReturnedUnchanged() {
        SQLException error = new SQLException("Cannot open database \"x\"", "S0001", 4060);

        assertSame(error, MssqlKerberosErrors.connectFailure(error));
    }
}
