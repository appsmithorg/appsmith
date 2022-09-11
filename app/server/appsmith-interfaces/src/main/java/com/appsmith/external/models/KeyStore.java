package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Document
public class KeyStore implements AppsmithDomain {

    UploadedFile file;

    String fileType;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

}
