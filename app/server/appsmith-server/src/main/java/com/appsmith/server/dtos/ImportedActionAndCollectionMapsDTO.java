package com.appsmith.server.dtos;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class ImportedActionAndCollectionMapsDTO {
    Map<String, String> unpublishedActionIdToCollectionIdMap = new HashMap<>();
    Map<String, String> publishedActionIdToCollectionIdMap = new HashMap<>();
}
