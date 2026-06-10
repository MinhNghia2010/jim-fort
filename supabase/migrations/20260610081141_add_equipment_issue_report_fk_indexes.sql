create index if not exists equipment_issue_reports_facility_id_idx
  on public.equipment_issue_reports (facility_id);

create index if not exists equipment_issue_reports_reported_by_manager_id_idx
  on public.equipment_issue_reports (reported_by_manager_id);
