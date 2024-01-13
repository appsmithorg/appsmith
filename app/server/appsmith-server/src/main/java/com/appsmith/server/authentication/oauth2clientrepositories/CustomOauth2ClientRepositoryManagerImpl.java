package com.appsmith.server.authentication.oauth2clientrepositories;

import com.appsmith.server.authentication.oauth2clientrepositories.ce.CustomOauth2ClientRepositoryManagerCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomOauth2ClientRepositoryManagerImpl extends CustomOauth2ClientRepositoryManagerCEImpl
        implements CustomOauth2ClientRepositoryManager {}
