package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConflictedFileVersionsDTO {
    private String filePath;
    private Object baseVersion;
    private Object localBranchVersion;
    private Object targetBranchVersion;
}
