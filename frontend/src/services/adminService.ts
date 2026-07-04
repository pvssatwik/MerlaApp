import { authGet, authPost } from "../config/api";

export const getPendingUsers = () => authGet("/api/admin/pending-users");

export const getAllUsers = () => authGet("/api/admin/all-users");

export const getRoles = () => authGet("/api/admin/roles");

export const getSheds = () => authGet("/api/admin/sheds");

export const approveUser = (data: {
  userid: string;
  role_id: string;
  shed_name?: string | null;
  assignment_start_date?: string;
  assignment_end_date?: string;
}) =>
  authPost("/api/admin/approve-user", data as Record<string, unknown>);

export const rejectUser = (userid: string) =>
  authPost("/api/admin/reject-user", { userid });

export const updateUserStatus = (userid: string, status: string) =>
  authPost("/api/admin/update-status", { userid, status });
