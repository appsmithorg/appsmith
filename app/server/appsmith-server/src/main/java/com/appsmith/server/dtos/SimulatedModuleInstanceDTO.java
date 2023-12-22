package com.appsmith.server.dtos;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import lombok.Data;
import lombok.ToString;

import java.util.List;
import java.util.Map;

@ToString
@Data
public class SimulatedModuleInstanceDTO {
    ModuleInstanceDTO createdModuleInstance;
    Map<String, ModuleInstance> originToModuleInstanceMap;
    Map<String, NewAction> originToNewActionMap;
    Map<String, ActionCollection> originToCollectionMap;
    Map<String, List<NewAction>> originCollectionIdToActionsMap;
}
