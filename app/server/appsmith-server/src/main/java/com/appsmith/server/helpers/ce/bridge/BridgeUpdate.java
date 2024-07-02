package com.appsmith.server.helpers.ce.bridge;

import lombok.Getter;
import lombok.NonNull;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
public class BridgeUpdate {
    private final Map<String, SetOp> setOps = new LinkedHashMap<>();

    private void addOp(SetOp op) {
        if (setOps.put(op.key, op) != null) {
            // Duplicate set operation for the same key!
            // TODO(Shri): Look into uncommenting this again. `ApplicationForkingServiceTests` and a few fail on EE.
            // throw new UnsupportedOperationException("Duplicate key in BridgeUpdate: " + op.key);
        }
    }

    public BridgeUpdate set(String key, Object value) {
        if (key.contains("$")) {
            throw new UnsupportedOperationException(
                    "Conditionally setting nested field values in JSON columns, is not implemented yet, and isn't a priority today");
        }
        if (key.chars().filter((i) -> i == '.').count() > 1) {
            throw new UnsupportedOperationException(
                    "Setting values at more than one level of nesting will not work, if first-level nested JSON field is missing in the JSONb data."
                            + " See https://github.com/appsmithorg/appsmith/commit/c7c93b2dfdd25f44fc721e018df05efcd9cc719a");
        }
        addOp(new SetOp(key, value));
        return this;
    }

    public BridgeUpdate pull(@NonNull String key, @NonNull Object value) {
        throw new UnsupportedOperationException();
    }

    /**
     * Set the value of the field `key`, to the current value of the field `valueKey`.
     */
    public BridgeUpdate setToValueFromField(String key, String valueKey) {
        addOp(new SetOp(key, valueKey, false));
        return this;
    }

    public record SetOp(String key, Object value, boolean isRawValue) {
        public SetOp(String key, Object value) {
            this(key, value, true);
        }
    }
}
