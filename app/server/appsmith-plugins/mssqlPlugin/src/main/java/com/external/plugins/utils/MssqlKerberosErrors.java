package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.SQLException;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns Kerberos and SQL Server errors into messages that say what to fix.
 *
 * <p>Some domain controller answers tell apart "no such account" from "wrong password". Those are shown as one
 * message, so someone who can edit a datasource cannot use "Test" to find out which accounts exist.
 */
final class MssqlKerberosErrors {

    /** Kerberos error codes, from RFC 4120 section 7.5.9, that mean the account or its password is wrong. */
    private static final Set<Integer> WRONG_ACCOUNT_CODES = Set.of(
            6, // client not found
            14, // encryption type not supported: only returned for an account that exists
            18, // client's credentials revoked: account disabled or locked out
            24, // pre-authentication failed: wrong password
            31 // integrity check failed: wrong password, when the server asks for no pre-authentication
            );

    private static final int PASSWORD_EXPIRED_CODE = 23;
    private static final int CLOCK_SKEW_CODE = 37;
    private static final int WRONG_REALM_CODE = 68;

    /** Java ends a Kerberos error message with the code, such as "... was invalid (24)". */
    private static final Pattern CODE_AT_END = Pattern.compile("\\((\\d+)\\)\\s*$");

    private static final int SQL_LOGIN_FAILED = 18456;
    private static final int SQL_UNTRUSTED_DOMAIN = 18452;

    private MssqlKerberosErrors() {}

    /** Returns the message for a failed Kerberos login. It names the account but never the password. */
    static String loginFailure(String principal, Throwable error) {
        String hint = loginHint(error);
        if (hint == null) {
            // Not a known case: show the error as it is, so an admin can still act on it.
            hint = error.getMessage();
        }
        return String.format(MssqlErrorMessages.KERBEROS_LOGIN_FAILED_ERROR_MSG, principal, hint);
    }

    private static String loginHint(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SocketTimeoutException
                    || cause instanceof ConnectException
                    || cause instanceof UnknownHostException) {
                return MssqlErrorMessages.KERBEROS_KDC_UNREACHABLE_HINT;
            }
            String message = cause.getMessage();
            if (message == null) {
                continue;
            }
            if (message.contains("Cannot locate default realm")
                    || message.contains("Cannot get kdc for realm")
                    || message.contains("Cannot locate KDC")
                    || message.contains("krb5.conf")) {
                return MssqlErrorMessages.KERBEROS_NOT_SET_UP_HINT;
            }
            Integer code = kerberosCode(message);
            if (code != null) {
                if (WRONG_ACCOUNT_CODES.contains(code)) {
                    return MssqlErrorMessages.KERBEROS_WRONG_ACCOUNT_HINT;
                }
                if (code == PASSWORD_EXPIRED_CODE) {
                    return MssqlErrorMessages.KERBEROS_PASSWORD_EXPIRED_HINT;
                }
                if (code == CLOCK_SKEW_CODE) {
                    return MssqlErrorMessages.KERBEROS_CLOCK_SKEW_HINT;
                }
                if (code == WRONG_REALM_CODE) {
                    return MssqlErrorMessages.KERBEROS_WRONG_REALM_HINT;
                }
            }
        }
        return null;
    }

    /**
     * Adds a hint to an error from SQL Server or the driver, after the Kerberos login worked. Returns the same
     * exception when there is no hint to add.
     */
    static SQLException connectFailure(SQLException error) {
        String hint = null;
        String message = error.getMessage() == null ? "" : error.getMessage();
        if (message.contains("Server not found in Kerberos database")) {
            hint = MssqlErrorMessages.KERBEROS_SPN_NOT_FOUND_HINT;
        } else if (error.getErrorCode() == SQL_UNTRUSTED_DOMAIN) {
            hint = MssqlErrorMessages.KERBEROS_TICKET_REFUSED_HINT;
        } else if (error.getErrorCode() == SQL_LOGIN_FAILED) {
            hint = MssqlErrorMessages.KERBEROS_NO_SQL_LOGIN_HINT;
        }
        if (hint == null) {
            return error;
        }
        return new SQLException(hint + " " + message, error.getSQLState(), error.getErrorCode(), error);
    }

    private static Integer kerberosCode(String message) {
        Matcher matcher = CODE_AT_END.matcher(message);
        return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
    }
}
