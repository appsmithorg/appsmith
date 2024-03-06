package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class WorkflowResourceDTO extends BaseView {
    private List<ActionResourceDTO> actions;
    private List<ActionCollectionResourceDTO> actionCollections;
}
