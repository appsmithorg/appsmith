package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class SSHPrivateKey {

    UploadedFile keyFile;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

}
