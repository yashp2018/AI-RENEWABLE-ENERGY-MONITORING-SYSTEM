// CO2 emission factor: avg grid = 0.386 kg CO2 per kWh (IEA global average)
const CO2_KG_PER_KWH = 0.386;
// Average tree absorbs ~21 kg CO2/year
const CO2_KG_PER_TREE_YEAR = 21;
// Average home uses ~10,500 kWh/year
const HOME_KWH_PER_YEAR = 10500;

export interface CarbonMetrics {
  totalEnergyWh: number;       // Wh generated
  totalEnergyKwh: number;      // kWh generated
  co2SavedKg: number;          // kg CO2 avoided
  co2SavedTons: number;        // metric tons CO2
  treesEquivalent: number;     // trees needed to absorb same CO2 in a year
  homeDaysEquivalent: number;  // days of average home powered
  coalAvoidedKg: number;       // kg of coal not burned (1 kWh ≈ 0.45 kg coal)
}

export function calculateCarbonSavings(totalEnergyWh: number): CarbonMetrics {
  const totalEnergyKwh = totalEnergyWh / 1000;
  const co2SavedKg     = totalEnergyKwh * CO2_KG_PER_KWH;
  const co2SavedTons   = co2SavedKg / 1000;
  const treesEquivalent    = co2SavedKg / CO2_KG_PER_TREE_YEAR;
  const homeDaysEquivalent = (totalEnergyKwh / HOME_KWH_PER_YEAR) * 365;
  const coalAvoidedKg      = totalEnergyKwh * 0.45;

  return {
    totalEnergyWh,
    totalEnergyKwh: parseFloat(totalEnergyKwh.toFixed(3)),
    co2SavedKg:     parseFloat(co2SavedKg.toFixed(2)),
    co2SavedTons:   parseFloat(co2SavedTons.toFixed(4)),
    treesEquivalent:     parseFloat(treesEquivalent.toFixed(1)),
    homeDaysEquivalent:  parseFloat(homeDaysEquivalent.toFixed(2)),
    coalAvoidedKg:       parseFloat(coalAvoidedKg.toFixed(2)),
  };
}

export function formatCarbonValue(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  if (kg >= 1)    return `${kg.toFixed(1)} kg`;
  return `${(kg * 1000).toFixed(0)} g`;
}
