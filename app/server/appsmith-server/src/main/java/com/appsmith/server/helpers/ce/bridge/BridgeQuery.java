package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;
import lombok.NonNull;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.regex.Pattern;

@SuppressWarnings("UnusedReturnValue")
public final class BridgeQuery<T extends BaseDomain> extends Criteria {
    final List<Criteria> checks = new ArrayList<>();

    BridgeQuery() {}

    public BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, int value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    public BridgeQuery<T> notEqual(@NonNull String key, @NonNull String value) {
        checks.add(Criteria.where(key).ne(value));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull Enum<?> value) {
        return equal(key, value.name());
    }

    public BridgeQuery<T> notEqual(@NonNull String key, @NonNull Enum<?> value) {
        return notEqual(key, value.name());
    }

    public BridgeQuery<T> equalIgnoreCase(@NonNull String key, @NonNull String value) {
        checks.add(Criteria.where(key).regex("^" + Pattern.quote(value) + "$", "i"));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull ObjectId value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    /**
     * Prefer using `.isTrue()` or `.isFalse()` instead of this method **if possible**.
     */
    public BridgeQuery<T> equal(@NonNull String key, boolean value) {
        checks.add(Criteria.where(key).is(value));
        return this;
    }

    public BridgeQuery<T> searchIgnoreCase(@NonNull String key, @NonNull String needle) {
        if (key.contains(".")) {
            throw new UnsupportedOperationException("Search-ignore-case is not supported for nested fields");
        }

        checks.add(Criteria.where(key).regex(".*" + Pattern.quote(needle) + ".*", "i"));
        return this;
    }

    public BridgeQuery<T> in(@NonNull String key, @NonNull Collection<String> value) {
        checks.add(Criteria.where(key).in(value));
        return this;
    }

    public BridgeQuery<T> notIn(@NonNull String needle, @NonNull Collection<String> haystack) {
        checks.add(Criteria.where(needle).not().in(haystack));
        return this;
    }

    // Filtering for enums does not work with hibernate even if the field is annotated with @Enumerated(String.class)
    public BridgeQuery<T> enumIn(@NonNull String key, @NonNull Collection<Enum<?>> value) {
        checks.add(Criteria.where(key).in(value));
        return this;
    }

    public BridgeQuery<T> exists(@NonNull String key) {
        checks.add(Criteria.where(key).exists(true));
        return this;
    }

    public BridgeQuery<T> notExists(@NonNull String key) {
        checks.add(Criteria.where(key).exists(false));
        return this;
    }

    public BridgeQuery<T> isNull(@NonNull String key) {
        checks.add(Criteria.where(key).isNull());
        return this;
    }

    public BridgeQuery<T> isNotNull(@NonNull String key) {
        checks.add(Criteria.where(key).ne(null));
        return this;
    }

    public BridgeQuery<T> isTrue(@NonNull String key) {
        checks.add(Criteria.where(key).is(true));
        return this;
    }

    public BridgeQuery<T> isFalse(@NonNull String key) {
        checks.add(Criteria.where(key).is(false));
        return this;
    }

    public BridgeQuery<T> and(BridgeQuery<T> item) {
        checks.add(new Criteria().andOperator(item));
        return this;
    }

    /**
     * Explicitly disable the `where()` API to prevent its usage. This is because querying with this API will work here,
     * but won't work in the Postgres version.
     */
    public static Bridge where() {
        throw new UnsupportedOperationException("Not implemented");
    }

    /**
     * Explicitly disable the `and()` API to prevent its usage. This is because querying with this API will work here,
     * but won't work in the Postgres version.
     */
    public static Bridge and() {
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

    public boolean isEmpty() {
        return checks.isEmpty();
    }
}
