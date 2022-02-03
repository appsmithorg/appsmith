package com.appsmith.server.services;

import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserOrganizationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserOrganizationServiceImpl extends UserOrganizationServiceCEImpl implements UserOrganizationService {

    public UserOrganizationServiceImpl(SessionUserService sessionUserService,
                                       OrganizationRepository organizationRepository,
                                       UserRepository userRepository,
                                       UserDataRepository userDataRepository,
                                       PolicyUtils policyUtils,
                                       EmailSender emailSender,
                                       UserDataService userDataService) {

        super(sessionUserService, organizationRepository, userRepository, userDataRepository, policyUtils, emailSender,
                userDataService);
    }
}
