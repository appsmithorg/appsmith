package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class MssqlErrorMessages extends BasePluginErrorMessages {
    public static final String MISSING_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG =
            "Your query failed to execute. Please check more information in the error details.";

    public static final String QUERY_TIMEOUT_ERROR_MSG = "The query ran longer than its timeout of %d ms, so Appsmith"
            + " stopped it. Statements in the query that already ran may have been saved.";

    public static final String QUERY_PREPARATION_FAILED_ERROR_MSG = "Query preparation failed while inserting value: %s"
            + " for binding: {{%s}}. Please check the query again.";

    public static final String CONNECTION_POOL_CREATION_FAILED_ERROR_MSG =
            "Exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid. Please check your datasource configuration.";

    public static final String GET_STRUCTURE_ERROR_MSG =
            "The Appsmith server has failed to fetch the structure of your schema.";

    /*
    ************************************************************************************************************************************************
                                       Error messages related to validation of datasource.
    ************************************************************************************************************************************************
    */
    public static final String DS_MISSING_ENDPOINT_ERROR_MSG = "Missing endpoint.";

    public static final String DS_MISSING_CONNECTION_MODE_ERROR_MSG = "Missing connection mode.";

    public static final String DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG = "Missing authentication details.";

    public static final String DS_MISSING_USERNAME_ERROR_MSG = "Missing username for authentication.";

    public static final String DS_MISSING_PASSWORD_ERROR_MSG = "Missing password for authentication.";

    public static final String DS_INVALID_DATABASE_NAME_ERROR_MSG =
            "Invalid database name: the database name must not contain ';' or control characters.";

    public static final String DS_INVALID_HOST_ERROR_MSG =
            "Invalid host: the host must not contain ';', '=', '{', '}' or control characters.";

    public static final String DS_INVALID_AUTHENTICATION_TYPE_ERROR_MSG =
            "Invalid authentication type. Choose \"SQL Server login\" or \"Windows (Kerberos)\".";

    public static final String DS_KERBEROS_DOMAIN_BACKSLASH_USERNAME_ERROR_MSG =
            "For Windows (Kerberos), enter the username as user@REALM, such as svc_appsmith@CORP.EXAMPLE.COM. "
                    + "The DOMAIN\\user form is not supported.";

    public static final String DS_INVALID_KERBEROS_USERNAME_ERROR_MSG =
            "Invalid username. Remove spaces and control characters, and use at most one @.";

    public static final String DS_INVALID_SERVER_SPN_ERROR_MSG =
            "Invalid server SPN. Remove spaces and control characters.";

    /*
    ************************************************************************************************************************************************
                                       Error messages for Windows (Kerberos) authentication.
    ************************************************************************************************************************************************
    */

    /** %s is the account, then a hint. The message never contains the password. */
    public static final String KERBEROS_LOGIN_FAILED_ERROR_MSG = "Kerberos login failed for %s. %s";

    public static final String KERBEROS_RETRY_WAIT_ERROR_MSG =
            "%s Appsmith waits %d seconds before it tries this account again, so that the account is not locked out.";

    public static final String KERBEROS_WRONG_ACCOUNT_HINT =
            "Check the username and password, and that the account is enabled and not locked out.";

    public static final String KERBEROS_PASSWORD_EXPIRED_HINT =
            "The account's password has expired. Set a new password in Active Directory and in this datasource.";

    public static final String KERBEROS_CLOCK_SKEW_HINT =
            "The clocks on the Appsmith server and the domain controller differ by more than 5 minutes.";

    public static final String KERBEROS_WRONG_REALM_HINT =
            "The domain controller does not know this realm. Check the part of the username after @.";

    public static final String KERBEROS_NOT_SET_UP_HINT =
            "Kerberos is not set up on the Appsmith server, or this realm is not in its krb5.conf. "
                    + "See the SQL Server datasource docs.";

    public static final String KERBEROS_KDC_UNREACHABLE_HINT =
            "The Appsmith server could not reach the domain controller on port 88.";

    public static final String KERBEROS_SPN_NOT_FOUND_HINT =
            "SQL Server's service name (SPN) is not registered in Active Directory. Register MSSQLSvc/<host>:<port> "
                    + "for the SQL Server service account, or enter the registered name in Server SPN.";

    public static final String KERBEROS_TICKET_REFUSED_HINT =
            "SQL Server did not accept the Kerberos ticket. Check that the SPN belongs to the SQL Server service "
                    + "account and that SQL Server is joined to the domain.";

    public static final String KERBEROS_NO_SQL_LOGIN_HINT =
            "The Kerberos login worked, but SQL Server refused the account. Check that the account has a SQL Server "
                    + "login and access to the database.";
}
