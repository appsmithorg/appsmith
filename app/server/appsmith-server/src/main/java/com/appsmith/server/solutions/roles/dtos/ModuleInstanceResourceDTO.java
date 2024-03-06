package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModuleInstanceResourceDTO extends BaseView {
    private Boolean isDefault = null;
}
