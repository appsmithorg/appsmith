package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

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
