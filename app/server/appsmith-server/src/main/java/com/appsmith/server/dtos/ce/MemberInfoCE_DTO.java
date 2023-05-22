/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos.ce;

import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MemberInfoCE_DTO {

  String userId;
  String username;
  String name;
  List<PermissionGroupInfoDTO> roles;
  String photoId;
}
