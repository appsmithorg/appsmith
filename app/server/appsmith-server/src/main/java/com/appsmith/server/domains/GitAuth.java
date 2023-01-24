package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.time.Instant;

@Data
public class GitAuth implements AppsmithDomain {

    @JsonView(Views.Internal.class)
    @Encrypted
    String privateKey;

    String publicKey;

    @JsonView(Views.Internal.class)
    Instant generatedAt;

    // Deploy key documentation url
    @Transient
    String docUrl;

    @Transient
    boolean isRegeneratedKey = false;
}
