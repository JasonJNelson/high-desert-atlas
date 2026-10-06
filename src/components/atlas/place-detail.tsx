import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink, Heart } from "lucide-react";
import { categoryLabel, getPlace, regionMeta, type Place } from "@/data/places";
import { fromStrip } from "@/lib/drive";

export function PlaceDetail({
  place,
  saved,
  onBack,
  onSave,
  onOpen,
}: {
  place: Place;
  saved: boolean;
  onBack: () => void;
  onSave: () => void;
  onOpen: (id: string) => void;
}) {
  const region = regionMeta(place.region);
  const pairs = place.pairWith.map((id) => getPlace(id)).filter((item): item is Place => !!item);

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-3">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back to list">
          <ArrowLeft size={18} />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm text-muted">{region.label}</p>
        <button
          type="button"
          className="icon-btn"
          data-on={saved ? "true" : "false"}
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved places" : "Save place"}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
          <span className="inline-block size-2 rounded-full" style={{ background: region.color }} />
          {place.area}
        </p>
        <h2 className="mt-2 font-display text-3xl leading-tight font-medium tracking-tight">
          {place.name}
        </h2>
        <p className="mt-2 text-base leading-snug text-ink">{place.signature}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted"
            >
              {categoryLabel(category)}
            </span>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink">{place.summary}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{place.why}</p>
        {place.line ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The colored line is this route, traced from OpenStreetMap and simplified. Side spurs, closures, and private land are not all drawn. A line is not a permit.
          </p>
        ) : null}

        {place.status ? (
          <div className="mt-5 border-l-2 border-clay bg-paper-2 px-3 py-3">
            <p className="text-xs font-medium tracking-wide text-clay uppercase">Before you go</p>
            <p className="mt-1 text-sm leading-relaxed">{place.status}</p>
          </div>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-2">
          <Fact label="Best time" value={place.best} />
          <Fact label="Time needed" value={place.time} />
          <Fact label="Difficulty" value={place.difficulty} />
          <Fact label="Elevation" value={place.elevation} />
          <Fact label="From the Strip" value={fromStrip(place.lat, place.lng)} />
          <Fact label="Getting there" value={place.access} wide />
        </dl>

        <Section title="See">
          <ul className="mt-2 space-y-1.5">
            {place.highlights.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-snug">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-pine" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Fees and permits">
          <p className="mt-2 text-sm leading-relaxed">{place.fee}</p>
          {place.permit ? <p className="mt-2 text-sm leading-relaxed text-muted">{place.permit}</p> : null}
          {place.established ? (
            <p className="mt-2 text-sm text-faint">{place.established}</p>
          ) : null}
        </Section>

        <Section title="Field notes">
          <ul className="mt-2 space-y-2">
            {place.tips.map((tip) => (
              <li key={tip} className="text-sm leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Watch for">
          <p className="mt-2 text-sm leading-relaxed">{place.watch}</p>
        </Section>

        {pairs.length > 0 ? (
          <Section title="Pair it with">
            <div className="mt-2 flex flex-col">
              {pairs.map((pair) => (
                <button key={pair.id} type="button" className="row-btn" onClick={() => onOpen(pair.id)}>
                  <span className="block px-1 text-sm font-medium">{pair.name}</span>
                  <span className="mt-0.5 block px-1 text-xs text-muted">{pair.area}</span>
                </button>
              ))}
            </div>
          </Section>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {place.website ? (
            <a
              className="text-btn primary"
              href={place.website}
              target="_blank"
              rel="noreferrer"
            >
              Official site
              <ExternalLink size={15} />
            </a>
          ) : null}
          <p className="text-xs text-faint tabular-nums">
            {place.lat.toFixed(3)}°, {place.lng.toFixed(3)}°
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Drive times are a rough guess from straight-line distance to the Strip, not a route.
          Fees, permits, and closures change — confirm with the land manager before you go.
        </p>
      </div>
    </article>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "fact col-span-2" : "fact"}>
      <dt className="text-xs font-medium tracking-wide text-faint uppercase">{label}</dt>
      <dd className="mt-1 text-sm leading-snug">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-xl font-medium">{title}</h3>
      {children}
    </section>
  );
}
