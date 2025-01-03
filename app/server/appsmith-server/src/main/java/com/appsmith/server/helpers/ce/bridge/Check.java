package com.appsmith.server.helpers.ce.bridge;

import com.appsmith.external.models.BaseDomain;

import java.util.Collection;

public interface Check {

    record Unit(Op op, String key, Object value) implements Check {}

    record Or<T extends BaseDomain>(Collection<BridgeQuery<T>> items) implements Check {}

    record And<T extends BaseDomain>(Collection<BridgeQuery<T>> items) implements Check {}
}
