package com.appsmith.external.dtos.ce;

import com.appsmith.external.constants.Assets;
import lombok.Data;

import java.util.Set;

/**
 * DTO to convey the status local git repo
 */
// TODO: @Manish modify git status DTO accordingly
@Data
public class GitStatusCE_DTO {

    // set of files that were modified
    Set<String> modified;

    // set of files that were added anew
    Set<String> added;

    // set of files that were removed
    Set<String> removed;

    // set of pages that were modified
    Set<String> pagesModified;

    // set of pages that were added
    Set<String> pagesAdded;

    // set of pages that were removed
    Set<String> pagesRemoved;

    // set of queries that were modified
    Set<String> queriesModified;

    // set of queries that were added
    Set<String> queriesAdded;

    // set of queries that were removed
    Set<String> queriesRemoved;

    // set of jsObjects that were modified
    Set<String> jsObjectsModified;

    // set of jsObjects that were added
    Set<String> jsObjectsAdded;

    // set of jsObjects that were removed
    Set<String> jsObjectsRemoved;

    // set of datasources that were modified
    Set<String> datasourcesModified;

    // set of datasources that were added
    Set<String> datasourcesAdded;

    // set of datasources that were removed
    Set<String> datasourcesRemoved;

    // set of jsLibs that were modified
    Set<String> jsLibsModified;

    // set of jsLibs that were added
    Set<String> jsLibsAdded;

    // set of jsLibs that were removed
    Set<String> jsLibsRemoved;

    // Name of the conflicting resources
    Set<String> conflicting;

    // number of modified custom JS libs
    @Deprecated
    int modifiedJSLibs;

    // number of modified pages
    @Deprecated
    int modifiedPages;

    // number of modified actions
    @Deprecated
    int modifiedQueries;

    // number of modified JSObjects
    @Deprecated
    int modifiedJSObjects;

    // number of modified JSObjects
    @Deprecated
    int modifiedDatasources;

    // bool to check if the branch is clean
    Boolean isClean;

    // number of local commits which are not present in remote repo
    Integer aheadCount;

    // number of remote commits which are not present in local repo
    Integer behindCount;

    // remote tracking branch name
    String remoteBranch;

    // documentation url for discard and pull functionality
    String discardDocUrl = Assets.GIT_DISCARD_DOC_URL;

    // file Format migration
    String migrationMessage = "";
}
