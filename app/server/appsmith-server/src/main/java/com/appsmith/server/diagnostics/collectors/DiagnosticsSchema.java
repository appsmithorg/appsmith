package com.appsmith.server.diagnostics.collectors;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Declares the keys a collector returns and the kind of value each key holds. The redaction guard rejects any key or
 * value outside this declaration.
 *
 * @param keys the kind of each top-level key
 * @param nestedKeys for each {@link ValueKind#MAP} key, the keys allowed in the map. An empty set means the map must
 *     be empty.
 * @param categoryValues for each {@link ValueKind#CATEGORY} key, the strings allowed as its value. For a
 *     {@link ValueKind#FIELD} key, the strings allowed as the field value. For a {@link ValueKind#MAP} key, the
 *     strings allowed as a nested value. The {@code DiagnosticsValues} sentinels are always allowed.
 */
public record DiagnosticsSchema(
        Map<String, ValueKind> keys, Map<String, Set<String>> nestedKeys, Map<String, Set<String>> categoryValues) {

    public enum ValueKind {
        /** A finite number. */
        COUNT,
        BOOLEAN,
        /** A string from {@code categoryValues}. */
        CATEGORY,
        /** A string that matches {@code DiagnosticsValues.VERSION_PATTERN}. */
        VERSION,
        /** A {@code yyyy-MM-dd} date. */
        DATE,
        /** A canonical UUID or a 24-character hex ObjectId. Use it only for the instance ID key. */
        INSTANCE_ID,
        /** A lowercase hex git commit SHA of 7 to 40 characters. */
        COMMIT_SHA,
        /** A {@code DiagnosticsField} with a fixed-list or numeric value and constant metadata. */
        FIELD,
        /**
         * A map from {@code nestedKeys} to numbers, booleans or strings from {@code categoryValues}. Nested values are
         * never maps themselves.
         */
        MAP,
        /** A string of up to 256 characters. Use only for {@code configuredPublicUrl}. A new use needs a security review. */
        FREE_TEXT
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private final Map<String, ValueKind> keys = new LinkedHashMap<>();
        private final Map<String, Set<String>> nestedKeys = new HashMap<>();
        private final Map<String, Set<String>> categoryValues = new HashMap<>();

        private Builder() {}

        /**
         * Declares a key of a kind that needs no value list: COUNT, BOOLEAN, VERSION, DATE, INSTANCE_ID, COMMIT_SHA or
         * FREE_TEXT.
         *
         * @throws IllegalArgumentException for CATEGORY, FIELD or MAP, which must use {@link #category},
         *     {@link #field} or {@link #map}
         */
        public Builder key(String key, ValueKind kind) {
            if (kind == ValueKind.CATEGORY || kind == ValueKind.FIELD || kind == ValueKind.MAP) {
                throw new IllegalArgumentException(
                        "Declare a " + kind + " key with category(), field() or map(), not key()");
            }
            keys.put(key, kind);
            return this;
        }

        public Builder category(String key, String... allowedValues) {
            keys.put(key, ValueKind.CATEGORY);
            categoryValues.put(key, Set.of(allowedValues));
            return this;
        }

        /** Declares a field whose value is a number, or one of {@code allowedValues}. */
        public Builder field(String key, String... allowedValues) {
            keys.put(key, ValueKind.FIELD);
            categoryValues.put(key, Set.of(allowedValues));
            return this;
        }

        public Builder map(String key, Set<String> allowedNestedKeys, String... allowedNestedValues) {
            keys.put(key, ValueKind.MAP);
            nestedKeys.put(key, Set.copyOf(allowedNestedKeys));
            categoryValues.put(key, Set.of(allowedNestedValues));
            return this;
        }

        public DiagnosticsSchema build() {
            return new DiagnosticsSchema(Map.copyOf(keys), Map.copyOf(nestedKeys), Map.copyOf(categoryValues));
        }
    }
}
