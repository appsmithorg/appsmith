package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class InviteUsersDTO {

    @NotNull
    List<String> usernames;

    @NotNull
    String roleName;

    @NotNull
    String orgId;
}
