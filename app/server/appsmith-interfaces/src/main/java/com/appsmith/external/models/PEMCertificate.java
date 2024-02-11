package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class PEMCertificate implements AppsmithDomain {

    String id;

    UploadedFile file;

    @Encrypted @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    public PEMCertificate(UploadedFile file, String password) {
        this.file = file;
        this.password = password;
    }
}
