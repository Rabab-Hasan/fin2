// API Types
export interface Report {
  report_date: string;
  month_label?: string;
  data: Record<string, any>;
}

export interface Column {
  key: string;
  label: string;
  display_order?: number;
}

export interface Stats {
  total_records: number;
  months_tracked: number;
  notes_count: number;
}

export interface BackupStatus {
  records_stored: number;
  main_storage_kb: number;
  primary_backup_kb: number;
  emergency_backup_kb: number;
  primary_last_at: string | null;
  emergency_last_at: string | null;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  new_columns: string[];
  errors: Array<{ row: number; reason: string }>;
}

export interface Rollup {
  month: string;
  record_count: number;
  new_applicants: number;
  linked_accounts: number;
}
