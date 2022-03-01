package com.appsmith.external.dtos;

import lombok.Data;

import java.util.Set;

/**
 * DTO to convey the status local git repo
 */
@Data
public class GitStatusDTO {

        // Name of modified, added and deleted resources in local git repo
        Set<String> modified;

        // Name of added resources to local git repo
        Set<String> added;

        // Name of deleted resources from local git repo
        Set<String> removed;

        // Name of conflicting resources
        Set<String> conflicting;

        Boolean isClean;

        // # of modified pages
        Long modifiedPages = 0L;
        Long addedPages = 0L;
        Long removedPages = 0L;

        // # of modified actions
        Long modifiedQueries = 0L;
        Long addedQueries = 0L;
        Long removedQueries = 0L;

        // # of modified JSObjects
        Long modifiedJSObjects = 0L;
        Long addedJSObjects = 0L;
        Long removedJSObjects = 0L;

        // # of modified datasources
        Long modifiedDatasources = 0L;
        Long addedDatasources = 0L;
        Long removedDatasources = 0L;

        // # of local commits which are not present in remote repo
        Integer aheadCount;

        // # of remote commits which are not present in local repo
        Integer behindCount;

        // Remote tracking branch name
        String remoteBranch;
}
