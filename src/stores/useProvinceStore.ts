import { create } from "zustand";

interface ProvinceState {
  selectedProvince: string | null;
  selectProvince: (name: string | null) => void;
}

export const useProvinceStore = create<ProvinceState>((set) => ({
  selectedProvince: null,
  selectProvince: (name) => set({ selectedProvince: name }),
}));
