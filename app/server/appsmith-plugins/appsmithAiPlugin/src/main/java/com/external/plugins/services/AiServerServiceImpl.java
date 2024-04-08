package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.dtos.AssociateDTO;
import com.external.plugins.dtos.FileStatusDTO;
import com.external.plugins.dtos.ResponseDTO;
import com.external.plugins.dtos.SourceDetails;
import com.external.plugins.utils.HeadersUtil;
import com.external.plugins.utils.RequestUtils;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.FILE_IDS;
import static com.external.plugins.constants.AppsmithAiConstants.SOURCE_DETAILS;

public class AiServerServiceImpl implements AiServerService {
    private final Gson gson = new GsonBuilder().create();

    @Override
    public Mono<Void> associateDatasource(AssociateDTO associateDTO) {
        URI uri = RequestUtils.getAssociateUri();
        String jsonBody = gson.toJson(associateDTO);

        return RequestUtils.makeRequest(
                        HttpMethod.POST,
                        uri,
                        MediaType.APPLICATION_JSON,
                        new HashMap<>(),
                        BodyInserters.fromValue(jsonBody))
                .flatMap(RequestUtils::handleResponse)
                .then();
    }

    @Override
    public Mono<Void> disassociateDatasource(AssociateDTO associateDTO) {
        URI uri = RequestUtils.getAssociateUri();
        String jsonBody = gson.toJson(associateDTO);

        return RequestUtils.makeRequest(
                        HttpMethod.DELETE,
                        uri,
                        MediaType.APPLICATION_JSON,
                        new HashMap<>(),
                        BodyInserters.fromValue(jsonBody))
                .flatMap(RequestUtils::handleResponse)
                .then();
    }

    @Override
    public Mono<FileStatusDTO> getFilesStatus(List<String> fileIds, SourceDetails sourceDetails) {
        Map<String, Object> body = new HashMap<>();
        body.put(FILE_IDS, fileIds);
        String jsonBody = gson.toJson(body);
        Type responseDTOType = new TypeToken<ResponseDTO<FileStatusDTO>>() {}.getType();

        return RequestUtils.makeRequest(
                        HttpMethod.POST,
                        RequestUtils.getFileStatusUri(),
                        MediaType.APPLICATION_JSON,
                        createSourceDetailsHeader(sourceDetails),
                        BodyInserters.fromValue(jsonBody))
                .flatMap(responseEntity -> RequestUtils.handleResponse(responseEntity, responseDTOType))
                .map(responseDTO -> ((ResponseDTO<FileStatusDTO>) responseDTO).getData());
    }

    @Override
    public Mono<Object> uploadFiles(List<FilePart> fileParts, SourceDetails sourceDetails) {
        return RequestUtils.makeRequest(
                        HttpMethod.POST,
                        RequestUtils.getFileUploadUri(),
                        createSourceDetailsHeader(sourceDetails),
                        fileParts)
                .flatMap(RequestUtils::handleResponse);
    }

    @Override
    public Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO, SourceDetails sourceDetails) {
        URI uri = RequestUtils.getQueryUri();
        String jsonBody = gson.toJson(aiServerRequestDTO);
        return RequestUtils.makeRequest(
                        HttpMethod.POST,
                        uri,
                        MediaType.APPLICATION_JSON,
                        createSourceDetailsHeader(sourceDetails),
                        BodyInserters.fromValue(jsonBody))
                .flatMap(RequestUtils::handleResponse);
    }

    private Map<String, String> createSourceDetailsHeader(SourceDetails sourceDetails) {
        Map<String, String> headers = new HashMap<>();
        headers.put(SOURCE_DETAILS, HeadersUtil.createSourceDetailsHeader(sourceDetails));
        return headers;
    }
}
