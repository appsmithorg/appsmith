package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.SecureBaseUrlResolverCE;

/**
 * Marker interface used by Spring DI. CE provides a default
 * {@link com.appsmith.server.helpers.SecureBaseUrlResolverImpl}; EE overrides the
 * implementation class to add multi-org-aware resolution.
 */
public interface SecureBaseUrlResolver extends SecureBaseUrlResolverCE {}
