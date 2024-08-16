package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_PREFIX;

public class PageSpanCE {
    public static final String PAGES = "pages.";
    public static final String GET_PAGE = CONSOLIDATED_API_PREFIX + "getpage";
    public static final String GET_PAGE_WITHOUT_BRANCH = CONSOLIDATED_API_PREFIX + "without_branch";
    public static final String GET_PAGE_WITH_BRANCH = CONSOLIDATED_API_PREFIX + "with_branch";
    public static final String FETCH_PAGE_FROM_DB = CONSOLIDATED_API_PREFIX + "pagedb";

    public static final String FETCH_PAGES_BY_APP_ID_DB = PAGES + "pagesdb";
    public static final String MARK_RECENTLY_ACCESSED_RESOURCES_PAGES = PAGES + "recentlyaccessed";
    public static final String PREPARE_APPLICATION_PAGES_DTO_FROM_PAGES = PAGES + "applicationpagesdto";
}
