package com.appsmith.server.dtos;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class PackagePublishingMetaDTO {
    String sourcePackageId;
    Package publishedPackage;

    // Map of all published entities
    Map<String, Module> originModuleIdToPublishedModuleMap = new HashMap<>();

    Map<String, ModuleInstance> existingModuleInstanceIdToModuleInstanceMap = new ConcurrentHashMap<>();
    Map<String, Map<String, ModuleInstance>> existingComposedModuleInstanceRefToModuleInstanceMap =
            new ConcurrentHashMap<>();

    // moduleInstanceId - Map <originActionId, newAction>
    Map<String, Map<String, NewAction>> existingComposedActionRefToNewActionMap = new ConcurrentHashMap<>();
    // moduleInstanceId - Map <FQN, newAction>
    Map<String, Map<String, NewAction>> existingInvalidComposedActionRefToNewActionMap = new ConcurrentHashMap<>();

    // moduleInstanceId - Map <originCollectionId, actionCollection>
    Map<String, Map<String, ActionCollection>> existingComposedCollectionRefToCollectionMap = new ConcurrentHashMap<>();
    // moduleInstanceId - Map <FQN, actionCollection>
    Map<String, Map<String, ActionCollection>> existingInvalidComposedCollectionRefToCollectionMap =
            new ConcurrentHashMap<>();

    // moduleInstanceId - Map <originCollectionId, List<NewAction>>
    Map<String, Map<String, List<NewAction>>> existingComposedCollectionRefToNewActionsMap = new ConcurrentHashMap<>();
    // moduleInstanceId - Map <originCollectionId, List<NewAction>>
    Map<String, Map<String, NewAction>> existingInvalidJSActionFQNToNewActionsMap = new ConcurrentHashMap<>();

    Set<String> autoUpgradedPageIds = ConcurrentHashMap.newKeySet();
}
