package com.appsmith.external.dtos;

import com.appsmith.external.constants.Assets;
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

    // number of modified custom JS libs
    int modifiedJSLibs;

    // number of modified pages
    int modifiedPages;

    // number of modified actions
    int modifiedQueries;

    // number of modified JSObjects
    int modifiedJSObjects;

    // number of modified JSObjects
    int modifiedDatasources;

    // number of local commits which are not present in remote repo
    Integer aheadCount;

    // number of remote commits which are not present in local repo
    Integer behindCount;

    // Remote tracking branch name
    String remoteBranch;

    // Documentation url for discard and pull functionality
    String discardDocUrl = Assets.GIT_DISCARD_DOC_URL;

    // File Format migration
    String migrationMessage = "";
}
