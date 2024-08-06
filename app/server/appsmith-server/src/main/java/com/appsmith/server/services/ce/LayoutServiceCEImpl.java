package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class LayoutServiceCEImpl implements LayoutServiceCE {

    private final NewPageService newPageService;
    private final PagePermission pagePermission;

    @Override
    public Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode) {
        return newPageService
                .findByIdAndLayoutsId(pageId, layoutId, pagePermission.getReadPermission(), viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    // Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the
                    // layoutId here.
                    Layout matchedLayout = layoutList.stream()
                            .filter(layout -> layout.getId().equals(layoutId))
                            .findFirst()
                            .get();
                    matchedLayout.setViewMode(viewMode);
                    return matchedLayout;
                });
    }
}
