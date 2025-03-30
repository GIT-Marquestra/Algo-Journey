import { create } from "zustand";

interface tagStore {
  tags: string[],
  setTags: (value: string[]) => void
}

const useTagStore = create<tagStore>((set) => ({
    tags: [],
    setTags: (value) => set({ tags: value })
}))

export default useTagStore;