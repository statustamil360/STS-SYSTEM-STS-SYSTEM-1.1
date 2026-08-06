export const DEFAULT_TIMEZONE = 'Asia/Colombo';

export const TIMEZONE_OPTIONS = [
  { group: 'Universal', zones: [
    { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
  ]},
  { group: 'Asia', zones: [
    { value: 'Asia/Colombo', label: 'Asia/Colombo — Sri Lanka (GMT+5:30)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata — India (GMT+5:30)' },
    { value: 'Asia/Karachi', label: 'Asia/Karachi — Pakistan (GMT+5)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai — UAE (GMT+4)' },
    { value: 'Asia/Bangkok', label: 'Asia/Bangkok — Thailand (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore — Singapore (GMT+8)' },
    { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong — China (GMT+8)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai — China (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo — Japan (GMT+9)' },
    { value: 'Asia/Seoul', label: 'Asia/Seoul — South Korea (GMT+9)' },
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta — Indonesia (GMT+7)' },
    { value: 'Asia/Manila', label: 'Asia/Manila — Philippines (GMT+8)' },
    { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu — Nepal (GMT+5:45)' },
  ]},
  { group: 'Europe', zones: [
    { value: 'Europe/London', label: 'Europe/London — UK (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Europe/Paris — France (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin — Germany (CET/CEST)' },
    { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam — Netherlands (CET/CEST)' },
    { value: 'Europe/Moscow', label: 'Europe/Moscow — Russia (GMT+3)' },
    { value: 'Europe/Istanbul', label: 'Europe/Istanbul — Turkey (GMT+3)' },
  ]},
  { group: 'Americas', zones: [
    { value: 'America/New_York', label: 'America/New York — US Eastern (EST/EDT)' },
    { value: 'America/Chicago', label: 'America/Chicago — US Central (CST/CDT)' },
    { value: 'America/Denver', label: 'America/Denver — US Mountain (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles — US Pacific (PST/PDT)' },
    { value: 'America/Toronto', label: 'America/Toronto — Canada Eastern (EST/EDT)' },
    { value: 'America/Vancouver', label: 'America/Vancouver — Canada Pacific (PST/PDT)' },
    { value: 'America/Sao_Paulo', label: 'America/São Paulo — Brazil (GMT-3)' },
    { value: 'America/Mexico_City', label: 'America/Mexico City — Mexico (CST)' },
  ]},
  { group: 'Pacific & Oceania', zones: [
    { value: 'Australia/Sydney', label: 'Australia/Sydney — Australia (AEST/AEDT)' },
    { value: 'Australia/Melbourne', label: 'Australia/Melbourne — Australia (AEST/AEDT)' },
    { value: 'Australia/Perth', label: 'Australia/Perth — Australia (AWST)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland — New Zealand (NZST/NZDT)' },
    { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu — Hawaii (HST)' },
  ]},
  { group: 'Africa & Middle East', zones: [
    { value: 'Africa/Cairo', label: 'Africa/Cairo — Egypt (GMT+2)' },
    { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg — South Africa (GMT+2)' },
    { value: 'Africa/Lagos', label: 'Africa/Lagos — Nigeria (GMT+1)' },
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh — Saudi Arabia (GMT+3)' },
    { value: 'Asia/Tehran', label: 'Asia/Tehran — Iran (GMT+3:30)' },
  ]},
];

export const getTimezoneLabel = (value) => {
  for (const group of TIMEZONE_OPTIONS) {
    const match = group.zones.find((z) => z.value === value);
    if (match) return match.label;
  }
  return value || DEFAULT_TIMEZONE;
};
