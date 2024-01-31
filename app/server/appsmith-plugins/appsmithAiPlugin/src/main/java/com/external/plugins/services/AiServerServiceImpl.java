package com.external.plugins.services;

import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.dtos.AssociateDTO;
import com.external.plugins.dtos.FileStatusDTO;
import com.external.plugins.dtos.ResponseDTO;
import com.external.plugins.utils.RequestUtils;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.FILE_IDS;

public class AiServerServiceImpl implements AiServerService {
    private final Gson gson = new GsonBuilder().create();

    @Override
    public Mono<Void> associateDatasource(AssociateDTO associateDTO) {
        URI uri = RequestUtils.getAssociateUri();
        String jsonBody = gson.toJson(associateDTO);

        return RequestUtils.makeRequest(HttpMethod.POST, uri, new HashMap<>(), BodyInserters.fromValue(jsonBody))
                .flatMap(RequestUtils::handleResponse)
                .then();
    }

    @Override
    public Mono<FileStatusDTO> getFilesStatus(List<String> fileIds) {
        Map<String, Object> body = new HashMap<>();
        body.put(FILE_IDS, fileIds);
        String jsonBody = gson.toJson(body);
        Type responseDTOType = new TypeToken<ResponseDTO<FileStatusDTO>>() {}.getType();

        return RequestUtils.makeRequest(
                        HttpMethod.POST,
                        RequestUtils.getFileStatusUri(),
                        new HashMap<>(),
                        BodyInserters.fromValue(jsonBody))
                .flatMap(responseEntity -> RequestUtils.handleResponse(responseEntity, responseDTOType))
                .map(responseDTO -> ((ResponseDTO<FileStatusDTO>) responseDTO).getData());
    }

    @Override
    public Mono<Object> uploadFiles(List<FilePart> fileParts) {
        return RequestUtils.makeRequest(HttpMethod.POST, RequestUtils.getFileUploadUri(), new HashMap<>(), fileParts)
                .flatMap(RequestUtils::handleResponse);
    }

    @Override
    public Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO, Map<String, String> headers) {
        URI uri = RequestUtils.getQueryUri();
        String jsonBody = gson.toJson(aiServerRequestDTO);

        return RequestUtils.makeRequest(HttpMethod.POST, uri, headers, BodyInserters.fromValue(jsonBody))
                .flatMap(RequestUtils::handleResponse);
    }
}
