import { alpha, Flex, Text, useMantineTheme } from '@mantine/core';
import { MotionFlex } from 'dirk-cfx-react';
import { motion, Variants } from 'framer-motion';
import React, { useMemo } from 'react';

export type ButtonProps = {
  label?: string;
  /** A lucide component, e.g. `ShoppingCart`. */
  icon?: React.ElementType;
  /** Any CSS colour. Defaults to the server's accent. */
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  flex?: number;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  ml?: string | number;
  fullWidth?: boolean;
};

const ICON_SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  xxs: '1.4vh',
  xs: '1.6vh',
  sm: '1.9vh',
  md: '2.2vh',
  lg: '2.6vh',
};

// The icon leans and springs on hover. Small, and it is the whole reason a
// button in a game UI feels like a button rather than a rectangle.
const iconVariants: Variants = {
  idle: { rotate: 0, scale: 1 },
  hover: {
    rotate: [0, -10, 10, 0],
    scale: 1.1,
    transition: {
      rotate: { duration: 0.6, ease: 'easeInOut' },
      scale: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
};

export default function Button({
  label,
  icon: Icon,
  color,
  onClick,
  disabled,
  flex,
  size = 'sm',
  ml,
  fullWidth,
}: ButtonProps) {
  const theme = useMantineTheme();

  // Mantine's `alpha` understands hex, rgb(a) and theme colours, so the shades
  // this used to derive with a hand-written colour parser come for free.
  const base = color ?? theme.colors[theme.primaryColor][6];

  const tokens = useMemo(() => ({
    body: disabled ? 'rgba(38, 38, 38, 0.15)' : color ? alpha(base, 0.15) : 'rgba(38, 38, 38, 0.35)',
    outline: disabled ? 'rgba(49, 49, 49, 0.3)' : color ? alpha(base, 0.4) : 'rgba(49, 49, 49, 0.6)',
    hoverOutline: alpha(base, 0.6),
    hoverBg: alpha(base, 0.12),
    hoverGlow: alpha(base, 0.28),
    tapGlow: alpha(base, 0.45),
  }), [base, color, disabled]);

  const iconSize = ICON_SIZES[size];

  return (
    <MotionFlex
      flex={flex}
      w={fullWidth ? '100%' : undefined}
      bg={tokens.body}
      p="xs"
      ml={ml}
      align="center"
      justify="center"
      style={{
        aspectRatio: !label ? '1 / 1' : undefined,
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: `0.15vh solid ${tokens.outline}`,
        borderRadius: theme.radius.xs,
        color: disabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.92)',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={!disabled ? {
        outline: `0.18vh solid ${tokens.hoverOutline}`,
        backgroundColor: tokens.hoverBg,
        boxShadow: `inset 0 0 1.6vh ${tokens.hoverGlow}, 0 0 1.2vh ${alpha(base, 0.2)}`,
        y: -1,
      } : undefined}
      whileTap={!disabled ? {
        scale: 0.98,
        y: 0,
        boxShadow: `inset 0 0 1.6vh ${tokens.tapGlow}`,
      } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={!disabled ? onClick : undefined}
    >
      <Flex align="center" justify="center" gap={Icon && label ? 'xs' : 0} style={{ position: 'relative', zIndex: 1 }}>
        {Icon && (
          <motion.div
            variants={iconVariants}
            initial="idle"
            whileHover={!disabled ? 'hover' : 'idle'}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Icon size={iconSize} strokeWidth={2.2} />
          </motion.div>
        )}
        {label && (
          <Text
            size={size}
            ff="Akrobat Bold"
            tt="uppercase"
            lts="0.06em"
            lh={1}
            c={disabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.92)'}
          >
            {label}
          </Text>
        )}
      </Flex>
    </MotionFlex>
  );
}
