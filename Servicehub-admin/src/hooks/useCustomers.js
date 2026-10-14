import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useCustomers(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const { data } = await api.get("/customers", { params });
      return data;
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

function useCustomerMutation(request) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      const { data } = await request(variables);
      return data;
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(["customers", detail.customer._id], detail);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      // Customer names appear in booking and ticket lists.
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useCreateCustomer() {
  return useCustomerMutation((body) => api.post("/customers", body));
}

export function useUpdateCustomer(id) {
  return useCustomerMutation((body) => api.patch(`/customers/${id}`, body));
}
