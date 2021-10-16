package com.external.plugins;

import java.util.Map;

public class ConfigMap {

    public final static Map<String, Integer> s3MigrationMap = Map.ofEntries(
            Map.entry("actionConfiguration.formData.command", 0),
            Map.entry("actionConfiguration.formData.bucket", 1),
            Map.entry("actionConfiguration.formData.create.expiry", 7),
            Map.entry("actionConfiguration.formData.read.expiry", 7),
            Map.entry("actionConfiguration.formData.delete.expiry", 7),
            Map.entry("actionConfiguration.formData.create.dataType", 6),
            Map.entry("actionConfiguration.formData.list.prefix", 4),
            Map.entry("actionConfiguration.formData.list.signedUrl", 2),
            Map.entry("actionConfiguration.formData.list.expiry", 3),
            Map.entry("actionConfiguration.formData.list.unSignedUrl", 8),
            Map.entry("actionConfiguration.formData.read.dataType", 6),
            Map.entry("actionConfiguration.formData.read.usingBase64Encoding", 5)
    );
}
