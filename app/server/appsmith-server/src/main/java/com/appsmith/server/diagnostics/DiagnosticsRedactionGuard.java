package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema;
import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema.ValueKind;
import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Checks that a diagnostics section returns only the keys its schema declares, each with a value of the declared kind.
 */
@Component
@RequiredArgsConstructor
public class DiagnosticsRedactionGuard {

    public static final int MAX_SECTION_BYTES = 100 * 1024;
    static final int MAX_STRING_LENGTH = 256;
    private static final Pattern DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern UUID =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    // The instance ID that DatabaseChangelog1 writes is a 24-character hex ObjectId.
    private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-fA-F]{24}$");
    private static final Set<String> FIELD_SOURCES = Set.of(
            DiagnosticsField.SOURCE_APPLICATION_CONFIG,
            DiagnosticsField.SOURCE_RUNTIME,
            DiagnosticsField.SOURCE_ORCHESTRATOR,
            DiagnosticsField.SOURCE_CUSTOMER_SUPPLIED);
    private static final Set<String> FIELD_CONFIDENCES = Set.of(
            DiagnosticsField.CONFIDENCE_DETECTED,
            DiagnosticsField.CONFIDENCE_CONFIGURED,
            DiagnosticsField.CONFIDENCE_INFERRED,
            DiagnosticsField.CONFIDENCE_UNKNOWN);
    private static final Set<String> FIELD_AVAILABILITIES =
            Set.of(DiagnosticsField.AVAILABILITY_AVAILABLE, DiagnosticsField.AVAILABILITY_UNKNOWN);

    static final String KEY_NOT_ALLOWED = "key_not_allowed";
    static final String VALUE_NOT_ALLOWED = "value_not_allowed";
    static final String SECTION_TOO_LARGE = "section_too_large";

    private final ObjectMapper objectMapper;

    /**
     * @return an error code when the data breaks a rule, or empty when the data is allowed.
     */
    public Optional<String> violation(DiagnosticsSchema schema, Map<String, Object> data) {
        if (data == null) {
            return Optional.of(VALUE_NOT_ALLOWED);
        }

        for (Map.Entry<String, Object> entry : data.entrySet()) {
            ValueKind kind = entry.getKey() == null ? null : schema.keys().get(entry.getKey());
            if (kind == null) {
                return Optional.of(KEY_NOT_ALLOWED);
            }
            if (kind == ValueKind.MAP && entry.getValue() instanceof Map<?, ?> nested) {
                Set<String> allowedNestedKeys = schema.nestedKeys().getOrDefault(entry.getKey(), Set.of());
                for (Object nestedKey : nested.keySet()) {
                    if (!(nestedKey instanceof String key) || !allowedNestedKeys.contains(key)) {
                        return Optional.of(KEY_NOT_ALLOWED);
                    }
                }
            }
        }

        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!fitsKind(schema, entry.getKey(), schema.keys().get(entry.getKey()), entry.getValue())) {
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

    private boolean fitsKind(DiagnosticsSchema schema, String key, ValueKind kind, Object value) {
        if (value == null) {
            return false;
        }
        if (isSentinel(value)) {
            return true;
        }
        Set<String> categories = schema.categoryValues().getOrDefault(key, Set.of());
        return switch (kind) {
            case COUNT -> isFiniteNumber(value);
            case BOOLEAN -> value instanceof Boolean;
            case CATEGORY -> value instanceof String string && categories.contains(string);
            case VERSION ->
                value instanceof String string
                        && DiagnosticsValues.VERSION_PATTERN.matcher(string).matches();
            case COMMIT_SHA ->
                value instanceof String string
                        && DiagnosticsValues.COMMIT_SHA_PATTERN.matcher(string).matches();
            case DATE -> value instanceof String string && isDate(string);
            case INSTANCE_ID ->
                value instanceof String string
                        && (UUID.matcher(string).matches()
                                || OBJECT_ID.matcher(string).matches());
            case FIELD -> value instanceof DiagnosticsField field && isAllowedField(field, categories);
            case MAP -> value instanceof Map<?, ?> map && isAllowedNestedMap(map, categories);
            case FREE_TEXT -> value instanceof String string && string.length() <= MAX_STRING_LENGTH;
        };
    }

    private boolean isAllowedField(DiagnosticsField field, Set<String> allowedValues) {
        Object value = field.value();
        boolean valueAllowed = value != null
                && (isFiniteNumber(value)
                        || value instanceof Boolean
                        || (value instanceof String string && (isSentinel(string) || allowedValues.contains(string))));
        return valueAllowed
                && field.source() != null
                && FIELD_SOURCES.contains(field.source())
                && field.confidence() != null
                && FIELD_CONFIDENCES.contains(field.confidence())
                && field.availability() != null
                && FIELD_AVAILABILITIES.contains(field.availability());
    }

    private boolean isAllowedNestedMap(Map<?, ?> map, Set<String> allowedStrings) {
        return map.values().stream()
                .allMatch(value -> value != null
                        && (isFiniteNumber(value)
                                || value instanceof Boolean
                                || (value instanceof String string
                                        && (isSentinel(string) || allowedStrings.contains(string)))));
    }

    private static boolean isSentinel(Object value) {
        return value instanceof String string && DiagnosticsValues.SENTINELS.contains(string);
    }

    private static boolean isDate(String value) {
        if (!DATE.matcher(value).matches()) {
            return false;
        }
        try {
            LocalDate.parse(value);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private static boolean isFiniteNumber(Object value) {
        if (value instanceof Double d) {
            return Double.isFinite(d);
        }
        if (value instanceof Float f) {
            return Float.isFinite(f);
        }
        return value instanceof Integer
                || value instanceof Long
                || value instanceof Short
                || value instanceof Byte
                || value instanceof BigInteger
                || value instanceof BigDecimal;
    }
}
