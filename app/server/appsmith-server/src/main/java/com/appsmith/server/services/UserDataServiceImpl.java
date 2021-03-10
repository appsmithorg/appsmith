package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.mongodb.DBObject;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Map;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

@Service
public class UserDataServiceImpl extends BaseService<UserDataRepository, UserData, String> implements UserDataService {

    private final UserService userService;

    private final SessionUserService sessionUserService;

    private final AssetService assetService;

    private final ReleaseNotesService releaseNotesService;

    private static final int MAX_PROFILE_PHOTO_SIZE_KB = 250;

    @Autowired
    public UserDataServiceImpl(Scheduler scheduler,
                               Validator validator,
                               MongoConverter mongoConverter,
                               ReactiveMongoTemplate reactiveMongoTemplate,
                               UserDataRepository repository,
                               AnalyticsService analyticsService,
                               UserService userService,
                               SessionUserService sessionUserService,
                               AssetService assetService,
                               ReleaseNotesService releaseNotesService
    ) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
        this.releaseNotesService = releaseNotesService;
        this.assetService = assetService;
        this.sessionUserService = sessionUserService;
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
        return userService.findByEmail(email)
                .flatMap(this::getForUser);
    }

    @Override
    public Mono<UserData> updateForCurrentUser(UserData updates) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> {
                    // If a UserData document exists for this user, update it. If not, create one.
                    updates.setUserId(user.getId());
                    final Mono<UserData> updaterMono = update(user.getId(), updates);
                    final Mono<UserData> creatorMono = Mono.just(updates).flatMap(this::create);
                    return updaterMono.switchIfEmpty(creatorMono);
                });
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
                .switchIfEmpty(userService
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

        final Mono<Asset> uploaderMono = assetService.upload(filePart, MAX_PROFILE_PHOTO_SIZE_KB);

        return Mono.zip(prevAssetIdMono, uploaderMono)
                .flatMap(tuple -> {
                    final String oldAssetId = tuple.getT1();
                    final Asset uploadedAsset = tuple.getT2();
                    final UserData updates = new UserData();
                    updates.setProfilePhotoAssetId(uploadedAsset.getId());
                    final Mono<UserData> updateMono = updateForCurrentUser(updates);
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
                .flatMap(userData -> Mono.justOrEmpty(userData.getProfilePhotoAssetId()))
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

}
