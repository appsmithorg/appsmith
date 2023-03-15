package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.PermissionGroupInfoCE_DTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PermissionGroupInfoDTO extends PermissionGroupInfoCE_DTO {

    public PermissionGroupInfoDTO(String id, String name) {
        super(id, name);
    }
}
