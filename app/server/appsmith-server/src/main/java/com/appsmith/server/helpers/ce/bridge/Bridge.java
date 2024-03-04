package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;
import lombok.NonNull;
import org.bson.types.ObjectId;

import java.util.Collection;

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
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Check.Or<>(items));
        return q;
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        return Bridge.<T>query().equal(key, value);
    }

    public static <T extends BaseDomain> BridgeQuery<T> equal(@NonNull String key, @NonNull ObjectId value) {
        throw new UnsupportedOperationException("Won't be supported");
    }

    public static <T extends BaseDomain> BridgeQuery<T> in(
            @NonNull String needle, @NonNull Collection<String> haystack) {
        return Bridge.<T>query().in(needle, haystack);
    }

    public static <T extends BaseDomain> BridgeQuery<T> exists(@NonNull String key) {
        return Bridge.<T>query().exists(key);
    }

    public static <T extends BaseDomain> BridgeQuery<T> isTrue(@NonNull String key) {
        return Bridge.<T>query().isTrue(key);
    }

    /**
     * Check that the string `needle` is present in the JSON array at `key`.
     */
    public static <T extends BaseDomain> BridgeQuery<T> jsonIn(@NonNull String needle, @NonNull String key) {
        return Bridge.<T>query().jsonIn(needle, key);
    }
}
