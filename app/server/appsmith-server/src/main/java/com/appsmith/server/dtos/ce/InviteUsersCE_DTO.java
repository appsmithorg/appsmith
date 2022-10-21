package com.appsmith.server.dtos.ce;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class InviteUsersCE_DTO {

    List<String> usernames;

    @NotNull
    String permissionGroupId;

}
