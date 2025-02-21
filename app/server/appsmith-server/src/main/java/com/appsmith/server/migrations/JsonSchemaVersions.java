package com.appsmith.server.migrations;

import org.springframework.stereotype.Component;

/**
 * This class represents the JSON schema versions those are supported for the current instance. Whenever we run the
 * migration which is going to affect the underlying DB structure for different collection used in the JSON file, we
 * have to increment the corresponding version here by 1 unit. We have 2 different fields for client and server to
 * address the issue of linear incremental migration on both server and client side as both run their own migrations.
 * Having said that during import server will have to check the compatibility for both client
 * (widget dsl) and server-side resources, so that imported application will be in sane state after import is successful
 */
@Component
public class JsonSchemaVersions extends JsonSchemaVersionsFallback {

    /**
     * Only org level flags would work over here.
     * @return an Integer which is server version
     */
    @Override
    public Integer getServerVersion() {
        return super.getServerVersion();
    }
}
