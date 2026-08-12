import type { Prisma } from "@prisma/client";

export const orderViewSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  userAddressId: true,
  totalPrice: true,
  status: true,
  remark: true,
  couponId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, phoneNumber: true } },
  userAddress: {
    select: {
      id: true,
      addressLine: true,
      postalCode: true,
      city: true,
      state: true,
      country: true,
      contactPerson: true,
      contactNumber: true,
    },
  },
  items: {
    select: {
      id: true,
      productIdentifier: true,
      quantity: true,
      price: true,
      subtotal: true,
      product: {
        select: {
          id: true,
          productName: true,
          variant: {
            select: {
              frameSize: true,
              mountType: true,
            },
          },
          images: {
            where: { isPrimary: true },
            select: { id: true, imageUrl: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.OrderSelect;
