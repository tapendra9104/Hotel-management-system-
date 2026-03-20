import path from 'node:path';
import { env } from '../config/env';

type CatalogModule = {
  roomCatalog: Array<{
    name: string;
    description: string;
    price: number;
    capacity: number;
    amenities: string[];
    image: string;
    totalRooms: number;
    availableRooms: number;
    available: boolean;
  }>;
  spaServiceCatalog: Array<{
    serviceType: string;
    serviceId: string;
    name: string;
    basePrice: number;
    duration: number;
    description: string;
    image: string;
    imageAlt: string;
  }>;
  spaAddOns: Record<string, { name: string; price: number }>;
  spaHours: {
    open: string;
    close: string;
    maxConcurrentAppointments: number;
  };
  foodMenu: Array<{
    id: string;
    category: string;
    name: string;
    price: number;
    description: string;
    dietary: string[];
    serviceWindow: string;
    image: string;
    imageAlt: string;
  }>;
  foodOrderSettings: {
    serviceHours: string;
    averageDeliveryMinutes: number;
    deliveryFee: number;
  };
};

const catalogPath = path.resolve(env.backendRoot, 'data', 'catalog.js');
const catalogModule = require(catalogPath) as CatalogModule;

export const roomCatalog = catalogModule.roomCatalog.map((room) => ({ ...room, amenities: [...room.amenities] }));
export const spaServiceCatalog = catalogModule.spaServiceCatalog.map((service) => ({ ...service }));
export const spaAddOns = Object.fromEntries(
  Object.entries(catalogModule.spaAddOns).map(([id, value]) => [id, { ...value }])
);
export const spaHours = { ...catalogModule.spaHours };
export const foodMenu = catalogModule.foodMenu.map((item) => ({ ...item, dietary: [...(item.dietary || [])] }));
export const foodOrderSettings = { ...catalogModule.foodOrderSettings };

