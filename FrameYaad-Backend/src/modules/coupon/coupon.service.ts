import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { ApiError } from "../../utils/api-error";
import { paginationMeta } from "../../utils/pagination";
import { logger } from "../../config/logger";
import { couponListQuerySchema, type CreateCouponInput, type UpdateCouponInput } from "./coupon.schemas";
import { couponViewSelect } from "./coupon.select";

const validateRules = (input: CreateCouponInput | UpdateCouponInput) => {
  if (input.endDate && input.startDate && input.endDate < input.startDate) throw new ApiError(400, "End date cannot be before start date", "INVALID_COUPON_DATES");
  if (input.expiresAt && input.startDate && input.expiresAt < input.startDate) throw new ApiError(400, "Expiry cannot be before start date", "INVALID_COUPON_EXPIRY");
};

export const listCoupons = async (rawQuery: unknown) => {
  const query = couponListQuerySchema.parse(rawQuery);
  const where: Prisma.CouponWhereInput = {
    ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
  };
  const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.CouponOrderByWithRelationInput;
  const [coupons, total] = await prisma.$transaction([
    prisma.coupon.findMany({ where, select: couponViewSelect, orderBy, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.coupon.count({ where }),
  ]);
  return { coupons, pagination: paginationMeta(query.page, query.limit, total) };
};

export const getCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: couponViewSelect });
  if (!coupon) throw new ApiError(404, "Coupon was not found", "COUPON_NOT_FOUND");
  return coupon;
};

export const createCoupon = async (input: CreateCouponInput, actorId: string) => {
  validateRules(input);
  const coupon = await prisma.coupon.create({ data: { ...input, code: input.code.toUpperCase(), createdById: actorId }, select: couponViewSelect });
  logger.info({ couponId: coupon.id }, "Coupon Created");
  return coupon;
};

export const updateCoupon = async (id: string, input: UpdateCouponInput) => {
  await getCoupon(id); validateRules(input);
  const coupon = await prisma.coupon.update({ where: { id }, data: { ...input, ...(input.code ? { code: input.code.toUpperCase() } : {}) }, select: couponViewSelect });
  logger.info({ couponId: id }, "Coupon Updated");
  return coupon;
};

export const updateCouponStatus = async (id: string, isActive: boolean) => {
  await getCoupon(id);
  const coupon = await prisma.coupon.update({ where: { id }, data: { isActive }, select: couponViewSelect });
  logger.info({ couponId: id }, isActive ? "Coupon Activated" : "Coupon Deactivated");
  return coupon;
};

export const deleteCoupon = async (id: string) => {
  await getCoupon(id);
  await prisma.coupon.delete({ where: { id } });
  logger.info({ couponId: id }, "Coupon Deleted");
};
