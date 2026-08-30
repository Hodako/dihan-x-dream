import { useState, useMemo } from 'react';
import {
  getDivisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getUnionsByUpazila,
} from '@/lib/bdLocations';
import { BdDivision, BdDistrict, BdUpazila, BdUnion } from '@/types';

export function useBdGeo(initialState?: {
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  unionId?: string;
}) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(initialState?.divisionId || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialState?.districtId || '');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<string>(initialState?.upazilaId || '');
  const [selectedUnionId, setSelectedUnionId] = useState<string>(initialState?.unionId || '');

  const divisions = useMemo<BdDivision[]>(() => getDivisions(), []);

  const districts = useMemo<BdDistrict[]>(() => {
    if (!selectedDivisionId) return [];
    return getDistrictsByDivision(selectedDivisionId);
  }, [selectedDivisionId]);

  const upazilas = useMemo<BdUpazila[]>(() => {
    if (!selectedDistrictId) return [];
    return getUpazilasByDistrict(selectedDistrictId);
  }, [selectedDistrictId]);

  const unions = useMemo<BdUnion[]>(() => {
    if (!selectedUpazilaId) return [];
    return getUnionsByUpazila(selectedUpazilaId);
  }, [selectedUpazilaId]);

  const selectDivision = (divisionId: string) => {
    setSelectedDivisionId(divisionId);
    setSelectedDistrictId('');
    setSelectedUpazilaId('');
    setSelectedUnionId('');
  };

  const selectDistrict = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSelectedUpazilaId('');
    setSelectedUnionId('');
  };

  const selectUpazila = (upazilaId: string) => {
    setSelectedUpazilaId(upazilaId);
    setSelectedUnionId('');
  };

  const selectUnion = (unionId: string) => {
    setSelectedUnionId(unionId);
  };

  const selectedDivision = useMemo(
    () => divisions.find((d) => String(d.id) === String(selectedDivisionId)) || null,
    [divisions, selectedDivisionId]
  );

  const selectedDistrict = useMemo(
    () => districts.find((d) => String(d.id) === String(selectedDistrictId)) || null,
    [districts, selectedDistrictId]
  );

  const selectedUpazila = useMemo(
    () => upazilas.find((u) => String(u.id) === String(selectedUpazilaId)) || null,
    [upazilas, selectedUpazilaId]
  );

  const selectedUnion = useMemo(
    () => unions.find((u) => String(u.id) === String(selectedUnionId)) || null,
    [unions, selectedUnionId]
  );

  return {
    divisions,
    districts,
    upazilas,
    unions,
    selectedDivisionId,
    selectedDistrictId,
    selectedUpazilaId,
    selectedUnionId,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    selectedUnion,
    selectDivision,
    selectDistrict,
    selectUpazila,
    selectUnion,
    resetGeo: () => {
      setSelectedDivisionId('');
      setSelectedDistrictId('');
      setSelectedUpazilaId('');
      setSelectedUnionId('');
    },
  };
}
