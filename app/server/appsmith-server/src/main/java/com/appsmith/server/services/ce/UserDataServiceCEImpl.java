package com.appsmith.server.services.ce;

import com.appsmith.external.enums.WorkspaceResourceContext;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.projections.UserDataProfilePhotoProjection;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ReleaseNotesService;
import jakarta.validation.Validator;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;

public class UserDataServiceCEImpl extends BaseService<UserDataRepository, UserData, String>
        implements UserDataServiceCE {

    private final UserRepository userRepository;

    private final SessionUserService sessionUserService;

    private final AssetService assetService;

    private final ReleaseNotesService releaseNotesService;

    private final FeatureFlagService featureFlagService;

    private final ApplicationRepository applicationRepository;

    private final ApplicationPermission applicationPermission;

    private final OrganizationService organizationService;

    private static final int MAX_PROFILE_PHOTO_SIZE_KB = 1024;

    private static final int MAX_RECENT_WORKSPACES_LIMIT = 10;

    private static final int MAX_RECENT_WORKSPACE_RESOURCE_LIMIT = 20;

    /**
     * Maximum number of applications a user can favorite.
     * This limit helps manage data size and UI performance.
     * To change this limit, update this constant value.
     * Default: 50
     */
    private static final int MAX_FAVORITE_APPLICATIONS_LIMIT = 50;

    @Autowired
    public UserDataServiceCEImpl(
            Validator validator,
            UserDataRepository repository,
            AnalyticsService analyticsService,
            UserRepository userRepository,
            SessionUserService sessionUserService,
            AssetService assetService,
            ReleaseNotesService releaseNotesService,
            FeatureFlagService featureFlagService,
            ApplicationRepository applicationRepository,
            ApplicationPermission applicationPermission,
            OrganizationService organizationService) {
        super(validator, repository, analyticsService);
        this.userRepository = userRepository;
        this.releaseNotesService = releaseNotesService;
        this.assetService = assetService;
        this.sessionUserService = sessionUserService;
        this.featureFlagService = featureFlagService;
        this.applicationRepository = applicationRepository;
        this.applicationPermission = applicationPermission;
        this.organizationService = organizationService;
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
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> userRepository.findByEmailAndOrganizationId(email, organizationId))
                .flatMap(this::getForUser);
    }

    @Override
    public Mono<Map<String, String>> getProfilePhotoAssetIdsForUserIds(Collection<String> userIds) {
        return repository
                .findByUserIdIn(userIds)
                .collectMap(
                        UserDataProfilePhotoProjection::getUserId,
                        UserDataProfilePhotoProjection::getProfilePhotoAssetId);
    }

    @Override
    public Mono<UserData> updateForCurrentUser(UserData updates) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> organizationService
                        .getCurrentUserOrganizationId()
                        .flatMap(organizationId ->
                                userRepository.findByEmailAndOrganizationId(user.getEmail(), organizationId)))
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
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, UserData.Fields.userId));
        }

        return repository
                .queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(resource)
                .flatMap(count -> count == 0 ? Mono.empty() : repository.findByUserId(userId))
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
                .switchIfEmpty(organizationService
                        .getCurrentUserOrganizationId()
                        .flatMap(organizationId ->
                                userRepository.findByEmailAndOrganizationId(user.getEmail(), organizationId))
                        .flatMap(user1 -> Mono.justOrEmpty(user1.getId())))
                .flatMap(userId -> repository
                        .saveReleaseNotesViewedVersion(userId, version)
                        .flatMap(count -> {
                            if (count == 0) {
                                final UserData userData = new UserData();
                                userData.setReleaseNotesViewedVersion(version);
                                userData.setUserId(user.getId());
                                return repository.save(userData).then();
                            }
                            return Mono.empty();
                        }))
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

    @Override
    public Mono<UserData> updateLastUsedResourceAndWorkspaceList(
            String resourceId, String workspaceId, WorkspaceResourceContext context) {
        return sessionUserService
                .getCurrentUser()
                .zipWhen(this::getForUser)
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    // Update recently used workspace and corresponding application ids
                    List<RecentlyUsedEntityDTO> recentlyUsedEntities = reorderWorkspacesInRecentlyUsedOrderForUser(
                            userData.getRecentlyUsedEntityIds(), workspaceId, MAX_RECENT_WORKSPACES_LIMIT);

                    if (!CollectionUtils.isNullOrEmpty(recentlyUsedEntities)) {
                        RecentlyUsedEntityDTO latest = recentlyUsedEntities.get(0);
                        // Get the correct resource id based on the context
                        List<String> existingResourceIds = getResourceIds(latest, context);
                        // Add the current applicationId to the list
                        setResourceIds(
                                latest,
                                context,
                                addIdToRecentList(
                                        existingResourceIds, resourceId, MAX_RECENT_WORKSPACE_RESOURCE_LIMIT));
                    }
                    userData.setRecentlyUsedEntityIds(recentlyUsedEntities);
                    return Mono.zip(
                            analyticsService.identifyUser(user, userData, workspaceId), repository.save(userData));
                })
                .map(Tuple2::getT2);
    }

    protected void setResourceIds(
            RecentlyUsedEntityDTO recentlyUsedEntityDTO,
            WorkspaceResourceContext workspaceResourceContext,
            List<String> resourceIds) {
        recentlyUsedEntityDTO.setApplicationIds(resourceIds);
    }

    protected List<String> getResourceIds(
            RecentlyUsedEntityDTO recentlyUsedEntityDTO, WorkspaceResourceContext context) {
        return recentlyUsedEntityDTO.getApplicationIds();
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
            srcIdList.subList(maxSize, srcIdList.size()).clear();
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
            srcIdList.subList(maxSize, srcIdList.size()).clear();
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
    public Mono<Void> removeRecentWorkspaceAndChildEntities(String userId, String workspaceId) {

        return applicationRepository
                .findIdsByWorkspaceId(workspaceId)
                .map(IdOnly::id)
                .collectList()
                .flatMap(appIdsList -> repository.removeEntitiesFromRecentlyUsedList(userId, workspaceId));
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

    /**
     * Toggle favorite status for an application
     * @param applicationId Application ID to toggle
     * @return Updated UserData with modified favorites list
     * @throws AppsmithException if the maximum favorite limit is reached when trying to add a favorite
     */
    @Override
    public Mono<UserData> toggleFavoriteApplication(String applicationId) {
        return sessionUserService.getCurrentUser().zipWhen(this::getForUser).flatMap(tuple -> {
            User user = tuple.getT1();
            UserData userData = tuple.getT2();

            // For new users without a persisted UserData document the atomic
            // repo operations will not match anything, so fall back to save.
            // If a concurrent request creates the document first (DuplicateKeyException),
            // retry through the atomic existing-user path.
            if (userData.getId() == null) {
                List<String> favorites = userData.getFavoriteApplicationIds();
                if (favorites == null) {
                    favorites = new ArrayList<>();
                }

                if (favorites.remove(applicationId)) {
                    userData.setFavoriteApplicationIds(favorites);
                    return repository.save(userData).onErrorResume(DuplicateKeyException.class, ex -> repository
                            .removeFavoriteApplicationForUser(user.getId(), applicationId)
                            .flatMap(count -> getForUser(user.getId())));
                }

                // Adding — verify access first
                AclPermission readPermission = applicationPermission.getReadPermission();
                List<String> finalFavorites = favorites;
                return applicationRepository
                        .queryBuilder()
                        .criteria(Bridge.equal(Application.Fields.id, applicationId))
                        .permission(readPermission)
                        .first()
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                        .flatMap(application -> {
                            if (finalFavorites.size() >= MAX_FAVORITE_APPLICATIONS_LIMIT) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INVALID_PARAMETER,
                                        String.format(
                                                "Maximum favorite applications limit (%d) reached. Please remove some favorites before adding new ones.",
                                                MAX_FAVORITE_APPLICATIONS_LIMIT)));
                            }
                            finalFavorites.add(applicationId);
                            userData.setFavoriteApplicationIds(finalFavorites);
                            return repository.save(userData).onErrorResume(DuplicateKeyException.class, ex -> repository
                                    .addFavoriteApplicationForUserIfUnderLimit(
                                            user.getId(), applicationId, MAX_FAVORITE_APPLICATIONS_LIMIT)
                                    .flatMap(matchedCount -> {
                                        if (matchedCount == 0) {
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.INVALID_PARAMETER,
                                                    String.format(
                                                            "Maximum favorite applications limit (%d) reached. Please remove some favorites before adding new ones.",
                                                            MAX_FAVORITE_APPLICATIONS_LIMIT)));
                                        }
                                        return getForUser(user.getId());
                                    }));
                        });
            }

            // For existing users, let the DB decide: try an atomic remove first.
            return repository
                    .removeFavoriteApplicationForUser(user.getId(), applicationId)
                    .flatMap(removedCount -> {
                        if (removedCount > 0) {
                            // Was in favorites and has been removed.
                            return getForUser(user.getId());
                        }

                        // Not in favorites — add it after verifying access.
                        AclPermission readPermission = applicationPermission.getReadPermission();
                        return applicationRepository
                                .queryBuilder()
                                .criteria(Bridge.equal(Application.Fields.id, applicationId))
                                .permission(readPermission)
                                .first()
                                .switchIfEmpty(Mono.error(new AppsmithException(
                                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                                .flatMap(application -> repository
                                        .addFavoriteApplicationForUserIfUnderLimit(
                                                user.getId(), applicationId, MAX_FAVORITE_APPLICATIONS_LIMIT)
                                        .flatMap(matchedCount -> {
                                            if (matchedCount == 0) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_PARAMETER,
                                                        String.format(
                                                                "Maximum favorite applications limit (%d) reached. Please remove some favorites before adding new ones.",
                                                                MAX_FAVORITE_APPLICATIONS_LIMIT)));
                                            }
                                            return getForUser(user.getId());
                                        }));
                    });
        });
    }

    /**
     * Get all favorite applications for current user
     * Filters out deleted applications and applications user no longer has access to
     * @return List of favorite applications
     */
    @Override
    public Mono<List<Application>> getFavoriteApplications() {
        return getForCurrentUser().flatMap(userData -> {
            List<String> favoriteIds = userData.getFavoriteApplicationIds();
            if (CollectionUtils.isNullOrEmpty(favoriteIds)) {
                return Mono.just(Collections.emptyList());
            }

            AclPermission readPermission = applicationPermission.getReadPermission();
            return applicationRepository
                    .queryBuilder()
                    .criteria(Bridge.in(Application.Fields.id, favoriteIds))
                    .permission(readPermission)
                    .all()
                    .collectList();
        });
    }

    /**
     * Remove application from all users' favorites when app is deleted
     * @param applicationId ID of deleted application
     */
    @Override
    public Mono<Void> removeApplicationFromAllFavorites(String applicationId) {
        return repository.removeApplicationFromFavorites(applicationId);
    }
}
