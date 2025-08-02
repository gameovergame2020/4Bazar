/// <reference types="vite/client" />

declare global {
  interface Window {
    ymaps: any;
  }
}

declare global {
  interface Window {
    ymaps: any;
    selectRestaurant: (index: number) => void;
  }
}

export {};
