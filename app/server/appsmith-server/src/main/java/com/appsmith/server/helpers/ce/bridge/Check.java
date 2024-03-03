package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;

public interface Check {

    record Unit(Op op, String key, Object value) implements Check {}

    record Or<T extends BaseDomain>(BridgeQuery<T>[] items) implements Check {}
}
