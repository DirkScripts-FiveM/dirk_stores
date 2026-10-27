import type { StoreItem } from '@/types/store';
import { alpha, Flex, type MantineTheme, Text, useMantineTheme } from '@mantine/core';
import { getItemImageUrl, locale, resolveItemDescription, resolveItemLabel, useItems, useSettings } from 'dirk-cfx-react';
import { money } from '@/utils/money';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, PackageOpen, PackageX, ScrollText, ShoppingBasket } from 'lucide-react';
import { useMemo } from 'react';
import GlowImage from '../Generic/GlowImage';
import { useStore } from './useStore';

export default function Items() {
  const theme = useMantineTheme();
  const categories = useStore((state) => state.categories);
  const selectedCategory = useStore((state) => state.selectedCategory);
  const stock = useStore((state) => state.stock);
  const search = useStore((state) => state.search);
  const items = useItems();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stock.filter((item) => {
      if (categories?.length && selectedCategory && item.category !== selectedCategory) return false;
      if (!term) return true;
      const label = resolveItemLabel(items, item.name, item.label);
      return label.toLowerCase().includes(term) || item.name.toLowerCase().includes(term);
    });
  }, [stock, selectedCategory, categories, search, items]);

  if (filtered.length === 0) {
    return (
      <Flex flex={1} direction="column" align="center" justify="center" gap="sm" c="rgba(255,255,255,0.35)">
        <PackageOpen size="6vh" strokeWidth={1.4} />
        <Text ff="Akrobat Bold" tt="uppercase" lts="0.08em" size="sm">
          {search ? locale('NoMatchingItems') : locale('NothingForSale')}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      flex={1}
      // Room above for the hover lift — this is the scroll container, so with
      // none the card's top border was clipped off the moment you pointed at
      // it. NOT on the left: the first card's edge is the column the title and
      // the category tabs are set to, and padding there breaks that line.
      pt="xs"
      pb="xs"
      pr="xs"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(22vh, 1fr))',
        gridAutoRows: 'min-content',
        gap: theme.spacing.sm,
        overflowY: 'auto',
        alignContent: 'start',
      }}
    >
      {filtered.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.25) }}
          // The lift lives on the wrapper, so the card's own border never
          // leaves the box the grid measured for it.
          whileHover={{ y: -3 }}
        >
          <Item {...item} />
        </motion.div>
      ))}
    </Flex>
  );
}

function Item(item: StoreItem) {
  const theme = useMantineTheme();
  const accent = theme.colors[theme.primaryColor][5];
  const addToCart = useStore((state) => state.addToCart);
  const selectedMethod = useStore((state) => state.selectedMethod);
  const quantityInCart = useStore((state) => state.cart.find((line) => line.id === item.id)?.quantity ?? 0);
  const itemImgPath = useSettings((state) => state.itemImgPath);
  const items = useItems();

  const label = resolveItemLabel(items, item.name, item.label);
  const description = resolveItemDescription(items, item.name, item.description);
  const image = getItemImageUrl(item.name) || `${itemImgPath}${item.name}.png`;

  // An empty shelf is a reason like any other, so it is drawn like one. The
  // server usually says so itself; this covers a line whose count simply ran
  // down to nothing while the screen was open.
  const soldOut = typeof item.stock === 'number' && item.stock <= 0;
  const reason = item.disabled ?? (soldOut ? { kind: 'stock' as const, message: locale('OutOfStock') } : undefined);
  const blocked = !!reason;
  const active = quantityInCart > 0;

  return (
    <motion.div
      onClick={() => { if (!blocked) addToCart(item); }}
      whileHover={!blocked ? { borderColor: alpha(accent, 0.55) } : undefined}
      whileTap={!blocked ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        position: 'relative',
        height: '24vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
        cursor: blocked ? 'not-allowed' : 'pointer',
        background: active
          ? `linear-gradient(165deg, ${alpha(accent, 0.14)} 0%, rgba(14,14,14,0.94) 62%)`
          : `linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(14,14,14,0.92) 58%)`,
        border: active ? `1px solid ${alpha(accent, 0.45)}` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: active ? `0 0 1.2vh ${alpha(accent, 0.16)}` : '0 0.2vh 0.8vh rgba(0,0,0,0.35)',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Chips */}
      <Flex pos="absolute" top="1vh" left="1vh" right="1vh" gap="xs" align="center" style={{ zIndex: 2 }}>
        {typeof item.stock === 'number' && (
          <Chip label={`${item.stock}`} caption={locale('Stock')} muted dimmed={blocked} />
        )}
        <Chip ml="auto" label={money(item.price, selectedMethod)} accent dimmed={blocked} />
      </Flex>

      {/* Art. A locked line is still SHOWN — you are meant to see what you are
          missing — it is just drained of colour and light. */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        p="lg"
        style={{
          minHeight: 0,
          filter: blocked ? 'grayscale(1) brightness(0.45)' : undefined,
          transition: 'filter 0.2s',
        }}
      >
        <GlowImage src={image} alt={label} size="10vh" />
      </Flex>

      {/* Foot */}
      <Flex
        align="center"
        gap="xs"
        px="sm"
        py="xs"
        style={{ background: 'rgba(0,0,0,0.45)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Flex direction="column" style={{ minWidth: 0 }}>
          <Text size="sm" ff="Akrobat Bold" lineClamp={1} c={blocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.92)'}>
            {label}
          </Text>
          {/* The reason takes the description's line rather than sitting on top
              of the picture: it is the most useful thing to read about a line
              you cannot buy, and it costs no extra height. */}
          {reason ? (
            <Flex align="center" gap="xxs">
              <ReasonIcon kind={reason.kind} />
              <Text size="xxs" lineClamp={1} c={reasonColor(reason.kind, theme)}>
                {reason.message}
              </Text>
            </Flex>
          ) : description ? (
            <Text size="xxs" lineClamp={1} c="rgba(255,255,255,0.45)">
              {description}
            </Text>
          ) : null}
        </Flex>

        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ marginLeft: 'auto' }}
            >
              <Flex
                align="center"
                gap="xxs"
                px="xs"
                py="0.3vh"
                style={{ background: alpha(accent, 0.22), borderRadius: theme.radius.xs }}
              >
                <ShoppingBasket size="1.5vh" strokeWidth={2.4} color={accent} />
                <Text size="xxs" ff="Akrobat Bold" c={accent}>{quantityInCart}</Text>
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>
      </Flex>
    </motion.div>
  );
}

function Chip({ label, caption, accent, muted, ml, dimmed }: {
  label: string;
  caption?: string;
  accent?: boolean;
  muted?: boolean;
  ml?: string;
  dimmed?: boolean;
}) {
  const theme = useMantineTheme();
  const color = theme.colors[theme.primaryColor][5];

  return (
    <Flex
      ml={ml}
      opacity={dimmed ? 0.45 : 1}
      align="center"
      gap="xxs"
      px="xs"
      py="0.3vh"
      style={{
        background: accent ? alpha(color, 0.2) : 'rgba(0,0,0,0.5)',
        border: `1px solid ${accent ? alpha(color, 0.35) : 'rgba(255,255,255,0.08)'}`,
        borderRadius: theme.radius.xs,
      }}
    >
      {caption && (
        <Text size="xxs" tt="uppercase" lts="0.08em" c="rgba(255,255,255,0.4)">{caption}</Text>
      )}
      <Text size="xxs" ff="Akrobat Bold" c={accent ? color : muted ? 'rgba(255,255,255,0.8)' : 'white'}>
        {label}
      </Text>
    </Flex>
  );
}

/** A lock reads differently from an empty shelf, so they get different marks. */
const REASON_ICONS = {
  stock: PackageX,
  group: Lock,
  license: ScrollText,
} as const;

function ReasonIcon({ kind }: { kind: NonNullable<StoreItem['disabled']>['kind'] }) {
  const theme = useMantineTheme();
  const Icon = REASON_ICONS[kind] ?? Lock;
  return <Icon size="1.3vh" strokeWidth={2.4} color={reasonColor(kind, theme)} />;
}

/** Out of stock is a fact; a lock is a rule. Amber for the rule, grey for the fact. */
function reasonColor(kind: NonNullable<StoreItem['disabled']>['kind'], theme: MantineTheme): string {
  return kind === 'stock' ? 'rgba(255,255,255,0.4)' : theme.colors.yellow[5];
}
