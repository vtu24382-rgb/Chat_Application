package com.chat.chatapp.controller;

import com.chat.chatapp.model.User;
import com.chat.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUsers(HttpSession session) {
        // Get current logged in user
        User currentUser = (User) session.getAttribute("loggedInUser");
        
        if (currentUser == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(response);
        }
        
        // Get all users except current user
        List<User> users = userRepository.findAll().stream()
                .filter(user -> !user.getUsername().equals(currentUser.getUsername()))
                .map(user -> {
                    user.setPassword(null); // Remove password
                    return user;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", users);
        
        return ResponseEntity.ok(response);
    }
}