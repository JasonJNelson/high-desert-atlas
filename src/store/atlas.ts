import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BasemapId, CategoryId, RegionId } from "@/data/places";

type SheetMode = "list" | "detail";

type AtlasState = {
  query: string;
  regions: RegionId[];
  categories: CategoryId[];
  savedOnly: boolean;
  selectedId: string | null;
  basemap: BasemapId;
  favorites: string[];
  mobilePanel: "map" | "browse";
  sheet: SheetMode;
  setQuery: (query: string) => void;
  toggleRegion: (id: RegionId) => void;
  toggleCategory: (id: CategoryId) => void;
  setSavedOnly: (value: boolean) => void;
  select: (id: string | null) => void;
  setBasemap: (basemap: BasemapId) => void;
  toggleFavorite: (id: string) => void;
  clearFilters: () => void;
  setMobilePanel: (panel: "map" | "browse") => void;
  showList: () => void;
};

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      query: "",
      regions: [],
      categories: [],
      savedOnly: false,
      selectedId: null,
      basemap: "liberty",
      favorites: [],
      mobilePanel: "browse",
      sheet: "list",
      setQuery: (query) => set({ query }),
      toggleRegion: (id) => {
        const regions = get().regions.includes(id)
          ? get().regions.filter((region) => region !== id)
          : [...get().regions, id];
        set({ regions });
      },
      toggleCategory: (id) => {
        const categories = get().categories.includes(id)
          ? get().categories.filter((category) => category !== id)
          : [...get().categories, id];
        set({ categories });
      },
      setSavedOnly: (savedOnly) => set({ savedOnly }),
      select: (selectedId) =>
        set({
          selectedId,
          sheet: selectedId ? "detail" : "list",
          mobilePanel: "browse",
        }),
      setBasemap: (basemap) => set({ basemap }),
      toggleFavorite: (id) => {
        const favorites = get().favorites.includes(id)
          ? get().favorites.filter((favorite) => favorite !== id)
          : [...get().favorites, id];
        set({ favorites });
      },
      clearFilters: () =>
        set({ query: "", regions: [], categories: [], savedOnly: false }),
      setMobilePanel: (mobilePanel) => set({ mobilePanel }),
      showList: () => set({ sheet: "list", selectedId: null }),
    }),
    {
      name: "high-desert-atlas",
      skipHydration: true,
      partialize: (state) => ({
        favorites: state.favorites,
        basemap: state.basemap,
      }),
    },
  ),
);
