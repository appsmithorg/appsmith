package com.appsmith.git.service;

import com.appsmith.git.dto.BashFunctionResult;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
public class BashService {

    // Executes bash function from classpath resource
    public Mono<BashFunctionResult> callFunction(String classpathResource, String functionName, String... args) {
        return Mono.fromCallable(() -> callFunctionUnBounded(classpathResource, functionName, args))
                .subscribeOn(Schedulers.boundedElastic());
    }

    // Executes bash script and returns result
    private BashFunctionResult callFunctionUnBounded(String classpathResource, String functionName, String... args)
            throws IOException {
        InputStream scriptContentInputStream =
                BashService.class.getClassLoader().getResourceAsStream(classpathResource);
        if (scriptContentInputStream == null) {
            throw new FileNotFoundException("Resource not found: " + classpathResource);
        }
        String scriptContent = new String(scriptContentInputStream.readAllBytes(), StandardCharsets.UTF_8);

        String fullScript = buildFullCommand(scriptContent, functionName, args);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
        ByteArrayInputStream inputStream = new ByteArrayInputStream(fullScript.getBytes(StandardCharsets.UTF_8));

        CommandLine cmdLine = new CommandLine("bash");

        DefaultExecutor executor = new DefaultExecutor();
        executor.setStreamHandler(new PumpStreamHandler(outputStream, errorStream, inputStream));

        Integer exitCode = null;
        String exceptionError = null;
        try {
            exitCode = executor.execute(cmdLine);
        } catch (Exception e) {
            exceptionError = e.getMessage();
        }

        String output = outputStream.toString(StandardCharsets.UTF_8).trim();
        String error = errorStream.toString(StandardCharsets.UTF_8).trim();

        if (exceptionError != null || exitCode != 0) {
            throw new RuntimeException(
                    "Bash execution failed: " + buildErrorDetails(output, error, exceptionError, exitCode));
        }

        log.info("Script: {}", fullScript);
        log.info("Output: {}", output);
        log.info("Error: {}", error);
        log.info("Exit code: {}", exitCode);

        outputStream.close();
        errorStream.close();
        inputStream.close();

        return new BashFunctionResult(output, exitCode, error);
    }

    // Builds complete bash command with args
    private String buildFullCommand(String scriptContent, String functionName, String... args) {
        String variableAssignments = IntStream.range(0, args.length)
                .mapToObj(i -> String.format("arg%d=\"%s\"", i + 1, args[i]))
                .collect(Collectors.joining("\n"));

        String functionCall = functionName
                + " "
                + IntStream.range(0, args.length)
                        .mapToObj(i -> String.format("\"$arg%d\"", i + 1))
                        .collect(Collectors.joining(" "));

        return scriptContent + "\n" + variableAssignments + "\n" + functionCall;
    }

    // Returns fallback if string is blank
    private String fallbackIfBlank(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    // Returns fallback if integer is null
    private String fallbackIfBlank(Integer value, String fallback) {
        return (value == null) ? fallback : value.toString();
    }

    // Formats error details for exception
    private String buildErrorDetails(String output, String error, String exceptionError, Integer exitCode) {
        return "EXITCODE: %s\nEXCEPTION: %s\nSTDERR: %s\nSTDOUT: %s"
                .formatted(
                        fallbackIfBlank(exitCode, "(empty)"),
                        fallbackIfBlank(output, "(empty)"),
                        fallbackIfBlank(error, "(empty)"),
                        fallbackIfBlank(exceptionError, "(none)"));
    }
}
