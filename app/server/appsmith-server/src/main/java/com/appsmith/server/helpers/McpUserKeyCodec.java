package com.appsmith.server.helpers;

import org.bson.types.ObjectId;
import org.springframework.util.StringUtils;

import java.util.UUID;
import java.util.function.Predicate;

/**
 * String assembly for the presented MCP user key {@code mcp_{mcpKeyId}_{secret}}.
 *
 * <p>{@code mcpKeyId} is {@code McpKey.id} (Mongo {@code _id}, a 24-hex ObjectId). Expand also accepts a UUID id
 * and the previous {@code .} separator so existing rate-limit tests keep parsing a public id. Compress always
 * emits the underscore form.
 */
public final class McpUserKeyCodec {

    public static final String PREFIX = "mcp_";
    private static final int UUID_LENGTH = 36;
    private static final int OBJECT_ID_LENGTH = 24;

    private McpUserKeyCodec() {}

    public static String compress(String mcpKeyId, String secret) {
        return PREFIX + mcpKeyId + "_" + secret;
    }

    /**
     * @return the public mcpKeyId, or {@code null} when the string is not a well-formed user key
     */
    public static String expandKeyId(String userKey) {
        Expanded expanded = expand(userKey);
        return expanded == null ? null : expanded.mcpKeyId();
    }

    public static Expanded expand(String userKey) {
        if (!StringUtils.hasText(userKey) || !userKey.startsWith(PREFIX)) {
            return null;
        }

        String rest = userKey.substring(PREFIX.length());
        Expanded uuidForm = parseIdThenSecret(rest, UUID_LENGTH, McpUserKeyCodec::isUuid);
        if (uuidForm != null) {
            return uuidForm;
        }
        return parseIdThenSecret(rest, OBJECT_ID_LENGTH, ObjectId::isValid);
    }

    private static Expanded parseIdThenSecret(String rest, int idLength, Predicate<String> idValid) {
        if (rest.length() <= idLength) {
            return null;
        }
        String maybeId = rest.substring(0, idLength);
        if (!idValid.test(maybeId)) {
            return null;
        }
        char separator = rest.charAt(idLength);
        if (separator != '_' && separator != '.') {
            return null;
        }
        String secret = rest.substring(idLength + 1);
        if (!StringUtils.hasText(secret)) {
            return null;
        }
        return new Expanded(maybeId, secret);
    }

    private static boolean isUuid(String value) {
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public record Expanded(String mcpKeyId, String secret) {}
}
