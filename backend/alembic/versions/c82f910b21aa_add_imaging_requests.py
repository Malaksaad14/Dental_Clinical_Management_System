from alembic import op
import sqlalchemy as sa
revision = "c82f910b21aa"
down_revision = "75c46a2b352c"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("imaging_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("requested_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("exam", sa.String(100), nullable=False),
        sa.Column("indication", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("result", sa.Text()),
        sa.Column("completed_by", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))

def downgrade():
    op.drop_table("imaging_requests")
