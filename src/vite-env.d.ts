/// <reference types="vite/client" />

declare global {
  interface Window {
    ymaps: any;
    selectRestaurant: (index: number) => void;
  }
}

export {};
