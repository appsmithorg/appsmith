package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
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
        // The published layout needs the read permission; the draft layout needs the edit permission.
        AclPermission permission =
                Boolean.TRUE.equals(viewMode) ? pagePermission.getReadPermission() : pagePermission.getEditPermission();
        return newPageService
                .findNewPageByIdAndLayoutsId(pageId, layoutId, permission, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .flatMap(newPage -> newPageService
                        .getPageByViewMode(newPage, viewMode)
                        .map(page -> {
                            List<Layout> layoutList = page.getLayouts();
                            // The lookup matched this layoutId, so the layout is in the list.
                            Layout matchedLayout = layoutList.stream()
                                    .filter(layout -> layout.getId().equals(layoutId))
                                    .findFirst()
                                    .get();
                            matchedLayout.setViewMode(viewMode);
                            // The edit-mode read returns the page revision. A client can send it back on a
                            // layout update. The server then refuses the update if the page changed in between.
                            if (!Boolean.TRUE.equals(viewMode) && newPage.getUpdatedAt() != null) {
                                matchedLayout.setRevision(
                                        String.valueOf(newPage.getUpdatedAt().toEpochMilli()));
                            }
                            return matchedLayout;
                        }));
    }
}
