import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./cart.controller";
import { addCartItemSchema, updateCartItemSchema } from "./cart.schemas";

export const cartRouter = Router();

cartRouter.use(authenticate, authorize(UserRole.CUSTOMER));
cartRouter.get("/", controller.get);
cartRouter.post("/items", validateBody(addCartItemSchema), controller.add);
cartRouter.patch("/items/:itemId", validateBody(updateCartItemSchema), controller.update);
cartRouter.delete("/items/:itemId", controller.remove);
cartRouter.delete("/", controller.clear);
