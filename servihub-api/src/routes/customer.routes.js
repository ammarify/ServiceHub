import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { listCustomers, getCustomerById, createCustomer, updateCustomer } from "../controllers/customer.controller.js";
import {
  listCustomersQuerySchema,
  customerIdParamsSchema,
  createCustomerBodySchema,
  updateCustomerBodySchema,
} from "../validators/customer.validators.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission("customer.read"),
  validate(listCustomersQuerySchema, "query"),
  listCustomers
);

router.post("/", requirePermission("customer.manage"), validate(createCustomerBodySchema, "body"), createCustomer);

router.get(
  "/:id",
  requirePermission("customer.read"),
  validate(customerIdParamsSchema, "params"),
  getCustomerById
);

router.patch(
  "/:id",
  requirePermission("customer.manage"),
  validate(customerIdParamsSchema, "params"),
  validate(updateCustomerBodySchema, "body"),
  updateCustomer
);

export default router;
