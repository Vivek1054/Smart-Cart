const BANNER_KEY = 'smartcart_promo_banner';

const DEFAULT_BANNER = {
  title: 'Craving something new? Explore the full menu.',
  description: "From budget bites to premium picks, there's a sandwich for every mood.",
  ctaText: 'Explore Menu',
  ctaLink: '/menu',
  active: true,
};

export const getPromoBanner = () => {
  try {
    const raw = localStorage.getItem(BANNER_KEY);
    return raw ? { ...DEFAULT_BANNER, ...JSON.parse(raw) } : DEFAULT_BANNER;
  } catch {
    return DEFAULT_BANNER;
  }
};

export const savePromoBanner = (banner) => {
  localStorage.setItem(BANNER_KEY, JSON.stringify(banner));
};
