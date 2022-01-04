package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ItemService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.MARKETPLACE_ITEM_URL)
public class ItemControllerCE {
    private final ItemService service;

    public ItemControllerCE(ItemService service) {
        this.service = service;
    }

    @GetMapping("")
    public Mono<ResponseDTO<List<ItemDTO>>> getAll(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all items by parameters " + params);
        return service.get(params).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PostMapping("/addToPage")
    public Mono<ResponseDTO<ActionDTO>> addItemToPage(@RequestBody AddItemToPageDTO addItemToPageDTO) {
        log.debug("Going to add item {} to page {} with new name {}", addItemToPageDTO.getMarketplaceElement().getItem().getName(),
                addItemToPageDTO.getPageId(), addItemToPageDTO.getName());
        return service.addItemToPage(addItemToPageDTO)
                .map(action -> new ResponseDTO<>(HttpStatus.CREATED.value(), action, null));
    }
}
