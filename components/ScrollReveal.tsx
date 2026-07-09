"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  "main > section",
  "main > div",
  "article",
  ".lift",
  ".divider",
  "form",
].join(", ");

export default function ScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))
      .filter((element) => !element.closest("[data-no-reveal]"));

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    elements.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 35}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.04 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
