import { authGet } from "../config/api";

const get = async (url: string) => {
  try {
    const result = await authGet(url);
    return result.data || [];
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    return [];
  }
};

export const fetchSheds = () => get("/api/transactions/dropdowns/sheds");
export const fetchFlocks = () => get("/api/transactions/dropdowns/flocks");
export const fetchFlocksByShed = (shedNo: string) =>
  get(`/api/transactions/dropdowns/flocks/${shedNo}`);
export const fetchFeeds = () => get("/api/transactions/dropdowns/feeds");
export const fetchEggTypes = () =>
  get("/api/transactions/dropdowns/egg-types");
export const fetchBirdLossTypes = () =>
  get("/api/transactions/dropdowns/bird-loss-types");
export const fetchEggTransactions = () =>
  get("/api/transactions/dropdowns/egg-transactions");
export const fetchTrips = () => get("/api/transactions/dropdowns/trips");
