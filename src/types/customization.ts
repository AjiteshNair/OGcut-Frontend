export type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | '2XL';

export interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
}

export interface ZoneImageData {
  element: HTMLImageElement;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  customWidth: number;
  customHeight: number;
  lockAspectRatio: boolean;
}

export interface CustomizationPlacement {
  zone: Zone;
  image: string; // Base64 Data URL or remote URL
  coordinates: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  printZoneBounds: {
    centerX: number;
    centerY: number;
    clipWidth: number;
    clipHeight: number;
  };
}

export interface CustomizationPayload {
  size: ShirtSize;
  fabricColor: string;
  placements: CustomizationPlacement[];
}

export interface CartItem extends CustomizationPayload {
  id: string;
  price: number;
  quantity: number;
}