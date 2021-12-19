package com.appsmith.server.services.ce;

import com.appsmith.server.constants.CommentOnboardingState;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
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
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.server.solutions.UserChangedHandler;
import com.mongodb.DBObject;
import com.mongodb.client.result.UpdateResult;
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

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;


public class UserDataServiceCEImpl extends BaseService<UserDataRepository, UserData, String> implements UserDataServiceCE {

    private final UserRepository userRepository;

    private final SessionUserService sessionUserService;

    private final AssetService assetService;

    private final ReleaseNotesService releaseNotesService;

    private final FeatureFlagService featureFlagService;

    private final UserChangedHandler userChangedHandler;

    private final ApplicationRepository applicationRepository;

    private static final int MAX_PROFILE_PHOTO_SIZE_KB = 1024;


    @Autowired
    public UserDataServiceCEImpl(Scheduler scheduler,
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
                                 ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userRepository = userRepository;
        this.releaseNotesService = releaseNotesService;
        this.assetService = assetService;
        this.sessionUserService = sessionUserService;
        this.featureFlagService = featureFlagService;
        this.userChangedHandler = userChangedHandler;
        this.applicationRepository = applicationRepository;
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
        return sessionUserService.getCurrentUser()
                .map(User::getEmail)
                .flatMap(this::getForUserEmail);
    }

    @Override
    public Mono<UserData> getForUserEmail(String email) {
        return userRepository.findByEmail(email)
                .flatMap(this::getForUser);
    }

    @Override
    public Mono<UserData> updateForCurrentUser(UserData updates) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userRepository.findByEmail(user.getEmail()))
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
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, fieldName(QUserData.userData.userId)));
        }

        Query query = new Query(Criteria.where(fieldName(QUserData.userData.userId)).is(userId));

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        DBObject update = getDbObject(resource);

        Update updateObj = new Update();
        Map<String, Object> updateMap = update.toMap();
        updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

        return mongoTemplate.updateFirst(query, updateObj, resource.getClass())
                .flatMap(updateResult -> updateResult.getMatchedCount() == 0 ? Mono.empty() : repository.findByUserId(userId))
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
                .switchIfEmpty(userRepository
                        .findByEmail(user.getEmail())
                        .flatMap(user1 -> Mono.justOrEmpty(user1.getId()))
                )
                .flatMap(userId -> repository.saveReleaseNotesViewedVersion(userId, version))
                .thenReturn(user);
    }

    @Override
    public Mono<User> ensureViewedCurrentVersionReleaseNotes(User user) {
        return getForUser(user)
                .flatMap(userData -> {
                    if (userData != null && userData.getReleaseNotesViewedVersion() == null) {
                        return setViewedCurrentVersionReleaseNotes(user);
                    }
                    return Mono.just(user);
                });
    }

    @Override
    public Mono<UserData> saveProfilePhoto(Part filePart) {
        final Mono<String> prevAssetIdMono = getForCurrentUser()
                .map(userData -> ObjectUtils.defaultIfNull(userData.getProfilePhotoAssetId(), ""));

        final Mono<Asset> uploaderMono = assetService.upload(filePart, MAX_PROFILE_PHOTO_SIZE_KB, true);

        return Mono.zip(prevAssetIdMono, uploaderMono)
                .flatMap(tuple -> {
                    final String oldAssetId = tuple.getT1();
                    final Asset uploadedAsset = tuple.getT2();
                    final UserData updates = new UserData();
                    updates.setProfilePhotoAssetId(uploadedAsset.getId());
                    final Mono<UserData> updateMono = updateForCurrentUser(updates).map(userData -> {
                        userChangedHandler.publish(userData.getUserId(), uploadedAsset.getId());
                        return userData;
                    });
                    if (StringUtils.isEmpty(oldAssetId)) {
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
                    userChangedHandler.publish(userData.getUserId(), null);
                    return repository.save(userData).thenReturn(profilePhotoAssetId);
                })
                .flatMap(assetService::remove);
    }

    @Override
    public Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, String email) {
        return getForUserEmail(email)
                .flatMap(userData -> makeProfilePhotoResponse(exchange, userData));
    }

    @Override
    public Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange) {
        return getForCurrentUser()
                .flatMap(userData -> makeProfilePhotoResponse(exchange, userData));
    }

    private Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, UserData userData) {
        return Mono.justOrEmpty(userData.getProfilePhotoAssetId())
                .flatMap(assetId -> assetService.makeImageResponse(exchange, assetId));
    }

    /**
     * The application.organizationId is prepended to the list {@link UserData#getRecentlyUsedOrgIds}.
     * The application.id is prepended to the list {@link UserData#getRecentlyUsedAppIds()}.
     *
     * @param application@return Updated {@link UserData}
     */
    @Override
    public Mono<UserData> updateLastUsedAppAndOrgList(Application application) {
        return this.getForCurrentUser().flatMap(userData -> {
            // set recently used organization ids
            userData.setRecentlyUsedOrgIds(
                    addIdToRecentList(userData.getRecentlyUsedOrgIds(), application.getOrganizationId(), 10)
            );
            // set recently used application ids
            userData.setRecentlyUsedAppIds(
                    addIdToRecentList(userData.getRecentlyUsedAppIds(), application.getId(), 20)
            );
            return repository.save(userData);
        });
    }

    private List<String> addIdToRecentList(List<String> srcIdList, String newId, int maxSize) {
        if(srcIdList == null) {
            srcIdList = new ArrayList<>();
        }
        CollectionUtils.putAtFirst(srcIdList, newId);

        // check if there is any duplicates, remove if exists
        if(srcIdList.size() > 1) {
            CollectionUtils.removeDuplicates(srcIdList);
        }
        // keeping the last 10 org ids, there may be a lot of deleted organization ids which are not used anymore
        if(srcIdList.size() > maxSize) {
            srcIdList = srcIdList.subList(0, maxSize);
        }
        return srcIdList;
    }

    @Override
    public Mono<Map<String, Boolean>> getFeatureFlagsForCurrentUser() {
        return featureFlagService.getAllFeatureFlagsForUser();
    }

    @Override
    public Mono<UserData> setCommentState(CommentOnboardingState commentOnboardingState) {
        if(commentOnboardingState != CommentOnboardingState.SKIPPED && commentOnboardingState != CommentOnboardingState.ONBOARDED) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, QUserData.userData.commentOnboardingState));
        }
        return this.getForCurrentUser().flatMap(userData -> {
            userData.setCommentOnboardingState(commentOnboardingState);
            return repository.save(userData);
        });
    }

    /**
     * Removes provided organization id and all other application id under that organization from the user data
     * @param organizationId organization id
     * @return update result obtained from DB
     */
    @Override
    public Mono<UpdateResult> removeRecentOrgAndApps(String userId, String organizationId) {
        return applicationRepository.getAllApplicationId(organizationId).flatMap(appIdsList ->
            repository.removeIdFromRecentlyUsedList(userId, organizationId, appIdsList)
        );
    }
}
