"""Create horario_snapshots table for version tracking

Revision ID: 002_create_horario_snapshots
Revises: horario_versions_001
Create Date: 2026-02-23 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_create_horario_snapshots'
down_revision = 'horario_versions_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create horario_snapshots table
    op.create_table(
        'horario_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ciclo_escolar', sa.String(length=20), nullable=False),
        sa.Column('version_numero', sa.Integer(), nullable=False),
        sa.Column('horarios_data', sa.JSON(), nullable=False),
        sa.Column('tipo_version', sa.String(length=50), nullable=False),
        sa.Column('descripcion', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('usuario_nombre', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    # Create indexes
    op.create_index('ix_ciclo_version', 'horario_snapshots', ['ciclo_escolar', 'version_numero'], unique=True)
    op.create_index('ix_horario_snapshots_ciclo_escolar', 'horario_snapshots', ['ciclo_escolar'])
    op.create_index('ix_horario_snapshots_created_at', 'horario_snapshots', ['created_at'])


def downgrade():
    op.drop_index('ix_horario_snapshots_created_at', table_name='horario_snapshots')
    op.drop_index('ix_horario_snapshots_ciclo_escolar', table_name='horario_snapshots')
    op.drop_index('ix_ciclo_version', table_name='horario_snapshots')
    op.drop_table('horario_snapshots')
