const STRIP = { lat: 36.1147, lng: -115.1728 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const r = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function fromStrip(lat: number, lng: number): string {
  const straight = milesBetween(STRIP, { lat, lng });
  if (straight < 4) return "On the Strip";
  if (straight < 12) return "In the Las Vegas valley";
  const roadMiles = Math.round(straight * 1.28);
  const hours = roadMiles / 52;
  if (hours < 0.9) return `About ${Math.max(20, Math.round(hours * 60))} min from the Strip`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m < 12) return `Roughly ${h} hr from the Strip`;
  if (m > 48) return `Roughly ${h + 1} hr from the Strip`;
  return `Roughly ${h} hr ${m} min from the Strip`;
}
