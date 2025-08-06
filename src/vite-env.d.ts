/// <reference types="vite/client" />

declare global {
  interface Window {
    ymaps: any;
    L: any; // Leaflet
  }
}

export {};