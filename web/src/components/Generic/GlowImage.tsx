import { Flex, Image } from '@mantine/core';
import NothingPNG from '../Store/nothing.png';

export type GlowImageProps = {
  src: string;
  alt?: string;
  /** Height of the sharp copy. The blurred copy sits behind it, larger. */
  size?: string;
};

/**
 * An item picture with a soft bloom of itself behind it — the thing that makes
 * a flat inventory PNG read as lit rather than pasted on.
 */
export default function GlowImage({ src, alt, size = '11vh' }: GlowImageProps) {
  return (
    <Flex w="100%" h="100%" justify="center" align="center" pos="relative">
      <Image
        pos="absolute"
        h={`calc(${size} * 1.5)`}
        w={`calc(${size} * 1.5)`}
        fit="contain"
        src={src}
        fallbackSrc={NothingPNG}
        alt=""
        style={{ filter: 'blur(1.5vh)', opacity: 0.35, zIndex: 1 }}
      />
      <Image
        h={size}
        w={size}
        fit="contain"
        src={src}
        fallbackSrc={NothingPNG}
        alt={alt ?? ''}
        style={{ zIndex: 2 }}
      />
    </Flex>
  );
}
