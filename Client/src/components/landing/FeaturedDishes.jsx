import React from 'react';
import { useNavigate } from 'react-router-dom';
import FoodDishCard from '../ui/FoodDishCard';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import { PLATTER_MENU } from '../../data/landingData';

export default function FeaturedDishes() {
  const navigate = useNavigate();

  // Curated showcase of iconic Filipino catering favorites
  const featuredIds = [
    'lechon',
    'pork-kare-kare',
    'pork-humba',
    'pork-lumpia',
    'buttered-shrimp',
    'beef-steak-tagalog',
    'pancit-guisado',
    'buko-pandan',
  ];

  const allItems = [
    ...PLATTER_MENU.specials,
    ...PLATTER_MENU.mains,
    ...PLATTER_MENU.sides,
  ];

  const dishes = featuredIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <section id="featured-dishes" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="Our Culinary Specialties"
          title="Authentic Filipino Catering Favorites"
          description="Crafted with traditional recipes, premium local ingredients, and served with signature elegance."
        />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {dishes.map((dish) => (
            <FoodDishCard
              key={dish.id}
              dish={dish}
              price={dish.price}
              selectable={false}
              compact={false}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" onClick={() => navigate('/menus')}>
            Explore Full 50+ Dish Menu &amp; Platters
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}
