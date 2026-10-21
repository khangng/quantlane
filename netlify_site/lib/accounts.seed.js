// First-use seed only. Once saved, the shared registry in Netlify Blobs is authoritative.
export const seedAccounts = [
  {alias:'E8SIG_1',program:'E8_SIGNATURE_FOREX',size:100000,stage:'Challenge',targetPct:6,status:'active',rulesConfirmed:false,archiveReason:'',settings:{dailyPct:0,totalPct:3,dailyStopUsd:1000,afterFirstPayout:false,confirmedPeak:0,eodHour:23}},
  {alias:'E8ONE_1',program:'E8_ONE_FOREX',size:200000,stage:'Challenge',targetPct:6,status:'active',rulesConfirmed:false,archiveReason:'',settings:{dailyPct:3,totalPct:4,dailyStopUsd:3500,afterFirstPayout:false,confirmedPeak:0}},
  {alias:'E8_1',program:'E8_PRO_FOREX',size:200000,stage:'Performance',targetPct:null,status:'active',rulesConfirmed:false,archiveReason:'',settings:{dailyPct:2.5,totalPct:8,dailyStopUsd:3500,afterFirstPayout:false,confirmedPeak:0}}
];
