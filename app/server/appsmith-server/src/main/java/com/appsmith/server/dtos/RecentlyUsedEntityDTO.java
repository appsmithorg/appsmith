package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.RecentlyUsedEntityCE_DTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@NoArgsConstructor
@FieldNameConstants
public class RecentlyUsedEntityDTO extends RecentlyUsedEntityCE_DTO {
    public static class Fields extends RecentlyUsedEntityCE_DTO.Fields {}
}
