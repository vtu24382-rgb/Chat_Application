package com.chat.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Same-origin SPA using session cookies (SameSite=Lax); the WebSocket
            // endpoint is protected by authentication + origin checks.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/login",
                    "/register",
                    "/login.html",
                    "/register.html",
                    "/chat.css",
                    "/script.js",
                    "/favicon.ico",
                    "/health",
                    "/error",
                    "/api/auth/**"
                ).permitAll()
                // /chat.html, /chat, /ws/** and all other /api/** require a logged-in user
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                String path = request.getRequestURI();
                if (path.startsWith("/api/") || path.startsWith("/ws")) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                } else {
                    response.sendRedirect("/login.html");
                }
            }))
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository())
            )
            .sessionManagement(session -> session
                .sessionFixation().migrateSession()
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .anonymous(anonymous -> anonymous.disable());

        return http.build();
    }
}
