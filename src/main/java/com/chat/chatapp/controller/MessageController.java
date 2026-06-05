package com.chat.chatapp.controller;

import com.chat.chatapp.model.Message;
import com.chat.chatapp.model.User;
import com.chat.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @GetMapping("/{otherUser}")
    public ResponseEntity<?> getConversation(@PathVariable String otherUser, HttpSession session) {
        // Get current logged in user
        User currentUser = (User) session.getAttribute("loggedInUser");
        
        if (currentUser == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(response);
        }
        
        System.out.println("Loading conversation between " + currentUser.getUsername() + " and " + otherUser);
        
        // Find all messages between current user and other user
        List<Message> messages = messageRepository.findConversation(
            currentUser.getUsername(), 
            otherUser
        );
        
        System.out.println("Found " + messages.size() + " messages");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", messages);
        
        return ResponseEntity.ok(response);
    }
}