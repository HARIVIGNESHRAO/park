import React, { useState, useEffect } from 'react';
import {Link} from "react-router-dom";
import '../CarouselPage/CarouselPage.css';

const CarouselPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Sample image data - replace with your actual images
  const images = [
    { id: 1, src: "/images/vydyavano.png", alt: "Carousel Image 1" },
    { id: 2, src: "/images/img_4.png", alt: "Carousel Image 2" },
    { id: 3, src: "/images/vydyavano.png", alt: "Carousel Image 3" },
    { id: 4, src: "/images/img_4.png", alt: "Carousel Image 4" },
    { id: 5, src: "/images/vydyavano.png", alt: "Carousel Image 5" }
  ];

  // Auto-rotation effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isNavigating) {
        setActiveIndex((current) => (current + 1) % images.length);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length, isNavigating]);

  // Handle image click to navigate to home
  const handleImageClick = () => {
    setIsNavigating(true);
    // Simulating navigation animation
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  // Handle manual carousel navigation
  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="carousel-page">
      {/* Blurred background using the current active image */}
      <div
        className="carousel-background"
        style={{
          backgroundImage: `url(${images[activeIndex].src})`,
        }}
      />

      {/* Carousel container */}
      <div className={`carousel-container ${isNavigating ? 'navigating' : ''}`}>
        {/* Images */}
        <div className="carousel-images">
          {images.map((image, index) => {
            const position = index - activeIndex;
            const isActive = index === activeIndex;

            // Handle wrap-around for circular carousel
            let cssPosition = position;
            if (position > 2) cssPosition = position - images.length;
            if (position < -2) cssPosition = position + images.length;

            return (
              <div
                key={image.id}
                className={`carousel-image ${isActive ? 'active' : ''} position-${cssPosition}`}
                onClick={handleImageClick}
              >
                <Link to='/login'>           <img
                  src={image.src}
                  alt={image.alt}
                /></Link>
              </div>
            );
          })}
        </div>

        {/* Carousel indicators */}
        <div className="carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-indicator ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>

  );
};

export default CarouselPage;