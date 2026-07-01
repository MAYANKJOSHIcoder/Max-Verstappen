import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import galleryData from '../data/gallery.json';
import DomeGallery from '../components/DomeGallery';
import './Gallery.css';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(
    () => ['all', ...new Set(galleryData.map((img) => img.category))],
    []
  );

  const images = useMemo(() => {
    const pool =
      selectedCategory === 'all'
        ? galleryData
        : galleryData.filter((img) => img.category === selectedCategory);

    return pool.map((img) => ({
      src: img.imageUrl,
      alt: img.caption,
      credit: img.credit,
    }));
  }, [selectedCategory]);

  // Scroll-lock mirror — DomeGallery toggles `.dg-scroll-lock` on
  // open/close via its own `lock`/`unlock` helpers, which flip
  // document.body.classList. Nothing else to do here, but we clean
  // up on unmount in case the user navigates away mid-enlarge.
  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock');
    };
  }, []);

  return (
    <div className="home-section-gallery">
      <div className="gallery-head">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow">Gallery</span>
          <h2 className="section-title">In the frame</h2>
          <p className="section-lead">
            Races, podiums, championships, and behind the scenes. Click a tile
            to enlarge, or drag to spin the wall.
          </p>
        </motion.div>

        <motion.div
          className="gallery-filters"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-button ${selectedCategory === cat ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </motion.div>
      </div>

      <DomeGallery
        images={images}
        segments={images.length < 10 ? 17 : 24}
        fit={0.6}
        minRadius={420}
        overlayBlurColor="#0a0a18"
        maxVerticalRotationDeg={6}
        dragSensitivity={22}
        enlargeTransitionMs={320}
        openedImageWidth="320px"
        openedImageHeight="460px"
        imageBorderRadius="14px"
        openedImageBorderRadius="16px"
        grayscale={false}
      />
    </div>
  );
};

export default Gallery;
