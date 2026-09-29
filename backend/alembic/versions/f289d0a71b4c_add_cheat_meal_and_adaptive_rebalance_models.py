"""add_cheat_meal_and_adaptive_rebalance_models

Revision ID: f289d0a71b4c
Revises: ba07595ca352
Create Date: 2026-09-29 21:33:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f289d0a71b4c'
down_revision: Union[str, Sequence[str], None] = 'ba07595ca352'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create cheat_meal_logs table
    op.create_table(
        'cheat_meal_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('meal_type', sa.String(length=50), nullable=False),
        sa.Column('estimated_calories', sa.Float(), nullable=False),
        sa.Column('protein_g', sa.Float(), server_default='0', nullable=False),
        sa.Column('carbs_g', sa.Float(), server_default='0', nullable=False),
        sa.Column('fats_g', sa.Float(), server_default='0', nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('feeling_tag', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cheat_meal_logs_id'), 'cheat_meal_logs', ['id'], unique=False)
    op.create_index(op.f('ix_cheat_meal_logs_user_id'), 'cheat_meal_logs', ['user_id'], unique=False)

    # 2. Create adaptive_rebalance_plans table
    op.create_table(
        'adaptive_rebalance_plans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('cheat_meal_log_id', sa.UUID(), nullable=True),
        sa.Column('meal_name', sa.String(length=150), nullable=False),
        sa.Column('surplus_calories', sa.Float(), nullable=False),
        sa.Column('rebalance_days', sa.Integer(), nullable=False),
        sa.Column('strategy', sa.String(length=50), nullable=False),
        sa.Column('daily_calorie_offset', sa.Float(), nullable=False),
        sa.Column('daily_extra_steps', sa.Integer(), nullable=False),
        sa.Column('daily_extra_active_burn_kcal', sa.Float(), nullable=False),
        sa.Column('target_date_start', sa.Date(), nullable=False),
        sa.Column('target_date_end', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('glycogen_tip', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cheat_meal_log_id'], ['cheat_meal_logs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_adaptive_rebalance_plans_id'), 'adaptive_rebalance_plans', ['id'], unique=False)
    op.create_index(op.f('ix_adaptive_rebalance_plans_user_id'), 'adaptive_rebalance_plans', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_adaptive_rebalance_plans_user_id'), table_name='adaptive_rebalance_plans')
    op.drop_index(op.f('ix_adaptive_rebalance_plans_id'), table_name='adaptive_rebalance_plans')
    op.drop_table('adaptive_rebalance_plans')

    op.drop_index(op.f('ix_cheat_meal_logs_user_id'), table_name='cheat_meal_logs')
    op.drop_index(op.f('ix_cheat_meal_logs_id'), table_name='cheat_meal_logs')
    op.drop_table('cheat_meal_logs')
