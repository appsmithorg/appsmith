package com.appsmith.external.dtos;

import lombok.Data;

import java.util.Set;

@Data
public class GitStatusDTO {
    Set<String> modified;
    Set<String> conflicting;
    Boolean isClean;
    Long modifiedPages;
    Long modifiedQueries;
    Integer aheadCount;
    Integer behindCount;
    String remoteBranch;
}
