package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BasicAuth extends AuthenticationDTO {

    @JsonView({Views.Public.class, FromRequest.class})
    String username;

    @Encrypted @JsonView({Views.Internal.class, FromRequest.class})
    String password;
}
