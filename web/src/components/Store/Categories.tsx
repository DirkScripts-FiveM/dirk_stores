import { alpha, Flex, TextInput, useMantineTheme } from '@mantine/core';
import { locale, SegmentedControl } from 'dirk-cfx-react';
import { Search, X } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from './useStore';

export default function Categories() {
  const theme = useMantineTheme();
  const categories = useStore((state) => state.categories);
  const selectedCategory = useStore((state) => state.selectedCategory);
  const search = useStore((state) => state.search);
  const stockCount = useStore((state) => state.stock.length);

  useEffect(() => {
    if (!categories?.length) {
      useStore.setState({ selectedCategory: undefined });
      return;
    }
    if (!useStore.getState().selectedCategory) {
      useStore.setState({ selectedCategory: categories[0].name });
    }
  }, [categories]);

  // A store with three items does not need a search box; one with sixty does.
  const showSearch = stockCount > 8;

  if (!categories?.length && !showSearch) return null;

  return (
    <Flex w="100%" align="center" gap="sm">
      {!!categories?.length && (
        <SegmentedControl
          gap="xxs"
          value={selectedCategory ?? categories[0].name}
          items={categories.map((category) => ({
            label: category.name,
            value: category.name,
            icon: category.icon,
          }))}
          onChange={(value) => useStore.setState({ selectedCategory: value as string })}
        />
      )}

      {showSearch && (
        <TextInput
          ml="auto"
          w="26vh"
          size="xs"
          placeholder={locale('SearchItems')}
          value={search}
          onChange={(event) => useStore.setState({ search: event.currentTarget.value })}
          leftSection={<Search size="1.6vh" strokeWidth={2.2} color="rgba(255,255,255,0.45)" />}
          rightSection={search ? (
            <X
              size="1.5vh"
              strokeWidth={2.4}
              color="rgba(255,255,255,0.45)"
              style={{ cursor: 'pointer' }}
              onClick={() => useStore.setState({ search: '' })}
            />
          ) : null}
          styles={{
            input: {
              background: 'rgba(20, 20, 20, 0.55)',
              border: `0.1vh solid ${alpha(theme.colors[theme.primaryColor][6], 0.18)}`,
              borderRadius: theme.radius.xs,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Akrobat Regular',
            },
          }}
        />
      )}
    </Flex>
  );
}
