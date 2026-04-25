/* Types derived from the OpenAPI specification */

export interface Token {
  access_token: string;
  token_type: string;
}

export const UserGroup = {
  Admin: 1,
  Manager: 2,
  User: 4,
} as const;
export type UserGroup = (typeof UserGroup)[keyof typeof UserGroup];

export interface UserBase {
  name: string;
  usergroup: UserGroup;
}

export interface EventCreate {
  name: string;
  date: string;
  lap_duration: string;
  min_lap_duration: string;
}

export interface EventPublic {
  name: string;
  date: string;
  lap_duration: string;
  min_lap_duration: string;
  id: number;
}

export interface RunnerCreate {
  name: string;
}

export interface RunnerPublic {
  name: string;
  id: number;
}

export interface RegistrationPublic {
  event_id: number;
  runner_id: number;
  bib_nr: number | null;
  rfid_tag_id: string | null;
  dnf_lap: number | null;
  start_lap: number;
}

export interface RegistrationUpdate {
  bib_nr: number | null;
  rfid_tag_id: string | null;
  dnf_lap: number | null;
}

export interface RegistrationRunnerCreate {
  name: string;
  bib_nr: number | null;
  rfid_tag_id: string | null;
  start_lap?: number;
}

export interface RegistrationRunnerPublic {
  event_id: number;
  runner_id: number;
  bib_nr: number | null;
  rfid_tag_id: string | null;
  dnf_lap: number | null;
  start_lap: number;
  runner: RunnerPublic;
}

export interface TimingCreate {
  rfid_tag_id: string;
  time: string;
  event_id?: number;
}

export interface TimingPublic {
  rfid_tag_id: string;
  time: string;
  event_id: number;
  id: number;
}

export interface LapTimingCreate {
  rfid_tag_id: string;
  lap: number;
  lap_time: string;
}

export interface LiveTimingRow {
  rank: number;
  name: string;
  laps: number;
  last_laptime: string | null;
  avg_laptime: string | null;
  min_laptime: string | null;
  all_laps: string[];
  status: string;
}

export interface TagInfoPublic {
  rfid_tag_id: string;
  time: string;
}

export interface TagInfoUpdate {
  rfid_tag_id: string;
  time: string;
}

export const ScannerMode = {
  Off: 0,
  Read: 1,
  Write: 2,
} as const;
export type ScannerMode = (typeof ScannerMode)[keyof typeof ScannerMode];

export interface ScannerStatus {
  connected: boolean;
  mode: ScannerMode | null;
  event_id: number | null;
}
