// /client-slideshow.js

const carousel = document.getElementById("clientCarousel");
const slidesTrack = document.getElementById("slidesTrack");
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const dotNav = document.getElementById("dotNav");
const slideStatus = document.getElementById("slideStatus");
const progressIndicator = document.getElementById("progressIndicator");

let currentIndex = 0;
let autoplayId = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const autoplayDelay = 7000;

initializeCarousel();

function initializeCarousel() {
    if (!carousel || !slidesTrack || !slides.length || !prevButton || !nextButton || !dotNav || !slideStatus || !progressIndicator) {
        return;
    }

    createDots();
    updateCarousel(false);
    attachEvents();

    if (!prefersReducedMotion) {
        startAutoplay();
    }
}

function createDots() {
    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot-button";
        dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
        dot.addEventListener("click", () => {
            goToSlide(index, true);
        });
        dotNav.appendChild(dot);
    });
}

function attachEvents() {
    prevButton.addEventListener("click", () => {
        goToSlide(currentIndex - 1, true);
    });

    nextButton.addEventListener("click", () => {
        goToSlide(currentIndex + 1, true);
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", handleFocusOut);

    carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToSlide(currentIndex - 1, true);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            goToSlide(currentIndex + 1, true);
        }
    });

    attachTouchSupport();
    window.addEventListener("resize", () => updateCarousel(false));
}

function handleFocusOut(event) {
    if (!carousel.contains(event.relatedTarget)) {
        startAutoplay();
    }
}

function attachTouchSupport() {
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener(
        "touchstart",
        (event) => {
            touchStartX = event.changedTouches[0].clientX;
        },
        { passive: true }
    );

    carousel.addEventListener(
        "touchend",
        (event) => {
            touchEndX = event.changedTouches[0].clientX;
            const distance = touchEndX - touchStartX;

            if (Math.abs(distance) < 40) {
                return;
            }

            if (distance > 0) {
                goToSlide(currentIndex - 1, true);
            } else {
                goToSlide(currentIndex + 1, true);
            }
        },
        { passive: true }
    );
}

function goToSlide(index, userInitiated) {
    currentIndex = getWrappedIndex(index);
    updateCarousel(userInitiated);

    if (!prefersReducedMotion) {
        restartAutoplay();
    }
}

function updateCarousel(shouldFocusCurrentSlide) {
    slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    slideStatus.textContent = `Slide ${currentIndex + 1} of ${slides.length}`;
    progressIndicator.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;

    slides.forEach((slide, index) => {
        const isActive = index === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        slide.tabIndex = isActive ? 0 : -1;
    });

    Array.from(dotNav.children).forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === currentIndex));
    });

    if (shouldFocusCurrentSlide) {
        slides[currentIndex].focus();
    }
}

function getWrappedIndex(index) {
    if (index < 0) {
        return slides.length - 1;
    }

    if (index >= slides.length) {
        return 0;
    }

    return index;
}

function startAutoplay() {
    if (prefersReducedMotion || autoplayId !== null) {
        return;
    }

    autoplayId = window.setInterval(() => {
        goToSlide(currentIndex + 1, false);
    }, autoplayDelay);
}

function stopAutoplay() {
    if (autoplayId === null) {
        return;
    }

    window.clearInterval(autoplayId);
    autoplayId = null;
}

function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
}
