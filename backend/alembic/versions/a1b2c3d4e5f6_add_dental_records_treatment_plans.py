"""add dental records, treatment plans, prescriptions, clinical notes, icd10 codes

Revision ID: a1b2c3d4e5f6
Revises: 6d981ce29ef7
Create Date: 2026-11-25 15:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '6d981ce29ef7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tables for dental records, treatment plans, prescriptions."""

    # ICD-10 codes (referenced by clinical_notes)
    op.create_table('icd10_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_icd10_codes_id'), 'icd10_codes', ['id'])
    op.create_index(op.f('ix_icd10_codes_code'), 'icd10_codes', ['code'], unique=True)

    # Treatment plans
    op.create_table('treatment_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('dentist_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='proposed'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['dentist_id'], ['staff.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_treatment_plans_id'), 'treatment_plans', ['id'])
    op.create_index(op.f('ix_treatment_plans_patient_id'), 'treatment_plans', ['patient_id'])

    # Treatment plan items
    op.create_table('treatment_plan_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('tooth_number', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='pending'),
        sa.Column('planned_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['treatment_plans.id']),
        sa.ForeignKeyConstraint(['service_id'], ['services.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_treatment_plan_items_id'), 'treatment_plan_items', ['id'])
    op.create_index(op.f('ix_treatment_plan_items_plan_id'), 'treatment_plan_items', ['plan_id'])

    # Prescriptions
    op.create_table('prescriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('dentist_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('issued_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['dentist_id'], ['staff.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_prescriptions_id'), 'prescriptions', ['id'])
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'])

    # Prescription items
    op.create_table('prescription_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prescription_id', sa.Integer(), nullable=False),
        sa.Column('drug_name', sa.String(length=150), nullable=False),
        sa.Column('dosage', sa.String(length=100), nullable=False),
        sa.Column('frequency', sa.String(length=100), nullable=False),
        sa.Column('duration', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_prescription_items_id'), 'prescription_items', ['id'])
    op.create_index(op.f('ix_prescription_items_prescription_id'), 'prescription_items', ['prescription_id'])

    # Clinical notes
    op.create_table('clinical_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('staff_id', sa.Integer(), nullable=False),
        sa.Column('icd10_code_id', sa.Integer(), nullable=True),
        sa.Column('note', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['staff_id'], ['staff.id']),
        sa.ForeignKeyConstraint(['icd10_code_id'], ['icd10_codes.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_clinical_notes_id'), 'clinical_notes', ['id'])


def downgrade() -> None:
    """Drop tables in reverse dependency order."""
    op.drop_table('clinical_notes')
    op.drop_table('prescription_items')
    op.drop_table('prescriptions')
    op.drop_table('treatment_plan_items')
    op.drop_table('treatment_plans')
    op.drop_table('icd10_codes')
