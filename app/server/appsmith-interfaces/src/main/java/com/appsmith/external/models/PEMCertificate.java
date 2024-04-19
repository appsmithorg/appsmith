package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PEMCertificate implements AppsmithDomain {

    UploadedFile file;

    @Encrypted @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;
}
