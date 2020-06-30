package com.appsmith.server.dtos;

import com.appsmith.server.domains.User;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;

@Getter
@Setter
public class ResetUserPasswordDTO extends User {

    String baseUrl;

    @NotEmpty
    String token;
}
