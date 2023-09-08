package com.appsmith.server.knowledgebase.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ProcessingStatus;
import com.appsmith.server.domains.KnowledgeBase;
import com.appsmith.server.domains.KnowledgeStore;
import com.appsmith.server.dtos.KnowledgeStoreDTO;
import com.appsmith.server.dtos.KnowledgeStoreDownstreamDTO;
import com.appsmith.server.dtos.KnowledgeStoreUpstreamDTO;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.KnowledgeStoreRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.util.WebClientUtils;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ProcessingStatus.IDLE;
import static com.appsmith.server.constants.ProcessingStatus.IN_PROGRESS;

@Slf4j
@Service
public class KnowledgeStoreServiceImpl extends KnowledgeStoreServiceCECompatibleImpl implements KnowledgeStoreService {

    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;
    private final KnowledgeStoreRepository repository;
    private final TenantService tenantService;
    private final LicenseAPIManager licenseAPIManager;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final ImportExportApplicationService importExportApplicationService;
    private final Gson gson;

    public KnowledgeStoreServiceImpl(
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            KnowledgeStoreRepository repository,
            TenantService tenantService,
            LicenseAPIManager licenseAPIManager,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ImportExportApplicationService importExportApplicationService,
            Gson gson) {

        super();
        this.repository = repository;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.tenantService = tenantService;
        this.licenseAPIManager = licenseAPIManager;
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.importExportApplicationService = importExportApplicationService;
        this.gson = gson;
    }

    @Override
    public Mono<KnowledgeStore> create(KnowledgeStore knowledgeStore) {
        if (StringUtils.hasText(knowledgeStore.getId())) {
            Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return repository.save(knowledgeStore);
    }

    @Override
    public Mono<KnowledgeStore> findByApplicationId(String applicationId) {
        return repository.findByApplicationId(applicationId);
    }

    @Override
    public Mono<KnowledgeStore> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<KnowledgeStore> save(KnowledgeStore knowledgeStore) {
        return repository.save(knowledgeStore);
    }

    @Override
    public Mono<KnowledgeStore> obtainKnowledgeStoreFromDB(String applicationId) {
        Mono<KnowledgeStore> knowledgeStoreMono = applicationService
                .findById(applicationId, applicationPermission.getReadPermission())
                .flatMap(application -> {
                    KnowledgeStore knowledgeStore = new KnowledgeStore();
                    knowledgeStore.setApplicationId(application.getId());

                    KnowledgeStoreDTO publishedAppKnowledgeStoreDTO = new KnowledgeStoreDTO();
                    publishedAppKnowledgeStoreDTO.setProcessingStatus(IDLE);

                    knowledgeStore.setPublishedAppKnowledgeStoreDTO(publishedAppKnowledgeStoreDTO);
                    return this.save(knowledgeStore);
                });

        return applicationService
                .findById(applicationId, applicationPermission.getReadPermission())
                .flatMap(application -> findByApplicationId(application.getId()))
                .switchIfEmpty(Mono.defer(() -> knowledgeStoreMono));
    }

    /**
     *
     * @param applicationId
     * @return knowledgestore
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_knowledge_base_enabled)
    public Mono<KnowledgeStore> generateDraftKB(String applicationId) {
        return obtainKnowledgeStoreFromDB(applicationId).flatMap(knowledgeStore -> {
            ProcessingStatus applicationProcessingStatus =
                    knowledgeStore.getPublishedAppKnowledgeStoreDTO().getProcessingStatus();
            Mono<KnowledgeStore> knowledgeStoreWithTransientsMono = addTransientsToKnowledgeStore(knowledgeStore);

            if (IN_PROGRESS.equals(applicationProcessingStatus)) {
                return Mono.error(new AppsmithException(
                        AppsmithError.KNOWLEDGE_BASE_ERROR,
                        "Duplicate request, A knowledge base generation request is already in progress"));
            }

            return knowledgeStoreWithTransientsMono
                    .flatMap(this::addDSLToKnowledgeStore)
                    .map(dbKnowledgeStore -> {
                        // Setting the draft KB to a newer hash map, as we would discard the older versions
                        dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO().setDraftKB(new HashMap<>());
                        return dbKnowledgeStore;
                    })
                    .map(KnowledgeStoreDownstreamDTO::createKnowledgeStoreDTO)
                    .flatMap(this::sendKBGenerationRequestToCloudServer)
                    .map(KnowledgeStore::createKnowledgeStore)
                    .map(csKnowledgeStore -> mergeKnowledgeStore(knowledgeStore, csKnowledgeStore))
                    .flatMap(mergedKnowledgeStore -> this.save(mergedKnowledgeStore));
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_knowledge_base_enabled)
    public Mono<KnowledgeStore> getKnowledgeStore(String applicationId) {
        return obtainKnowledgeStoreFromDB(applicationId).flatMap(knowledgeStore -> {
            ProcessingStatus applicationProcessingStatus =
                    knowledgeStore.getPublishedAppKnowledgeStoreDTO().getProcessingStatus();
            Mono<KnowledgeStore> transientKnowledgeStoreMono = addTransientsToKnowledgeStore(knowledgeStore);

            if (IDLE.equals(applicationProcessingStatus)) {
                return Mono.just(knowledgeStore);
            }

            return transientKnowledgeStoreMono
                    .map(KnowledgeStoreDownstreamDTO::createKnowledgeStoreDTO)
                    .flatMap(this::getKBGenerationStatusFromCloudServer)
                    .map(KnowledgeStore::createKnowledgeStore)
                    .map(csKnowledgeStore -> mergeKnowledgeStore(knowledgeStore, csKnowledgeStore))
                    .flatMap(mergedKnowledgeStore -> {
                        if (Boolean.TRUE.equals(verifyKnowledgeStoreFetchComplete(mergedKnowledgeStore))) {

                            // archive the published kb
                            KnowledgeStoreDTO publishedKnowledgeStoreDTO =
                                    mergedKnowledgeStore.getPublishedAppKnowledgeStoreDTO();
                            publishedKnowledgeStoreDTO.addToQueue(publishedKnowledgeStoreDTO.getPublishedKB());

                            // copy draft KB to published KB as well
                            publishedKnowledgeStoreDTO.setPublishedKB(publishedKnowledgeStoreDTO.getDraftKB());

                            // this is created before setting the kbGenRequestId to null sending the purge request
                            KnowledgeStoreDownstreamDTO knowledgeStoreDTO =
                                    KnowledgeStoreDownstreamDTO.createKnowledgeStoreDTO(mergedKnowledgeStore);

                            // set required params back start
                            publishedKnowledgeStoreDTO.setKbGenRequestId(null);
                            publishedKnowledgeStoreDTO.setProcessingStatus(IDLE);

                            return this.save(mergedKnowledgeStore).flatMap(dbKnowledgeStore -> Mono.zip(
                                            this.sendPurgeRequestToCloudServer(knowledgeStoreDTO)
                                                    .subscribeOn(Schedulers.boundedElastic()),
                                            Mono.just(dbKnowledgeStore))
                                    .map(Tuple2::getT2));
                        }
                        return this.save(mergedKnowledgeStore);
                    });
        });
    }

    /**
     * @param knowledgeStoreDTO
     * @return
     */
    @Override
    public Mono<KnowledgeStoreDownstreamDTO> sendPurgeRequestToCloudServer(
            KnowledgeStoreDownstreamDTO knowledgeStoreDTO) {
        String purgeUri = "/api/v1/kb/purge";
        return sendRequestToCloudServer(purgeUri, knowledgeStoreDTO)
                .onErrorResume(error -> Mono.just(new KnowledgeStoreDownstreamDTO()));
    }

    @Override
    public Mono<KnowledgeStoreDownstreamDTO> getKBGenerationStatusFromCloudServer(
            KnowledgeStoreDownstreamDTO knowledgeStoreDTO) {
        String fetchUri = "/api/v1/kb/fetch";
        return sendRequestToCloudServer(fetchUri, knowledgeStoreDTO);
    }

    @Override
    public Mono<KnowledgeStoreDownstreamDTO> sendKBGenerationRequestToCloudServer(
            KnowledgeStoreDownstreamDTO knowledgeStoreDTO) {
        String generateUri = "api/v1/kb/generate";
        return sendRequestToCloudServer(generateUri, knowledgeStoreDTO);
    }

    private Mono<KnowledgeStoreDownstreamDTO> sendRequestToCloudServer(
            String uri, KnowledgeStoreDownstreamDTO knowledgeStoreDTO) {
        return WebClientUtils.create(cloudServicesConfig.getBaseUrlWithSignatureVerification())
                .post()
                .uri(uri)
                .body(BodyInserters.fromValue(knowledgeStoreDTO))
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().is2xxSuccessful()) {
                        return clientResponse.bodyToMono(
                                new ParameterizedTypeReference<ResponseDTO<KnowledgeStoreDownstreamDTO>>() {});
                    } else {
                        return clientResponse.createError();
                    }
                })
                .map(ResponseDTO::getData)
                .onErrorMap(
                        // Only map errors if we haven't already wrapped them into an AppsmithException
                        e -> !(e instanceof AppsmithException),
                        e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage()));
    }

    @Override
    public KnowledgeStore mergeKnowledgeStore(KnowledgeStore dbKnowledgeStore, KnowledgeStore csKnowledgeStore) {
        dbKnowledgeStore
                .getPublishedAppKnowledgeStoreDTO()
                .setKbGenRequestId(
                        csKnowledgeStore.getPublishedAppKnowledgeStoreDTO().getKbGenRequestId());
        dbKnowledgeStore
                .getPublishedAppKnowledgeStoreDTO()
                .setProcessingStatus(
                        csKnowledgeStore.getPublishedAppKnowledgeStoreDTO().getProcessingStatus());

        Map<String, KnowledgeBase> csKBMap =
                csKnowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB();
        Map<String, KnowledgeBase> dbKBMap =
                dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB();

        if (CollectionUtils.isEmpty(csKBMap)) {
            return dbKnowledgeStore;
        }

        if (CollectionUtils.isEmpty(dbKBMap)) {
            dbKnowledgeStore.getPublishedAppKnowledgeStoreDTO().setDraftKB(csKBMap);
            return dbKnowledgeStore;
        }

        dbKBMap.putAll(csKBMap);
        return dbKnowledgeStore;
    }

    @Override
    public Boolean verifyKnowledgeStoreFetchComplete(KnowledgeStore knowledgeStore) {
        Boolean fetchingCompletionStatus = Boolean.TRUE;

        Map<String, KnowledgeBase> draftKBMap =
                knowledgeStore.getPublishedAppKnowledgeStoreDTO().getDraftKB();
        if (CollectionUtils.isEmpty(draftKBMap)) {
            return fetchingCompletionStatus;
        }

        for (String pageSlugAsKey : draftKBMap.keySet()) {
            KnowledgeBase knowledgeBase = draftKBMap.get(pageSlugAsKey);
            if (IN_PROGRESS.equals(knowledgeBase.getProcessingStatus())) {
                fetchingCompletionStatus = Boolean.FALSE;
                break;
            }
        }

        return fetchingCompletionStatus;
    }

    @Override
    public Mono<KnowledgeStore> addTransientsToKnowledgeStore(KnowledgeStore knowledgeStore) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        Mono<LicenseValidationRequestDTO> licenseValidationRequestDTOMono =
                tenantService.getDefaultTenant().flatMap(licenseAPIManager::populateLicenseValidationRequest);

        return Mono.zip(instanceIdMono, licenseValidationRequestDTOMono).map(tuple -> {
            String instanceId = tuple.getT1();
            LicenseValidationRequestDTO licenseValidationRequestDTO = tuple.getT2();
            licenseValidationRequestDTO.setInstanceId(instanceId);
            knowledgeStore.setLicenseValidationRequestDTO(licenseValidationRequestDTO);
            knowledgeStore.setInstanceId(instanceId);
            return knowledgeStore;
        });
    }

    @Override
    public Mono<KnowledgeStore> addDSLToKnowledgeStore(KnowledgeStore knowledgeStore) {
        return this.getApplicationJsonStringForApplicationId(knowledgeStore.getApplicationId())
                .map(dsl -> {
                    knowledgeStore.setDsl(dsl);
                    return knowledgeStore;
                });
    }

    @Override
    public Mono<String> getApplicationJsonStringForApplicationId(String applicationId) {
        return importExportApplicationService
                .exportApplicationById(applicationId, "")
                .map(gson::toJson);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_knowledge_base_enabled)
    public Mono<KnowledgeStoreUpstreamDTO> generateDraftKB(String applicationId, Boolean isPublished) {
        return this.generateDraftKB(applicationId).map(KnowledgeStoreUpstreamDTO::createKnowledgeStoreUpstreamDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_knowledge_base_enabled)
    public Mono<KnowledgeStoreUpstreamDTO> getKnowledgeStore(String applicationId, Boolean isPublished) {
        return this.getKnowledgeStore(applicationId).map(KnowledgeStoreUpstreamDTO::createKnowledgeStoreUpstreamDTO);
    }
}
