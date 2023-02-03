package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SSHPrivateKey implements AppsmithDomain {

    @JsonView(Views.Public.class)
    UploadedFile keyFile;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Public.class)
    String password;

}
