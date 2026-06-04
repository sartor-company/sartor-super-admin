export const STAFF_DATA: Record<string, { fn: string; ln: string; em: string; role: string }> = {
  'Nwachukwu Confidence': { fn: 'Nwachukwu', ln: 'Confidence', em: 'confidence@sartor.ng', role: 'Super Admin' },
  'Amaka Eze': { fn: 'Amaka', ln: 'Eze', em: 'amaka@sartor.ng', role: 'Account Manager' },
  'Samuel Okon': { fn: 'Samuel', ln: 'Okon', em: 'samuel@sartor.ng', role: 'AI/ML Lead' },
  'Chidi Ogu': { fn: 'Chidi', ln: 'Ogu', em: 'chidi@sartor.ng', role: 'Platform Support' },
  'Fatima Bello': { fn: 'Fatima', ln: 'Bello', em: 'fatima@sartor.ng', role: 'Finance Admin' },
  'Emeka Nnaji': { fn: 'Emeka', ln: 'Nnaji', em: 'emeka.n@sartor.ng', role: 'Operations Manager' },
};

export const SETTINGS_STAFF = [
  { name: 'Nwachukwu Confidence', email: 'confidence@sartor.ng', role: 'CEO / Super Admin', roleStyle: { background: 'rgba(255,92,53,.15)', color: 'var(--accent)' } as const },
  { name: 'Amaka Eze', email: 'amaka@sartor.ng', role: 'Account Manager', roleVariant: 'bb' as const },
  { name: 'Samuel Okon', email: 'samuel@sartor.ng', role: 'AI/ML Lead', roleVariant: 'bp' as const },
  { name: 'Chidi Ogu', email: 'chidi@sartor.ng', role: 'Platform Support', roleVariant: 'ba' as const },
  { name: 'Fatima Bello', email: 'fatima@sartor.ng', role: 'Finance Admin', roleVariant: 'bn' as const },
  { name: 'Emeka Nnaji', email: 'emeka.n@sartor.ng', role: 'Ops Manager', roleVariant: 'bg' as const },
];
