"""add private_opportunities table

Revision ID: 003
Revises: 002
Create Date: 2026-07-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "private_opportunities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("provider", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("eligibility_criteria", JSONB, nullable=True),
        sa.Column("award_range", sa.String(100), nullable=True),
        sa.Column("deadline", sa.Date, nullable=True),
        sa.Column("field_tags", ARRAY(sa.Text), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("source_url", sa.Text, nullable=True),
        sa.Column("guidelines", sa.Text, nullable=True),
        sa.Column("is_parsed", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_private_opportunities_user_id", "private_opportunities", ["user_id"])
    op.create_index("ix_private_opportunities_type", "private_opportunities", ["type"])


def downgrade() -> None:
    op.drop_index("ix_private_opportunities_type", table_name="private_opportunities")
    op.drop_index("ix_private_opportunities_user_id", table_name="private_opportunities")
    op.drop_table("private_opportunities")
