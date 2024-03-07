package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;
import lombok.NonNull;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class BridgeQuery<T extends BaseDomain> extends Criteria {
    final List<Criteria> checks = new ArrayList<>();

    BridgeQuery() {}

    public BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull ObjectId value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    public BridgeQuery<T> in(@NonNull String key, @NonNull Collection<String> value) {
        checks.add(Criteria.where(key).in(value));
        return this;
    }

    public BridgeQuery<T> exists(@NonNull String key) {
        checks.add(Criteria.where(key).exists(true));
        return this;
    }

    public BridgeQuery<T> isTrue(@NonNull String key) {
        checks.add(Criteria.where(key).is(true));
        return this;
    }

    public BridgeQuery<T> or(BridgeQuery... items) {
        checks.add(new Criteria().orOperator(items));
        return this;
    }

    public BridgeQuery<T> and(BridgeQuery... items) {
        checks.add(new Criteria().andOperator(items));
        return this;
    }

    /**
     * Explicitly disable the `where()` API to prevent its usage. This is because querying with this API will work here,
     * but won't work in the Postgres version.
     */
    public static Bridge where() {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public Document getCriteriaObject() {
        if (checks.isEmpty()) {
            throw new UnsupportedOperationException(
                    "Empty bridge criteria leads to subtle bugs. Just don't call `.criteria()` in such cases.");
        }

        return new Criteria().andOperator(checks.toArray(new Criteria[0])).getCriteriaObject();
    }
}
