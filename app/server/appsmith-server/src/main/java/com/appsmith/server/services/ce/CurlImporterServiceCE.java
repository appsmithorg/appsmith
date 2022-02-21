package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithException;

import java.util.List;

public interface CurlImporterServiceCE extends ApiImporterCE{

    ActionDTO curlToAction(String command, String name) throws AppsmithException;

    ActionDTO curlToAction(String command) throws AppsmithException;

    List<String> lex(String text);

    List<String> normalize(List<String> tokens);

    ActionDTO parse(List<String> tokens) throws AppsmithException;

}
