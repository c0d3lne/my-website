"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const photographs = [
  {
    src: "/images/gallery-wheel-detail.webp",
    alt: "Close detail of a blue car’s wheel and 5.0 fender badge",
    title: "Power in the details",
    note: "A close look at the wheel and sculpted blue bodywork",
  },
  {
    src: "/images/gallery-blue-headlight.webp",
    alt: "Blue performance car front corner and headlight",
    title: "Light and line",
    note: "A close-up of blue paint and headlight design",
  },
  {
    src: "/images/gallery-porsche-headlight.webp",
    alt: "Porsche bonnet and headlight detail",
    title: "Sculpted from every angle",
    note: "A considered view across the bonnet and headlight",
  },
  {
    src: "/images/hero-porsche-front.webp",
    alt: "Blue Porsche viewed from the front three-quarter angle",
    title: "A confident first impression",
    note: "Blue Porsche front three-quarter view",
  },
  {
    src: "/images/gallery-porsche-rear.webp",
    alt: "Porsche Carrera lettering across the rear of a dark car",
    title: "The finishing touch",
    note: "Porsche rear lettering and Carrera detail",
  },
];

type SlidePosition = "left" | "center" | "right" | "hidden";

function positionFor(index: number, active: number): SlidePosition {
  if (index === active) return "center";
  if (index === (active - 1 + photographs.length) % photographs.length) return "left";
  if (index === (active + 1) % photographs.length) return "right";
  return "hidden";
}

export default function GalleryCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const previous = () => setActiveIndex((index) => (index - 1 + photographs.length) % photographs.length);
  const next = () => setActiveIndex((index) => (index + 1) % photographs.length);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > 48) (delta < 0 ? next : previous)();
  }

  return (
    <section className="gallery-section" id="gallery">
      <div className="section gallery-inner">
        <div className="section-heading gallery-heading">
          <div>
            <p className="eyebrow">03 / THE GALLERY</p>
            <h2>Made to be<br /><em>looked after.</em></h2>
          </div>
          <p className="section-intro">A closer look at the lines, finishes and details that make every car unique. These photographs showcase the cars themselves, not before-and-after results.</p>
        </div>

        <div
          className="gallery-carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="GB Detailing car photography"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <div
            className="carousel-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { pointerStart.current = null; }}
          >
            {photographs.map((photo, index) => {
              const position = positionFor(index, activeIndex);
              return (
                <figure
                  className={`carousel-slide carousel-slide-${position}`}
                  key={photo.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${photographs.length}: ${photo.title}`}
                  aria-hidden={position === "hidden"}
                >
                  <div className="carousel-photo">
                    <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 78vw, 52vw" />
                  </div>
                  <figcaption><strong>{photo.title}</strong><span>{photo.note}</span></figcaption>
                </figure>
              );
            })}
          </div>

          <div className="carousel-controls">
            <button className="carousel-arrow" type="button" onClick={previous} aria-label="Show previous photograph">
              <span aria-hidden="true">←</span>
            </button>
            <p className="carousel-status" aria-live="polite" aria-atomic="true">
              <span>{String(activeIndex + 1).padStart(2, "0")}</span> / {String(photographs.length).padStart(2, "0")}
            </p>
            <button className="carousel-arrow" type="button" onClick={next} aria-label="Show next photograph">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
