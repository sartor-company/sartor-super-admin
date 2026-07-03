export type InvoiceCatalogOption = { value: number; label: string };

export type InvoiceCatalogGroup = {
  label: string;
  options: InvoiceCatalogOption[];
};

export const INVOICE_CATALOG: InvoiceCatalogGroup[] = [
  {
    label: 'Engagement Fees',
    options: [
      { value: 3500000, label: 'Pilot Programme Fee (90-day)' },
      { value: 4500000, label: 'Full Deployment Onboarding Fee' },
      { value: 1000000, label: 'Full Deployment — Pilot Convert' },
    ],
  },
  {
    label: 'Verification Domain Upgrades',
    options: [
      { value: 100000, label: 'Growth Subdomain Setup (one-time)' },
      { value: 150000, label: 'Enterprise CNAME Setup (one-time)' },
      { value: 200000, label: 'Enterprise CNAME Annual Maintenance' },
    ],
  },
  {
    label: 'SKU Annual Licences',
    options: [
      { value: 350000, label: 'SKU Licence — Starter 1–5 (₦350K/SKU)' },
      { value: 250000, label: 'SKU Licence — Growth 6–20 (₦250K/SKU)' },
      { value: 175000, label: 'SKU Licence — Enterprise 21–50 (₦175K/SKU)' },
    ],
  },
  {
    label: 'Batch Calibration Credits',
    options: [
      { value: 800000, label: 'Batch Cal. Starter 5cr (₦160K/batch)' },
      { value: 2100000, label: 'Batch Cal. Standard 15cr (₦140K/batch)' },
      { value: 3600000, label: 'Batch Cal. Professional 30cr (₦120K/batch)' },
      { value: 6000000, label: 'Batch Cal. Enterprise 60cr+ (₦100K/batch)' },
    ],
  },
  {
    label: 'PIN Authentication Credits',
    options: [
      { value: 150000, label: 'PIN Entry 10K (₦15/PIN)' },
      { value: 600000, label: 'PIN Growth 50K (₦12/PIN)' },
      { value: 2000000, label: 'PIN Scale 200K (₦10/PIN)' },
    ],
  },
  {
    label: 'SMS Notification Credits',
    options: [
      { value: 45000, label: 'SMS Starter 10K (₦4.50/SMS)' },
      { value: 200000, label: 'SMS Standard 50K (₦4.00/SMS)' },
      { value: 700000, label: 'SMS Professional 200K (₦3.50/SMS)' },
    ],
  },
  {
    label: 'Sartor CRM — seat & subscription rates',
    options: [
      { value: 15000, label: 'CRM Field — ₦15,000/seat/month (min 3)' },
      { value: 22000, label: 'CRM Depot (revenue) — ₦22,000/seat/month (min 5)' },
      { value: 8000, label: 'CRM Depot (operational) — ₦8,000/seat/month' },
      { value: 375000, label: 'CRM 360 — ₦375,000/month (flat, unlimited seats)' },
    ],
  },
  {
    label: 'Other',
    options: [{ value: 0, label: 'Custom item (enter manually)' }],
  },
];
