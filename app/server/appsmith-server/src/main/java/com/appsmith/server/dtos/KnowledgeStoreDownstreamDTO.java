package com.appsmith.server.dtos;

import com.appsmith.server.constants.ProcessingStatus;
import com.appsmith.server.domains.KnowledgeBase;
import com.appsmith.server.domains.KnowledgeStore;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@RequiredArgsConstructor
public class KnowledgeStoreDownstreamDTO {

    /**
     * This is same as cloud server unique request id
     */
    String id;

    String applicationId;

    ProcessingStatus processingStatus;

    Map<String, KnowledgeBase> draftKB;

    String dsl;

    String instanceId;

    LicenseValidationRequestDTO licenseValidationRequestDTO;

    public static KnowledgeStoreDownstreamDTO createKnowledgeStoreDTO(KnowledgeStore knowledgeStore) {
        KnowledgeStoreDownstreamDTO kbStoreDownstreamDTO = new KnowledgeStoreDownstreamDTO();
        kbStoreDownstreamDTO.setId(
                knowledgeStore.getPublishedAppKnowledgeStoreDTO().getKbGenRequestId());
        kbStoreDownstreamDTO.setApplicationId(knowledgeStore.getApplicationId());
        kbStoreDownstreamDTO.setProcessingStatus(
                knowledgeStore.getPublishedAppKnowledgeStoreDTO().getProcessingStatus());
        kbStoreDownstreamDTO.setInstanceId(knowledgeStore.getInstanceId());
        kbStoreDownstreamDTO.setLicenseValidationRequestDTO(knowledgeStore.getLicenseValidationRequestDTO());
        kbStoreDownstreamDTO.setDsl(knowledgeStore.getDsl());
        return kbStoreDownstreamDTO;
    }
}
