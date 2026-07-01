import { useMemo } from 'react';
import { COUNTRIES, getCountryName } from '../api/countries';

export function useCountries() {
  const getLabel = useMemo(() => (code: string) => getCountryName(code), []);

  return { countries: COUNTRIES, loading: false, getLabel };
}
