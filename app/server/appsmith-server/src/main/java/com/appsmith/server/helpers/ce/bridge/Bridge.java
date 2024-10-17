package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;
import lombok.NonNull;

import java.util.Collection;
import java.util.List;

public class Bridge {
    private Bridge() {}

    public static BridgeUpdate update() {
        return new BridgeUpdate();
    }

    public static <T extends BaseDomain> BridgeQuery<T> query() {
        return new BridgeQuery<>();
    }

    @SafeVarargs
    public static <T extends BaseDomain> BridgeQuery<T> or(BridgeQuery<T>... items) {
        return or(List.of(items));
    }

    public static <T extends BaseDomain> BridgeQuery<T> or(Collection<BridgeQuery<T>> items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Check.Or<>(items));
        return q;
    }

    @SafeVarargs
    public static <T extends BaseDomain> BridgeQuery<T> and(BridgeQuery<T>... items) {
        return and(List.of(items));
    }

    public static <T extends BaseDomain> BridgeQuery<T> and(Collection<BridgeQuery<T>> items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Check.And<>(items));
        return q;
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        return Bridge.<T>query().equal(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull int value) {
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

    public static <T extends BaseDomain> BridgeQuery<T> searchIgnoreCase(@NonNull String key, @NonNull String needle) {
        return Bridge.<T>query().searchIgnoreCase(key, needle);
    }

    public static <T extends BaseDomain> BridgeQuery<T> in(
            @NonNull String needle, @NonNull Collection<String> haystack) {
        return Bridge.<T>query().in(needle, haystack);
    }

    public static <T extends BaseDomain> BridgeQuery<T> notIn(
            @NonNull String needle, @NonNull Collection<String> haystack) {
        return Bridge.<T>query().notIn(needle, haystack);
    }

    public static <T extends BaseDomain> BridgeQuery<T> enumNotIn(
            @NonNull String needle, @NonNull Collection<Enum<?>> haystack) {
        return Bridge.<T>query().enumNotIn(needle, haystack);
    }

    public static <T extends BaseDomain> BridgeQuery<T> exists(@NonNull String key) {
        return Bridge.<T>query().exists(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> notExists(@NonNull String key) {
        return Bridge.<T>query().notExists(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isNull(@NonNull String key) {
        return Bridge.<T>query().isNull(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isTrue(@NonNull String key) {
        return Bridge.<T>query().isTrue(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isFalse(@NonNull String key) {
        return Bridge.<T>query().isFalse(key);
    }

    /**
     * Check that the string `needle` is present in the JSON array at `key`.
     */
    public static <T extends BaseDomain> BridgeQuery<T> jsonIn(@NonNull String needle, @NonNull String key) {
        return Bridge.<T>query().jsonIn(needle, key);
    }
}
