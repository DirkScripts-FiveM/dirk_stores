import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as lucide from 'lucide-react';
import { Store as StoreIcon } from 'lucide-react';

/**
 * An icon named by the CONFIG, from either set.
 *
 * Stores ship Font Awesome classes ("fas fa-gun") because that is what the
 * store screen has always drawn, and Script Studio's icon picker declares
 * `iconSet: "fontawesome"` for those fields so they keep coming back the same
 * way. Anything that is not an `fa-` class is read as a lucide name, so a
 * server owner who picks from the other set still gets an icon rather than a
 * silent blank. Same rule dirk_lib's own AnyIcon uses — copied, not invented.
 */

const CACHE = new Map<string, React.ElementType>();

/** `shopping-bag` -> `ShoppingBag`, which is how lucide names its exports. */
function pascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveLucide(name: string): React.ElementType {
  const cached = CACHE.get(name);
  if (cached) return cached;

  const registry = lucide as unknown as Record<string, React.ElementType | undefined>;
  const found = registry[pascal(name)]
    ?? registry[name]
    ?? registry[`${pascal(name)}Icon`]
    ?? StoreIcon;

  CACHE.set(name, found);
  return found;
}

/** `"fa-solid fa-gun"` -> `["fas", "gun"]`, or null when it is not one. */
export function parseFaIcon(name: string): [string, string] | null {
  if (!name || !/fa-/.test(name)) return null;

  // Font Awesome names its styles two ways — the short `fas` and the long
  // `fa-solid` — and the long one is itself an `fa-` token. Reading the glyph
  // as "the first fa- word" turns `fa-solid fa-gun` into the icon named
  // "solid", which does not exist, and the category draws a blank.
  const STYLES = {
    'fa-solid': 'fas', fas: 'fas',
    'fa-regular': 'far', far: 'far',
    'fa-brands': 'fab', fab: 'fab',
    'fa-light': 'fal', fal: 'fal',
    'fa-duotone': 'fad', fad: 'fad',
  } as Record<string, string>;

  const parts = name.trim().toLowerCase().split(/\s+/);
  const style = parts.map((part) => STYLES[part]).find(Boolean) ?? 'fas';
  const glyph = parts.find((part) => part.startsWith('fa-') && !STYLES[part])?.slice(3);
  return glyph ? [style, glyph] : null;
}

export type ConfigIconProps = {
  name?: string;
  size?: string;
  color?: string;
  strokeWidth?: number;
};

export function ConfigIcon({ name, size = '2vh', color = 'currentColor', strokeWidth = 2 }: ConfigIconProps) {
  if (!name) return null;

  const fa = parseFaIcon(name);
  if (fa) {
    return (
      <FontAwesomeIcon
        icon={fa as IconProp}
        color={color}
        style={{ width: size, height: size }}
      />
    );
  }

  const Cmp = resolveLucide(name);
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}

export default ConfigIcon;
