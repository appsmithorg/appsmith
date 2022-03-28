package com.appsmith.server.migrations;

public class ApplicationVersion {
    // EARLIEST_VERSION will never be changed
    public static final int EARLIEST_VERSION = 1;

    // increment the LATEST_VERSION when there is a breaking change and user need to upgrade manually
    public static final int LATEST_VERSION = 2;
}
