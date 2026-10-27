export type PaymentMethod = {
  /** Matches the id of a row in scriptConfig `paymentMethods`. */
  id: string;
  name: string;
  symbol: string;
  icon: string;
  /** What the player currently holds in this method. */
  balance?: number;
};

export type Category = {
  name: string;
  description?: string;
  icon?: string;
};

/** Why a line cannot be bought. The screen decides how each kind looks. */
export type DisabledReason = {
  kind: 'stock' | 'group' | 'license';
  message: string;
};

export type StoreItem = {
  /** Listing id — unique per store, not per item name. */
  id: string;
  /** The inventory item name. */
  name: string;
  label: string;
  description: string;
  price: number;
  category?: string;
  /** Undefined means unlimited. */
  stock?: number;
  disabled?: DisabledReason;
};

export type CartLine = StoreItem & { quantity: number };

export type StoreType = 'buy' | 'sell';

export type StorePayload = {
  id: string;
  type: StoreType;
  name: string;
  description: string;
  icon: string;
  paymentMethods: PaymentMethod[];
  categories?: Category[];
  stock: StoreItem[];
  /** Backdrop treatment, from this resource's own scriptConfig. */
  background?: 'themed' | 'dark' | 'transparent';
};
