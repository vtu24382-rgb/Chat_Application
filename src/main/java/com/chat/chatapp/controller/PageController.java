package com.chat.chatapp.controller;

import com.chat.chatapp.model.User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class PageController {
    
    @GetMapping("/")
    public String index(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        System.out.println("Root path - Session: " + (session != null ? session.getId() : "none") + 
                          ", User: " + (user != null ? user.getUsername() : "none"));
        
        if (user != null) {
            return "forward:/chat.html";
        }
        return "redirect:/login.html";
    }
    
    @GetMapping("/login")
    public String login(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        System.out.println("Login path - Session: " + (session != null ? session.getId() : "none") + 
                          ", User: " + (user != null ? user.getUsername() : "none"));
        
        if (user != null) {
            return "redirect:/";
        }
        return "forward:/login.html";
    }
    
    @GetMapping("/register")
    public String register(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        System.out.println("Register path - Session: " + (session != null ? session.getId() : "none") + 
                          ", User: " + (user != null ? user.getUsername() : "none"));
        
        if (user != null) {
            return "redirect:/";
        }
        return "forward:/register.html";
    }
    
    @GetMapping("/chat")
    public String chat(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        System.out.println("Chat path - Session: " + (session != null ? session.getId() : "none") + 
                          ", User: " + (user != null ? user.getUsername() : "none"));
        
        if (user == null) {
            System.out.println("Not authenticated, redirecting to login");
            return "redirect:/login.html";
        }
        
        System.out.println("Authenticated, forwarding to chat.html");
        return "forward:/chat.html";
    }
}