package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.plugins.solutions.PluginTriggerSolution;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@RequestMapping(Url.PLUGIN_URL)
@Slf4j
public class PluginControllerCE extends BaseController<PluginService, Plugin, String> {

    private final PluginTriggerSolution pluginTriggerSolution;

    @Autowired
    public PluginControllerCE(PluginService service, PluginTriggerSolution pluginTriggerSolution) {
        super(service);
        this.pluginTriggerSolution = pluginTriggerSolution;
    }

    @JsonView(Views.Public.class)
    @PostMapping("/install")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Workspace>> install(@Valid @RequestBody PluginWorkspaceDTO plugin) {
        return service.installPlugin(plugin)
                .map(workspace -> new ResponseDTO<>(HttpStatus.CREATED.value(), workspace, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/uninstall")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Workspace>> uninstall(@Valid @RequestBody PluginWorkspaceDTO plugin) {
        return service.uninstallPlugin(plugin)
                .map(workspace -> new ResponseDTO<>(HttpStatus.CREATED.value(), workspace, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{pluginId}/form")
    public Mono<ResponseDTO<Object>> getDatasourceForm(@PathVariable String pluginId) {
        return service.getFormConfig(pluginId).map(form -> new ResponseDTO<>(HttpStatus.OK.value(), form, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/default/icons")
    public Mono<ResponseDTO<List<Plugin>>> getDefaultPluginIcons() {
        return service.getDefaultPluginIcons()
                .collectList()
                .map(data -> new ResponseDTO<>(HttpStatus.OK.value(), data, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{pluginId}/trigger")
    public Mono<ResponseDTO<TriggerResultDTO>> trigger(
            @PathVariable String pluginId,
            @RequestBody TriggerRequestDTO triggerRequestDTO,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId,
            ServerWebExchange serverWebExchange) {
        log.debug("Trigger received for PLugin {}", pluginId);
        return pluginTriggerSolution
                .trigger(
                        pluginId,
                        environmentId,
                        triggerRequestDTO,
                        serverWebExchange.getRequest().getHeaders())
                .map(triggerResultDTO -> new ResponseDTO<>(HttpStatus.OK.value(), triggerResultDTO, null));
    }
}
