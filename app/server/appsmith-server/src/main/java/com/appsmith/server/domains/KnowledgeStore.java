package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.KnowledgeStoreDTO;
import com.appsmith.server.dtos.KnowledgeStoreDownstreamDTO;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@RequiredArgsConstructor
@Document
public class KnowledgeStore extends BaseDomain {

    /**
     * Number of previously published KBs being stored in the queue
     */
    private static final int MAX_QUEUE_SIZE = 5;

    /**
     * Application Id of the default branch of the application,
     * currently, separate branches are not supported
     */
    String applicationId;

    /**
     * This stores the draft and published knowledge bases for deployed version of applications
     */
    KnowledgeStoreDTO publishedAppKnowledgeStoreDTO;

    @Transient
    @JsonView(Views.Internal.class)
    LicenseValidationRequestDTO licenseValidationRequestDTO;

    @Transient
    @JsonView(Views.Internal.class)
    String instanceId;

    @Transient
    @JsonView(Views.Internal.class)
    String dsl;

    @JsonView(Views.Internal.class)
    List<Map<String, KnowledgeBase>> archivedKnowledgeBase = new ArrayList<>();

    public void addToQueue(Map<String, KnowledgeBase> previouslyPublishedKB) {
        if (this.archivedKnowledgeBase.size() == MAX_QUEUE_SIZE) {
            this.archivedKnowledgeBase.remove(0);
        }

        this.archivedKnowledgeBase.add(previouslyPublishedKB);
    }

    public static KnowledgeStore createKnowledgeStore(KnowledgeStoreDownstreamDTO kbStoreDownstreamDTO) {

        KnowledgeStore knowledgeStore = new KnowledgeStore();
        knowledgeStore.setApplicationId(kbStoreDownstreamDTO.getApplicationId());
        knowledgeStore.setInstanceId(kbStoreDownstreamDTO.getInstanceId());
        knowledgeStore.setLicenseValidationRequestDTO(kbStoreDownstreamDTO.getLicenseValidationRequestDTO());
        knowledgeStore.setDsl(kbStoreDownstreamDTO.getDsl());

        KnowledgeStoreDTO publishedAppKnowledgeStoreDTO = new KnowledgeStoreDTO();
        publishedAppKnowledgeStoreDTO.setKbGenRequestId(kbStoreDownstreamDTO.getId());
        publishedAppKnowledgeStoreDTO.setProcessingStatus(kbStoreDownstreamDTO.getProcessingStatus());
        publishedAppKnowledgeStoreDTO.setDraftKB(kbStoreDownstreamDTO.getDraftKB());

        knowledgeStore.setPublishedAppKnowledgeStoreDTO(publishedAppKnowledgeStoreDTO);
        return knowledgeStore;
    }
}
