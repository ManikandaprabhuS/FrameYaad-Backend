import { Prisma, UserRole } from "@prisma/client";
import type { z } from "zod";

import { prisma } from "../../prisma/client";
import { ApiError } from "../../utils/api-error";
import { paginationMeta, parsePagination } from "../../utils/pagination";
import { userViewSelect } from "../../utils/user-view";
import type { adminUpdateUserSchema } from "./users.schemas";

type UpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

const customerWhere = (id: string): Prisma.UserWhereUniqueInput & { role: UserRole } => ({
  id,
  role: UserRole.CUSTOMER,
});

export const listCustomers = async (rawQuery: unknown) => {
  const { page, limit, search, isActive } = parsePagination(rawQuery);
  const where: Prisma.UserWhereInput = {
    role: UserRole.CUSTOMER,
    ...(isActive === undefined ? {} : { isActive }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userViewSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, pagination: paginationMeta(page, limit, total) };
};

export const getCustomer = async (id: string) => {
  const user = await prisma.user.findFirst({ where: customerWhere(id), select: userViewSelect });
  if (!user) throw new ApiError(404, "Customer was not found", "CUSTOMER_NOT_FOUND");
  return user;
};

export const updateCustomer = async (id: string, input: UpdateUserInput) => {
  await getCustomer(id);
  return prisma.user.update({ where: { id }, data: input, select: userViewSelect });
};
