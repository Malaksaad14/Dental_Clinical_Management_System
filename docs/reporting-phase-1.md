# Phase 1 — Reporting and Statistics

**Owner:** Mai Mahmoud, Team 5. The administrator opens Reports in the clinic workspace, chooses inclusive Cairo calendar dates and reviews clinic-wide totals. Access to this view and its API is restricted to administrators because receipts are clinic-wide financial data.

| Feature | Data and rule | Module dependency |
| --- | --- | --- |
| New patients | Join patients.user_id to users.id and count patient accounts by users.created_at | User accounts and patient profiles |
| Appointment outcomes | Count appointments by start_time and status: scheduled, completed, cancelled, no_show | Appointment management |
| Daily chart | Group completed appointments by their Cairo appointment date | Appointment management |
| Payments received | Sum payments.amount for completed payments by paid_at; a partial payment contributes its recorded amount | Billing and payments |

**System design.** The React route `/admin/reports` uses the shared layout and authenticated API client. It requests `GET /reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD`. FastAPI checks the administrator role and reads through the team's SQLAlchemy session. Each metric is aggregated independently to avoid double-counting when one patient has several appointments or payments. The reports module owns no database tables or migrations.

**ERD relationships used.** A user has a patient profile. A patient can have many appointments and invoices. Each invoice can have many payments. Reporting reads those entities created by the responsible modules.

**Acceptance check.** Select a period containing a new patient, one completed appointment and one completed payment. Verify each metric against the underlying record, narrow the period to exclude it, and check that a patient account cannot access the reporting API. On a freshly seeded database, the seed creates one patient and no appointments or payments. Include the day the seed ran to see that registration.
