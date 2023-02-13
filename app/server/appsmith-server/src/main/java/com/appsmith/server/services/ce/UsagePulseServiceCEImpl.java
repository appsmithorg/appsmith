package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ce.UsagePulseRepositoryCE;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang.StringUtils;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class UsagePulseServiceCEImpl implements UsagePulseServiceCE {

    private final UsagePulseRepositoryCE repository;

    private final SessionUserService sessionUserService;

    private final UserService userService;

    private final TenantService tenantService;

    private final ConfigService configService;

    private final CommonConfig commonConfig;

    /**
     * To create a usage pulse
     * @param usagePulseDTO UsagePulseDTO
     * @return Mono of UsagePulse
     */
    @Override
    public Mono<UsagePulse> createPulse(UsagePulseDTO usagePulseDTO) {
        if (null == usagePulseDTO.getViewMode()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.VIEW_MODE));
        }

        // Remove usage pulse logging for appsmith-cloud until multi-tenancy is introduced
        // TODO remove this condition after multi-tenancy is introduced
        if (Boolean.TRUE.equals(commonConfig.isCloudHosting())) {
            return Mono.just(new UsagePulse());
        }

        UsagePulse usagePulse = new UsagePulse();
        usagePulse.setEmail(null);
        usagePulse.setViewMode(usagePulseDTO.getViewMode());

        Mono<User> currentUserMono = sessionUserService.getCurrentUser();
        // TODO: Change to getCurrentTenantId once multi-tenancy in introduced
        Mono<String> tenantIdMono = tenantService.getDefaultTenantId();
        Mono<String> instanceIdMono = configService.getInstanceId();

        return Mono.zip(currentUserMono, tenantIdMono, instanceIdMono)
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    String tenantId = tuple.getT2();
                    String instanceId = tuple.getT3();
                    usagePulse.setTenantId(tenantId);
                    usagePulse.setInstanceId(instanceId);

                    if (user.isAnonymous()) {
                        if (null == usagePulseDTO.getAnonymousUserId()) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ANONYMOUS_USER_ID));
                        }
                        usagePulse.setIsAnonymousUser(true);
                        usagePulse.setUser(usagePulseDTO.getAnonymousUserId());
                    }
                    else {
                        usagePulse.setIsAnonymousUser(false);
                        if (user.getHashedEmail() == null || StringUtils.isEmpty(user.getHashedEmail())) {
                            String hashedEmail = DigestUtils.sha256Hex(user.getEmail());
                            usagePulse.setUser(hashedEmail);
                            // Hashed user email is stored to user for future mapping of user and pulses
                            User updateUser = new User();
                            updateUser.setHashedEmail(hashedEmail);

                            // Avoid updating the ACL fields
                            updateUser.setGroupIds(null);
                            updateUser.setPolicies(null);
                            updateUser.setPermissions(null);

                            return userService.updateWithoutPermission(user.getId(), updateUser)
                                    .then(save(usagePulse));
                        }
                        usagePulse.setUser(user.getHashedEmail());
                    }
                    return save(usagePulse);
                });
    }

    /**
     * To save usagePulse to the database
     * @param usagePulse UsagePulse
     * @return Mono of UsagePulse
     */
    public Mono<UsagePulse> save(UsagePulse usagePulse) {
        return repository.save(usagePulse);
    }

}
