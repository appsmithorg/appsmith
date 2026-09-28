package com.appsmith.server.solutions.ce;

/**
 * Redis pub/sub channel for restarting every pod of one Appsmith instance.
 * The channel is scoped by instance id so installations that share a Redis do not restart each other.
 */
public final class InstanceRestartChannel {

    public static final String PREFIX = "instance-restart:";

    /**
     * Placeholder body. A request id can be carried here later; receivers currently ignore the contents
     * and treat any message on the channel as a restart.
     */
    public static final String PAYLOAD = "restart";

    private InstanceRestartChannel() {}

    public static String forInstance(String instanceId) {
        return PREFIX + instanceId;
    }
}
