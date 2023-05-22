/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import java.time.Instant;
import lombok.Data;
import org.springframework.data.annotation.Transient;

@Data
public class GitAuth implements AppsmithDomain {

@JsonView(Views.Internal.class)
@Encrypted String privateKey;

@JsonView(Views.Public.class)
String publicKey;

@JsonView(Views.Internal.class)
Instant generatedAt;

// Deploy key documentation url
@Transient
@JsonView(Views.Public.class)
String docUrl;

@Transient
@JsonView(Views.Public.class)
boolean isRegeneratedKey = false;
}
