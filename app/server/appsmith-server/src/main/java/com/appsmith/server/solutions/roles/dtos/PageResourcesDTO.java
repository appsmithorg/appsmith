package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class PageResourcesDTO extends BaseView {
    private Boolean isDefault = null;
    private List<ActionResourceDTO> actions;
    private List<ActionCollectionResourceDTO> actionCollections;
}
