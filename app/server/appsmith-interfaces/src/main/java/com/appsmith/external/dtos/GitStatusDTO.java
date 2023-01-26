package com.appsmith.external.dtos;

import com.appsmith.external.constants.Assets;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

import java.util.Set;

/**
 * DTO to convey the status local git repo
 */
@Data
public class GitStatusDTO {

        // Name of modified, added and deleted resources in local git repo
        @JsonView(Views.Public.class)
        Set<String> modified;

        // Name of added resources to local git repo
        @JsonView(Views.Public.class)
        Set<String> added;

        // Name of deleted resources from local git repo
        @JsonView(Views.Public.class)
        Set<String> removed;

        // Name of conflicting resources
        @JsonView(Views.Public.class)
        Set<String> conflicting;

        @JsonView(Views.Public.class)
        Boolean isClean;

        // number of modified custom JS libs
        @JsonView(Views.Public.class)
        int modifiedJSLibs;

        // number of modified pages
        @JsonView(Views.Public.class)
        int modifiedPages;

        // number of modified actions
        @JsonView(Views.Public.class)
        int modifiedQueries;

        // number of modified JSObjects
        @JsonView(Views.Public.class)
        int modifiedJSObjects;

        // number of modified JSObjects
        @JsonView(Views.Public.class)
        int modifiedDatasources;

        // number of local commits which are not present in remote repo
        @JsonView(Views.Public.class)
        Integer aheadCount;

        // number of remote commits which are not present in local repo
        @JsonView(Views.Public.class)
        Integer behindCount;

        // Remote tracking branch name
        @JsonView(Views.Public.class)
        String remoteBranch;

        // Documentation url for discard and pull functionality
        @JsonView(Views.Public.class)
        String discardDocUrl = Assets.GIT_DISCARD_DOC_URL;
}
