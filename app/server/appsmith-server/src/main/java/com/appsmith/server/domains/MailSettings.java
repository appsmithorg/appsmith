package com.appsmith.server.domains;

public record MailSettings(
        Boolean isEnabled,
        String protocol,
        String host,
        Integer port,
        Boolean isStartTLSEnabled,
        String username,
        String password,
        String replyToAddress) {}
