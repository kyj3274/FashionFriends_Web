package com.example.fashionfriends.domain;
import jakarta.persistence.*;

@Entity
public class Clothes {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // DB 컬럼명은 member_id로 통일하는 것이 좋습니다.
    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    private String category;
    private String name;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String imageUrl;

    // AI가 분석해줄 상세 정보들
    private String color;     // 색상
    private String season;    // 계절
    private String style;     // 스타일 (캐주얼, 포멀...)
    private String material;  // 재질 (데님, 가죽...)

    public Clothes() {}

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
}