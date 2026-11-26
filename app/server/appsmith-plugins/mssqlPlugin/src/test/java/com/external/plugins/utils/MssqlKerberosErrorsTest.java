package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import javax.security.auth.login.LoginException;
import java.net.SocketTimeoutException;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

class MssqlKerberosErrorsTest {

    private static final String ACCOUNT = "svc@CORP.EXAMPLE.COM";

    private static final String WRONG_ACCOUNT_MESSAGE =
            "Kerberos login failed for " + ACCOUNT + ". " + MssqlErrorMessages.KERBEROS_WRONG_ACCOUNT_HINT;

    @ParameterizedTest
    @ValueSource(
            strings = {
                "Client not found in Kerberos database (6)",
                "Client not found in Kerberos database (6) - CLIENT_NOT_FOUND",
                "KDC has no support for encryption type (14)",
                "Clients credentials have been revoked (18)",
                "Pre-authentication information was invalid (24)",
                "Pre-authentication information was invalid (24) - PREAUTH_FAILED",
                "Integrity check on decrypted field failed (31)"
            })
    void should_showOneMessage_when_theAccountOrPasswordIsWrong(String kdcText) {
        // Given: the same text for each, so "Test" cannot be used to find out which accounts exist.
        LoginException error = new LoginException(kdcText);

        // When
        String message = MssqlKerberosErrors.loginFailure(ACCOUNT, error);

        // Then
        assertThat(message).isEqualTo(WRONG_ACCOUNT_MESSAGE);
        assertThat(MssqlKerberosErrors.isAccountRefused(error)).isTrue();
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "Password has expired - change password to reset (23)|KERBEROS_PASSWORD_EXPIRED_HINT",
                "Clock skew too great (37)|KERBEROS_CLOCK_SKEW_HINT",
                "Clock skew too great (37) - detail|KERBEROS_CLOCK_SKEW_HINT",
                "Message stream modified (68)|KERBEROS_WRONG_REALM_HINT",
                "Cannot locate default realm|KERBEROS_NOT_SET_UP_HINT"
            })
    void should_showAHint_when_theLoginFailsForAKnownReason(String kdcText, String hintName) throws Exception {
        // Given
        String hint = (String) MssqlErrorMessages.class.getField(hintName).get(null);
        LoginException error = new LoginException(kdcText);

        // When
        String message = MssqlKerberosErrors.loginFailure(ACCOUNT, error);

        // Then
        assertThat(message).endsWith(hint);
        assertThat(MssqlKerberosErrors.isAccountRefused(error)).isFalse();
    }

    @Test
    void should_sayTheDomainControllerIsUnreachable_when_theCauseIsATimeout() {
        // Given
        LoginException error = new LoginException("Receive timed out");
        error.initCause(new SocketTimeoutException("Receive timed out"));

        // When
        String message = MssqlKerberosErrors.loginFailure(ACCOUNT, error);

        // Then
        assertThat(message).endsWith(MssqlErrorMessages.KERBEROS_KDC_UNREACHABLE_HINT);
        assertThat(MssqlKerberosErrors.isAccountRefused(error)).isFalse();
    }

    @Test
    void should_showTheErrorAsItIs_when_theReasonIsUnknown() {
        // Given
        LoginException error = new LoginException("Something new (99)");

        // When
        String message = MssqlKerberosErrors.loginFailure(ACCOUNT, error);

        // Then
        assertThat(message).isEqualTo("Kerberos login failed for " + ACCOUNT + ". Something new (99)");
    }

    @Test
    void should_addAnSpnHint_when_theServiceIsNotRegistered() {
        // Given
        SQLException error = new SQLException(
                "Integrated authentication failed. GSSException: Server not found in Kerberos database (7)",
                "S0001",
                0);

        // When
        SQLException withHint = MssqlKerberosErrors.connectFailure(error);

        // Then
        assertThat(withHint.getMessage())
                .startsWith(MssqlErrorMessages.KERBEROS_SPN_NOT_FOUND_HINT)
                .contains("Server not found in Kerberos database");
        assertThat(withHint.getCause()).isSameAs(error);
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "18452|Login failed. The login is from an untrusted domain.|KERBEROS_TICKET_REFUSED_HINT",
                "18456|Login failed for user 'CORP\\svc'.|KERBEROS_NO_SQL_LOGIN_HINT"
            })
    void should_addAHint_when_sqlServerRefusesTheConnection(int errorCode, String sqlText, String hintName)
            throws Exception {
        // Given
        String hint = (String) MssqlErrorMessages.class.getField(hintName).get(null);
        SQLException error = new SQLException(sqlText, "S0001", errorCode);

        // When
        SQLException withHint = MssqlKerberosErrors.connectFailure(error);

        // Then
        assertThat(withHint.getMessage()).startsWith(hint).endsWith(sqlText);
        assertThat(withHint.getErrorCode()).isEqualTo(errorCode);
    }

    @Test
    void should_returnTheSameError_when_thereIsNoHint() {
        // Given
        SQLException error = new SQLException("Cannot open database \"x\"", "S0001", 4060);

        // When
        SQLException result = MssqlKerberosErrors.connectFailure(error);

        // Then
        // SQLException is Iterable, so cast to pick the object assertion.
        assertThat((Object) result).isSameAs(error);
    }
}
