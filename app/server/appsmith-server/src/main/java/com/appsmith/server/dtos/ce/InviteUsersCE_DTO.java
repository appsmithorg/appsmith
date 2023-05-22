/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos.ce;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteUsersCE_DTO {

List<String> usernames;

@NotNull String permissionGroupId;
}
