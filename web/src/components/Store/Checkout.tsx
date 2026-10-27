import type { CartLine } from '@/types/store';
import { alpha, Flex, Image, Text, useMantineTheme } from '@mantine/core';
import { getItemImageUrl, locale, resolveItemLabel, useItems, useSettings } from 'dirk-cfx-react';
import { money } from '@/utils/money';
import { AnimatePresence, motion } from 'framer-motion';
import { HandCoins, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import Button from '../Generic/Button';
import NothingPNG from './nothing.png';
import { cartTotal, useStore } from './useStore';

export default function Checkout() {
  const theme = useMantineTheme();
  const accent = theme.colors[theme.primaryColor][5];

  const cart = useStore((state) => state.cart);
  const type = useStore((state) => state.type);
  const checkout = useStore((state) => state.checkout);
  const clearCart = useStore((state) => state.clearCart);
  const selectedMethod = useStore((state) => state.selectedMethod);
  const paymentMethods = useStore((state) => state.paymentMethods);

  const total = cartTotal(cart);
  const buying = type === 'buy';

  useEffect(() => {
    if (!selectedMethod && paymentMethods.length > 0) {
      useStore.setState({ selectedMethod: paymentMethods[0] });
    }
  }, [selectedMethod, paymentMethods]);

  const empty = cart.length === 0;

  // Buying with more in the basket than you can pay for is the one failure the
  // UI can catch before the server does, so say it here rather than bouncing.
  // An empty basket costs nothing, so it is never unaffordable — saying so on
  // a £0 total reads as an error before you have even picked anything up.
  const balance = selectedMethod?.balance;
  const cannotAfford = buying && !empty && total > 0 && typeof balance === 'number' && total > balance;

  return (
    <Flex
      direction="column"
      w="34vh"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,20,0.82) 0%, rgba(10,10,10,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
      }}
    >
      <Flex
        align="center"
        gap="xs"
        px="sm"
        py="xs"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {buying ? <ShoppingCart size="1.8vh" strokeWidth={2.2} color={accent} />
          : <HandCoins size="1.8vh" strokeWidth={2.2} color={accent} />}
        <Text size="sm" ff="Akrobat Bold" tt="uppercase" lts="0.08em" c="rgba(255,255,255,0.9)">
          {locale(buying ? 'Checkout' : 'ItemsToSell')}
        </Text>
        {!empty && (
          <Trash2
            size="1.6vh"
            strokeWidth={2.2}
            color="rgba(255,255,255,0.35)"
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
            onClick={clearCart}
          />
        )}
      </Flex>

      <Flex flex={1} direction="column" gap="xs" p="xs" style={{ overflowY: 'auto', minHeight: 0 }}>
        {empty ? (
          <Flex flex={1} direction="column" align="center" justify="center" gap="xs" c="rgba(255,255,255,0.3)">
            <ShoppingCart size="4vh" strokeWidth={1.4} />
            <Text size="xxs" tt="uppercase" lts="0.08em" ta="center" px="md">
              {locale(buying ? 'CartIsEmpty' : 'NothingToSellYet')}
            </Text>
          </Flex>
        ) : (
          <AnimatePresence mode="popLayout">
            {cart.map((line) => (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 30 } }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
              >
                <CheckoutLine {...line} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Flex>

      <Flex
        direction="column"
        gap="xs"
        p="sm"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Flex align="flex-end" justify="space-between">
          <Flex direction="column">
            <Text size="xxs" tt="uppercase" lts="0.08em" c="rgba(255,255,255,0.45)">
              {locale(buying ? 'TotalPrice' : 'TotalPayout')}
            </Text>
            {/* One line, always present. The warning replaces the method name
                rather than being added underneath it — appearing as a new row
                shoved the Buy button down the moment the basket got too big. */}
            <Text size="xxs" c={cannotAfford ? theme.colors.red[5] : 'rgba(255,255,255,0.35)'}>
              {cannotAfford ? locale('CannotAfford') : (selectedMethod?.name ?? '')}
            </Text>
          </Flex>

          <AnimatePresence mode="wait">
            <motion.div
              key={total}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              <Text size="lg" ff="Akrobat Black" c={cannotAfford ? theme.colors.red[5] : 'white'} lh={1}>
                {money(total, selectedMethod)}
              </Text>
            </motion.div>
          </AnimatePresence>
        </Flex>

        <Button
          fullWidth
          size="sm"
          disabled={empty || cannotAfford}
          label={locale(buying ? 'Buy' : 'Sell')}
          icon={buying ? ShoppingCart : HandCoins}
          color={alpha(accent, 1)}
          onClick={checkout}
        />
      </Flex>
    </Flex>
  );
}

function CheckoutLine(line: CartLine) {
  const theme = useMantineTheme();
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const setCartQuantity = useStore((state) => state.setCartQuantity);
  const selectedMethod = useStore((state) => state.selectedMethod);
  const itemImgPath = useSettings((state) => state.itemImgPath);
  const items = useItems();

  const label = resolveItemLabel(items, line.name, line.label);
  const image = getItemImageUrl(line.name) || `${itemImgPath}${line.name}.png`;

  return (
    <Flex
      align="center"
      gap="xs"
      p="xs"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: theme.radius.xs,
      }}
    >
      <Image src={image} fallbackSrc={NothingPNG} alt={label} w="4.5vh" h="4.5vh" fit="contain" />

      <Flex direction="column" style={{ minWidth: 0 }}>
        <Text size="xs" ff="Akrobat Bold" lineClamp={1} c="rgba(255,255,255,0.9)">{label}</Text>
        <Text size="xxs" c="rgba(255,255,255,0.5)">
          {money(line.price * line.quantity, selectedMethod)}
        </Text>
      </Flex>

      <Flex ml="auto" align="center" gap="xxs">
        <Stepper icon={Minus} onClick={() => removeFromCart(line.id, 1)} />
        <input
          value={line.quantity}
          onChange={(event) => {
            const next = parseInt(event.target.value, 10);
            setCartQuantity(line.id, Number.isNaN(next) ? 0 : next);
          }}
          style={{
            width: '3.4vh',
            height: '2.8vh',
            fontSize: '1.4vh',
            fontFamily: 'Akrobat Bold',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: theme.radius.xs,
            outline: 'none',
            color: 'rgba(255,255,255,0.9)',
          }}
        />
        <Stepper icon={Plus} onClick={() => addToCart(line, 1)} />
        <Stepper icon={Trash2} danger onClick={() => removeFromCart(line.id, Number.MAX_SAFE_INTEGER)} />
      </Flex>
    </Flex>
  );
}

function Stepper({ icon: Icon, onClick, danger }: { icon: React.ElementType; onClick: () => void; danger?: boolean }) {
  const theme = useMantineTheme();
  const color = danger ? theme.colors.red[5] : 'rgba(255,255,255,0.7)';

  return (
    <motion.div
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.8vh',
        height: '2.8vh',
        borderRadius: theme.radius.xs,
        background: danger ? alpha(theme.colors.red[9], 0.25) : 'rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}
    >
      <Icon size="1.5vh" strokeWidth={2.4} color={color} />
    </motion.div>
  );
}
