package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.server.solutions.UserChangedHandler;
import com.mongodb.DBObject;
import com.mongodb.client.result.UpdateResult;
import jakarta.validation.Validator;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

public class UserDataServiceCEImpl extends BaseService<UserDataRepository, UserData, String>
        implements UserDataServiceCE {

    private final UserRepository userRepository;

    private final SessionUserService sessionUserService;

    private final AssetService assetService;

    private final ReleaseNotesService releaseNotesService;

    private final FeatureFlagService featureFlagService;

    private final UserChangedHandler userChangedHandler;

    private final ApplicationRepository applicationRepository;

    private final TenantService tenantService;

    private static final int MAX_PROFILE_PHOTO_SIZE_KB = 1024;

    private static final int MAX_RECENT_WORKSPACES_LIMIT = 10;

    private static final int MAX_RECENT_APPLICATIONS_LIMIT = 20;

    @Autowired
    public UserDataServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            UserDataRepository repository,
            AnalyticsService analyticsService,
            UserRepository userRepository,
            SessionUserService sessionUserService,
            AssetService assetService,
            ReleaseNotesService releaseNotesService,
            FeatureFlagService featureFlagService,
            UserChangedHandler userChangedHandler,
            ApplicationRepository applicationRepository,
            TenantService tenantService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userRepository = userRepository;
        this.releaseNotesService = releaseNotesService;
        this.assetService = assetService;
        this.sessionUserService = sessionUserService;
        this.featureFlagService = featureFlagService;
        this.userChangedHandler = userChangedHandler;
        this.applicationRepository = applicationRepository;
        this.tenantService = tenantService;
    }

    @Override
    public Mono<UserData> getForUser(User user) {
        return user == null ? Mono.empty() : getForUser(user.getId());
    }

    @Override
    public Mono<UserData> getForUser(String userId) {
        // If an entry for this userId doesn't exist in the database, we return an empty object, since data in this
        // collection is treated to be sparse. That is, missing objects in the database are the same as empty objects.
        return StringUtils.isEmpty(userId)
                ? Mono.empty()
                : repository.findByUserId(userId).defaultIfEmpty(new UserData(userId));
    }

    @Override
    public Mono<UserData> getForCurrentUser() {
        return sessionUserService.getCurrentUser().map(User::getEmail).flatMap(this::getForUserEmail);
    }

    @Override
    public Mono<UserData> getForUserEmail(String email) {
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantId -> userRepository.findByEmailAndTenantId(email, tenantId))
                .flatMap(this::getForUser);
    }

    @Override
    public Mono<UserData> updateForCurrentUser(UserData updates) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> tenantService
                        .getDefaultTenantId()
                        .flatMap(tenantId -> userRepository.findByEmailAndTenantId(user.getEmail(), tenantId)))
                .flatMap(user -> updateForUser(user, updates));
    }

    @Override
    public Mono<UserData> updateForUser(User user, UserData updates) {
        // If a UserData document exists for this user, update it. If not, create one.
        updates.setUserId(user.getId());
        final Mono<UserData> updaterMono = update(user.getId(), updates);
        final Mono<UserData> creatorMono = Mono.just(updates).flatMap(this::create);
        return updaterMono.switchIfEmpty(creatorMono);
    }

    @Override
    public Mono<UserData> update(String userId, UserData resource) {
        if (userId == null) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_PARAMETER, fieldName(QUserData.userData.userId)));
        }

        Query query =
                new Query(Criteria.where(fieldName(QUserData.userData.userId)).is(userId));

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        DBObject update = getDbObject(resource);

        Update updateObj = new Update();
        Map<String, Object> updateMap = update.toMap();
        updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

        return mongoTemplate
                .updateFirst(query, updateObj, resource.getClass())
                .flatMap(updateResult ->
                        updateResult.getMatchedCount() == 0 ? Mono.empty() : repository.findByUserId(userId))
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<User> setViewedCurrentVersionReleaseNotes(User user) {
        final String version = releaseNotesService.getReleasedVersion();
        if (StringUtils.isEmpty(version)) {
            return Mono.just(user);
        }

        return setViewedCurrentVersionReleaseNotes(user, version);
    }

    @Override
    public Mono<User> setViewedCurrentVersionReleaseNotes(User user, String version) {
        if (user == null) {
            return Mono.empty();
        }

        return Mono.justOrEmpty(user.getId())
                .switchIfEmpty(tenantService
                        .getDefaultTenantId()
                        .flatMap(tenantId -> userRepository.findByEmailAndTenantId(user.getEmail(), tenantId))
                        .flatMap(user1 -> Mono.justOrEmpty(user1.getId())))
                .flatMap(userId -> repository.saveReleaseNotesViewedVersion(userId, version))
                .thenReturn(user);
    }

    @Override
    public Mono<User> ensureViewedCurrentVersionReleaseNotes(User user) {
        return getForUser(user).flatMap(userData -> {
            if (userData != null && userData.getReleaseNotesViewedVersion() == null) {
                return setViewedCurrentVersionReleaseNotes(user);
            }
            return Mono.just(user);
        });
    }

    @Override
    public Mono<UserData> saveProfilePhoto(Part filePart) {
        final Mono<String> prevAssetIdMono =
                getForCurrentUser().map(userData -> ObjectUtils.defaultIfNull(userData.getProfilePhotoAssetId(), ""));

        final Mono<Asset> uploaderMono = assetService.upload(List.of(filePart), MAX_PROFILE_PHOTO_SIZE_KB, true);

        return Mono.zip(prevAssetIdMono, uploaderMono).flatMap(tuple -> {
            final String oldAssetId = tuple.getT1();
            final Asset uploadedAsset = tuple.getT2();
            final UserData updates = new UserData();
            updates.setProfilePhotoAssetId(uploadedAsset.getId());
            final Mono<UserData> updateMono = updateForCurrentUser(updates);
            if (!StringUtils.hasLength(oldAssetId)) {
                return updateMono;
            } else {
                return assetService.remove(oldAssetId).then(updateMono);
            }
        });
    }

    @Override
    public Mono<Void> deleteProfilePhoto() {
        return getForCurrentUser()
                .flatMap(userData -> {
                    String profilePhotoAssetId = userData.getProfilePhotoAssetId();
                    userData.setProfilePhotoAssetId(null);
                    return repository.save(userData).thenReturn(profilePhotoAssetId);
                })
                .flatMap(assetService::remove);
    }

    @Override
    public Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, String email) {
        return getForUserEmail(email).flatMap(userData -> makeProfilePhotoResponse(exchange, userData));
    }

    @Override
    public Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange) {
        return getForCurrentUser().flatMap(userData -> makeProfilePhotoResponse(exchange, userData));
    }

    private Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, UserData userData) {
        return Mono.justOrEmpty(userData.getProfilePhotoAssetId())
                .flatMap(assetId -> assetService.makeImageResponse(exchange, assetId));
    }

    /**
     * This function is used to update the recently used application and workspace for the user
     *
     * @param application
     * @return Updated {@link UserData}
     */
    @Override
    public Mono<UserData> updateLastUsedAppAndWorkspaceList(Application application) {
        return sessionUserService
                .getCurrentUser()
                .zipWhen(this::getForUser)
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    // TODO remove the updated to deprecated fields once client starts consuming the updated API
                    // set recently used workspace ids
                    userData.setRecentlyUsedWorkspaceIds(addIdToRecentList(
                            userData.getRecentlyUsedWorkspaceIds(),
                            application.getWorkspaceId(),
                            MAX_RECENT_WORKSPACES_LIMIT));
                    // set recently used application ids
                    userData.setRecentlyUsedAppIds(addIdToRecentList(
                            userData.getRecentlyUsedAppIds(), application.getId(), MAX_RECENT_APPLICATIONS_LIMIT));

                    // Update recently used workspace and corresponding application ids
                    List<RecentlyUsedEntityDTO> recentlyUsedEntities = reorderWorkspacesInRecentlyUsedOrderForUser(
                            userData.getRecentlyUsedEntityIds(),
                            application.getWorkspaceId(),
                            MAX_RECENT_WORKSPACES_LIMIT);

                    if (!CollectionUtils.isNullOrEmpty(recentlyUsedEntities)) {
                        RecentlyUsedEntityDTO latest = recentlyUsedEntities.get(0);
                        // Add the current applicationId to the list
                        latest.setApplicationIds(addIdToRecentList(
                                latest.getApplicationIds(), application.getId(), MAX_RECENT_APPLICATIONS_LIMIT));
                    }
                    userData.setRecentlyUsedEntityIds(recentlyUsedEntities);
                    return Mono.zip(
                            analyticsService.identifyUser(user, userData, application.getWorkspaceId()),
                            repository.save(userData));
                })
                .map(Tuple2::getT2);
    }

    protected List<String> addIdToRecentList(List<String> srcIdList, String newId, int maxSize) {
        if (srcIdList == null) {
            srcIdList = new ArrayList<>();
        }
        CollectionUtils.putAtFirst(srcIdList, newId);

        // check if there is any duplicates, remove if exists
        if (srcIdList.size() > 1) {
            CollectionUtils.removeDuplicates(srcIdList);
        }
        // keeping the last maxSize ids, there may be a lot of ids which are not used anymore
        if (srcIdList.size() > maxSize) {
            srcIdList = srcIdList.subList(0, maxSize);
        }
        return srcIdList;
    }

    protected List<RecentlyUsedEntityDTO> reorderWorkspacesInRecentlyUsedOrderForUser(
            List<RecentlyUsedEntityDTO> srcIdList, String workspaceId, int maxSize) {
        if (srcIdList == null) {
            srcIdList = new ArrayList<>(maxSize);
        }
        if (!StringUtils.hasLength(workspaceId)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID);
        }
        RecentlyUsedEntityDTO existingEntity = null;
        for (RecentlyUsedEntityDTO entityDTO : srcIdList) {
            if (entityDTO.getWorkspaceId().equals(workspaceId)) {
                existingEntity = entityDTO;
                break;
            }
        }
        if (existingEntity == null) {
            existingEntity = new RecentlyUsedEntityDTO();
            existingEntity.setWorkspaceId(workspaceId);
        } else {
            // Remove duplicates
            srcIdList.remove(existingEntity);
        }
        CollectionUtils.putAtFirst(srcIdList, existingEntity);

        // keeping the last maxSize ids, there may be a lot of ids which are not used anymore
        if (srcIdList.size() > maxSize) {
            srcIdList = srcIdList.subList(0, maxSize);
        }
        return srcIdList;
    }

    @Override
    public Mono<Map<String, Boolean>> getFeatureFlagsForCurrentUser() {
        return featureFlagService.getAllFeatureFlagsForUser();
    }

    /**
     * Removes provided workspace id and all other application id under that workspace from the user data
     *
     * @param workspaceId workspace id
     * @return update result obtained from DB
     */
    @Override
    public Mono<UpdateResult> removeRecentWorkspaceAndApps(String userId, String workspaceId) {

        return applicationRepository
                .getAllApplicationId(workspaceId)
                .flatMap(appIdsList -> repository.removeIdFromRecentlyUsedList(userId, workspaceId, appIdsList));
    }

    /**
     * Returns the GitProfile for the currently logged in user
     * @return Mono of GitProfile
     */
    @Override
    public Mono<GitProfile> getGitProfileForCurrentUser(String defaultApplicationId) {
        return getForCurrentUser()
                .flatMap(userData -> {
                    if (CollectionUtils.isNullOrEmpty(userData.getGitProfiles())
                            || userData.getGitProfileByKey(DEFAULT) == null) {
                        return sessionUserService.getCurrentUser().flatMap(user -> {
                            GitProfile gitProfile = new GitProfile();
                            if (StringUtils.hasLength(user.getName())) {
                                gitProfile.setAuthorName(user.getName());
                            } else {
                                if (user.getUsername().indexOf("@") > 0) {
                                    gitProfile.setAuthorName(user.getUsername().split("@")[0]);
                                } else {
                                    gitProfile.setAuthorName(user.getUsername());
                                }
                            }

                            gitProfile.setAuthorEmail(user.getEmail());
                            Map<String, GitProfile> updateProfiles = userData.getGitProfiles();
                            if (CollectionUtils.isNullOrEmpty(updateProfiles)) {
                                updateProfiles = Map.of(DEFAULT, gitProfile);
                            } else {
                                updateProfiles.put(DEFAULT, gitProfile);
                            }

                            userData.setGitProfiles(updateProfiles);
                            return updateForCurrentUser(userData);
                        });
                    }
                    return Mono.just(userData);
                })
                .map(currentUserData -> {
                    GitProfile authorProfile = currentUserData.getGitProfileByKey(defaultApplicationId);

                    if (authorProfile == null
                            || !StringUtils.hasLength(authorProfile.getAuthorName())
                            || Boolean.TRUE.equals(authorProfile.getUseGlobalProfile())) {

                        // Use default author profile as the fallback value
                        if (currentUserData.getGitProfileByKey(DEFAULT) != null) {
                            authorProfile = currentUserData.getGitProfileByKey(DEFAULT);
                        }
                    }
                    return authorProfile;
                });
    }
}
