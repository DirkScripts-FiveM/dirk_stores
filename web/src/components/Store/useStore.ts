import type { CartLine, Category, PaymentMethod, StoreItem, StorePayload, StoreType } from '@/types/store';
import { notifications } from '@mantine/notifications';
import { fetchNui, isEnvBrowser, locale } from 'dirk-cfx-react';
import { create } from 'zustand';

export type UseStoreProps = StorePayload & {
  open: boolean;
  selectedMethod?: PaymentMethod;
  selectedCategory?: string;
  search: string;

  cart: CartLine[];
  addToCart: (item: StoreItem, quantity?: number) => void;
  setCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string, quantity?: number) => void;
  clearCart: () => void;
  checkout: () => void;
};

// Browser-only sample data. In game every one of these fields arrives on
// OPEN_STORE — this exists so `pnpm start` shows a store instead of a blank
// screen, and so the empty/disabled states can be looked at without a server.
const MOCK_CATEGORIES: Category[] = [
  { name: 'Firearms', description: 'Rifles, shotguns and handguns.', icon: 'fas fa-gun' },
  { name: 'Ammunition', description: 'Bullets and shells.', icon: 'fas fa-bullseye' },
  { name: 'Accessories', description: 'Scopes, suppressors and more.', icon: 'fas fa-screwdriver-wrench' },
];

const MOCK_STOCK: StoreItem[] = [
  { id: 'l1', name: 'weapon_pistol', label: 'Pistol', description: 'A standard 9mm sidearm.', price: 1500, category: 'Firearms', stock: 6 },
  { id: 'l2', name: 'weapon_snspistol', label: 'SNS Pistol', description: 'Small, cheap, unreliable.', price: 2000, category: 'Firearms', stock: 3 },
  { id: 'l3', name: 'weapon_vintagepistol', label: 'Vintage Pistol', description: 'A collector’s piece that still fires.', price: 2500, category: 'Firearms' },
  { id: 'l4', name: 'weapon_bat', label: 'Baseball Bat', description: 'For the sport, obviously.', price: 100, category: 'Firearms', stock: 0, disabled: { kind: 'stock', message: 'Out of stock' } },
  { id: 'l5', name: 'ammo_pistol', label: 'Pistol Ammo', description: 'A box of 9mm rounds.', price: 50, category: 'Ammunition', stock: 40 },
  { id: 'l6', name: 'ammo_shotgun', label: 'Shotgun Shells', description: 'A box of 12-gauge shells.', price: 75, category: 'Ammunition', stock: 25 },
  { id: 'l7', name: 'weapon_flashlight', label: 'Flashlight', description: 'Mounts under the barrel.', price: 100, category: 'Accessories', stock: 12 },
  { id: 'l8', name: 'weapon_suppressor', label: 'Suppressor', description: 'Quieter, not quiet.', price: 500, category: 'Accessories', disabled: { kind: 'license', message: 'Weapon licence required' } },
];

const MOCK_PAYMENTS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', symbol: '$', icon: 'fas fa-money-bill-wave', balance: 4820 },
  { id: 'bank', name: 'Card', symbol: '$', icon: 'fas fa-credit-card', balance: 152300 },
];

export const useStore = create<UseStoreProps>((set, get) => ({
  open: isEnvBrowser(),
  id: 'ammunation',
  type: 'buy' as StoreType,
  name: 'Ammunation',
  description: 'Faulty firearms and overpriced ammunition, what more could you want?',
  icon: 'fas fa-gun',
  background: 'themed',

  paymentMethods: isEnvBrowser() ? MOCK_PAYMENTS : [],
  categories: isEnvBrowser() ? MOCK_CATEGORIES : undefined,
  stock: isEnvBrowser() ? MOCK_STOCK : [],

  selectedMethod: isEnvBrowser() ? MOCK_PAYMENTS[0] : undefined,
  selectedCategory: undefined,
  search: '',

  cart: [],

  addToCart: (item, quantity = 1) => {
    const existing = get().cart.find((line) => line.id === item.id);
    const wanted = (existing?.quantity ?? 0) + quantity;

    if (typeof item.stock === 'number' && wanted > item.stock) {
      notifications.show({
        title: locale('InsufficientStock'),
        message: locale('NotEnoughStock', item.label, String(item.stock), String(wanted)),
        color: 'red',
      });
      return;
    }

    set((state) => ({
      cart: existing
        ? state.cart.map((line) => (line.id === item.id ? { ...line, quantity: wanted } : line))
        : [...state.cart, { ...item, quantity }],
    }));
  },

  setCartQuantity: (itemId, quantity) => {
    if (quantity <= 0) return get().removeFromCart(itemId, Number.MAX_SAFE_INTEGER);
    const line = get().cart.find((entry) => entry.id === itemId);
    if (!line) return;

    if (typeof line.stock === 'number' && quantity > line.stock) {
      notifications.show({
        title: locale('InsufficientStock'),
        message: locale('NotEnoughStock', line.label, String(line.stock), String(quantity)),
        color: 'red',
      });
      return;
    }

    set((state) => ({
      cart: state.cart.map((entry) => (entry.id === itemId ? { ...entry, quantity } : entry)),
    }));
  },

  removeFromCart: (itemId, quantity = 1) => set((state) => {
    const line = state.cart.find((entry) => entry.id === itemId);
    if (!line) return state;
    return line.quantity > quantity
      ? { cart: state.cart.map((entry) => (entry.id === itemId ? { ...entry, quantity: entry.quantity - quantity } : entry)) }
      : { cart: state.cart.filter((entry) => entry.id !== itemId) };
  }),

  clearCart: () => set({ cart: [] }),

  checkout: () => {
    const { selectedMethod, cart } = get();

    if (!selectedMethod) {
      notifications.show({
        title: locale('NoPaymentMethod'),
        message: locale('SelectPaymentMethod'),
        color: 'red',
      });
      return;
    }

    if (cart.length === 0) {
      notifications.show({
        title: locale('EmptyCart'),
        message: locale('CartIsEmpty'),
        color: 'red',
      });
      return;
    }

    fetchNui<{ success: boolean; error?: string }>(
      'MAKE_TRANSACTION',
      { method: selectedMethod.id, cart },
      { success: true },
    ).then((response) => {
      if (response?.success) {
        set({ cart: [] });
        return;
      }
      notifications.show({
        title: locale('TransactionFailed'),
        message: locale(response?.error ?? 'UnknownError'),
        color: 'red',
      });
    });
  },
}));

/** What the cart costs, in the selected method's currency. */
export const cartTotal = (cart: CartLine[]): number =>
  cart.reduce((total, line) => total + line.price * line.quantity, 0);
