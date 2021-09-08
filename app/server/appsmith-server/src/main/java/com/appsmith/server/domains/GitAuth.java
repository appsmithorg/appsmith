package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitAuth {
    @Encrypted
    String privateKey;

    String publicKey;
}
