export type Sex = "Male" | "Female";

export interface Aspirant {
  id: string;
  name: string;
  position: string;
  category: string | null;
  sex: Sex | null;
  photo_url: string | null;
  created_at: string;
}

export interface Voter {
  id: string;
  code: string;
  label: string | null;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  voter_id: string;
  aspirant_id: string;
  position: string;
  created_at: string;
}

export interface ElectionSettings {
  id: number;
  title: string;
  is_open: boolean;
}

export interface TallyRow extends Aspirant {
  vote_count: number;
}
