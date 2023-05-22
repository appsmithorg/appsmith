/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.MemberInfoCE_DTO;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class MemberInfoDTO extends MemberInfoCE_DTO {

  @Builder
  public MemberInfoDTO(
      String userId,
      String username,
      String name,
      List<PermissionGroupInfoDTO> roles,
      String photoId) {
    super(userId, username, name, roles, photoId);
  }
}
