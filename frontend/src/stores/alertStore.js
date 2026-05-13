import { create } from "zustand";

export const useAlertStore = create((set) => ({
  /** @type {{ type: "alert"|"confirm", title: string, message: string, confirmText?: string, cancelText?: string, variant?: "danger"|"warning"|"info", resolve?: (v:boolean)=>void } | null} */
  dialog: null,

  /** Show an alert (informational, single OK button). Returns a promise that resolves when dismissed. */
  showAlert: (message, { title = "Notice", variant = "info" } = {}) =>
    new Promise((resolve) =>
      set({
        dialog: { type: "alert", title, message, variant, resolve: () => { set({ dialog: null }); resolve(true); } },
      })
    ),

  /** Show a confirm dialog. Returns a promise that resolves to true/false. */
  showConfirm: (message, { title = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", variant = "danger" } = {}) =>
    new Promise((resolve) =>
      set({
        dialog: {
          type: "confirm", title, message, confirmText, cancelText, variant,
          resolve: (v) => { set({ dialog: null }); resolve(v); },
        },
      })
    ),

  dismiss: () => set((s) => { s.dialog?.resolve?.(false); return { dialog: null }; }),
}));
