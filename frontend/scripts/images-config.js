/**
 * Homepage image configuration for GrandStay.
 * The homepage reads these local asset paths at runtime so image assignments
 * stay centralized and can be swapped without editing the markup.
 */

const images = {
  hero: {
    url: 'images/hero-hotel.jpg',
    alt: 'Palm-lined GrandStay hotel exterior at sunset',
    position: 'center center',
    fetchPriority: 'high'
  },

  about: {
    url: 'images/about-hotel.jpg',
    alt: 'GrandStay lobby with chandelier and lounge seating',
    position: 'center center'
  },

  rooms: {
    standard: {
      url: 'images/room-standard.jpg',
      alt: 'Modern standard room with desk and city-view window',
      position: 'center center'
    },
    deluxe: {
      url: 'images/room-deluxe.jpg',
      alt: 'Warm deluxe bedroom with bench seating and soft lighting',
      position: 'center center'
    },
    suite: {
      url: 'images/room-suite.jpg',
      alt: 'Large luxury suite living room with chandelier and skyline view',
      position: 'center center'
    }
  },

  facilities: {
    pool: {
      url: 'images/facility-pool.jpg',
      alt: 'Infinity pool overlooking the water at sunset',
      position: 'center center'
    },
    dining: {
      url: 'images/facility-restaurant.jpg',
      alt: 'Fine-dining restaurant with chandeliers and dressed tables',
      position: 'center center'
    },
    spa: {
      url: 'images/gallery-spa.jpg',
      alt: 'Candlelit spa treatment room with massage bed and hot stones',
      position: 'center center'
    },
    gym: {
      url: 'images/facility-gym.jpg',
      alt: 'Bright fitness center with treadmills and floor-to-ceiling windows',
      position: 'center center'
    }
  },

  gallery: [
    {
      title: 'Room Gallery',
      url: 'images/gallery-bedroom.jpg',
      alt: 'Ornate gold-accent luxury bedroom',
      position: 'center center',
      size: 'large'
    },
    {
      title: 'Standard Room',
      url: 'images/room-standard.jpg',
      alt: 'Modern standard room with desk and city-view window',
      position: 'center center'
    },
    {
      title: 'Deluxe Room',
      url: 'images/room-deluxe.jpg',
      alt: 'Warm deluxe bedroom with bench seating and soft lighting',
      position: 'center center'
    },
    {
      title: 'Fitness Center',
      url: 'images/facility-gym.jpg',
      alt: 'Bright fitness center with treadmills and natural light',
      position: 'center center'
    },
    {
      title: 'Spa & Wellness',
      url: 'images/gallery-spa.jpg',
      alt: 'Hot-stone massage close-up in a warm spa setting',
      position: 'center center'
    },
    {
      title: 'Fine Dining',
      url: 'images/facility-restaurant.jpg',
      alt: 'Chandelier-lit fine-dining restaurant with formal table settings',
      position: 'center center',
      size: 'large'
    },
    {
      title: 'Infinity Pool',
      url: 'images/facility-pool.jpg',
      alt: 'Infinity pool overlooking the water at sunset',
      position: 'center center'
    },
    {
      title: 'Hotel Exterior',
      url: 'images/hero-hotel.jpg',
      alt: 'Palm-lined GrandStay hotel exterior at sunset',
      position: 'center center'
    },
    {
      title: 'Hotel Gardens',
      url: 'images/gallery-garden.jpg',
      alt: 'Courtyard garden with fountain, palms, and sculpted hedges',
      position: 'center center'
    },
    {
      title: 'Rooftop Lounge',
      url: 'images/gallery-rooftop.jpg',
      alt: 'Rooftop lounge with skyline views at dusk',
      position: 'center center'
    },
    {
      title: 'Lobby Area',
      url: 'images/gallery-lobby.jpg',
      alt: 'Double-height lobby with chandeliers and lounge seating',
      position: 'center center',
      size: 'large'
    },
    {
      title: 'Presidential Suite',
      url: 'images/room-suite.jpg',
      alt: 'Large luxury suite living room with chandelier and skyline view',
      position: 'center center'
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = images;
}

if (typeof window !== 'undefined') {
  window.hotelImages = images;
}
