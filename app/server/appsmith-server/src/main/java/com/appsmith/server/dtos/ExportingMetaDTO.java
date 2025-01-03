package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ExportingMetaDTO {
    String artifactType;
    String artifactId;
    String refName;
    Boolean isGitSync;
    Boolean exportWithConfiguration;

    Instant artifactLastCommittedAt;
    boolean isClientSchemaMigrated;
    boolean isServerSchemaMigrated;

    List<String> unpublishedContextIds;
}
