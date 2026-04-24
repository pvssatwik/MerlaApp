import { API_BASE_URL } from '../config/api';

export const submitForm = async (api: string, formData: Record<string, any>) => {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${api}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      farm_name: 'MERLA',        // always fixed
      who_created: 'APP_USER',   // replace with logged-in user later
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong');
  return result;
};