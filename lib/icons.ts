import {
  FOOD_ICONS,
  TRAVEL_ICONS,
  LIFESTYLE_ICONS,
  HOME_ICONS,
  HEALTH_ICONS,
  ENTERTAINMENT_ICONS,
  WORK_ICONS,
  NATURE_ICONS,
} from "./icons/category-data";

export interface IconCategory {
  name: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  { name: "Makanan & Minuman", icons: FOOD_ICONS },
  { name: "Kendaraan & Perjalanan", icons: TRAVEL_ICONS },
  { name: "Belanja & Gaya Hidup", icons: LIFESTYLE_ICONS },
  { name: "Rumah & Elektronik", icons: HOME_ICONS },
  { name: "Kesehatan & Olahraga", icons: HEALTH_ICONS },
  { name: "Hiburan & Hobi", icons: ENTERTAINMENT_ICONS },
  { name: "Keuangan & Kerja", icons: WORK_ICONS },
  { name: "Hewan & Alam", icons: NATURE_ICONS },
];

export const ALL_ICONS_FLAT = ICON_CATEGORIES.flatMap((cat) => cat.icons);
export const UNIQUE_ICONS = Array.from(new Set(ALL_ICONS_FLAT));
