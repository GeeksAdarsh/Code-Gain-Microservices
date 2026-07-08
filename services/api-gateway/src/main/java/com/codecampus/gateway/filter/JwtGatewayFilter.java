package com.codecampus.gateway.filter;

import com.codecampus.shared.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Global filter that:
 * 1. Lets unauthenticated public paths pass through.
 * 2. Validates the JWT Bearer token on all other requests.
 * 3. Injects X-User-Id, X-User-Name, X-User-Role headers so downstream
 *    services know who is calling without having to re-parse the JWT.
 */
@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
    );

    private final JwtUtil jwtUtil;

    public JwtGatewayFilter(@Value("${jwt.secret}") String secret) {
        this.jwtUtil = new JwtUtil(secret);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Let public endpoints through without a token
        boolean isPublic = PUBLIC_PATHS.stream().anyMatch(path::startsWith);
        if (isPublic) return chain.filter(exchange);

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange);
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.isTokenValid(token)) {
            return unauthorized(exchange);
        }

        // Inject user identity as headers for downstream services
        String username = jwtUtil.extractUsername(token);
        Long userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);

        ServerHttpRequest mutated = exchange.getRequest().mutate()
                .header("X-User-Id",   userId   != null ? userId.toString() : "")
                .header("X-User-Name", username != null ? username : "")
                .header("X-User-Role", role     != null ? role : "")
                .build();

        return chain.filter(exchange.mutate().request(mutated).build());
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return response.setComplete();
    }

    @Override
    public int getOrder() { return -100; }
}
