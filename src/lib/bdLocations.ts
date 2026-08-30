import geoData from '@/data/bd-geodata/locationBdDivisonsToUnionsEnglish.json';
import { BdDivision, BdDistrict, BdUpazila, BdUnion } from '@/types';

export function getDivisions(): BdDivision[] {
  return (geoData.divisions_en || []).map((d: any) => ({
    id: String(d.value),
    name: d.title,
  }));
}

export function getDistrictsByDivision(divisionId: string): BdDistrict[] {
  if (!divisionId) return [];
  const list = (geoData.districts_en as Record<string, any[]>)[String(divisionId)] || [];
  return list.map((item: any) => ({
    id: String(item.value),
    division_id: String(divisionId),
    name: item.title,
  }));
}

export function getUpazilasByDistrict(districtId: string): BdUpazila[] {
  if (!districtId) return [];
  const list = (geoData.upazilas_en as Record<string, any[]>)[String(districtId)] || [];
  return list.map((item: any) => ({
    id: String(item.value),
    district_id: String(districtId),
    name: item.title,
  }));
}

export function getUnionsByUpazila(upazilaId: string): BdUnion[] {
  if (!upazilaId) return [];
  const list = (geoData.unions_en as Record<string, any[]>)[String(upazilaId)] || [];
  return list.map((item: any) => ({
    id: String(item.value),
    upazila_id: String(upazilaId),
    name: item.title,
  }));
}
