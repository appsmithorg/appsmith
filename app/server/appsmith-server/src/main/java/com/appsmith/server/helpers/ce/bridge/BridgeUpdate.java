package com.appsmith.server.helpers.ce.bridge;

import lombok.NonNull;
import org.apache.commons.lang.NotImplementedException;
import org.bson.Document;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import java.util.Collections;
import java.util.List;

public class BridgeUpdate implements UpdateDefinition {
    private final Update update = new Update();

    public BridgeUpdate set(@NonNull String key, Object value) {
        update.set(key, value);
        return this;
    }

    public BridgeUpdate push(@NonNull String key, @NonNull Object value) {
        update.push(key, value);
        return this;
    }

    public BridgeUpdate pull(@NonNull String key, @NonNull Object value) {
        update.pull(key, value);
        return this;
    }

    /**
     * Set the value of the field `key`, to the current value of the field `valueKey`.
     */
    public BridgeUpdate setToValueFromField(String key, String valueKey) {
        throw new NotImplementedException("Not implemented here yet, but is ready on Postgres");
    }

    @Override
    public Boolean isIsolated() {
        return false;
    }

    @Override
    public Document getUpdateObject() {
        return update.getUpdateObject();
    }

    @Override
    public boolean modifies(@NonNull String key) {
        return false;
    }

    @Override
    public void inc(@NonNull String key) {
        update.inc(key);
    }

    @Override
    public List<ArrayFilter> getArrayFilters() {
        return Collections.emptyList();
    }
}
