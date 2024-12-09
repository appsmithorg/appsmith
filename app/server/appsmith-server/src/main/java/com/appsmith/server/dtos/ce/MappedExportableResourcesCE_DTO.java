package com.appsmith.server.dtos.ce;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@NoArgsConstructor
@Data
public class MappedExportableResourcesCE_DTO {

    Map<String, String> pluginMap = new HashMap<>();
    Map<String, String> datasourceIdToNameMap = new HashMap<>();
    Map<String, Instant> datasourceNameToUpdatedAtMap = new HashMap<>();
    Map<String, String> contextIdToNameMap = new HashMap<>();
    Map<String, String> contextNameToGitSyncIdMap = new HashMap<>();
    Map<String, String> actionIdToNameMap = new HashMap<>();
    Map<String, String> collectionIdToNameMap = new HashMap<>();
}
