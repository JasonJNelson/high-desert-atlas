import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapHandle, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { BasemapId, Place } from "@/data/places";
import { REGIONS } from "@/data/places";

const maplibrePromise =
  typeof window === "undefined"
    ? null
    : Promise.all([
        import("maplibre-gl"),
        import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
      ]);

const REGION_COLORS = Object.fromEntries(REGIONS.map((region) => [region.id, region.color])) as Record<
  string,
  string
>;

function styleFor(basemap: BasemapId): string | StyleSpecification {
  if (basemap === "dark") return "https://tiles.openfreemap.org/styles/dark";
  if (basemap === "liberty") return "https://tiles.openfreemap.org/styles/liberty";
  const satellite: StyleSpecification = {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  };
  return satellite;
}

function toGeoJson(places: Place[]) {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      properties: { id: place.id, name: place.name, region: place.region },
    })),
  };
}

function toTrails(places: Place[]) {
  return {
    type: "FeatureCollection" as const,
    features: places
      .filter((place) => place.line && place.line.length > 0)
      .map((place) => ({
        type: "Feature" as const,
        geometry: { type: "MultiLineString" as const, coordinates: place.line },
        properties: { id: place.id, name: place.name, region: place.region },
      })),
  };
}

function asGeoJson(source: { type: string } | undefined): GeoJSONSource | null {
  if (!source || source.type !== "geojson") return null;
  return source as GeoJSONSource;
}

export function MapView({
  places,
  selectedId,
  basemap,
  onSelect,
}: {
  places: Place[];
  selectedId: string | null;
  basemap: BasemapId;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const readyRef = useRef(false);
  const placesRef = useRef(places);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const basemapRef = useRef(basemap);
  placesRef.current = places;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;
  basemapRef.current = basemap;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapHandle | null = null;
    let cancelled = false;

    (async () => {
      if (!maplibrePromise) return;
      const [maplibregl, workerMod] = await maplibrePromise;
      const workerUrl = workerMod.default;
      if (typeof workerUrl === "string") maplibregl.setWorkerUrl(workerUrl);
      if (cancelled || !containerRef.current) return;
      const view = new maplibregl.Map({
        container: containerRef.current,
        style: styleFor(basemapRef.current),
        center: [-110.8, 36.6],
        zoom: 4.7,
        attributionControl: false,
      });
      map = view;
      view.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      view.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "Places curated for this atlas",
        }),
        "bottom-left",
      );
      mapRef.current = view;

      const install = () => {
        if (view.getSource("places")) return;
        view.addSource("places", {
          type: "geojson",
          data: toGeoJson(placesRef.current),
          cluster: true,
          clusterRadius: 46,
          clusterMaxZoom: 8,
        });
        view.addSource("trails", {
          type: "geojson",
          data: toTrails(placesRef.current),
        });
        view.addLayer({
          id: "trail-casing",
          type: "line",
          source: "trails",
          paint: {
            "line-color": "#f3efe6",
            "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.4, 8, 5, 12, 8],
            "line-opacity": 0.95,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        view.addLayer({
          id: "trails",
          type: "line",
          source: "trails",
          paint: {
            "line-color": [
              "match",
              ["get", "region"],
              "vegas",
              REGION_COLORS.vegas,
              "utah",
              REGION_COLORS.utah,
              "arizona",
              REGION_COLORS.arizona,
              "colorado",
              REGION_COLORS.colorado,
              "newmexico",
              REGION_COLORS.newmexico,
              "#1c1915",
            ],
            "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.3, 8, 2.8, 12, 4.4],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        view.addLayer({
          id: "trail-selected",
          type: "line",
          source: "trails",
          filter: ["==", ["get", "id"], selectedRef.current ?? ""],
          paint: {
            "line-color": "#1c1915",
            "line-width": ["interpolate", ["linear"], ["zoom"], 4, 3.2, 12, 7],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        view.addLayer({
          id: "trail-hit",
          type: "line",
          source: "trails",
          paint: { "line-color": "rgba(0,0,0,0.01)", "line-width": 16 },
        });
        view.addLayer({
          id: "trail-labels",
          type: "symbol",
          source: "trails",
          minzoom: 9,
          layout: {
            "symbol-placement": "line",
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-max-angle": 35,
          },
          paint: {
            "text-color": "#1c1915",
            "text-halo-color": "#f3efe6",
            "text-halo-width": 1.4,
          },
        });
        view.addLayer({
          id: "clusters",
          type: "circle",
          source: "places",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#1c1915",
            "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 20, 26],
            "circle-opacity": 0.9,
          },
        });
        view.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "places",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
          },
          paint: { "text-color": "#f3efe6" },
        });
        view.addLayer({
          id: "points",
          type: "circle",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "region"],
              "vegas",
              REGION_COLORS.vegas,
              "utah",
              REGION_COLORS.utah,
              "arizona",
              REGION_COLORS.arizona,
              "colorado",
              REGION_COLORS.colorado,
              "newmexico",
              REGION_COLORS.newmexico,
              "#1c1915",
            ],
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#f3efe6",
          },
        });
        view.addLayer({
          id: "selected",
          type: "circle",
          source: "places",
          filter: ["==", ["get", "id"], selectedRef.current ?? ""],
          paint: {
            "circle-color": "rgba(0,0,0,0)",
            "circle-radius": 13,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#1c1915",
          },
        });
        view.addLayer({
          id: "labels",
          type: "symbol",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          minzoom: 8,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 1.15],
            "text-anchor": "top",
            "text-max-width": 12,
          },
          paint: {
            "text-color": "#1c1915",
            "text-halo-color": "#f3efe6",
            "text-halo-width": 1.2,
          },
        });
      };

      view.on("style.load", () => {
        install();
        if (!readyRef.current) {
          readyRef.current = true;
          const bounds = new maplibregl.LngLatBounds();
          for (const place of placesRef.current) bounds.extend([place.lng, place.lat]);
          if (!bounds.isEmpty()) {
            view.fitBounds(bounds, { padding: 56, duration: 0, maxZoom: 6.2 });
          }
        }
      });

      view.on("click", (event) => {
        if (!view.getLayer("clusters") || !view.getLayer("points")) return;
        const clusters = view.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const cluster = clusters[0];
        if (cluster) {
          const source = asGeoJson(view.getSource("places"));
          const clusterId = cluster.properties?.cluster_id;
          if (!source || typeof clusterId !== "number") return;
          void source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const geometry = cluster.geometry;
            if (geometry.type !== "Point") return;
            const coords = geometry.coordinates;
            view.easeTo({ center: [coords[0], coords[1]], zoom });
          });
          return;
        }
        const points = view.queryRenderedFeatures(event.point, { layers: ["points"] });
        const pointId = points[0]?.properties?.id;
        if (typeof pointId === "string") {
          onSelectRef.current(pointId);
          return;
        }
        if (view.getLayer("trail-hit")) {
          const trails = view.queryRenderedFeatures(event.point, { layers: ["trail-hit"] });
          const trailId = trails[0]?.properties?.id;
          if (typeof trailId === "string") onSelectRef.current(trailId);
        }
      });

      view.on("mousemove", (event) => {
        if (!view.getLayer("points")) return;
        const layers = view.getLayer("trail-hit") ? ["points", "clusters", "trail-hit"] : ["points", "clusters"];
        const hit = view.queryRenderedFeatures(event.point, { layers });
        view.getCanvas().style.cursor = hit.length > 0 ? "pointer" : "";
      });
    })();

    return () => {
      cancelled = true;
      readyRef.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setStyle(styleFor(basemap));
  }, [basemap]);

  useEffect(() => {
    const source = asGeoJson(mapRef.current?.getSource("places"));
    if (source) source.setData(toGeoJson(places));
    const trails = asGeoJson(mapRef.current?.getSource("trails"));
    if (trails) trails.setData(toTrails(places));
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("selected")) return;
    map.setFilter("selected", ["==", ["get", "id"], selectedId ?? ""]);
    if (map.getLayer("trail-selected")) {
      map.setFilter("trail-selected", ["==", ["get", "id"], selectedId ?? ""]);
    }
    if (!selectedId) return;
    const place = places.find((item) => item.id === selectedId);
    if (!place) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (place.line && place.line.length > 0) {
      let minLng = 180;
      let minLat = 90;
      let maxLng = -180;
      let maxLat = -90;
      for (const segment of place.line) {
        for (const [lng, lat] of segment) {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        }
      }
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 72, duration: reduce ? 0 : 1100, maxZoom: 13 },
      );
      return;
    }
    map.flyTo({
      center: [place.lng, place.lat],
      zoom: Math.max(map.getZoom(), 9.4),
      duration: reduce ? 0 : 1100,
      essential: true,
    });
  }, [selectedId, places]);

  return <div ref={containerRef} className="h-full w-full bg-[#c5d0c4]" />;
}
