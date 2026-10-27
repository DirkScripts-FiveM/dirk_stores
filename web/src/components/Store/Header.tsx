import { Flex, Text } from '@mantine/core';
import { fetchNui, locale, SegmentedControl, Title } from 'dirk-cfx-react';
import { money } from '@/utils/money';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../Generic/Button';
import { useStore } from './useStore';

export default function Header() {
  const name = useStore((state) => state.name);
  const icon = useStore((state) => state.icon);
  const description = useStore((state) => state.description);
  const selectedMethod = useStore((state) => state.selectedMethod);
  const paymentMethods = useStore((state) => state.paymentMethods);

  return (
    <Flex w="100%" h="fit-content" align="center" gap="sm">
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeInOut' }}
      >
        <Title
          title={name || locale('Store')}
          description={description || ''}
          icon={icon || 'fa-store'}
          size="lg"
        />
      </motion.div>

      <motion.div
        style={{ marginLeft: 'auto' }}
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeInOut' }}
      >
        {/* Every method carries its own balance, so the one you are about to
            pay with is always the one showing a number — the old header only
            printed a balance for the selected method and left the rest bare. */}
        <SegmentedControl
          gap="xxs"
          value={selectedMethod?.id ?? paymentMethods[0]?.id}
          items={paymentMethods.map((method) => ({
            label: method.name,
            value: method.id,
            icon: method.icon || 'fa-credit-card',
            rightSection: typeof method.balance === 'number' ? (
              <Text size="xs" c="rgba(255, 255, 255, 0.45)" ff="Akrobat Bold" lts="0.04em">
                {money(method.balance, method)}
              </Text>
            ) : undefined,
          }))}
          onChange={(value) => {
            useStore.setState({
              selectedMethod: paymentMethods.find((method) => method.id === value) ?? paymentMethods[0],
            });
          }}
        />
      </motion.div>

      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeInOut' }}
      >
        <Button icon={X} size="md" onClick={() => fetchNui('CLOSE_STORE')} />
      </motion.div>
    </Flex>
  );
}
