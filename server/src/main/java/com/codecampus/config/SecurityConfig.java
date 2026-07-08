package com.codecampus.config;

import com.codecampus.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter; this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .cors(cors -> cors.configurationSource(req -> { var c = new org.springframework.web.cors.CorsConfiguration(); c.addAllowedOriginPattern("*"); c.addAllowedMethod("*"); c.addAllowedHeader("*"); c.setAllowCredentials(true); return c; }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll().requestMatchers("/api/batch-section/batches").permitAll().requestMatchers("/api/batch-section/batches/*/sections").permitAll().requestMatchers("/h2-console/**").permitAll().requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN").requestMatchers("/api/teacher/**").hasAnyRole("TEACHER", "ADMIN").requestMatchers("/api/company/**").hasAnyRole("COMPANY", "ADMIN")
                .requestMatchers("/api/proctoring/log").authenticated().requestMatchers("/api/proctoring/**").hasAnyRole("TEACHER", "ADMIN", "COMPANY").requestMatchers("/api/plagiarism/**").hasAnyRole("TEACHER", "ADMIN", "COMPANY")
                .requestMatchers("/api/**").authenticated().anyRequest().authenticated())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider()).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(h -> h.frameOptions(f -> f.disable()));
        return http.build();
    }

    @Bean public AuthenticationProvider authenticationProvider() { DaoAuthenticationProvider p = new DaoAuthenticationProvider(); p.setUserDetailsService(userDetailsService); p.setPasswordEncoder(passwordEncoder()); return p; }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception { return config.getAuthenticationManager(); }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
