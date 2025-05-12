import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Partner } from '@/core/types';

type PartnerType = {
  partnerData?: Partner;
  loading: boolean;
};

type PartnerAction = {
  setLoading: (loading: boolean) => void;
  setPartnerData: (partnerData?: Partner) => void;
};

const usePartner = create<PartnerType & PartnerAction>()(
  immer((set) => ({
    loading: false,
    setLoading(loading) {
      set({ loading });
    },
    setPartnerData(partnerData) {
      set({ partnerData });
    }
  }))
);

export default usePartner;
