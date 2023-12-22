package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ModuleInstantiatingMetaDTO {
    String sourceModuleId;
    String sourcePackageId;
    CreatorContextType contextType;
    String contextId;
    NewPage page;
    String rootModuleInstanceId;
    String rootModuleInstanceName;
    String branchName;
    boolean isSimulation = false;
    Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap = new HashMap<>();
    Map<String, String> oldToNewModuleInstanceIdMap = new HashMap<>();
    Mono<Integer> evalVersionMono;
    List<String> sourceCollectionIds = new ArrayList<>();
    Map<String, String> oldToNewCollectionIdMap;
    Map<String, List<String>> newCollectionIdToNewActionIdsMap = new HashMap<>();

    // Fields required for simulated instantiation
    Map<String, List<NewAction>> originCollectionIdToNewActionsMap = new HashMap<>();
}
