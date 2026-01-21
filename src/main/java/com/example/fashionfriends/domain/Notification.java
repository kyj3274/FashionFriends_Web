package com.example.fashionfriends.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private Member receiver; // 알림 받는 사람

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private Member sender;   // 알림 보낸 사람

    private String type;     // LIKE, FOLLOW_REQUEST, NEW_POST, FOLLOW_ACCEPT
    private String message;
    private Long targetId;   // 이동할 게시물 ID 혹은 멤버 ID
    private boolean isRead;  // 읽음 여부
    private LocalDateTime createdAt;

    public Notification() {}
    public Notification(Member receiver, Member sender, String type, String message, Long targetId) {
        this.receiver = receiver;
        this.sender = sender;
        this.type = type;
        this.message = message;
        this.targetId = targetId;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }
    // Getters & Setters
    public Long getId() { return id; }
    public Member getReceiver() { return receiver; }
    public Member getSender() { return sender; }
    public String getType() { return type; }
    public String getMessage() { return message; }
    public Long getTargetId() { return targetId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}