package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteUserDTO {
    String email;
    String roleName;
    String orgId;
}
