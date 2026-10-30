package edu.palm.advising.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ApiError(Instant.now(), exception.getStatus().value(),
                        exception.getStatus().getReasonPhrase(), exception.getMessage(), request.getRequestURI(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fields = exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, error -> error.getDefaultMessage() == null
                        ? "Invalid value" : error.getDefaultMessage(), (first, ignored) -> first));
        return ResponseEntity.badRequest().body(new ApiError(Instant.now(), 400, "Bad Request",
                "Check the submitted fields.", request.getRequestURI(), fields));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(Instant.now(), 409, "Conflict",
                "A record with the submitted unique value already exists.", request.getRequestURI(), Map.of()));
    }

    public record ApiError(Instant timestamp, int status, String error, String message, String path,
                           Map<String, String> fieldErrors) {
    }
}
