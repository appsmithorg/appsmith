package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping(Url.PAGE_LOAD_URL)
public class PageLoadController {

    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final ActionCollectionService actionCollectionService;
    private final PluginService pluginService;
    private final DatasourceService datasourceService;
    private final ThemeService themeService;
    private final CustomJSLibService customJSLibService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final UserDataService userDataService;
    private final TenantService tenantService;

    @Autowired
    public PageLoadController(
            NewActionService newActionService,
            NewPageService newPageService,
            ActionCollectionService actionCollectionService,
            PluginService pluginService,
            DatasourceService datasourceService,
            ThemeService themeService,
            CustomJSLibService customJSLibService,
            SessionUserService sessionUserService,
            UserService userService,
            UserDataService userDataService,
            TenantService tenantService) {
        this.newActionService = newActionService;
        this.newPageService = newPageService;
        this.actionCollectionService = actionCollectionService;
        this.pluginService = pluginService;
        this.datasourceService = datasourceService;
        this.themeService = themeService;
        this.customJSLibService = customJSLibService;
        this.sessionUserService = sessionUserService;
        this.userService = userService;
        this.userDataService = userDataService;
        this.tenantService = tenantService;
    }

    @JsonView(Views.Public.class)
    @GetMapping("/one-api/{pageId}")
    @ResponseStatus(HttpStatus.FOUND)
    public Mono<ResponseDTO<HashMap<String, Object>>> getData(
            @PathVariable String pageId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        HashMap<String, Object> result = new HashMap<>();

        Mono<List<ActionViewDTO>> actionDTOMono =
                newActionService.getActionsForViewMode(null, pageId, branchName).collectList();
        Mono<NewPage> pageMono = newPageService.getById(pageId);
        Mono<List<Plugin>> pluginsMono =
                pluginService.getAllPluginsUsingPageId(pageId).collectList();
        Mono<List<ActionCollectionViewDTO>> actionCollectionsMono = actionCollectionService
                .getActionCollectionsForViewMode(null, pageId, branchName)
                .collectList();
        Mono<List<CustomJSLib>> jsLibsMono =
                customJSLibService.getAllJSLibsInApplicationUsingPageId(pageId, branchName, true);
        Mono<List<Theme>> themesMono =
                themeService.getApplicationThemesUsingPageId(pageId, branchName).collectList();
        Mono<UserProfileDTO> userProfileDTOMono =
                sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO);
        Mono<Map<String, Boolean>> ffMono = userDataService.getFeatureFlagsForCurrentUser();
        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();

        return Mono.zip(
                        actionDTOMono,
                        pageMono,
                        pluginsMono,
                        actionCollectionsMono,
                        themesMono,
                        userProfileDTOMono,
                        ffMono,
                        tenantMono)
                .map(tuple8 -> {
                    List<ActionViewDTO> actions = tuple8.getT1();
                    NewPage page = tuple8.getT2();
                    List<Plugin> plugins = tuple8.getT3();
                    List<ActionCollectionViewDTO> actionCollections = tuple8.getT4();
                    List<Theme> themes = tuple8.getT5();
                    UserProfileDTO user = tuple8.getT6();
                    Map<String, Boolean> ff = tuple8.getT7();
                    Tenant tenant = tuple8.getT8();
                    result.put("page", page);
                    result.put("plugins", plugins);
                    result.put("actionCollections", actionCollections);
                    result.put("themes", themes);
                    result.put("user", user);
                    result.put("ff", ff);
                    result.put("tenant", tenant);
                    result.put("actions", actions);
                    return new ResponseDTO<>(HttpStatus.OK.value(), result, null);
                });
    }
}
