package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.JsSnippetsRequestDTO;
import com.appsmith.server.dtos.JsSnippetDTO;
import com.appsmith.server.dtos.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(Url.JS_SNIPPETS_URL)
@Slf4j
public class JsSnippetsController {

    @Autowired
    public JsSnippetsController() {}

    /**
     * This API returns dummy response so that the client can test its features, while the actual API
     * gets implemented.
     */
    @PostMapping("getDummy")
    public Mono<ResponseDTO<List<JsSnippetDTO>>> getSnippetsTest(@RequestBody JsSnippetsRequestDTO snippetsDTO) {
        log.debug("Going to fetch JS snippets for request: {}", snippetsDTO);

        /**
         * JS snippet for concat method.
         */
        JsSnippetDTO testResponse1 = new JsSnippetDTO();
        testResponse1.setTitle("Concat");
        List<String> args1 = new ArrayList<>();
        args1.add("array (Array): The array to concatenate");
        testResponse1.setArgs(args1);
        testResponse1.setResponse("(Array): Returns the new concatenated array.");
        testResponse1.setSummary("Merge data from two entities into a single response.");
        testResponse1.setSnippet("{{ _.concat(array) }}");
        String example1 = "var first = api1.data;\n" +
                "var second = api2.data;\n" +
                "var mergedData = first.concat(second)\n" +
                "\n" +
                "console.log(mergedData)\n";
        testResponse1.setExample(example1);

        /**
         * JS snippet for compact method.
         */
        JsSnippetDTO testResponse2 = new JsSnippetDTO();
        testResponse2.setTitle("Compact");
        List<String> args2 = new ArrayList<>();
        args2.add("array (Array): The array to compact.");
        testResponse2.setArgs(args2);
        testResponse2.setResponse("(Array): Returns the new array of filtered values.");
        testResponse2.setSummary("Creates an array with all falsey values removed. The values false, null, 0, \"\", " +
                "undefined, and NaN are falsey.");
        testResponse2.setSnippet("{{ _.compact(array) }}");
        String example2 = "_.compact([0, 1, false, 2, '', 3]);\n" +
                "// => [1, 2, 3]";
        testResponse2.setExample(example2);
        
        List<JsSnippetDTO> dummySnippetsList = new ArrayList<>();
        dummySnippetsList.add(testResponse1);
        dummySnippetsList.add(testResponse2);

        return Mono.just(new ResponseDTO<>(HttpStatus.OK.value(), dummySnippetsList, null));
    }
}
