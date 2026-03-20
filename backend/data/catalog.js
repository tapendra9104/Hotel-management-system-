const roomCatalog = [
    {
        name: 'Standard Room',
        description: 'Cozy comfort with modern amenities',
        price: 3500,
        capacity: 2,
        amenities: ['Free Wi-Fi', 'Work Desk', 'Smart TV', 'Rain Shower'],
        image: '/images/room-standard.jpg',
        totalRooms: 5,
        availableRooms: 5,
        available: true
    },
    {
        name: 'Deluxe Room',
        description: 'Spacious luxury with city views',
        price: 6000,
        capacity: 3,
        amenities: ['Free Wi-Fi', 'City View', 'Mini Bar', 'Premium Bathrobes'],
        image: '/images/room-deluxe.jpg',
        totalRooms: 3,
        availableRooms: 3,
        available: true
    },
    {
        name: 'Suite',
        description: 'Ultimate indulgence with private lounge',
        price: 12000,
        capacity: 4,
        amenities: ['Private Lounge', 'Complimentary Drinks', 'Butler Support', 'Luxury Toiletries'],
        image: '/images/room-suite.jpg',
        totalRooms: 2,
        availableRooms: 2,
        available: true
    }
];

const spaImageCatalog = {
    massage: {
        image: '/images/spa-swedish-massage.jpg',
        imageAlt: 'Candlelit massage room with hot stones placed along the back'
    },
    facial: {
        image: '/images/spa-classic-facial.jpg',
        imageAlt: 'Premium facial products and skincare tools arranged for a facial treatment'
    },
    'body-treatment': {
        image: '/images/spa-body-scrub.jpg',
        imageAlt: 'Body scrub ritual with bath salts, brush, towels, and tropical flowers'
    },
    'wellness-package': {
        image: '/images/spa-pkg-wellness.jpg',
        imageAlt: 'Wellness package still life with a green juice, tray, and hot stones'
    },
    'couples-spa': {
        image: '/images/spa-pkg-relaxation.jpg',
        imageAlt: 'Relaxation spa arrangement with candles, towels, oils, and stones'
    },
    aromatherapy: {
        image: '/images/spa-aromatherapy.jpg',
        imageAlt: 'Aromatherapy essential oil bottles styled with lavender and diffuser'
    }
};

const foodImageCatalog = {
    Breakfast: {
        image: '/images/food-breakfast.jpg',
        imageAlt: 'Turkish-style breakfast spread with eggs, vegetables, olives, and tea'
    },
    'Small Plates': {
        image: '/images/food-small-plates.jpg',
        imageAlt: 'Elegant appetizer bites served on toasted bread with herbs and tomatoes'
    },
    Mains: {
        image: '/images/food-mains.jpg',
        imageAlt: 'Chef-plated main course presentation with premium ingredients and seasonal vegetables'
    },
    Desserts: {
        image: '/images/food-dessert.jpg',
        imageAlt: 'Refined plated dessert with chocolate, ice cream, and fruit garnish'
    },
    Beverages: {
        image: '/images/food-beverages.jpg',
        imageAlt: 'Signature beverage service presented in a warm cafe setting'
    }
};

function decorateSpaService(service) {
    return {
        ...(spaImageCatalog[service.serviceType] || spaImageCatalog.massage),
        ...service
    };
}

function decorateFoodItem(item) {
    return {
        ...(foodImageCatalog[item.category] || foodImageCatalog.Mains),
        ...item
    };
}

const spaServiceCatalog = [
    {
        serviceType: 'massage',
        serviceId: 'relaxation',
        name: 'Relaxation Massage',
        basePrice: 4500,
        duration: 60,
        description: 'A calming full-body ritual to release tension and restore balance.',
        image: '/images/spa-swedish-massage.jpg',
        imageAlt: 'Guest receiving a calming Swedish-style massage in a warm candlelit room'
    },
    {
        serviceType: 'massage',
        serviceId: 'therapeutic',
        name: 'Therapeutic Massage',
        basePrice: 5500,
        duration: 90,
        description: 'Targeted pressure therapy designed for deep relief and mobility.',
        image: '/images/spa-deep-tissue.jpg',
        imageAlt: 'Deep tissue massage setting with hot stones and a serene treatment space'
    },
    {
        serviceType: 'massage',
        serviceId: 'hotstone',
        name: 'Hot Stone Massage',
        basePrice: 6000,
        duration: 90,
        description: 'Smooth heated stones melt away stress and improve circulation.',
        image: '/images/spa-hot-stone.jpg',
        imageAlt: 'Hot stone massage with smooth heated stones placed along the back'
    },
    {
        serviceType: 'facial',
        serviceId: 'basic',
        name: 'Basic Facial',
        basePrice: 3500,
        duration: 45,
        description: 'A glow-restoring facial for hydration, cleansing, and relaxation.',
        image: '/images/spa-classic-facial.jpg',
        imageAlt: 'Classic facial treatment setup with skincare products and tools'
    },
    {
        serviceType: 'facial',
        serviceId: 'luxury',
        name: 'Luxury Facial Treatment',
        basePrice: 5500,
        duration: 60,
        description: 'Premium botanicals and massage techniques for radiant skin.',
        image: '/images/spa-luxury-facial.jpg',
        imageAlt: 'Luxury facial treatment with a spa therapist massaging the client face'
    },
    {
        serviceType: 'facial',
        serviceId: 'antiaging',
        name: 'Anti-Aging Facial',
        basePrice: 6500,
        duration: 75,
        description: 'A collagen-focused ritual to firm, lift, and energize tired skin.',
        image: '/images/spa-anti-aging.jpg',
        imageAlt: 'Anti-aging facial products arranged in a premium spa skincare setting'
    },
    {
        serviceType: 'body-treatment',
        serviceId: 'scrub',
        name: 'Body Scrub & Polish',
        basePrice: 4000,
        duration: 60,
        description: 'Mineral exfoliation paired with nourishing oils for silky skin.',
        image: '/images/spa-body-scrub.jpg',
        imageAlt: 'Body scrub ritual with bath salts, a brush, towels, and tropical flowers'
    },
    {
        serviceType: 'body-treatment',
        serviceId: 'wrap',
        name: 'Body Wrap Therapy',
        basePrice: 5000,
        duration: 75,
        description: 'A cocooning treatment that deeply hydrates and renews the body.',
        image: '/images/spa-body-wrap.jpg',
        imageAlt: 'Spa guest wrapped in a towel after a restorative body wrap treatment'
    },
    {
        serviceType: 'body-treatment',
        serviceId: 'detox',
        name: 'Detox Therapy Package',
        basePrice: 6500,
        duration: 90,
        description: 'A full-body detox experience using warm oils and restorative care.',
        image: '/images/spa-yoga.jpg',
        imageAlt: 'Peaceful yoga studio prepared for a detox and wellness experience'
    },
    {
        serviceType: 'wellness-package',
        serviceId: 'basic',
        name: 'Basic Wellness Package',
        basePrice: 7500,
        duration: 120,
        description: 'A balanced combination of massage and facial essentials.',
        image: '/images/spa-pkg-wellness.jpg',
        imageAlt: 'Wellness package presentation with green juice, tray, and spa stones'
    },
    {
        serviceType: 'wellness-package',
        serviceId: 'premium',
        name: 'Premium Wellness Package',
        basePrice: 10000,
        duration: 150,
        description: 'A signature escape blending massage, facial, and body renewal.',
        image: '/images/spa-pkg-relaxation.jpg',
        imageAlt: 'Premium spa package setting with candles, towels, oils, and stones'
    },
    {
        serviceType: 'wellness-package',
        serviceId: 'deluxe',
        name: 'Deluxe Wellness Package',
        basePrice: 12500,
        duration: 180,
        description: 'A complete spa journey curated for long-form indulgence.',
        image: '/images/spa-pkg-bridal.jpg',
        imageAlt: 'Deluxe spa and beauty package arranged with luxury skincare products and roses'
    },
    {
        serviceType: 'couples-spa',
        serviceId: 'massage',
        name: 'Couples Massage',
        basePrice: 8000,
        duration: 60,
        description: 'A side-by-side relaxation ritual for shared unwind time.',
        image: '/images/spa-couples-massage.jpg',
        imageAlt: 'Couple enjoying a side-by-side massage treatment in a spa room'
    },
    {
        serviceType: 'couples-spa',
        serviceId: 'package',
        name: 'Couples Spa Package',
        basePrice: 15000,
        duration: 120,
        description: 'A romantic duo escape with massage, refreshments, and spa time.',
        image: '/images/spa-couples-package.jpg',
        imageAlt: 'Romantic couples spa package with side-by-side treatments in a candlelit room'
    },
    {
        serviceType: 'aromatherapy',
        serviceId: 'essential',
        name: 'Essential Oil Therapy',
        basePrice: 3500,
        duration: 45,
        description: 'A restorative aromatherapy session to rebalance mind and body.',
        image: '/images/spa-aromatherapy.jpg',
        imageAlt: 'Essential oil therapy bottles styled with lavender and diffuser'
    },
    {
        serviceType: 'aromatherapy',
        serviceId: 'custom',
        name: 'Custom Aromatherapy',
        basePrice: 4500,
        duration: 60,
        description: 'A tailored oil blend matched to your mood and wellness goals.',
        image: '/images/spa-custom-aromatherapy.jpg',
        imageAlt: 'Custom aromatherapy oils arranged on a botanical spa surface'
    }
].map(decorateSpaService);

const spaAddOns = {
    hotstone: { name: 'Hot Stone Enhancement', price: 1000 },
    aromatherapy: { name: 'Premium Aromatherapy', price: 800 },
    hydration: { name: 'Deep Hydration Boost', price: 1200 },
    champagne: { name: 'Champagne & Relaxation', price: 1500 },
    chocolate: { name: 'Chocolate Indulgence Wrap', price: 900 },
    facial_upgrade: { name: 'Premium Facial Serum', price: 500 }
};

const spaHours = {
    open: '10:00',
    close: '21:00',
    maxConcurrentAppointments: 3
};

const foodMenu = [
    {
        id: 'sunrise-breakfast',
        category: 'Breakfast',
        name: 'GrandStay Sunrise Breakfast',
        price: 950,
        description: 'Farm eggs, grilled tomato, breakfast potatoes, pastries, and seasonal fruit.',
        dietary: ['Vegetarian option'],
        serviceWindow: '06:30 - 11:00',
        image: '/images/food-sunrise-breakfast.jpg',
        imageAlt: 'Breakfast plate with sunny-side eggs, tea, and biscuits in morning light'
    },
    {
        id: 'avocado-sourdough',
        category: 'Breakfast',
        name: 'Avocado Sourdough Toast',
        price: 720,
        description: 'Crushed avocado, poached eggs, herbs, and toasted sourdough.',
        dietary: ['Vegetarian'],
        serviceWindow: '06:30 - 11:00',
        image: '/images/food-avocado-toast.jpg',
        imageAlt: 'Avocado sourdough toast topped with poached eggs and shaved parmesan'
    },
    {
        id: 'truffle-fries',
        category: 'Small Plates',
        name: 'Truffle Parmesan Fries',
        price: 540,
        description: 'Crisp fries finished with parmesan, truffle oil, and sea salt.',
        dietary: ['Vegetarian'],
        serviceWindow: '24/7',
        image: '/images/food-truffle-fries.jpg',
        imageAlt: 'Truffle fries topped with parmesan and served with dipping sauce'
    },
    {
        id: 'mezze-board',
        category: 'Small Plates',
        name: 'Mediterranean Mezze Board',
        price: 780,
        description: 'Hummus, muhammara, olives, vegetables, and warm pita bread.',
        dietary: ['Vegetarian'],
        serviceWindow: '12:00 - 23:00',
        image: '/images/food-mezze-board.jpg',
        imageAlt: 'Mediterranean mezze spread with creamy dip, herbs, and appetizer bites'
    },
    {
        id: 'butter-chicken',
        category: 'Mains',
        name: 'Signature Butter Chicken',
        price: 1180,
        description: 'Char-grilled chicken in a velvety tomato sauce with saffron naan.',
        dietary: ['Contains dairy'],
        serviceWindow: '12:00 - 23:30',
        image: '/images/food-butter-chicken.jpg',
        imageAlt: 'Bowl of butter chicken curry finished with a rich buttery center'
    },
    {
        id: 'herb-salmon',
        category: 'Mains',
        name: 'Herb-Crusted Salmon',
        price: 1450,
        description: 'Pan-seared salmon with lemon butter, asparagus, and mashed potatoes.',
        dietary: ['Gluten free'],
        serviceWindow: '12:00 - 23:30',
        image: '/images/food-herb-salmon.jpg',
        imageAlt: 'Plated salmon fillet served with vegetables and a glossy sauce'
    },
    {
        id: 'mushroom-risotto',
        category: 'Mains',
        name: 'Wild Mushroom Risotto',
        price: 1020,
        description: 'Arborio rice, parmesan, roasted mushrooms, and micro herbs.',
        dietary: ['Vegetarian'],
        serviceWindow: '12:00 - 23:30',
        image: '/images/food-mushroom-risotto.jpg',
        imageAlt: 'Creamy wild mushroom risotto finished with parmesan shavings'
    },
    {
        id: 'chocolate-torte',
        category: 'Desserts',
        name: 'Dark Chocolate Torte',
        price: 460,
        description: 'Rich chocolate torte with vanilla chantilly and berry compote.',
        dietary: ['Vegetarian'],
        serviceWindow: '12:00 - 23:30',
        image: '/images/food-chocolate-torte.jpg',
        imageAlt: 'Dark chocolate torte garnished with fresh blackberries and mint'
    },
    {
        id: 'tiramisu',
        category: 'Desserts',
        name: 'Espresso Tiramisu',
        price: 430,
        description: 'House tiramisu layered with mascarpone cream and cocoa dust.',
        dietary: ['Vegetarian'],
        serviceWindow: '12:00 - 23:30',
        image: '/images/food-tiramisu.jpg',
        imageAlt: 'Glass-plated tiramisu dessert layered with cream and coffee-soaked cake'
    },
    {
        id: 'fresh-juice',
        category: 'Beverages',
        name: 'Cold-Pressed Fresh Juice',
        price: 320,
        description: 'A rotating seasonal blend of citrus, melon, and greens.',
        dietary: ['Vegan'],
        serviceWindow: '24/7',
        image: '/images/food-fresh-juice.jpg',
        imageAlt: 'Tall glass of fresh citrus juice served with oranges and green apple'
    },
    {
        id: 'arabica-coffee',
        category: 'Beverages',
        name: 'Single-Origin Arabica Coffee',
        price: 280,
        description: 'Freshly brewed premium coffee served hot or iced.',
        dietary: ['Vegan'],
        serviceWindow: '24/7',
        image: '/images/food-arabica-coffee.jpg',
        imageAlt: 'Cup of arabica coffee with latte art on a clean tabletop'
    },
    {
        id: 'sparkling-water',
        category: 'Beverages',
        name: 'Premium Sparkling Water',
        price: 210,
        description: 'Chilled sparkling mineral water served tableside or in-room.',
        dietary: ['Vegan'],
        serviceWindow: '24/7',
        image: '/images/food-sparkling-water.jpg',
        imageAlt: 'Close-up glass of sparkling water with visible bubbles'
    }
].map(decorateFoodItem);

const foodOrderSettings = {
    serviceHours: '24/7 Room Service',
    averageDeliveryMinutes: 35,
    deliveryFee: 250
};

module.exports = {
    roomCatalog,
    spaServiceCatalog,
    spaAddOns,
    spaHours,
    foodMenu,
    foodOrderSettings
};
