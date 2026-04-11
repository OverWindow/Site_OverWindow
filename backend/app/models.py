from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Integer,
    Enum,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime, nullable=True)

    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    recommendations = relationship(
        "Recommendation",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(BigInteger, primary_key=True, index=True)
    site_title = Column(String(200), nullable=False)
    site_subtitle = Column(String(255), nullable=True)
    hero_image_url = Column(String(2048), nullable=True)
    resume_pdf_url = Column(String(2048), nullable=True)
    github_url = Column(String(2048), nullable=True)
    linkedin_url = Column(String(2048), nullable=True)
    email = Column(String(255), nullable=True)
    theme_config_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class CVSection(Base):
    __tablename__ = "cv_sections"

    id = Column(BigInteger, primary_key=True, index=True)
    section_key = Column(String(100), nullable=False, unique=True)
    title = Column(String(200), nullable=False)
    content_json = Column(JSON, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class LinkCategory(Base):
    __tablename__ = "link_categories"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    links = relationship(
        "Link",
        back_populates="category",
        cascade="all, delete-orphan",
    )



class Link(Base):
    __tablename__ = "links"

    id = Column(BigInteger, primary_key=True, index=True)
    category_id = Column(
        BigInteger,
        ForeignKey("link_categories.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    url = Column(String(2048), nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(100), nullable=True)
    favicon_url = Column(String(2048), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    category = relationship("LinkCategory", back_populates="links")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic = Column(String(255), nullable=False)
    features = Column(Text, nullable=False)
    additional_context = Column(Text, nullable=True)
    analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="recommendations")
    items = relationship(
        "RecommendedItem",
        back_populates="recommendation",
        cascade="all, delete-orphan",
    )


class RecommendedItem(Base):
    __tablename__ = "recommended_items"

    id = Column(BigInteger, primary_key=True, index=True)
    recommendation_id = Column(
        BigInteger,
        ForeignKey("recommendations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(
        Enum("website", "app", name="recommended_item_type"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    url = Column(String(2048), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    recommendation = relationship("Recommendation", back_populates="items")
