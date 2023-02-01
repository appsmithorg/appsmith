package com.appsmith.server.models.export;

import java.util.List;

import lombok.Data;

@Data
public class ApplicationMetadata {
    private List<String> pages;
    private Boolean appIsPublic;
    private String color;
    private String icon;
    private int evaluationVersion;
    private int applicationVersion;
    private Boolean isManualUpdate;
    private Boolean deleted;
    private String gitSyncId;
}
