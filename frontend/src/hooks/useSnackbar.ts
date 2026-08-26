import { useState, useCallback } from "react";

type SnackbarType = "success" | "error" | "warning" | "info";

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success" as SnackbarType,
  });

  const show = useCallback(
    (message: string, type: SnackbarType = "success") => {
      setSnackbar({ visible: true, message, type });
    },
    [],
  );

  const hide = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  }, []);

  return { snackbar, show, hide };
};
