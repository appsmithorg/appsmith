package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ClonePageMetaDTO {
    String branchedSourcePageId;
    PageDTO clonedPageDTO;
    String branchName;
    Map<String, String> oldToNewCollectionIds = new HashMap<>();
}
