package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
public class InvitedUserDetailDTO {
    @NotNull
    String email;

    @NotNull
    String roleName;
}
