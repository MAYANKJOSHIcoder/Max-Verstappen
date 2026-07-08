import { useMemo } from 'react';
import FadeIn from '../components/FadeIn';
import galleryData from '../data/gallery.json';
import DomeGallery from '../components/DomeGallery';
import './Gallery.css';

const Gallery = () => {
  const images = useMemo(
    () => galleryData.map((img) => ({
      src: img.imageUrl,
      alt: img.caption,
      credit: img.credit,
    })),
    []
  );

  return (
    <div className="home-section-gallery container">
      <div className="gallery-head">
        <FadeIn y={28} duration={0.6} rootMargin="-80px" className="section-head">
          <span className="eyebrow">Gallery</span>
          <h2 className="section-title">In the frame</h2>
          <p className="section-lead">
            Spin and click to see
          </p>
        </FadeIn>
      </div>

      <DomeGallery images={images} />
    </div>
  );
};

export default Gallery;
