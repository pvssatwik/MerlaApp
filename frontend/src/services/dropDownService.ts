import { API_BASE_URL, API_HEADERS } from '../config/api';

const get = async (url: string) => {
  const res = await fetch(`${API_BASE_URL}${url}`, { headers: API_HEADERS });
  const result = await res.json();
  return result.data || [];
};

export const fetchSheds            = () => get('/api/transactions/dropdowns/sheds');
export const fetchFlocks           = () => get('/api/transactions/dropdowns/flocks');
export const fetchFlocksByShed     = (shedNo: string) => get(`/api/transactions/dropdowns/flocks/${shedNo}`);
export const fetchFeeds            = () => get('/api/transactions/dropdowns/feeds');
export const fetchEggTypes         = () => get('/api/transactions/dropdowns/egg-types');
export const fetchBirdLossTypes    = () => get('/api/transactions/dropdowns/bird-loss-types');
export const fetchEggTransactions  = () => get('/api/transactions/dropdowns/egg-transactions');
export const fetchTrips            = () => get('/api/transactions/dropdowns/trips');