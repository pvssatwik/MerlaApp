import { authPost } from "../config/api";

export const submitForm = async (
  api: string,
  formData: Record<string, any>,
  whoCreated?: string,
) => {
  return authPost(`/api/transactions/${api}`, {
    ...formData,
    farm_name: "MERLA",
    who_created: whoCreated || "APP_USER",
  });
};
