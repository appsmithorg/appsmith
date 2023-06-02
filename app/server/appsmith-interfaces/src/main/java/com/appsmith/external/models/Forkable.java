package com.appsmith.external.models;

public interface Forkable<T> {

    // checkNameClash

    // checkGitConnectionExists

    /**
     * This method defines the behaviour of an object when the application is forked from one workspace to another.
     * If you wish to fork this object with all properties intact, do the following.
     * Create a new object from the source object
     * Based on forkWithConfiguration field present in source app, add logic for copying the object to target workspace
     * Please bear in mind that forking might give people outside your workspace access to this object
     * @param forkWithConfiguration     : This parameter defines the behaviour of an object if it needs to be copied to
     *                                    the new workspace with or without credentials
     * @param toWorkspaceId             : Target workspaceId
     * @return
     */
    T fork(Boolean forkWithConfiguration, String toWorkspaceId);
}
