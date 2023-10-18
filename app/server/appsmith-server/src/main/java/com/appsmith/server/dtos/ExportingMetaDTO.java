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
    String applicationId;
    String branchName;
    Boolean isGitSync;
    Boolean exportWithConfiguration;

    Instant applicationLastCommittedAt;
    boolean isClientSchemaMigrated;
    boolean isServerSchemaMigrated;

    List<String> unpublishedPages;
}
