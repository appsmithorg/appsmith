package com.appsmith.external.dtos;

import lombok.Data;

import java.util.Set;

/**
 * DTO to convey the status local git repo
 */
@Data
public class GitStatusDTO {

        // Name of modified, added and deleted resources for local git repo
        Set<String> modified;

        // Name of conflicting resources
        Set<String> conflicting;

        Boolean isClean;

        // # of modified pages
        Long modifiedPages;

        // # of modified actions
        Long modifiedQueries;

        // # of local commits which are not present in remote repo
        Integer aheadCount;

        // # of remote commits which are not present in local repo
        Integer behindCount;

        // Remote tracking branch name
        String remoteBranch;
}
