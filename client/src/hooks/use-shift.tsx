import { create } from 'zustand';
import { shiftsApi } from '@/lib/api';

interface ShiftState {
  isShiftOpen: boolean;
  shiftId: string | null;
  startTime: Date | null;
  startCash: number;
  totalSales: number;
  transactionCount: number;
  loading: boolean;
  error: string | null;
  checkShift: () => Promise<void>;
  openShift: (startCash: number) => Promise<void>;
  closeShift: (endCash: number) => Promise<any>;
}

export const useShift = create<ShiftState>((set, get) => ({
  isShiftOpen: false,
  shiftId: null,
  startTime: null,
  startCash: 0,
  totalSales: 0,
  transactionCount: 0,
  loading: false,
  error: null,

  checkShift: async () => {
    try {
      set({ loading: true, error: null });
      const shift = await shiftsApi.getActive();
      if (shift) {
        set({
          isShiftOpen: true,
          shiftId: shift.id,
          startTime: new Date(shift.startTime),
          startCash: parseFloat(shift.startCash),
          totalSales: parseFloat(shift.totalSales || '0'),
          transactionCount: shift.transactionCount || 0,
          loading: false,
        });
      } else {
        set({
          isShiftOpen: false,
          shiftId: null,
          startTime: null,
          startCash: 0,
          totalSales: 0,
          transactionCount: 0,
          loading: false,
        });
      }
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  openShift: async (startCash: number) => {
    try {
      set({ loading: true, error: null });
      const shift = await shiftsApi.create({ startCash: startCash.toString(), status: 'open' });
      set({
        isShiftOpen: true,
        shiftId: shift.id,
        startTime: new Date(shift.startTime),
        startCash: parseFloat(shift.startCash),
        totalSales: 0,
        transactionCount: 0,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  closeShift: async (endCash: number) => {
    const { shiftId } = get();
    if (!shiftId) throw new Error('No active shift');
    
    try {
      set({ loading: true, error: null });
      const shift = await shiftsApi.close(shiftId, endCash.toString());
      set({
        isShiftOpen: false,
        shiftId: null,
        startTime: null,
        startCash: 0,
        totalSales: 0,
        transactionCount: 0,
        loading: false,
      });
      return shift;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
}));
