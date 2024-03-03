package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;

public class Bridge {
    private Bridge() {}

    public static BridgeUpdate update() {
        return new BridgeUpdate();
    }

    public static <T extends BaseDomain> BridgeQuery<T> query() {
        return new BridgeQuery<>();
    }

    public static <T extends BaseDomain> BridgeQuery<T> or(BridgeQuery<T>... items) {
        final BridgeQuery<T> q = new BridgeQuery<>();
        q.checks.add(new Check.Or<>(items));
        return q;
    }
}
