package com.external.plugins.utils;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.MssqlErrorMessages;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Reads the SQL Server authentication method from a datasource.
 *
 * <p>The choice is kept in {@code datasourceConfiguration.properties}, under the key {@link #METHOD_KEY}. A datasource
 * saved before this choice existed has no such property, so it keeps using a SQL Server login. The {@code DBAuth}
 * model is not changed, so an older Appsmith server can still read a datasource saved by a newer one.
 */
public final class MssqlAuthenticationSettings {

    public static final String METHOD_KEY = "authenticationMethod";
    public static final String SERVER_SPN_KEY = "serverSpn";

    public static final String SQL_SERVER_LOGIN = "SQL_SERVER_LOGIN";
    public static final String KERBEROS = "KERBEROS";

    private static final Set<String> METHODS = Set.of(SQL_SERVER_LOGIN, KERBEROS);

    /** The index in {@code datasourceConfiguration.properties} that form.json uses for {@link #METHOD_KEY}. */
    static final int METHOD_FORM_SLOT = 0;

    /** The index in {@code datasourceConfiguration.properties} that form.json uses for {@link #SERVER_SPN_KEY}. */
    static final int SERVER_SPN_FORM_SLOT = 1;

    private MssqlAuthenticationSettings() {}

    /** Returns {@link #SQL_SERVER_LOGIN} when the datasource has no method, else the stored value as it is. */
    public static String method(DatasourceConfiguration datasourceConfiguration) {
        String value = propertyValue(datasourceConfiguration, METHOD_KEY);
        return StringUtils.hasText(value) ? value.trim() : SQL_SERVER_LOGIN;
    }

    public static boolean isKerberos(DatasourceConfiguration datasourceConfiguration) {
        return KERBEROS.equals(method(datasourceConfiguration));
    }

    public static boolean isKnownMethod(String method) {
        return METHODS.contains(method);
    }

    /** Returns the server SPN, trimmed, or null when it is blank. */
    public static String serverSpn(DatasourceConfiguration datasourceConfiguration) {
        String value = propertyValue(datasourceConfiguration, SERVER_SPN_KEY);
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /**
     * Returns an error message for a Kerberos username that cannot work, or null when it is fine. A null or empty
     * username is reported by the caller, with the same message as for a SQL Server login. A username of only spaces
     * gets that message here.
     */
    public static String kerberosUsernameError(String username) {
        if (username == null || username.isEmpty()) {
            return null;
        }
        if (username.isBlank()) {
            return MssqlErrorMessages.DS_MISSING_USERNAME_ERROR_MSG;
        }
        String trimmed = username.trim();
        if (trimmed.indexOf('\\') >= 0) {
            return MssqlErrorMessages.DS_KERBEROS_DOMAIN_BACKSLASH_USERNAME_ERROR_MSG;
        }
        boolean badCharacter = trimmed.chars().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c));
        long atSigns = trimmed.chars().filter(c -> c == '@').count();
        if (badCharacter || atSigns > 1 || trimmed.startsWith("@") || trimmed.endsWith("@")) {
            return MssqlErrorMessages.DS_INVALID_KERBEROS_USERNAME_ERROR_MSG;
        }
        return null;
    }

    /** Returns an error message for a server SPN that cannot work, or null when it is fine or blank. */
    public static String serverSpnError(String serverSpn) {
        if (!StringUtils.hasText(serverSpn)) {
            return null;
        }
        boolean badCharacter =
                serverSpn.trim().chars().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c));
        return badCharacter ? MssqlErrorMessages.DS_INVALID_SERVER_SPN_ERROR_MSG : null;
    }

    /**
     * Returns the Kerberos principal for a username. The realm, after the '@', is upper-cased, because Active
     * Directory realms are the upper-case DNS domain and Java matches realm names by exact case. A username without
     * a realm is returned as it is, so the default realm from krb5.conf applies.
     */
    public static String kerberosPrincipal(String username) {
        String trimmed = Objects.requireNonNull(username, "A Kerberos datasource needs a username.")
                .trim();
        int at = trimmed.indexOf('@');
        if (at < 0) {
            return trimmed;
        }
        return trimmed.substring(0, at + 1) + trimmed.substring(at + 1).toUpperCase(Locale.ROOT);
    }

    /**
     * Finds a property by its key. If no property has the key, falls back to the property in the form's slot for it
     * ({@link #formSlot}), as long as that property has no key. The form writes the key from a hidden field's initial
     * value, and the editor fills in initial values only for a new datasource. So when someone edits a datasource
     * saved before this setting existed, the value can arrive without its key.
     */
    private static String propertyValue(DatasourceConfiguration datasourceConfiguration, String key) {
        List<Property> properties = datasourceConfiguration.getProperties();
        if (properties == null) {
            return null;
        }
        Property match = properties.stream()
                .filter(Objects::nonNull)
                .filter(property -> key.equals(property.getKey()))
                .findFirst()
                .orElse(null);
        if (match == null) {
            int slot = formSlot(key);
            if (slot >= 0 && slot < properties.size()) {
                Property candidate = properties.get(slot);
                if (candidate != null && !StringUtils.hasText(candidate.getKey())) {
                    match = candidate;
                }
            }
        }
        if (match == null || match.getValue() == null) {
            return null;
        }
        return match.getValue().toString();
    }

    /** Returns the form's slot for a key, or -1 for a key the form does not have. MssqlFormSlotsTest checks these. */
    private static int formSlot(String key) {
        if (METHOD_KEY.equals(key)) {
            return METHOD_FORM_SLOT;
        }
        if (SERVER_SPN_KEY.equals(key)) {
            return SERVER_SPN_FORM_SLOT;
        }
        return -1;
    }
}
