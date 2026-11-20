package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Checks that a diagnostics section returns only declared keys and plain counts or categories.
 */
@Component
@RequiredArgsConstructor
public class DiagnosticsRedactionGuard {

    public static final int MAX_SECTION_BYTES = 100 * 1024;
    static final int MAX_STRING_LENGTH = 256;
    private static final Pattern CATEGORY_KEY = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

    static final String KEY_NOT_ALLOWED = "key_not_allowed";
    static final String VALUE_NOT_ALLOWED = "value_not_allowed";
    static final String SECTION_TOO_LARGE = "section_too_large";

    private final ObjectMapper objectMapper;

    /**
     * @return an error code when the data breaks a rule, or empty when the data is allowed.
     */
    public Optional<String> violation(Set<String> allowedKeys, Map<String, Object> data) {
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!allowedKeys.contains(entry.getKey())) {
                return Optional.of(KEY_NOT_ALLOWED);
            }
        }

        for (Object value : data.values()) {
            if (!isAllowedTopLevelValue(value)) {
                return Optional.of(VALUE_NOT_ALLOWED);
            }
        }

        try {
            if (objectMapper.writeValueAsBytes(data).length > MAX_SECTION_BYTES) {
                return Optional.of(SECTION_TOO_LARGE);
            }
        } catch (JsonProcessingException | RuntimeException e) {
            return Optional.of(VALUE_NOT_ALLOWED);
        }

        return Optional.empty();
    }

    private boolean isAllowedTopLevelValue(Object value) {
        if (value instanceof DiagnosticsField field) {
            return isAllowedLeaf(field.value())
                    && isAllowedString(field.source())
                    && isAllowedString(field.confidence())
                    && isAllowedString(field.availability());
        }
        if (value instanceof Map<?, ?> map) {
            return map.entrySet().stream()
                    .allMatch(e -> e.getKey() instanceof String key
                            && CATEGORY_KEY.matcher(key).matches()
                            && isAllowedNumber(e.getValue()));
        }
        return isAllowedLeaf(value);
    }

    private boolean isAllowedLeaf(Object value) {
        if (value == null || value instanceof Boolean || isAllowedNumber(value)) {
            return true;
        }
        return isAllowedString(value);
    }

    private boolean isAllowedString(Object value) {
        return value == null || (value instanceof String string && string.length() <= MAX_STRING_LENGTH);
    }

    private boolean isAllowedNumber(Object value) {
        return value instanceof Integer
                || value instanceof Long
                || value instanceof Short
                || value instanceof Byte
                || value instanceof Double
                || value instanceof Float
                || value instanceof BigInteger
                || value instanceof BigDecimal;
    }
}
