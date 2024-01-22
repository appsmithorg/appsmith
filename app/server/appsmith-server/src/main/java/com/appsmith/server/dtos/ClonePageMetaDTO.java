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
    String sourcePageId;
    PageDTO clonedPageDTO;
    String branchName;
    Map<String, String> oldToNewActionIdMap = new HashMap<>();
}
