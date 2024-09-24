package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;
import lombok.NonNull;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.Collection;

public final class Bridge {
    private Bridge() {}

    public static BridgeUpdate update() {
        return new BridgeUpdate();
    }

    public static <T extends BaseDomain> BridgeQuery<T> query() {
        return new BridgeQuery<>();
    }

    @Deprecated
    public static <T extends BaseDomain> BridgeQuery<T> bridge() {
        return new BridgeQuery<>();
    }

    @SafeVarargs
    public static <T extends BaseDomain> BridgeQuery<T> or(BridgeQuery<T>... items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Criteria().orOperator(items));
        return q;
    }

    public static <T extends BaseDomain> BridgeQuery<T> or(Collection<BridgeQuery<T>> items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(
                new Criteria().orOperator(items.stream().map(c -> (Criteria) c).toList()));
        return q;
    }

    @SafeVarargs
    public static <T extends BaseDomain> BridgeQuery<T> and(BridgeQuery<T>... items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Criteria().andOperator(items));
        return q;
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        return Bridge.<T>query().equal(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull Integer value) {
        return Bridge.<T>query().equal(key, value);
    }

    private static <T extends BaseDomain> BridgeQuery<T> notEqual(@NonNull String key, @NonNull String value) {
        return Bridge.<T>query().notEqual(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull Enum<?> value) {
        return equal(key, value.name());
    }

    public static <T extends BaseDomain> BridgeQuery<T> notEqual(@NonNull String key, @NonNull Enum<?> value) {
        return notEqual(key, value.name());
    }

    public static <T extends BaseDomain> BridgeQuery<T> equalIgnoreCase(@NonNull String key, @NonNull String value) {
        return Bridge.<T>query().equalIgnoreCase(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull ObjectId value) {
        return Bridge.<T>query().equal(key, value);
    }

    /**
     * Prefer using `.isTrue()` or `.isFalse()` instead of this method **if possible**.
     */
    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, boolean value) {
        return Bridge.<T>query().equal(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> searchIgnoreCase(@NonNull String key, @NonNull String needle) {
        return Bridge.<T>query().searchIgnoreCase(key, needle);
    }

    public static <T extends BaseDomain> BridgeQuery<T> in(@NonNull String key, @NonNull Collection<String> value) {
        return Bridge.<T>query().in(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> notIn(
            @NonNull String needle, @NonNull Collection<String> haystack) {
        return Bridge.<T>query().notIn(needle, haystack);
    }

    public static <T extends BaseDomain> BridgeQuery<T> exists(@NonNull String key) {
        return Bridge.<T>query().exists(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isNull(@NonNull String key) {
        return Bridge.<T>query().isNull(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isNotNull(@NonNull String key) {
        return Bridge.<T>query().isNotNull(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isTrue(@NonNull String key) {
        return Bridge.<T>query().isTrue(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isFalse(@NonNull String key) {
        return Bridge.<T>query().isFalse(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> notExists(@NonNull String key) {
        return Bridge.<T>query().notExists(key);
    }
}
