package com.appsmith.server.authentication.oauth2clientrepositories.ce;

import com.appsmith.server.authentication.oauth2clientrepositories.BaseClientRegistrationRepository;

public interface CustomOauth2ClientRepositoryManagerCE {

    BaseClientRegistrationRepository findClientRegistrationRepositoryByRegistrationId(String registrationId);
}
