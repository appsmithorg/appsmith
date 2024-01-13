package com.appsmith.server.dtos;

import lombok.Getter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
public class ImportedActionAndCollectionMapsDTO {
    Map<String, List<String>> unpublishedActionIdToCollectionIdMap = new HashMap<>();
    Map<String, List<String>> publishedActionIdToCollectionIdMap = new HashMap<>();
}
