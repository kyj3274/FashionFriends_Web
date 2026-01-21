package com.example.fashionfriends.domain;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat; // ★ 이 import 추가 필수!
import java.time.LocalDate;
import java.util.List;

@Entity
public class OotdLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    // 날짜 포맷을 "yyyy-MM-dd" 문자열로 고정
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    private LocalDate date;

    private String type;
    private boolean isPublic;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String imageUrl;
    private String comment;

    @ElementCollection
    private List<Long> clothesIds;
    private int likeCount = 0;
    public OotdLog() {}

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public List<Long> getClothesIds() { return clothesIds; }
    public void setClothesIds(List<Long> clothesIds) { this.clothesIds = clothesIds; }
    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }
}