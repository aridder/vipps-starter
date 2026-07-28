export type ExpressProduct = {
  id: string;
  name: string;
  description: string;
  priceOre: number;
  shippingOre: number;
  shippingName: string;
  estimatedDelivery?: string;
};

function positiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

// Express is deliberately server-configured. A browser may select a product ID,
// but must never be allowed to decide the amount or shipping price.
export function getExpressProduct(): ExpressProduct | null {
  const id = process.env.VIPPS_EXPRESS_PRODUCT_ID?.trim();
  const name = process.env.VIPPS_EXPRESS_PRODUCT_NAME?.trim();
  const priceOre = positiveInt(process.env.VIPPS_EXPRESS_PRODUCT_PRICE_ORE);
  const shippingOre = positiveInt(process.env.VIPPS_EXPRESS_SHIPPING_ORE);
  if (!id || !name || priceOre === null || priceOre < 100 || shippingOre === null) {
    return null;
  }
  return {
    id,
    name,
    description:
      process.env.VIPPS_EXPRESS_PRODUCT_DESCRIPTION?.trim() || name,
    priceOre,
    shippingOre,
    shippingName:
      process.env.VIPPS_EXPRESS_SHIPPING_NAME?.trim() || "Standardfrakt",
    estimatedDelivery:
      process.env.VIPPS_EXPRESS_ESTIMATED_DELIVERY?.trim() || undefined,
  };
}

export function expressShipping(product: ExpressProduct) {
  return {
    fixedOptions: [
      {
        type: "MAILBOX" as const,
        brand: "POSTEN" as const,
        isDefault: true,
        priority: 0,
        options: [
          {
            id: `${product.id}-standard`,
            amount: { currency: "NOK" as const, value: product.shippingOre },
            name: product.shippingName,
            isDefault: true,
            priority: 0,
            ...(product.estimatedDelivery
              ? { estimatedDelivery: product.estimatedDelivery }
              : {}),
          },
        ],
      },
    ],
    allowedCountries: ["NO"],
  };
}
