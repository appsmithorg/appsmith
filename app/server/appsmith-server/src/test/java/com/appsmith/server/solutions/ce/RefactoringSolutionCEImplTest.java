package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringSolutionCEImpl;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.services.ce.ApplicationPageServiceCEImpl.EVALUATION_VERSION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(SpringExtension.class)
@Slf4j
@SpringBootTest
class RefactoringSolutionCEImplTest {
    RefactoringSolutionCEImpl refactoringSolutionCE;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    ActionPermission actionPermission;

    @MockBean
    private NewPageService newPageService;

    @SpyBean
    private NewActionService newActionService;

    @MockBean
    private ResponseUtils responseUtils;

    @MockBean
    private LayoutActionService layoutActionService;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private SessionUserService sessionUserService;

    @MockBean
    ActionCollectionRepository actionCollectionRepository;

    @SpyBean
    private EntityRefactoringService<Void> jsActionEntityRefactoringService;

    @SpyBean
    private EntityRefactoringService<NewAction> newActionEntityRefactoringService;

    @SpyBean
    private EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService;

    @SpyBean
    private EntityRefactoringService<Layout> widgetEntityRefactoringService;

    @Autowired
    private TransactionalOperator transactionalOperator;

    @BeforeEach
    public void setUp() {

        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(new User()));

        refactoringSolutionCE = new RefactoringSolutionCEImpl(
                newPageService,
                responseUtils,
                layoutActionService,
                applicationService,
                pagePermission,
                analyticsService,
                sessionUserService,
                transactionalOperator,
                jsActionEntityRefactoringService,
                newActionEntityRefactoringService,
                actionCollectionEntityRefactoringService,
                widgetEntityRefactoringService);
    }

    @Test
    public void testRefactorCollectionName_withEmptyActions_returnsValidLayout() {
        final RefactorEntityNameDTO refactorActionCollectionNameDTO = new RefactorEntityNameDTO();
        refactorActionCollectionNameDTO.setEntityType(EntityType.JS_OBJECT);
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldActionCollection.setId("testCollectionId");
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);
        oldUnpublishedCollection.setDefaultResources(setDefaultResources(oldUnpublishedCollection));
        oldActionCollection.setDefaultResources(setDefaultResources(oldActionCollection));

        Mockito.when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);

        Mockito.when(responseUtils.updateLayoutDTOWithDefaultResources(Mockito.any()))
                .thenReturn(layout);

        Mockito.doReturn(Mono.empty())
                .when(actionCollectionEntityRefactoringService)
                .updateRefactoredEntity(Mockito.any(), Mockito.isNull());

        NewPage newPage = new NewPage();
        newPage.setId("testPageId");
        newPage.setApplicationId("testAppId");
        PageDTO pageDTO = new PageDTO();
        pageDTO.setId("testPageId");
        pageDTO.setApplicationId("testAppId");
        newPage.setUnpublishedPage(pageDTO);
        Layout layout1 = new Layout();
        layout1.setId("testLayoutId");
        layout1.setDsl(jsonObject);
        pageDTO.setLayouts(List.of(layout1));
        Mockito.when(newPageService.getById(Mockito.anyString())).thenReturn(Mono.just(newPage));

        Mockito.when(newPageService.findPageById(Mockito.anyString(), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(pageDTO));

        Mockito.when(newPageService.saveUnpublishedPage(Mockito.any())).thenReturn(Mono.just(pageDTO));

        Application application = new Application();
        application.setId("testAppId");
        application.setEvaluationVersion(EVALUATION_VERSION);
        Mockito.when(applicationService.findById(Mockito.anyString())).thenReturn(Mono.just(application));

        Mockito.when(newActionService.findByPageIdAndViewMode(Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.empty());

        Mockito.when(layoutActionService.updateLayout(
                        Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        final Mono<LayoutDTO> layoutDTOMono =
                refactoringSolutionCE.refactorEntityName(refactorActionCollectionNameDTO, null);

        StepVerifier.create(layoutDTOMono)
                .assertNext(layoutDTO -> {
                    assertNotNull(layoutDTO.getDsl());
                    assertEquals("value", layoutDTO.getDsl().get("key"));
                })
                .verifyComplete();
    }

    @Test
    public void testRefactorCollectionName_withDuplicateName_throwsError() {
        final RefactorEntityNameDTO refactorActionCollectionNameDTO = new RefactorEntityNameDTO();
        refactorActionCollectionNameDTO.setEntityType(EntityType.JS_OBJECT);
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);

        final ActionCollection duplicateActionCollection = new ActionCollection();
        final ActionCollectionDTO duplicateUnpublishedCollection = new ActionCollectionDTO();
        duplicateUnpublishedCollection.setPageId("testPageId");
        duplicateUnpublishedCollection.setName("newName");
        duplicateActionCollection.setUnpublishedCollection(duplicateUnpublishedCollection);

        Mockito.when(actionCollectionRepository.findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.just(oldActionCollection, duplicateActionCollection));

        Mockito.when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(false));

        NewPage newPage = new NewPage();
        newPage.setId("testPageId");
        Mockito.when(newPageService.getById(Mockito.anyString())).thenReturn(Mono.just(newPage));

        final Mono<LayoutDTO> layoutDTOMono =
                refactoringSolutionCE.refactorEntityName(refactorActionCollectionNameDTO, null);

        StepVerifier.create(layoutDTOMono)
                .expectErrorMatches(e -> AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR
                        .getMessage("oldName", "newName", FieldName.NAME)
                        .equals(e.getMessage()))
                .verify();
    }

    @Test
    public void testRefactorCollectionName_withActions_returnsValidLayout() {
        final RefactorEntityNameDTO refactorActionCollectionNameDTO = new RefactorEntityNameDTO();
        refactorActionCollectionNameDTO.setEntityType(EntityType.JS_OBJECT);
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldActionCollection.setId("testCollectionId");
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldUnpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId", "testActionId"));
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);
        oldActionCollection.setDefaultResources(setDefaultResources(oldActionCollection));
        oldUnpublishedCollection.setDefaultResources(setDefaultResources(oldUnpublishedCollection));

        Mockito.when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito.when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito.when(newActionService.updateUnpublishedAction(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito.doReturn(Mono.empty())
                .when(actionCollectionEntityRefactoringService)
                .updateRefactoredEntity(Mockito.any(), Mockito.isNull());

        NewPage newPage = new NewPage();
        newPage.setId("testPageId");
        newPage.setApplicationId("testAppId");
        PageDTO pageDTO = new PageDTO();
        pageDTO.setId("testPageId");
        pageDTO.setApplicationId("testAppId");
        newPage.setUnpublishedPage(pageDTO);
        Layout layout1 = new Layout();
        layout1.setId("testLayoutId");
        layout1.setDsl(new JSONObject());
        pageDTO.setLayouts(List.of(layout1));
        Mockito.when(newPageService.getById(Mockito.anyString())).thenReturn(Mono.just(newPage));

        Mockito.when(newPageService.findPageById(Mockito.anyString(), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(pageDTO));

        Mockito.when(newPageService.saveUnpublishedPage(Mockito.any())).thenReturn(Mono.just(pageDTO));

        Application application = new Application();
        application.setId("testAppId");
        application.setEvaluationVersion(EVALUATION_VERSION);
        Mockito.when(applicationService.findById(Mockito.anyString())).thenReturn(Mono.just(application));

        NewAction newAction = new NewAction();
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("testAction");
        newAction.setUnpublishedAction(actionDTO);

        Mockito.when(newActionService.findByPageIdAndViewMode(Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(newAction));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);
        layout.setActionUpdates(new ArrayList<>());
        layout.setLayoutOnLoadActions(new ArrayList<>());

        Mockito.when(responseUtils.updateLayoutDTOWithDefaultResources(Mockito.any()))
                .thenReturn(layout);

        Mockito.when(layoutActionService.updateLayout(
                        Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        final Mono<LayoutDTO> layoutDTOMono =
                refactoringSolutionCE.refactorEntityName(refactorActionCollectionNameDTO, null);

        StepVerifier.create(layoutDTOMono)
                .assertNext(layoutDTO -> {
                    assertNotNull(layoutDTO.getDsl());
                    assertEquals("value", layoutDTO.getDsl().get("key"));
                })
                .verifyComplete();
    }

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
}
