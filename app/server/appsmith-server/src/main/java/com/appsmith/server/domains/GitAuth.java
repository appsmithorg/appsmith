package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitAuth {
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Encrypted
    String privateKey;

    String publicKey;
}
