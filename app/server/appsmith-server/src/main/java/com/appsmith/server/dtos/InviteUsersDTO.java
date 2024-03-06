package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.InviteUsersCE_DTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
public class InviteUsersDTO extends InviteUsersCE_DTO {

    Set<String> groups;
}
