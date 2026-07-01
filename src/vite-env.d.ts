/// <reference types="vite/client" />

declare module 'world-countries' {
  const countries: {
    cca2: string;
    name: { common: string };
  }[];
  export default countries;
}
