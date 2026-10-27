import { Flex, type FlexProps } from '@mantine/core';
import { useSettings } from 'dirk-cfx-react';
import React from 'react';

/**
 * A Flex that wears torn paper edges on RedM and square ones on FiveM.
 *
 * This used to mask itself with a PNG fetched from a third-party GitHub raw
 * URL. In CEF that is a network request per element on a machine that may have
 * no route out — when it fails the mask resolves to nothing and the element
 * disappears entirely. The edge is a clip-path now: same look, no network, and
 * it is the same polygon dirk-cfx-react's own TornWrapper uses.
 */
const TORN_CLIP = `polygon(
  1% 2%,3.5% 0.1%,8.9% 2.7%,16.2% 1.2%,19.7% 0.8%,24.7% 2%,31.2% 0%,35.9% 2.3%,40.6% 0.5%,
  47.1% 1.8%,49.9% 1%,53.8% 2.5%,62.2% 0.4%,67.3% 1.2%,70.3% 0.3%,75.8% 1.4%,78.5% 1.7%,84% 2.6%,
  91.1% 0.5%,93.6% 2.4%,97.3% 0.3%,98.9% 6%,98.1% 11.4%,98.6% 15.5%,97.3% 17.8%,97.7% 27.4%,
  98.3% 28.5%,99.7% 34.1%,98.8% 41.9%,98.3% 45.7%,98.4% 50.9%,98.7% 57.4%,99.6% 60.4%,99.4% 66.6%,
  99.2% 69.5%,97.4% 77.1%,98.1% 82.3%,99.9% 83.5%,98.2% 91.5%,99.3% 95.3%,98% 98.6%,93.6% 97.4%,
  90.3% 98.3%,86.8% 98.3%,78.6% 98.5%,76.4% 99.2%,69.7% 99.8%,64.2% 99.3%,61.8% 99.2%,57.2% 98.1%,
  48.7% 98.3%,46.8% 99%,39.6% 98.9%,33.8% 97.3%,28.2% 99.4%,27% 98.3%,22.1% 98.6%,13.1% 97.1%,
  8.7% 99.3%,2.7% 97.4%,2% 98.2%,2.1% 94.3%,0.7% 90.5%,0.9% 86.3%,2.2% 78.2%,0.4% 76.7%,1.2% 72.1%,
  2% 64%,1.4% 59.8%,0.4% 57.3%,0.3% 49.1%,2.9% 44.7%,1.9% 41.3%,0.8% 35.7%,2.9% 31.3%,0.8% 24.9%,
  2.7% 20.5%,0.8% 17.4%,2.5% 8.6%,1.1% 5.5%
)`;

type CustomFlexProps = { children?: React.ReactNode } & FlexProps;

const CustomFlex = React.forwardRef<HTMLDivElement, CustomFlexProps>((props, ref) => {
  const game = useSettings((state) => state.game);

  return (
    <Flex
      ref={ref}
      {...props}
      style={{
        ...(game === 'rdr3' ? { clipPath: TORN_CLIP } : {}),
        ...props.style,
      }}
    />
  );
});

CustomFlex.displayName = 'CustomFlex';

export default CustomFlex;
