import { API_BASE_URL } from '../config/api';

export type EggProductionRecord = {
  SHED_NO:          number;
  FARM_NAME:        string;
  FLOCK_NO:         string;
  SHED_NAME:        string;
  PRODUCTION_DATE:  string;
  FLOCK_NAME:       string;
  TRANSACTION_TYPE: string;
  EGG_TYPE:         string;
  EGG_COUNT:        number;
  TRIP_NO:          string;
  COMMNETS:         string;
  WHO_CREATED:      string;
  WHEN_CREATED:     string;
};

export type EggProductionForm = {
  farm_name:        string;
  shed_name:        string;
  flock_name:       string;
  production_date:  string;
  transaction_type: string;
  egg_type:         string;
  egg_count:        number;
  trip_no:          string;
  commnets:         string; 
  who_created:      string;
};

// ── Insert via SP ─────────────────────────────────────
export const insertEggProduction = async (data: EggProductionForm) => {
  const response = await fetch(`${API_BASE_URL}/api/transactions/egg-production`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong');
  return result;
};

// ── Fetch all records ─────────────────────────────────
export const fetchEggProductions = async (): Promise<EggProductionRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/api/transactions/egg-production`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to fetch records');
  return result.data;
};