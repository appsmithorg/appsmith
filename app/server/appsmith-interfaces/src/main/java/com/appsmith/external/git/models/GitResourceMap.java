package com.appsmith.external.git.models;

import com.appsmith.external.dtos.ModifiedResources;
import lombok.Data;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class GitResourceMap {

    private Map<GitResourceIdentity, Object> gitResourceMap = new ConcurrentHashMap<>();

    private ModifiedResources modifiedResources;
}
