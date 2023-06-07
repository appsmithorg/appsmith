/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos.ce;

import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InviteUsersCE_DTO {

    List<String> usernames;

    @NotNull String permissionGroupId;
}
