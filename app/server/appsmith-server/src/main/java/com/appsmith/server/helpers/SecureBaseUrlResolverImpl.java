package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.SecureBaseUrlResolverCEImpl;
import org.springframework.stereotype.Component;

/**
 * CE concrete bean for {@link SecureBaseUrlResolver}. EE replaces this class with
 * a multi-org-aware variant that derives the trusted host from the organization
 * configuration when the {@code license_multi_org_enabled} feature flag is on.
 */
@Component
public class SecureBaseUrlResolverImpl extends SecureBaseUrlResolverCEImpl implements SecureBaseUrlResolver {}
