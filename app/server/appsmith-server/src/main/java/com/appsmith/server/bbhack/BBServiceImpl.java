package com.appsmith.server.bbhack;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.BuildingBlockHack;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.BBMainDTO;
import com.appsmith.server.dtos.BBResponseDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.BBHackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BBServiceImpl implements BBService {
    private final BBHackRepository repository;
    private final NewActionService newActionService;

    private BuildingBlockHack constructBBDomainFromDTO(BBMainDTO bbMainDTO) {
        BuildingBlockHack buildingBlock = new BuildingBlockHack();
        buildingBlock.setIcon(bbMainDTO.getIcon());
        buildingBlock.setName(bbMainDTO.getName());
        buildingBlock.setDsl(bbMainDTO.getDsl());
        buildingBlock.setActionIds(bbMainDTO.getActionIds());
        return buildingBlock;
    }

    private BBMainDTO prepareDTOFromDomain(BuildingBlockHack buildingBlockHack) {
        BBMainDTO bbMainDTO = new BBMainDTO();
        bbMainDTO.setId(buildingBlockHack.getId());
        bbMainDTO.setName(buildingBlockHack.getName());
        bbMainDTO.setDsl(buildingBlockHack.getDsl());
        bbMainDTO.setIcon(buildingBlockHack.getIcon());
        return bbMainDTO;
    }

    private BBMainDTO prepareDTOFromDomainLite(BuildingBlockHack buildingBlockHack) {
        BBMainDTO bbMainDTO = new BBMainDTO();
        bbMainDTO.setId(buildingBlockHack.getId());
        bbMainDTO.setName(buildingBlockHack.getName());
        bbMainDTO.setIcon(buildingBlockHack.getIcon());
        return bbMainDTO;
    }

    @Override
    public Mono<BBResponseDTO> createCustomBuildingBlock(BBMainDTO bbMainDTO) {
        return repository.save(constructBBDomainFromDTO(bbMainDTO)).flatMap(savedBB -> {
            BBResponseDTO bbResponseDTO = new BBResponseDTO();
            bbMainDTO.setId(savedBB.getId());
            bbResponseDTO.setBb(bbMainDTO);
            return Mono.just(bbResponseDTO);
        });
    }

    @Override
    public Mono<List<BBResponseDTO>> fetchAllBuildingBlocks() {
        return repository
                .findAll()
                .flatMap(buildingBlockHack -> {
                    Mono<List<ActionDTO>> actionsMono = getActionListMono(buildingBlockHack);
                    return Mono.zip(Mono.just(buildingBlockHack), actionsMono).flatMap(tuple2 -> {
                        BuildingBlockHack bb = tuple2.getT1();
                        List<ActionDTO> actionList = tuple2.getT2();
                        BBResponseDTO bbResponseDTO = new BBResponseDTO();
                        bbResponseDTO.setBb(prepareDTOFromDomain(bb));
                        bbResponseDTO.setActionList(actionList);

                        return Mono.just(bbResponseDTO);
                    });
                })
                .collectList()
                .map(bbResponseDTOS -> bbResponseDTOS);
    }

    @Override
    public Mono<List<BBResponseDTO>> fetchAllBuildingBlocksLite() {
        return repository
                .findAll()
                .flatMap(bb -> {
                    BBResponseDTO bbResponseDTO = new BBResponseDTO();
                    bbResponseDTO.setBb(prepareDTOFromDomainLite(bb));

                    return Mono.just(bbResponseDTO);
                })
                .collectList()
                .map(bbResponseDTOS -> bbResponseDTOS);
    }

    @Override
    public Mono<ApplicationJson> prepareApplicationJsonFromBB(BuildingBlockHack buildingBlockHack) {
        return null;
    }

    private Mono<List<ActionDTO>> getActionListMono(BuildingBlockHack buildingBlockHack) {
        Mono<List<ActionDTO>> actionsMono = newActionService
                .findAllById(buildingBlockHack.getActionIds())
                .flatMap(newAction -> Mono.just(newActionService.generateActionByViewMode(newAction, false)))
                .doOnNext(actionDTO -> {
                    actionDTO.setPageId(null);
                    actionDTO.setWorkspaceId(null);
                    actionDTO.setApplicationId(null);
                })
                .collectList();
        return actionsMono;
    }
}
