import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const go = (next: number) => {
    const i = (next + images.length) % images.length;
    setIdx(i);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative px-4 pt-3">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIdx(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${alt} — foto ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[4/5] w-full shrink-0 snap-center object-contain"
            />
          ))}
        </div>

        <button
          aria-label="Foto anterior"
          onClick={() => go(idx - 1)}
          className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 shadow"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          aria-label="Próxima foto"
          onClick={() => go(idx + 1)}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 shadow"
        >
          <ChevronRight className="size-5" />
        </button>

        <span className="absolute bottom-3 left-3 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {idx + 1} / {images.length}
        </span>
      </div>

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-3">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => go(i)}
            aria-label={`Ver foto ${i + 1}`}
            className={`size-[52px] shrink-0 overflow-hidden rounded border ${
              i === idx ? "border-primary" : "border-border"
            }`}
          >
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <span
            key={src}
            className={`size-1.5 rounded-full ${i === idx ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}
