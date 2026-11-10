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
        
        
        if (user != null) {
            return "forward:/chat.html";
        }
        return "redirect:/login.html";
    }
    
    @GetMapping("/login")
    public String login(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        
        if (user != null) {
            return "redirect:/";
        }
        return "forward:/login.html";
    }
    
    @GetMapping("/register")
    public String register(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        
        if (user != null) {
            return "redirect:/";
        }
        return "forward:/register.html";
    }
    
    @GetMapping("/chat")
    public String chat(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        User user = session != null ? (User) session.getAttribute("loggedInUser") : null;
        
        
        if (user == null) {
            return "redirect:/login.html";
        }
        
        return "forward:/chat.html";
    }
}