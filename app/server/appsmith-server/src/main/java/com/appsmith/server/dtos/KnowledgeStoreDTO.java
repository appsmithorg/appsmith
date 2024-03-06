package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ProcessingStatus;
import com.appsmith.server.domains.KnowledgeBase;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@RequiredArgsConstructor
public class KnowledgeStoreDTO {

    /**
     * Number of previously published KBs being stored in the queue
     */
    private static final int MAX_QUEUE_SIZE = 5;

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

    @JsonView(Views.Internal.class)
    String kbGenRequestId;

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
}
