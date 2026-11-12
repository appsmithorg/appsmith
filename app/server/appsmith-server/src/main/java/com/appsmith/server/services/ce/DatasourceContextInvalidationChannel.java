package com.appsmith.server.services.ce;

/**
 * Redis pub/sub channel that tells every pod of one Appsmith instance to drop a cached datasource context.
 * The channel is scoped by instance id so installations that share a Redis do not evict each other's connections.
 */
public final class DatasourceContextInvalidationChannel {

    public static final String PREFIX = "datasource-context-invalidation:";

    private DatasourceContextInvalidationChannel() {}

    public static String forInstance(String instanceId) {
        return PREFIX + instanceId;
    }
}
