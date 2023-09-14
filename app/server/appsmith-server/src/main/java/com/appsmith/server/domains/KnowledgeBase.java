package com.appsmith.server.domains;

import com.appsmith.server.constants.ProcessingStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@RequiredArgsConstructor
public class KnowledgeBase {

    ProcessingStatus processingStatus;

    String functionalDescription;

    String intro;

    String pageSlug;

    String pageName;

    List<PageFeature> features;
}
