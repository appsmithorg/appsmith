package com.external.plugins.utils;

import org.ietf.jgss.GSSCredential;
import org.ietf.jgss.GSSException;
import org.ietf.jgss.GSSManager;
import org.ietf.jgss.Oid;

import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.NameCallback;
import javax.security.auth.callback.PasswordCallback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.kerberos.KerberosPrincipal;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;
import java.util.Map;
import java.util.concurrent.CompletionException;

/**
 * Logs in to Kerberos with a user name and password, and returns a credential the SQL Server driver can use.
 *
 * <p>The driver's own login needs a JVM-wide JAAS file, or its built-in configuration ({@code useDefaultJaasConfig}),
 * which reads the Kerberos ticket cache first. With a cached ticket, for example after someone ran {@code kinit} on the
 * Appsmith server, every Kerberos datasource would connect as that cached user, whatever password the datasource
 * holds. This login never reads or writes the ticket cache, so each datasource uses only its own user name and
 * password.
 *
 * <p>The login configuration is passed to {@link LoginContext} directly. Nothing is installed JVM-wide.
 */
public final class MssqlKerberosLogin {

    static final String LOGIN_ENTRY_NAME = "AppsmithSqlServerKerberos";

    private static final String KRB5_LOGIN_MODULE = "com.sun.security.auth.module.Krb5LoginModule";

    /** Kerberos v5 mechanism, RFC 1964. */
    private static final String KRB5_MECHANISM_OID = "1.2.840.113554.1.2.2";

    private static final Configuration LOGIN_CONFIGURATION = new Configuration() {
        @Override
        public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
            if (!LOGIN_ENTRY_NAME.equals(name)) {
                return null;
            }
            return new AppConfigurationEntry[] {
                new AppConfigurationEntry(
                        KRB5_LOGIN_MODULE,
                        AppConfigurationEntry.LoginModuleControlFlag.REQUIRED,
                        Map.of(
                                // Never use or fill the ticket cache: see the class comment.
                                "useTicketCache", "false",
                                "useKeyTab", "false",
                                "storeKey", "false",
                                // Ask the callback handler below for the user name and password.
                                "doNotPrompt", "false",
                                "isInitiator", "true",
                                // Read krb5.conf again on each login, so an admin can fix it without a restart.
                                "refreshKrb5Config", "true"))
            };
        }
    };

    static final String PRINCIPAL_PROPERTY = "sun.security.krb5.principal";

    static final String PRINCIPAL_PROPERTY_ERROR = "The Appsmith server's Java setting " + PRINCIPAL_PROPERTY
            + " names a different Kerberos account. Remove it from APPSMITH_JAVA_ARGS.";

    private MssqlKerberosLogin() {}

    /**
     * Returns true when two principal names are the same account. A name without a realm gets the default realm
     * from krb5.conf. If that realm cannot be found, the names are compared as they are.
     */
    static boolean sameAccount(String first, String second) {
        return normalized(first).equals(normalized(second));
    }

    /** Returns the principal name with the default realm filled in, or the trimmed name if that fails. */
    static String normalized(String name) {
        try {
            return new KerberosPrincipal(name.trim()).getName();
        } catch (IllegalArgumentException e) {
            return name.trim();
        }
    }

    /**
     * Logs in as {@code principal} and returns a credential that can start a Kerberos session with a server.
     *
     * @param principal a Kerberos principal, such as {@code svc_appsmith@CORP.EXAMPLE.COM}. Without a realm, the
     *                  default realm from krb5.conf is used.
     * @param password  the account's password. The array is not cleared here; the caller owns it.
     * @throws LoginException when the domain controller refuses the login, or Kerberos is not set up on the server
     * @throws GSSException   when a credential cannot be made from the login
     */
    public static GSSCredential login(String principal, char[] password) throws LoginException, GSSException {
        // Krb5LoginModule uses this JVM-wide setting instead of the name we give it, and no login option turns that
        // off. Refuse to send this datasource's password for another account.
        String overridingPrincipal = System.getProperty(PRINCIPAL_PROPERTY);
        if (overridingPrincipal != null && !sameAccount(overridingPrincipal, principal)) {
            throw new LoginException(PRINCIPAL_PROPERTY_ERROR);
        }

        LoginContext loginContext = new LoginContext(
                LOGIN_ENTRY_NAME, new Subject(), new PasswordHandler(principal, password), LOGIN_CONFIGURATION);
        loginContext.login();
        Subject subject = loginContext.getSubject();

        // Check the account that actually logged in, in case anything else replaced the name.
        boolean loggedInAsPrincipal = subject.getPrincipals(KerberosPrincipal.class).stream()
                .anyMatch(loggedIn -> sameAccount(loggedIn.getName(), principal));
        if (!loggedInAsPrincipal) {
            loginContext.logout();
            throw new LoginException(PRINCIPAL_PROPERTY_ERROR);
        }

        try {
            // The credential is made from the ticket in this subject, never from a ticket cache.
            return Subject.callAs(subject, () -> GSSManager.getInstance()
                    .createCredential(
                            null,
                            GSSCredential.DEFAULT_LIFETIME,
                            new Oid(KRB5_MECHANISM_OID),
                            GSSCredential.INITIATE_ONLY));
        } catch (CompletionException e) {
            if (e.getCause() instanceof GSSException gssException) {
                throw gssException;
            }
            throw e;
        }
    }

    private record PasswordHandler(String principal, char[] password) implements CallbackHandler {
        @Override
        public void handle(Callback[] callbacks) throws UnsupportedCallbackException {
            for (Callback callback : callbacks) {
                if (callback instanceof NameCallback nameCallback) {
                    nameCallback.setName(principal);
                } else if (callback instanceof PasswordCallback passwordCallback) {
                    passwordCallback.setPassword(password);
                } else {
                    throw new UnsupportedCallbackException(callback);
                }
            }
        }
    }
}
