package com.example.fashionfriends.domain;
import jakarta.persistence.*;

@Entity
public class Follow {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private Member sender; // 요청한 사람 (Ref 건 사람)

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private Member receiver; // 요청 받은 사람

    @Enumerated(EnumType.STRING)
    private FollowStatus status; // PENDING(대기), ACCEPTED(수락)

    public Follow() {}
    public Follow(Member sender, Member receiver) {
        this.sender = sender;
        this.receiver = receiver;
        this.status = FollowStatus.PENDING; // 기본은 대기
    }

    public Long getId() { return id; }
    public Member getSender() { return sender; }
    public Member getReceiver() { return receiver; }
    public FollowStatus getStatus() { return status; }
    public void setStatus(FollowStatus status) { this.status = status; }
}

