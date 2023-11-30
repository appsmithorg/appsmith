package com.appsmith.server.dtos;

import com.appsmith.external.models.CreatorContextType;
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
    CreatorContextType contextType;
    String contextId;
    NewPage page;
    String rootModuleInstanceId;
    String rootModuleInstanceName;
    String branchName;
    Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap = new HashMap<>();
    Map<String, String> oldToNewModuleInstanceIdMap = new HashMap<>();
    Mono<Integer> evalVersionMono;
    List<String> sourceCollectionIds = new ArrayList<>();
    Map<String, String> oldToNewCollectionIdMap;
    Map<String, List<String>> newCollectionIdToNewActionsMap = new HashMap<>();
}
