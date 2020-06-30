package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
public class InviteUserDTO {

    @NotNull
    String email;

    @NotNull
    String roleName;

    @NotNull
    String orgId;
}
