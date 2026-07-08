package com.codecampus.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

/**
 * Stateless JWT utility — does NOT need Spring context. Used by the gateway
 * and optionally by individual services to validate / inspect tokens.
 */
public class JwtUtil {

    private final SecretKey signingKey;

    public JwtUtil(String base64Secret) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        Object id = extractAllClaims(token).get("userId");
        if (id == null) return null;
        return id instanceof Integer ? ((Integer) id).longValue() : ((Number) id).longValue();
    }

    public String extractRole(String token) {
        return (String) extractAllClaims(token).get("role");
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
