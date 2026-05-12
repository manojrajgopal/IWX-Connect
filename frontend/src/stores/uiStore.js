import { create } from "zustand";

// Global lightweight UI state — composer modal, story viewer, etc.
export const useUIStore = create((set) => ({
  composer: { open: false, kind: "post" }, // kind: post | reel | story
  openComposer: (kind = "post") => set({ composer: { open: true, kind } }),
  closeComposer: () => set({ composer: { open: false, kind: "post" } }),

  storyViewer: { open: false, stories: [], index: 0 },
  openStoryViewer: (stories, index = 0) => set({ storyViewer: { open: true, stories, index } }),
  closeStoryViewer: () => set({ storyViewer: { open: false, stories: [], index: 0 } }),
}));
