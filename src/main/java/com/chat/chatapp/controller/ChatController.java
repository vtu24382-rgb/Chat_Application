package com.chat.chatapp.controller;

import com.chat.chatapp.model.Message;
import com.chat.chatapp.repository.UserRepository;
import com.chat.chatapp.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private static final int MAX_CONTENT_LENGTH = 2000;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(Message incoming, Principal principal) {
        // The sender is ALWAYS the authenticated user - never trust the client's "sender" field.
        if (principal == null) {
            log.warn("Rejected chat message from unauthenticated WebSocket session");
            return;
        }
        String sender = principal.getName();

        String receiver = incoming.getReceiver() == null ? "" : incoming.getReceiver().trim();
        String content = incoming.getContent() == null ? "" : incoming.getContent().trim();
        if (receiver.isEmpty() || content.isEmpty()) {
            return;
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            content = content.substring(0, MAX_CONTENT_LENGTH);
        }
        if (!userRepository.existsByUsername(receiver)) {
            log.warn("Rejected message from '{}' to unknown user", sender);
            return;
        }

        // Build a fresh entity so a client can't set id (overwrite existing rows) or timestamp.
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setType("CHAT");
        message.setTimestamp(LocalDateTime.now());

        Message saved = chatService.saveMessage(message);
        log.debug("Message {} saved ({} -> {})", saved.getId(), sender, receiver);

        messagingTemplate.convertAndSendToUser(receiver, "/queue/messages", saved);
        if (!receiver.equals(sender)) {
            messagingTemplate.convertAndSendToUser(sender, "/queue/messages", saved);
        }
    }
}
