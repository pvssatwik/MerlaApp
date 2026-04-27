import { API_BASE_URL, API_HEADERS } from '../config/api';

const get = async (url: string) => {
  try {
    const furl = `${API_BASE_URL}${url}`;
    console.log('URL:', furl);

    const res = await fetch(furl, { headers: API_HEADERS });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const result = await res.json();
    console.log('Response:', result);
    return result.data || [];
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    return [];
  }
};

export const fetchSheds            = () => get('/api/transactions/dropdowns/sheds');
export const fetchFlocks           = () => get('/api/transactions/dropdowns/flocks');
export const fetchFlocksByShed     = (shedNo: string) => get(`/api/transactions/dropdowns/flocks/${shedNo}`);
export const fetchFeeds            = () => get('/api/transactions/dropdowns/feeds');
export const fetchEggTypes         = () => get('/api/transactions/dropdowns/egg-types');
export const fetchBirdLossTypes    = () => get('/api/transactions/dropdowns/bird-loss-types');
export const fetchEggTransactions  = () => get('/api/transactions/dropdowns/egg-transactions');
export const fetchTrips            = () => get('/api/transactions/dropdowns/trips');