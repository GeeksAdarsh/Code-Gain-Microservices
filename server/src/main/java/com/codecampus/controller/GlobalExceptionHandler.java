package com.codecampus.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (msg.contains("already submitted")) status = HttpStatus.CONFLICT;
        if (msg.contains("not found") || msg.contains("Not found")) status = HttpStatus.NOT_FOUND;
        if (msg.contains("not authorized") || msg.contains("Access denied")) status = HttpStatus.FORBIDDEN;
        return ResponseEntity.status(status).body(Map.of("message", msg));
    }
}
