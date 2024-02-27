package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class ActionCollectionServiceImpl2Test {

    private static final File mockObjects =
            new File("src/test/resources/test_assets/ActionCollectionServiceTest/mockObjects.json");

    @Autowired
    private ActionCollectionRepository actionCollectionRepository;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ReactiveMongoTemplate reactiveMongoTemplate;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private UpdateLayoutService updateLayoutService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    <T> DefaultResources setDefaultResources(T collection) {
        DefaultResources defaultResources = new DefaultResources();
        if (collection instanceof ActionCollection) {
            defaultResources.setApplicationId("testApplicationId");
            defaultResources.setCollectionId("testCollectionId");
        } else if (collection instanceof ActionCollectionDTO) {
            defaultResources.setPageId("testPageId");
        }
        return defaultResources;
    }

    @Test
    public void testMoveCollection_toValidPage_returnsCollection() throws IOException {
        final ActionCollectionMoveDTO actionCollectionMoveDTO = new ActionCollectionMoveDTO();
        actionCollectionMoveDTO.setCollectionId("testCollectionId");
        actionCollectionMoveDTO.setDestinationPageId("newPageId");

        final ActionCollection actionCollection = new ActionCollection();
        final ActionCollectionDTO unpublishedCollection = new ActionCollectionDTO();
        unpublishedCollection.setPageId("oldPageId");
        unpublishedCollection.setName("collectionName");
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));
        unpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId", "testActionId"));
        actionCollection.setUnpublishedCollection(unpublishedCollection);
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        DefaultResources actionResources = new DefaultResources();
        actionResources.setActionId("testAction");
        actionResources.setPageId("newPageId");
        action.setDefaultResources(actionResources);

        /*
        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(action));

        Mockito.when(newActionService.updateUnpublishedAction(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, new BsonObjectId())));
        //*/

        PageDTO oldPageDTO = new PageDTO();
        oldPageDTO.setId("oldPageId");
        oldPageDTO.setLayouts(List.of(new Layout()));

        PageDTO newPageDTO = new PageDTO();
        newPageDTO.setId("newPageId");
        newPageDTO.setLayouts(List.of(new Layout()));

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        DefaultResources pageDefaultResources = new DefaultResources();
        pageDefaultResources.setPageId(newPage.getId());
        newPage.setDefaultResources(pageDefaultResources);

        /*
        Mockito.when(newPageService.findPageById(Mockito.any(), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(oldPageDTO))
                .thenReturn(Mono.just(newPageDTO));

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        //*/

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);

        /*
        Mockito.when(updateLayoutService.unescapeMongoSpecialCharacters(Mockito.any()))
                .thenReturn(jsonObject);

        Mockito.when(updateLayoutService.updateLayout(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenReturn(Mono.just(actionCollection));
        //*/

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.moveCollection(actionCollectionMoveDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    assertEquals("newPageId", actionCollectionDTO.getPageId());
                })
                .verifyComplete();
    }
}
