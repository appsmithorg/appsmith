package com.appsmith.server.helpers.ce.bridge;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class BridgeUpdate {
    private final List<SetOp> setOps = new ArrayList<>();

    public BridgeUpdate set(String key, Object value) {
        setOps.add(new SetOp(key, value));
        return this;
    }

    /**
     * Set the value of the field `key`, to the current value of the field `valueKey`.
     */
    public BridgeUpdate setToValueFromField(String key, String valueKey) {
        setOps.add(new SetOp(key, valueKey, false));
        return this;
    }

    public record SetOp(String key, Object value, boolean isRawValue) {
        public SetOp(String key, Object value) {
            this(key, value, true);
        }
    }
}
