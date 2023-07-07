package com.appsmith.server.solutions.roles.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleEntityDTO {

    String type;

    String id;

    List<Integer> permissions;

    String name;
}
