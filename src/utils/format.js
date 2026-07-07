export const compoundColor = (compound) => {
  const map = {
    SOFT: '#FF3333',
    MEDIUM: '#FFD700',
    HARD: '#F0F0F0',
    INTER: '#3EB83E',
    WET: '#3399FF',
  };
  return map[compound] || '#888888';
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
