/**
 * Country list from world-countries (MIT, open source).
 * https://github.com/mledoze/countries
 */
import countriesData from 'world-countries';

export type CountryOption = {
  code: string;
  name: string;
};

export function sortCountriesFirstNigeria(list: CountryOption[]): CountryOption[] {
  return [...list].sort((a, b) => {
    if (a.code === 'NG') return -1;
    if (b.code === 'NG') return 1;
    return a.name.localeCompare(b.name);
  });
}

export const COUNTRIES: CountryOption[] = sortCountriesFirstNigeria(
  countriesData
    .map((row) => ({
      code: row.cca2,
      name: row.name.common,
    }))
    .filter((c) => c.code && c.name),
);

export function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}
