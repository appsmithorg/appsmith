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
        @JsonView(Views.Api.class)
        Set<String> modified;

        // Name of added resources to local git repo
        @JsonView(Views.Api.class)
        Set<String> added;

        // Name of deleted resources from local git repo
        @JsonView(Views.Api.class)
        Set<String> removed;

        // Name of conflicting resources
        @JsonView(Views.Api.class)
        Set<String> conflicting;

        @JsonView(Views.Api.class)
        Boolean isClean;

        // number of modified custom JS libs
        @JsonView(Views.Api.class)
        int modifiedJSLibs;

        // number of modified pages
        @JsonView(Views.Api.class)
        int modifiedPages;

        // number of modified actions
        @JsonView(Views.Api.class)
        int modifiedQueries;

        // number of modified JSObjects
        @JsonView(Views.Api.class)
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
}
