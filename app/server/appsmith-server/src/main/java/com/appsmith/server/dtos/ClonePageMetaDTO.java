package com.appsmith.server.dtos;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ClonePageMetaDTO {
    String sourcePageId;
    PageDTO clonedPageDTO;
    String branchName;

    Map<String, String> clonedIdToOldActionIdMap = new HashMap<>();
    Map<String, String> clonedIdToOldActionCollectionIdMap = new HashMap<>();

    Map<String, NewAction> oldIdToOldActionMap = new HashMap<>();

    Map<String, ActionCollection> clonedIdToActionCollectionMap = new HashMap<>();

    Map<String, String> oldToNewModuleInstanceIdMap = new HashMap<>();
    Map<String, String> oldToNewActionIdMap = new HashMap<>();
    Map<String, String> oldToNewActionCollectionIdMap = new HashMap<>();

    Map<String, String> oldActionIdToOldModuleInstanceIdMap = new HashMap<>();
    Map<String, String> oldActionCollectionIdToOldModuleInstanceIdMap = new HashMap<>();
}
