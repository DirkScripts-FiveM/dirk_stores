import { Flex, FlexProps, Transition, useMantineTheme } from '@mantine/core';
import { useEffect, useState } from 'react';

export type BackgroundStyle = 'themed' | 'dark' | 'transparent';

type BackgroundProps = {
  children: React.ReactNode;
  escapeKey?: boolean;
  onClose?: () => void;
  open?: boolean;
  background?: BackgroundStyle;
} & FlexProps;

export default function Background({
  children,
  escapeKey,
  onClose,
  open,
  background = 'themed',
  ...rest
}: BackgroundProps) {
  const theme = useMantineTheme();
  const primaryColor = theme.colors[theme.primaryColor];

  // A wash of the server's accent over near-black, so the store reads as part
  // of the same family as every other dirk screen without tinting the game.
  const gradientBackground = `
    linear-gradient(135deg, rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0.92)),
    linear-gradient(135deg, ${primaryColor[9]}30 0%, ${primaryColor[9]}60 100%)
  `;

  const [pointerEvents, setPointerEvents] = useState<boolean>(false);

  useEffect(() => {
    if (!escapeKey) return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keyup', handleKeyUp);
    return () => document.removeEventListener('keyup', handleKeyUp);
  }, [escapeKey, onClose]);

  return (
    <Transition
      duration={400}
      timingFunction="ease"
      transition="fade"
      mounted={!!open}
      onEntered={() => setPointerEvents(true)}
      onExited={() => setPointerEvents(false)}
    >
      {(transition) => (
        <Flex
          direction="column"
          bg={
            background === 'dark' ? 'rgba(0, 0, 0, 0.9)'
              : background === 'transparent' ? 'transparent'
                : gradientBackground
          }
          w="100dvw"
          maw="100dvw"
          mih="100dvh"
          mah="100dvh"
          style={{
            pointerEvents: pointerEvents ? 'all' : 'none',
            userSelect: 'none',
            overflow: 'hidden',
            ...transition,
          }}
          {...rest}
        >
          {children}
        </Flex>
      )}
    </Transition>
  );
}
