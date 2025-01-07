package com.appsmith.server.migrations;

import org.springframework.stereotype.Component;

@Component
public class JsonSchemaVersionsFallback {
    private static final Integer serverVersion = 11;
    public static final Integer clientVersion = 2;

    public Integer getServerVersion() {
        return serverVersion;
    }

    public Integer getClientVersion() {
        return clientVersion;
    }

    /**
     * This method is separately described from the instance method.
     * Since the instance method is feature flagged to yield different results based on
     * value of flag release_git_autocommit_feature_enabled.
     * Now some of the use case requires the value which is present in the static variable server version.
     * That can be accessed via the instance method of fallback implementation, but would cost more memory
     * to instantiate.
     * @return server version from the private variable
     */
    public static Integer getStaticServerVersion() {
        return serverVersion;
    }

    /**
     * The client version can be accessed via the instance method of fallback implementation,
     * but would cost more memory to instantiate. hence a parallel static implementation.
     * @return client version from the private variable
     */
    public static Integer getStaticClientVersion() {
        return clientVersion;
    }
}
