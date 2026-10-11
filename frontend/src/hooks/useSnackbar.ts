import { useState, useCallback } from "react";
import { getFriendlyMessage } from "../utils/messages";

type SnackbarType = "success" | "error" | "warning" | "info";

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success" as SnackbarType,
  });

  const show = useCallback(
    (message: string, type: SnackbarType = "success") => {
      const friendly = getFriendlyMessage(
        message,
        type === "error" ? "error" : "success",
      );
      setSnackbar({ visible: true, message: friendly, type });
    },
    [],
  );

  const hide = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  }, []);

  return { snackbar, show, hide };
};
