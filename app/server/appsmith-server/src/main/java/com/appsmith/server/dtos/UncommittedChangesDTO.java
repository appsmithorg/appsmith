package com.appsmith.server.dtos;

import lombok.Data;

/**
 * DTO to hold the uncommitted changes status of the local git repo.
 * Currently, we are only interested in knowing if the repo is clean or not.
 * In the future, we can add more fields to this DTO to convey the status of the repo
 * e.g. which files are modified, added, deleted etc.
 */
@Data
public class UncommittedChangesDTO {
    private boolean isClean;
}
