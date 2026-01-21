package com.example.fashionfriends.domain;
import jakarta.persistence.*;


@Entity
public class Heart {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member; // 좋아요 누른 사람

    @ManyToOne
    @JoinColumn(name = "ootd_log_id")
    private OotdLog ootdLog; // 어떤 게시물

    // 생성자 등
    public Heart() {}
    public Heart(Member member, OotdLog ootdLog) {
        this.member = member;
        this.ootdLog = ootdLog;
    }
    // Getter
    public Member getMember() { return member; }
    public OotdLog getOotdLog() { return ootdLog; }
}