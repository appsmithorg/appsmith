package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InviteUsersDTO {

    @NotNull
    List<String> usernames;

    @NotNull
    String permissionGroupId;

}
