package com.appsmith.server.dtos;

import com.appsmith.server.domains.ActionCollection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ClonePageMetaDTO {
    String branchedSourcePageId;
    PageDTO clonedPageDTO;
    String branchName;
    Map<String, String> oldToNewActionIdMap = new HashMap<>();
    List<ActionCollection> clonedActionCollections = new ArrayList<>();
}
