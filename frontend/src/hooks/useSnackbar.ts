import { useState } from "react";

type SnackbarType = "success" | "error" | "info" | "warning";

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success" as SnackbarType,
  });

  const show = (message: string, type: SnackbarType = "success") => {
    setSnackbar({ visible: true, message, type });
  };

  const hide = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  return { snackbar, show, hide };
};
