"""Initial schema

Revision ID: 362ef87851da
Revises: None
Create Date: 2026-09-07 11:06:03.079765

"""
from typing import Sequence, Union
from alembic import op
from app.core.database import Base
import app.models  # noqa: F401 - register every model with Base metadata


# revision identifiers, used by Alembic.
revision: str = '362ef87851da'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # The initial revision is intentionally driven by the SQLAlchemy metadata so
    # a clean install receives the complete normalized schema in one operation.
    Base.metadata.create_all(bind=op.get_bind())

def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
