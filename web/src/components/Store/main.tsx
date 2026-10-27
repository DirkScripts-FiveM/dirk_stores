import type { StorePayload } from '@/types/store';
import { Flex } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchNui, localeStore, useNuiEvent, useSettings } from 'dirk-cfx-react';
import type { MantineColorsTuple } from '@mantine/core';
import Background from '../Generic/Background';
import Categories from './Categories';
import Checkout from './Checkout';
import Header from './Header';
import Items from './Items';
import { useStore } from './useStore';

type OpenStorePayload = Partial<StorePayload> & {
  theme?: {
    primaryColor?: string;
    primaryShade?: number;
    customTheme?: MantineColorsTuple;
  };
};

/** Re-render this subtree whenever the locale dictionary changes. */
const useLocales = () => localeStore((state) => state.locales);

export default function StoreUI() {
  const open = useStore((state) => state.open);
  const background = useStore((state) => state.background);

  // `locale()` is a plain function, not a hook, so nothing below re-renders on
  // its own when the dictionary changes. DirkProvider subscribes, but its
  // `children` element is unchanged so React bails out of re-rendering us.
  // Subscribing here is what makes a live language change — and the browser
  // harness's own seeding — actually reach the screen instead of leaving raw
  // keys like "CartIsEmpty" on it.
  useLocales();

  useNuiEvent<OpenStorePayload>('OPEN_STORE', (data) => {
    // A store may carry its own colours. dirk_lib's global theme is the
    // fallback, resolved server-side, so this is always a complete triple.
    if (data.theme) {
      useSettings.setState({
        primaryColor: data.theme.primaryColor,
        primaryShade: data.theme.primaryShade,
        customTheme: data.theme.customTheme,
      });
    }

    const state = useStore.getState();

    // Listing ids are regenerated per open, so anything left in the cart from
    // last time points at a listing that no longer exists. Drop those rather
    // than letting checkout fail on the server with "no_item_by_id".
    const stock = data.stock ?? [];
    const cart = state.cart.filter((line) => stock.some((item) => item.id === line.id));

    // Keep the open category if the new store still has it; otherwise first.
    const categories = data.categories;
    const selectedCategory = categories?.some((category) => category.name === state.selectedCategory)
      ? state.selectedCategory
      : categories?.[0]?.name;

    // Same for the payment method — a store that does not take cards should
    // not open showing a card as selected.
    const paymentMethods = data.paymentMethods ?? [];
    const selectedMethod = paymentMethods.find((method) => method.id === state.selectedMethod?.id)
      ?? paymentMethods[0];

    useStore.setState({
      ...data,
      cart,
      categories,
      selectedCategory,
      selectedMethod,
      search: '',
      open: true,
    });
  });

  // A supplier script topped the shelves up while the player is stood at them.
  useNuiEvent<{ stock: StorePayload['stock'] }>('UPDATE_STOCK', (data) => {
    const stock = data?.stock ?? [];
    useStore.setState((state) => ({
      stock,
      cart: state.cart.filter((line) => stock.some((item) => item.id === line.id)),
    }));
  });

  useNuiEvent('CLOSE_STORE', () => {
    notifications.clean();
    notifications.cleanQueue();
    useStore.setState({ open: false });
  });

  return (
    <Background
      open={open}
      background={background}
      escapeKey
      onClose={() => fetchNui('CLOSE_STORE')}
      p="6vh"
      gap="sm"
    >
      <Header />

      <Flex flex={1} gap="sm" mah="100%" style={{ overflow: 'hidden' }}>
        <Flex flex={1} direction="column" gap="sm" style={{ overflow: 'hidden' }}>
          <Categories />
          <Items />
        </Flex>

        <Checkout />
      </Flex>
    </Background>
  );
}
