package com.appsmith.server.dtos.ce;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;
import java.util.List;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class InviteUsersCE_DTO {

    @JsonView(Views.Public.class)
    List<String> usernames;

    @NotNull
    @JsonView(Views.Public.class)
    String permissionGroupId;

}
