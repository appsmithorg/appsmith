package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.FromRequest;
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
public class BearerTokenAuth extends AuthenticationDTO {
    @Encrypted @JsonView(FromRequest.class)
    String bearerToken;
}
