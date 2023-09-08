package com.appsmith.server.services.ee;

import com.appsmith.server.constants.ProcessingStatus;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.KnowledgeBase;
import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.dtos.KnowledgeStoreDTO;
import com.appsmith.server.dtos.KnowledgeStoreDownstreamDTO;
import com.appsmith.server.knowledgebase.services.KnowledgeStoreService;
import com.appsmith.server.repositories.KnowledgeStoreRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ProcessingStatus.IDLE;
import static com.appsmith.server.constants.ProcessingStatus.IN_PROGRESS;
import static com.appsmith.server.domains.KnowledgeStore.createKnowledgeStore;
import static com.appsmith.server.featureflags.FeatureFlagEnum.release_knowledge_base_enabled;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@Slf4j
@SpringBootTest
@ExtendWith(SpringExtension.class)
public class KnowledgeStoreServiceTest {

    @SpyBean
    KnowledgeStoreService knowledgeStoreService;

    @Autowired
    KnowledgeStoreRepository knowledgeStoreRepository;

    @SpyBean
    FeatureFlagService featureFlagService;

    @MockBean
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    private KnowledgeStore getKnowledgeStore(String applicationId) {
        if (!StringUtils.hasText(applicationId)) {
            applicationId = "sampleApplicationId";
        }
        KnowledgeStore knowledgeStore = new KnowledgeStore();
        knowledgeStore.setApplicationId(applicationId);
        knowledgeStore.setInstanceId("sampleInstanceId");

        knowledgeStore.setPublishedAppKnowledgeStoreDTO(new KnowledgeStoreDTO());
        knowledgeStore.getPublishedAppKnowledgeStoreDTO().setProcessingStatus(IDLE);
        return knowledgeStore;
    }

    private KnowledgeStoreDownstreamDTO getDownstreamKnowledgeStore(String applicationId, String pageName) {
        if (!StringUtils.hasText(applicationId)) {
            applicationId = "sampleApplicationId";
        }

        if (!StringUtils.hasText(pageName)) {
            pageName = "page1";
        }
        KnowledgeStoreDownstreamDTO knowledgeStoreDTO = new KnowledgeStoreDownstreamDTO();
        knowledgeStoreDTO.setApplicationId(applicationId);
        knowledgeStoreDTO.setInstanceId("sampleInstanceId");
        knowledgeStoreDTO.setProcessingStatus(ProcessingStatus.IN_PROGRESS);
        Map<String, KnowledgeBase> knowledgeBaseMap = new HashMap<>();
        knowledgeBaseMap.put(pageName, getKnowledgeBase(pageName));
        knowledgeStoreDTO.setDraftKB(knowledgeBaseMap);
        return knowledgeStoreDTO;
    }

    private KnowledgeBase getKnowledgeBase(String pageName) {
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        knowledgeBase.setProcessingStatus(IN_PROGRESS);
        knowledgeBase.setPageName(pageName);
        knowledgeBase.setPageSlug(pageName);
        return knowledgeBase;
    }

    @Test
    public void verifyDataRetrieval() {
        String applicationIdForThisTest = "dataRetrievalApplicationId";
        knowledgeStoreService.save(getKnowledgeStore(applicationIdForThisTest)).block();

        Mono<KnowledgeStore> knowledgeStoreMono = knowledgeStoreService.findByApplicationId(applicationIdForThisTest);
        StepVerifier.create(knowledgeStoreMono)
                .assertNext(dbKnowledgeStore -> {
                    assertThat(dbKnowledgeStore.getApplicationId()).isEqualTo(applicationIdForThisTest);
                    assertThat(dbKnowledgeStore.getInstanceId()).isNull();
                    assertThat(dbKnowledgeStore
                                    .getPublishedAppKnowledgeStoreDTO()
                                    .getDraftKB())
                            .isEmpty();
                })
                .verifyComplete();
    }

    @Test
    public void verifyErrorOnDuplicateApplicationIdKey() {
        String applicationIdForThisTest = "duplicateErrorTestApplicationId";
        knowledgeStoreService.save(getKnowledgeStore(applicationIdForThisTest)).block();
        Mono<KnowledgeStore> knowledgeStoreMono =
                knowledgeStoreService.save(getKnowledgeStore(applicationIdForThisTest));
        StepVerifier.create(knowledgeStoreMono)
                .verifyErrorSatisfies(error -> assertThat(error).isInstanceOf(DuplicateKeyException.class));
    }

    @Test
    public void verifyNoRetrievalOfArchived() {
        String applicationIdForThisTest = "deletedRetrievalApplicationId";
        KnowledgeStore savedKnowledgeStore = knowledgeStoreService
                .save(getKnowledgeStore(applicationIdForThisTest))
                .block();
        knowledgeStoreRepository.archive(savedKnowledgeStore).block();

        Mono<KnowledgeStore> knowledgeStoreMono = knowledgeStoreService.findByApplicationId(applicationIdForThisTest);
        StepVerifier.create(knowledgeStoreMono).verifyComplete();
    }

    @Test
    public void verifyKnowledgeStoreMergeTest() {
        String applicationIdForThisTest = "mergeTestApplicationId";
        String pageName = "samplePageName";
        String downstreamPageName = "page1";
        String downstreamCsRequestId = "downstreamRequestId";
        KnowledgeStore destinationKnowledgeStore = getKnowledgeStore(applicationIdForThisTest);
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        knowledgeBase.setPageName(pageName);
        knowledgeBase.setPageSlug(pageName);
        destinationKnowledgeStore
                .getPublishedAppKnowledgeStoreDTO()
                .getDraftKB()
                .put(pageName, knowledgeBase);

        KnowledgeStoreDTO destinationKnowledgeStoreDTO = destinationKnowledgeStore.getPublishedAppKnowledgeStoreDTO();

        assertThat(destinationKnowledgeStoreDTO.getDraftKB().size()).isEqualTo(1);
        assertThat(destinationKnowledgeStoreDTO.getDraftKB().containsKey(pageName))
                .isTrue();
        assertThat(destinationKnowledgeStoreDTO.getDraftKB().containsKey(downstreamPageName))
                .isFalse();

        KnowledgeStore downstreamKnowledgeStore =
                createKnowledgeStore(getDownstreamKnowledgeStore(applicationIdForThisTest, downstreamPageName));
        KnowledgeStoreDTO downstreamKnowledgeStoreDTO = downstreamKnowledgeStore.getPublishedAppKnowledgeStoreDTO();

        downstreamKnowledgeStore.getPublishedAppKnowledgeStoreDTO().setKbGenRequestId(downstreamCsRequestId);
        assertThat(downstreamKnowledgeStoreDTO.getDraftKB().size()).isEqualTo(1);
        assertThat(downstreamKnowledgeStoreDTO.getDraftKB().containsKey(pageName))
                .isFalse();
        assertThat(downstreamKnowledgeStoreDTO.getDraftKB().containsKey(downstreamPageName))
                .isTrue();
        assertThat(downstreamKnowledgeStore.getPublishedAppKnowledgeStoreDTO().getKbGenRequestId())
                .isEqualTo(downstreamCsRequestId);

        KnowledgeStore mergedKnowledgeStore =
                knowledgeStoreService.mergeKnowledgeStore(destinationKnowledgeStore, downstreamKnowledgeStore);

        KnowledgeStoreDTO mergedKnowledgeStoreDTO = mergedKnowledgeStore.getPublishedAppKnowledgeStoreDTO();
        assertThat(mergedKnowledgeStoreDTO.getDraftKB().size()).isEqualTo(2);
        assertThat(mergedKnowledgeStoreDTO.getDraftKB().containsKey(pageName)).isTrue();
        assertThat(mergedKnowledgeStoreDTO.getDraftKB().containsKey(downstreamPageName))
                .isTrue();
        assertThat(mergedKnowledgeStore.hashCode()).isEqualTo(destinationKnowledgeStore.hashCode());
        assertThat(mergedKnowledgeStoreDTO.getKbGenRequestId()).isEqualTo(downstreamCsRequestId);
    }

    @Test
    public void verifyKnowledgeStoreFetchCompleteReturnsFalseWhenPageFetchInProgress() {
        String applicationIdForThisTest = "mergeTestApplicationId";
        String pageName = "samplePageName";
        String pageName2 = "samplePageName2";
        KnowledgeStore knowledgeStore = getKnowledgeStore(applicationIdForThisTest);
        KnowledgeBase knowledgeBase = new KnowledgeBase();

        knowledgeBase.setPageName(pageName);
        knowledgeBase.setPageSlug(pageName);
        knowledgeBase.setProcessingStatus(ProcessingStatus.IN_PROGRESS);
        knowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB().put(pageName, knowledgeBase);

        KnowledgeBase knowledgeBase2 = new KnowledgeBase();
        knowledgeBase2.setPageName(pageName2);
        knowledgeBase2.setPageSlug(pageName2);
        knowledgeBase2.setProcessingStatus(IDLE);
        knowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB().put(pageName2, knowledgeBase2);

        when(featureFlagService.check(eq(release_knowledge_base_enabled))).thenReturn(Mono.just(TRUE));

        assertThat(knowledgeStoreService.verifyKnowledgeStoreFetchComplete(knowledgeStore))
                .isEqualTo(false);
        knowledgeStore
                .getPublishedAppKnowledgeStoreDTO()
                .getDraftKB()
                .get(pageName)
                .setProcessingStatus(IDLE);
        assertThat(knowledgeStoreService.verifyKnowledgeStoreFetchComplete(knowledgeStore))
                .isEqualTo(true);
    }

    @Test
    public void verifyObtainKnowledgeStoreFromDBCreatesNewObjectWhenNotFound() {
        String applicationIdForThisTest = "obtainKBStoreApplicationId";

        // asserting that no object present for the given applicationId
        StepVerifier.create(knowledgeStoreService.findByApplicationId(applicationIdForThisTest))
                .verifyComplete();

        Application mockApplication = new Application();
        mockApplication.setId(applicationIdForThisTest);

        when(applicationService.findById(Mockito.any(), eq(applicationPermission.getReadPermission())))
                .thenReturn(Mono.just(mockApplication));

        when(featureFlagService.check(eq(release_knowledge_base_enabled))).thenReturn(Mono.just(TRUE));

        Mono<KnowledgeStore> knowledgeStoreMono =
                knowledgeStoreService.obtainKnowledgeStoreFromDB(applicationIdForThisTest);

        StepVerifier.create(knowledgeStoreMono)
                .assertNext(dbKnowledgeStore -> {
                    KnowledgeStoreDTO dbKnowledgeStoreDTO = dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO();
                    assertThat(dbKnowledgeStore.getApplicationId()).isEqualTo(applicationIdForThisTest);
                    assertThat(dbKnowledgeStore.getInstanceId()).isNull();
                    assertThat(dbKnowledgeStoreDTO.getDraftKB()).isEmpty();
                    assertThat(dbKnowledgeStoreDTO.getProcessingStatus()).isEqualTo(IDLE);
                })
                .verifyComplete();
    }

    @Test
    public void verifySuccessfulGenerationFlow() {
        String applicationIdForThisTest = "generateKBApplicationId";
        String downstreamPageName = "downstreamPageName";
        String downstreamCsRequestId = "downstreamRequestId";

        Application mockApplication = new Application();
        mockApplication.setId(applicationIdForThisTest);

        when(applicationService.findById(Mockito.any(), eq(applicationPermission.getReadPermission())))
                .thenReturn(Mono.just(mockApplication));

        when(featureFlagService.check(eq(release_knowledge_base_enabled))).thenReturn(Mono.just(TRUE));

        KnowledgeStoreDownstreamDTO downstreamKnowledgeStoreDTO =
                getDownstreamKnowledgeStore(applicationIdForThisTest, downstreamPageName);
        downstreamKnowledgeStoreDTO.setId(downstreamCsRequestId);

        doReturn(Mono.just(downstreamKnowledgeStoreDTO))
                .when(knowledgeStoreService)
                .sendKBGenerationRequestToCloudServer(Mockito.any());

        doReturn(Mono.just("\"sampleApplicationJsonString\""))
                .when(knowledgeStoreService)
                .getApplicationJsonStringForApplicationId(Mockito.any());

        Mono<KnowledgeStore> knowledgeStoreMono = knowledgeStoreService.generateDraftKB(applicationIdForThisTest);

        StepVerifier.create(knowledgeStoreMono)
                .assertNext(dbKnowledgeStore -> {
                    KnowledgeStoreDTO dbKnowledgeStoreDTO = dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO();
                    assertThat(dbKnowledgeStore.getApplicationId()).isEqualTo(applicationIdForThisTest);
                    assertThat(dbKnowledgeStore.getInstanceId()).isNotNull();
                    assertThat(dbKnowledgeStoreDTO.getDraftKB()).isNotEmpty();
                    assertThat(dbKnowledgeStoreDTO.getDraftKB().containsKey(downstreamPageName))
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void verifySuccessfulGetRequest() {
        String applicationIdForThisTest = "getKBApplicationId";
        String downstreamPageName = "downstreamPageName";
        String downstreamCsRequestId = "downstreamRequestId";

        // this is so that obtain KS doesn't create a new object
        KnowledgeStore knowledgeStore = getKnowledgeStore(applicationIdForThisTest);
        knowledgeStore.getPublishedAppKnowledgeStoreDTO().setProcessingStatus(IN_PROGRESS);
        knowledgeStoreService.save(knowledgeStore).block();

        Application mockApplication = new Application();
        mockApplication.setId(applicationIdForThisTest);

        when(applicationService.findById(Mockito.any(), eq(applicationPermission.getReadPermission())))
                .thenReturn(Mono.just(mockApplication));

        KnowledgeStoreDownstreamDTO downstreamKnowledgeStoreDTO =
                getDownstreamKnowledgeStore(applicationIdForThisTest, downstreamPageName);
        downstreamKnowledgeStoreDTO.setId(downstreamCsRequestId);
        downstreamKnowledgeStoreDTO.getDraftKB().get(downstreamPageName).setProcessingStatus(IDLE);

        when(featureFlagService.check(eq(release_knowledge_base_enabled))).thenReturn(Mono.just(TRUE));

        doReturn(Mono.just(downstreamKnowledgeStoreDTO))
                .when(knowledgeStoreService)
                .getKBGenerationStatusFromCloudServer(Mockito.any());

        doReturn(Mono.just(downstreamKnowledgeStoreDTO))
                .when(knowledgeStoreService)
                .sendPurgeRequestToCloudServer(Mockito.any());

        Mono<KnowledgeStore> knowledgeStoreMono = knowledgeStoreService.getKnowledgeStore(applicationIdForThisTest);

        StepVerifier.create(knowledgeStoreMono)
                .assertNext(dbKnowledgeStore -> {
                    KnowledgeStoreDTO dbKnowledgeStoreDTO = dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO();
                    assertThat(dbKnowledgeStore.getApplicationId()).isEqualTo(applicationIdForThisTest);
                    assertThat(dbKnowledgeStore.getInstanceId()).isNotNull();
                    assertThat(dbKnowledgeStoreDTO.getDraftKB()).isNotEmpty();
                    assertThat(dbKnowledgeStoreDTO.getProcessingStatus()).isEqualTo(IDLE);
                    assertThat(dbKnowledgeStoreDTO.getDraftKB().containsKey(downstreamPageName))
                            .isTrue();
                    assertThat(dbKnowledgeStoreDTO
                                    .getDraftKB()
                                    .get(downstreamPageName)
                                    .getProcessingStatus())
                            .isEqualTo(IDLE);
                })
                .verifyComplete();
    }
}
