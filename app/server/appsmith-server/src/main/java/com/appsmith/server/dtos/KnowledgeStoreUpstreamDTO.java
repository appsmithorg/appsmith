package com.appsmith.server.dtos;

import com.appsmith.server.constants.ProcessingStatus;
import com.appsmith.server.domains.KnowledgeBase;
import com.appsmith.server.domains.KnowledgeStore;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@RequiredArgsConstructor
public class KnowledgeStoreUpstreamDTO {

    String id;
    /**
     * Application Id of the default branch of the application,
     * currently, separate branches are not supported
     */
    String applicationId;

    /**
     * the processing status for an application is termed as completed only if processing status is completed for all the pages
     */
    ProcessingStatus processingStatus;
    /**
     *  This map holds the knowledge base for each page of the application,
     *  page slug is used as the key and Knowledge base is the object it holds
     */
    Map<String, KnowledgeBase> draftKB = new HashMap<>();

    /**
     *  This map holds the knowledge base for each page of the application,
     *  page slug is used as the key and Knowledge base is the object it holds
     */
    Map<String, KnowledgeBase> publishedKB = new HashMap<>();

    public static KnowledgeStoreUpstreamDTO createKnowledgeStoreUpstreamDTO(KnowledgeStore knowknowledgeStore) {
        KnowledgeStoreUpstreamDTO knowledgeStoreUpstreamDTO = new KnowledgeStoreUpstreamDTO();
        knowledgeStoreUpstreamDTO.setApplicationId(knowknowledgeStore.getApplicationId());
        knowledgeStoreUpstreamDTO.setProcessingStatus(
                knowknowledgeStore.getPublishedAppKnowledgeStoreDTO().getProcessingStatus());
        knowledgeStoreUpstreamDTO.setDraftKB(
                knowknowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB());
        knowledgeStoreUpstreamDTO.setPublishedKB(
                knowknowledgeStore.getPublishedAppKnowledgeStoreDTO().getPublishedKB());
        return knowledgeStoreUpstreamDTO;
    }
}
