import { axiosClient } from "../api/axios-client";

export const voucherService = {
  checkVoucher: async (code: string, orderTotal: number) => {
    const res = await axiosClient.post("/vouchers/check", { code, orderTotal });
    return res.data;
  },

  getVouchersAdmin: async () => {
    const res = await axiosClient.get("/vouchers");
    return res.data;
  },

  createVoucherAdmin: async (voucherData: any) => {
    const res = await axiosClient.post("/vouchers", voucherData);
    return res.data;
  },

  deleteVoucherAdmin: async (id: string) => {
    const res = await axiosClient.delete(`/vouchers/${id}`);
    return res.data;
  },

  getPublicVouchers: async () => {
    const res = await axiosClient.get("/vouchers/public-list");
    return res.data;
  },
};
