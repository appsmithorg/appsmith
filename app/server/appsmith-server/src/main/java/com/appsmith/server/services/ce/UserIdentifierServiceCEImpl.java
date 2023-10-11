package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;

public class UserIdentifierServiceCEImpl implements UserIdentifierServiceCE {

    private final CommonConfig commonConfig;

    @Autowired
    public UserIdentifierServiceCEImpl(CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
    }

    /**
     * This function returns the flagsmith userIdentifier.
     * If self-hosted then hashed email is returned.
     *
     * @param user
     * @return
     */
    @Override
    public String getUserIdentifier(User user) {
        String userIdentifier = user.getUsername();
        if (!commonConfig.isCloudHosting()) {
            userIdentifier = hash(user.getUsername());
        }
        return userIdentifier;
    }

    @Override
    public String hash(String value) {
        return value == null ? "" : DigestUtils.sha256Hex(value);
    }

    @Override
    public String getEmailDomain(String email) {
        String emailDomain = null;
        if (email != null) {
            int atIndex = email.indexOf('@');
            if (atIndex > 0) {
                emailDomain = email.substring(atIndex + 1).toLowerCase();
            }
        }
        return emailDomain;
    }
}
