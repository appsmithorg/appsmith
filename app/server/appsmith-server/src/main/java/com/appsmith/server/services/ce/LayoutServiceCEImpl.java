package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.NewPageService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Slf4j
public class LayoutServiceCEImpl implements LayoutServiceCE {

    private final NewPageService newPageService;
    private final ResponseUtils responseUtils;

    @Autowired
    public LayoutServiceCEImpl(NewPageService newPageService,
                             ResponseUtils responseUtils) {
        this.newPageService = newPageService;
        this.responseUtils = responseUtils;
    }

    @Override
    public Mono<Layout> createLayout(String pageId, Layout layout) {
        if (pageId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        // fetch the unpublished page
        Mono<PageDTO> pageMono = newPageService
                .findPageById(pageId, MANAGE_PAGES, false)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID)));

        return pageMono
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    if (layoutList == null) {
                        //no layouts exist for this page
                        layoutList = new ArrayList<Layout>();
                    }
                    //Adding an Id to the layout to ensure that a layout can be referred to by its ID as well.
                    layout.setId(new ObjectId().toString());

                    layoutList.add(layout);
                    page.setLayouts(layoutList);
                    return page;
                })
                .flatMap(newPageService::saveUnpublishedPage)
                .then(Mono.just(layout));
    }

    @Override
    public Mono<Layout> createLayout(String defaultPageId, Layout layout, String branchName) {
        if (StringUtils.isEmpty(branchName)) {
            return createLayout(defaultPageId, layout);
        }
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .flatMap(branchedPage ->  createLayout(branchedPage.getId(), layout))
                .map(responseUtils::updateLayoutWithDefaultResources);
    }

    @Override
    public Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode) {
        return newPageService.findByIdAndLayoutsId(pageId, layoutId, READ_PAGES, viewMode)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    Layout matchedLayout = layoutList.stream().filter(layout -> layout.getId().equals(layoutId)).findFirst().get();
                    matchedLayout.setViewMode(viewMode);
                    return matchedLayout;
                });
    }

    @Override
    public Mono<Layout> getLayout(String defaultPageId, String layoutId, Boolean viewMode, String branchName) {
        if (StringUtils.isEmpty(branchName)) {
            return getLayout(defaultPageId, layoutId, viewMode);
        }
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, MANAGE_PAGES)
                .flatMap(branchedPage ->  getLayout(branchedPage.getId(), layoutId, viewMode))
                .map(responseUtils::updateLayoutWithDefaultResources);
    }


}

