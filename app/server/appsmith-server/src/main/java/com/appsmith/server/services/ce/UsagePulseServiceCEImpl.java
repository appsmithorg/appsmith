package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.cakes.UsagePulseRepositoryCake;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@RequiredArgsConstructor
public class UsagePulseServiceCEImpl implements UsagePulseServiceCE {

    private final UsagePulseRepositoryCake repository;

    private final SessionUserService sessionUserService;

    private final UserService userService;

    private final OrganizationService organizationService;

    private final ConfigService configService;

    private final CommonConfig commonConfig;

    /**
     * To create a usage pulse
     *
     * @param usagePulseDTO UsagePulseDTO
     * @return Mono of UsagePulse
     */
    @Override
    public Mono<UsagePulse> createPulse(UsagePulseDTO usagePulseDTO) {
        if (null == usagePulseDTO.getViewMode()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.VIEW_MODE));
        } else if (FALSE.equals(usagePulseDTO.getViewMode()) && usagePulseDTO.getAnonymousUserId() != null) {
            // We don't expect anonymous user to have access to edit mode
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ANONYMOUS_USER_ID));
        }

        // TODO remove this condition after multi-tenancy is introduced
        if (TRUE.equals(commonConfig.isCloudHosting())) {
            return Mono.just(new UsagePulse());
        }

        UsagePulse usagePulse = new UsagePulse();
        usagePulse.setEmail(null);
        usagePulse.setViewMode(usagePulseDTO.getViewMode());

        Mono<User> currentUserMono = sessionUserService.getCurrentUser();
        Mono<String> defaultOrganizationIdMono = organizationService.getDefaultOrganizationId();
        Mono<String> instanceIdMono = configService.getInstanceId();

        return Mono.zip(currentUserMono, defaultOrganizationIdMono, instanceIdMono)
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    String organizationId = tuple.getT2();
                    String instanceId = tuple.getT3();
                    usagePulse.setOrganizationId(organizationId);
                    usagePulse.setInstanceId(instanceId);

                    if (user.isAnonymous()) {
                        if (null == usagePulseDTO.getAnonymousUserId()) {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INVALID_PARAMETER, FieldName.ANONYMOUS_USER_ID));
                        }
                        usagePulse.setIsAnonymousUser(true);
                        usagePulse.setUser(usagePulseDTO.getAnonymousUserId());
                        return save(usagePulse);
                    }
                    usagePulse.setIsAnonymousUser(false);
                    BridgeUpdate updateUserObj = Bridge.update();

                    String hashedEmail = user.getHashedEmail();
                    if (StringUtils.isEmpty(hashedEmail)) {
                        hashedEmail = DigestUtils.sha256Hex(user.getEmail());
                        // Hashed user email is stored to user for future mapping of user and pulses
                        updateUserObj.set(User.Fields.hashedEmail, hashedEmail);
                    }
                    usagePulse.setUser(hashedEmail);

                    updateUserObj.set(User.Fields.lastActiveAt, Instant.now());

                    return userService
                            .updateWithoutPermission(user.getId(), updateUserObj)
                            .then(save(usagePulse));
                });
    }

    /**
     * To save usagePulse to the database
     *
     * @param usagePulse UsagePulse
     * @return Mono of UsagePulse
     */
    public Mono<UsagePulse> save(UsagePulse usagePulse) {
        return repository.save(usagePulse);
    }
}
