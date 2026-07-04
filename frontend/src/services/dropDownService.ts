import { authGet } from "../config/api";

const get = async (url: string) => {
  try {
    const result = await authGet(url);
    console.log("API Response:", JSON.stringify(result.data, null, 2));
    return result.data || [];
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    return [];
  }
};

export const fetchSheds = () => get("/api/transactions/dropdowns/sheds");
export const fetchFlocks = () => get("/api/transactions/dropdowns/flocks");
export const fetchFlocksByShed = (shedName: string) => {
  console.log("Fetching flocks for shed:", shedName);
  return get(
    `/api/transactions/dropdowns/flocks/${encodeURIComponent(shedName)}`,
  );
};
export const fetchFeeds = () => get("/api/transactions/dropdowns/feeds");
export const fetchEggTypes = () => get("/api/transactions/dropdowns/egg-types");
export const fetchBirdLossTypes = () =>
  get("/api/transactions/dropdowns/bird-loss-types");
export const fetchEggTransactions = () =>
  get("/api/transactions/dropdowns/egg-transactions");
export const fetchTrips = () => get("/api/transactions/dropdowns/trips");
