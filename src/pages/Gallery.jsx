import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

  const segments = useMemo(() => {
    const count = images.length;
    if (count <= 4) return 8;
    if (count <= 8) return 12;
    return 24;
  }, [images.length]);

  return (
    <div className="home-section-gallery container">
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
            Spin and click to see
          </p>
        </motion.div>
      </div>

      <DomeGallery
        images={images}
        segments={segments}
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
