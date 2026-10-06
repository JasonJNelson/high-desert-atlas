import { useEffect, useMemo, useState } from "react";
import { Heart, Map as MapIcon, Search, X } from "lucide-react";
import { CATEGORIES, REGIONS, catalogWith, getPlace, regionMeta, rememberPlaces } from "@/data/places";
import type { Place } from "@/data/places";
import { filterPlaces } from "@/lib/filter-places";
import { useAtlas } from "@/store/atlas";
import { MapView } from "./map-view";
import { PlaceDetail } from "./place-detail";

export function AtlasShell() {
  const query = useAtlas((s) => s.query);
  const regions = useAtlas((s) => s.regions);
  const categories = useAtlas((s) => s.categories);
  const savedOnly = useAtlas((s) => s.savedOnly);
  const selectedId = useAtlas((s) => s.selectedId);
  const basemap = useAtlas((s) => s.basemap);
  const favorites = useAtlas((s) => s.favorites);
  const mobilePanel = useAtlas((s) => s.mobilePanel);
  const sheet = useAtlas((s) => s.sheet);
  const setQuery = useAtlas((s) => s.setQuery);
  const toggleRegion = useAtlas((s) => s.toggleRegion);
  const toggleCategory = useAtlas((s) => s.toggleCategory);
  const setSavedOnly = useAtlas((s) => s.setSavedOnly);
  const select = useAtlas((s) => s.select);
  const setBasemap = useAtlas((s) => s.setBasemap);
  const toggleFavorite = useAtlas((s) => s.toggleFavorite);
  const clearFilters = useAtlas((s) => s.clearFilters);
  const setMobilePanel = useAtlas((s) => s.setMobilePanel);
  const showList = useAtlas((s) => s.showList);

  useEffect(() => {
    void useAtlas.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") showList();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showList]);

  const [offroad, setOffroad] = useState<Place[]>([]);

  useEffect(() => {
    let cancel = false;
    let started = false;
    const start = () => {
      if (started || cancel) return;
      started = true;
      void import("@/data/offroad").then((mod) => {
        if (cancel) return;
        rememberPlaces(mod.offroadPlaces);
        setOffroad(mod.offroadPlaces);
      });
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 1800 });
    const timer = window.setTimeout(start, 1400);
    return () => {
      cancel = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  const catalog = useMemo(() => catalogWith(offroad), [offroad]);

  const filtered = useMemo(
    () => filterPlaces(catalog, { query, regions, categories, savedOnly, favorites }),
    [catalog, query, regions, categories, savedOnly, favorites],
  );
  const [listLimit, setListLimit] = useState(80);
  useEffect(() => {
    setListLimit(80);
  }, [query, regions, categories, savedOnly]);
  const visible = filtered.slice(0, listLimit);

  useEffect(() => {
    if (selectedId && !filtered.some((place) => place.id === selectedId)) showList();
  }, [filtered, selectedId, showList]);

  const selected = selectedId
    ? (catalog.find((place) => place.id === selectedId) ?? getPlace(selectedId))
    : undefined;
  const filtersActive = query.length > 0 || regions.length > 0 || categories.length > 0 || savedOnly;

  return (
    <div className="flex h-dvh w-full flex-col md:flex-row">
      <aside
        className={
          "order-2 flex min-h-0 w-full flex-col border-t border-line bg-paper md:order-1 md:h-full md:w-[420px] md:shrink-0 md:border-t-0 md:border-r " +
          (mobilePanel === "map" ? "h-auto" : "h-[58dvh]")
        }
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-2 md:pt-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-none font-medium tracking-tight">High Desert</p>
            <p className="mt-1 truncate text-xs text-muted">
              Las Vegas · Utah · Arizona · Colorado · New Mexico
            </p>
          </div>
          <button
            type="button"
            className="text-btn md:hidden"
            onClick={() => setMobilePanel(mobilePanel === "map" ? "browse" : "map")}
          >
            <MapIcon size={16} />
            {mobilePanel === "map" ? "Places" : "Map"}
          </button>
        </div>

        {mobilePanel === "map" ? null : selected && sheet === "detail" ? (
          <PlaceDetail
            place={selected}
            saved={favorites.includes(selected.id)}
            onBack={showList}
            onSave={() => toggleFavorite(selected.id)}
            onOpen={select}
          />
        ) : (
          <>
            <div className="px-4 pb-2">
              <label className="flex h-11 items-center gap-2 border border-line-strong bg-paper px-3">
                <Search size={16} className="text-faint" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search canyons, towns, trails"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
                />
                {query ? (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                    <X size={16} />
                  </button>
                ) : null}
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  className="chip shrink-0"
                  data-on={regions.includes(region.id) ? "true" : "false"}
                  onClick={() => toggleRegion(region.id)}
                >
                  <span className="size-2 rounded-full" style={{ background: region.color }} />
                  {region.label}
                </button>
              ))}
              <button
                type="button"
                className="chip shrink-0"
                data-on={savedOnly ? "true" : "false"}
                onClick={() => setSavedOnly(!savedOnly)}
              >
                <Heart size={14} fill={savedOnly ? "currentColor" : "none"} />
                Saved
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="chip shrink-0"
                  data-on={categories.includes(category.id) ? "true" : "false"}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between px-4 pb-1">
              <p className="text-xs text-muted tabular-nums">
                {filtered.length} of {catalog.length} places
              </p>
              {filtersActive ? (
                <button type="button" className="text-xs font-medium text-pine" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3">
              {filtered.length === 0 ? (
                <p className="px-2 py-8 text-sm text-muted">
                  Nothing matches. Clear a filter or try a place name, a town, or a trail.
                </p>
              ) : (
                visible.map((place) => {
                  const region = regionMeta(place.region);
                  const saved = favorites.includes(place.id);
                  return (
                    <button
                      key={place.id}
                      type="button"
                      className="row-btn"
                      onClick={() => select(place.id)}
                    >
                      <span className="flex items-start gap-3 px-2">
                        <span
                          className="mt-2 size-2.5 shrink-0 rounded-full"
                          style={{ background: region.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="font-display text-lg leading-tight font-medium">
                              {place.name}
                            </span>
                            {saved ? <Heart size={14} className="mt-1 shrink-0" fill="currentColor" /> : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {place.area}
                            {place.line ? " · mapped route" : ""}
                          </span>
                          <span className="mt-1 block text-sm leading-snug text-ink/80">
                            {place.signature}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
              {filtered.length > visible.length ? (
                <button
                  type="button"
                  className="row-btn text-sm font-medium"
                  onClick={() => setListLimit((limit) => limit + 80)}
                >
                  Show {Math.min(80, filtered.length - visible.length)} more of {filtered.length}
                </button>
              ) : null}
            </div>
            <div className="flex gap-2 border-t border-line px-3 py-3">
              {(
                [
                  ["liberty", "Atlas"],
                  ["dark", "Ink"],
                  ["satellite", "Satellite"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className="text-btn flex-1 justify-center"
                  data-on={basemap === id ? "true" : "false"}
                  onClick={() => setBasemap(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
      <div className="relative order-1 min-h-0 flex-1 md:order-2">
        <MapView places={filtered} selectedId={selectedId} basemap={basemap} onSelect={select} />
        <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-end md:left-auto">
          <p className="pointer-events-none hidden max-w-sm bg-paper/95 px-3 py-2 text-xs leading-snug text-muted shadow-panel md:block">
            {filtered.length} places. Select one for miles, vehicle, and what to watch for.
          </p>
        </div>
      </div>
    </div>
  );
}
