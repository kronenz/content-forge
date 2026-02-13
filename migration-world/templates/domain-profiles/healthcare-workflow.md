# Domain Profile: Healthcare Workflow

- inputUnit: clinical_task
- outputUnit: care_action
- sources: ehr, lab_feed, scheduling
- destinations: provider_queue, patient_portal, billing
- quality gates: privacy, safety, clinical-policy
