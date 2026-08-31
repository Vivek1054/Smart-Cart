import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import ProductCard from './ProductCard';
import ScrollReveal from '../ui/ScrollReveal';
import './styles.css';

const settings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 2,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 3, slidesToScroll: 2 } },
    { breakpoint: 900, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    { breakpoint: 560, settings: { slidesToShow: 1, slidesToScroll: 1 } },
  ],
};

const ProductCarousel = ({ eyebrow, title, products, viewAllLink }) => {
  if (!products?.length) return null;

  return (
    <section className="max-w-screen-2xl container mx-auto md:px-20 px-4 py-12">
      <ScrollReveal>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            {eyebrow && <span className="text-sm font-semibold uppercase tracking-wider text-brand-500">{eyebrow}</span>}
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mt-1">
              {title}
            </h2>
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all"
            >
              View All <FaArrowRight size={12} />
            </Link>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="smartcart-slider">
          <Slider {...settings}>
            {products.map((item) => (
              <div key={item.id} className="px-3 py-2">
                <ProductCard item={item} />
              </div>
            ))}
          </Slider>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default ProductCarousel;
