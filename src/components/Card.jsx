import { motion } from 'framer-motion';
import './Card.css';

const Card = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={`card ${className}`}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default Card;
