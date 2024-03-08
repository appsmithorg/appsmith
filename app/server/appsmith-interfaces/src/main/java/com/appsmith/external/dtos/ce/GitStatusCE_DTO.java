package com.appsmith.external.dtos.ce;

import com.appsmith.external.constants.Assets;
import lombok.Data;

import java.util.HashMap;
import java.util.Set;

/**
 * DTO to convey the status local git repo
 */
@Data
public class GitStatusCE_DTO {

    // Hashmap that contains files changed in a set, keys - added, removed, modified, uncommitted, untracked
    HashMap<String, Set<String>> changes;

    // Number of total changes
    Integer totalChanges;

    // Hashmap that contains pages changed
    HashMap<String, Set<String>> changedPages;

    // Hashmap that contains pages changed
    HashMap<String, Set<String>> changedQueries;

    // Hashmap that contains pages changed
    HashMap<String, Set<String>> changedJsObjects;

    // Hashmap that contains pages changed
    HashMap<String, Set<String>> changedDatasources;

    // Hashmap that contains pages changed
    HashMap<String, Set<String>> changedJsLibs;

    // Name of the conflicting resources
    Set<String> conflicting;

    // bool to check if the branch is clean
    Boolean isClean;

    // Number of local commits which are not present in remote repo
    Integer aheadCount;

    // Number of remote commits which are not present in local repo
    Integer behindCount;

    // Remote tracking branch name
    String remoteBranch;

    // Documentation url for discard and pull functionality
    String discardDocUrl = Assets.GIT_DISCARD_DOC_URL;

    // File Format migration
    String migrationMessage = "";
}
