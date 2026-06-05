package com.chat.chatapp.controller;

import com.chat.chatapp.model.Message;
import com.chat.chatapp.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(Message message) {
        System.out.println("=== SENDING MESSAGE ===");
        System.out.println("From: " + message.getSender());
        System.out.println("To: " + message.getReceiver());
        System.out.println("Content: " + message.getContent());
        
        // Save message to database
        Message savedMessage = chatService.saveMessage(message);
        System.out.println("Message saved with ID: " + savedMessage.getId());

        // Send to receiver using username from message
        messagingTemplate.convertAndSendToUser(
                message.getReceiver(),
                "/queue/messages",
                savedMessage
        );
        System.out.println("Sent to receiver: " + message.getReceiver());

        // Send to sender using username from message
        messagingTemplate.convertAndSendToUser(
                message.getSender(),
                "/queue/messages",
                savedMessage
        );
        System.out.println("Sent to sender: " + message.getSender());
        
        System.out.println("=== MESSAGE SENT ===");
    }

    // REMOVE the addUser method completely - we don't need it
}