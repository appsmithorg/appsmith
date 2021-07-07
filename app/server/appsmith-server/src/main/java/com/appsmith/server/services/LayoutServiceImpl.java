package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Slf4j
@Service
public class LayoutServiceImpl implements LayoutService {

    private final NewPageService newPageService;

    @Autowired
    public LayoutServiceImpl(NewPageService newPageService) {
        this.newPageService = newPageService;
    }

    @Override
    public Mono<Layout> createLayout(String pageId, Layout layout) {
        if (pageId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        // fetch the unpublished page
        Mono<PageDTO> pageMono = newPageService
                .findPageById(pageId, AclPermission.MANAGE_PAGES, false)
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

}

