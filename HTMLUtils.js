// HTMLUtils.js
import { Dimensions, Platform, StatusBar } from 'react-native';

/* ------------------------------------------------------------------ */
/* Device + responsive helpers                                         */
/* ------------------------------------------------------------------ */
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;

export function responsiveFontSize(fontSize) {
  const { height, width } = Dimensions.get('window');
  const standardScreenHeight = Math.max(height, width);
  const standardLength = width > height ? width : height;
  const offset =
    width > height ? 0 : Platform.OS === 'ios' ? 78 : StatusBar.currentHeight;

  const deviceHeight =
    Platform.OS === 'android' ? standardLength - (offset ?? 0) : standardLength;

  const heightPercent = (fontSize * deviceHeight) / standardScreenHeight;
  return Math.round(heightPercent);
}

const percentageCalculation = (max, val) => max * (val / 100);

export const responsiveHeight = (h) => {
  if (Platform.OS === 'web') return percentageCalculation(MOBILE_HEIGHT, h);
  const { height } = Dimensions.get('window');
  return percentageCalculation(height, h);
};

export const responsiveWidth = (w) => {
  if (Platform.OS === 'web') return percentageCalculation(MOBILE_WIDTH, w);
  const { width } = Dimensions.get('window');
  return percentageCalculation(width, w);
};

/* ------------------------------------------------------------------ */
/* CSS → RN size keywords                                              */
/* ------------------------------------------------------------------ */
export const ABSOLUTE_FONT_SIZE = {
  medium: 14,
  'xx-small': 8.5,
  'x-small': 10,
  small: 12,
  large: 17,
  'x-large': 20,
  'xx-large': 24,
  smaller: 13.3,
  larger: 16,
  length: null,
  initial: null,
  inherit: null,
  unset: null,
};

/* ------------------------------------------------------------------ */
/* Style policy                                                        */
/* ------------------------------------------------------------------ */

// Toggle if you want to scale numeric font sizes responsively.
const USE_RESPONSIVE_FONT_SIZE = true;

// Inline text-only props that are safe for <Text>
const TEXT_SAFE_PROPS = [
  'color',
  'fontFamily',
  // 'fontSize',
  'fontStyle',
  'fontWeight',
  'fontVariant',
  'textShadowOffset',
  'textShadowRadius',
  'textShadowColor',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textAlignVertical',
  'includeFontPadding',
  'textDecoration',
  'textDecorationLine',
  'textDecorationStyle',
  'textDecorationColor',
  'textTransform',
  'writingDirection',
  'backgroundColor',
  'opacity',
  'marginLeft', 
  'marginRight', 
  'marginHorizontal',
  'paddingLeft', 
  'paddingRight', 
  'paddingHorizontal',
  'transform',
];

// Layout/box props we do NOT want on inline text nodes
const LAYOUT_PROPS = [
  'display',
  'width',
  'height',
  'start',
  'end',
  'top',
  'left',
  'right',
  'bottom',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'margin',
  'marginVertical',
  'marginHorizontal',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginEnd',
  'padding',
  'paddingVertical',
  'paddingHorizontal',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingEnd',
  'borderWidth',
  'borderTopWidth',
  'borderStartWidth',
  'borderEndWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'position',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignSelf',
  'alignContent',
  'overflow',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'aspectRatio',
  'zIndex',
  'direction',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'transform',
  'transformMatrix',
  'decomposedMatrix',
  'scaleX',
  'scaleY',
  'rotation',
  'translateX',
  'translateY',
  'elevation',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderStartColor',
  'borderEndColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopStartRadius',
  'borderTopEndRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomStartRadius',
  'borderBottomEndRadius',
  'borderStyle',
];

// Block-level tags that can carry layout props safely
const BLOCK_TAGS = new Set([
  'div',
  'p',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'figure',
  'figcaption',
  'blockquote',
  'pre',
]);

// Inline tags that should remain inline-only
const INLINE_TEXT_TAGS = new Set([
  'span',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'sub',
  'sup',
  'code',
  'small',
  'big',
  'a',
]);

// Percentage support: allow on block containers, not on inline text
export const PERC_SUPPORTED_STYLES_BLOCK = [
  'width',
  'height',
  'top',
  'bottom',
  'left',
  'right',
  'margin',
  'marginBottom',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'padding',
  'paddingBottom',
  'paddingTop',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
];

export const PERC_SUPPORTED_STYLES_INLINE = []; // none for inline text

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

function normalizeFontSizeValue(value) {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    // Keyword → fixed numeric mapping
    if (lower in ABSOLUTE_FONT_SIZE && ABSOLUTE_FONT_SIZE[lower] != null) {
      return ABSOLUTE_FONT_SIZE[lower];
    }
    // e.g., "16px"
    const pxMatch = lower.match(/^(-?\d+(\.\d+)?)px$/);
    if (pxMatch) return Number(pxMatch[1]);
    // raw number as string "16"
    const num = Number(lower);
    if (!Number.isNaN(num)) return num;
    return undefined;
  }

  if (typeof value === 'number') return value;
  return undefined;
}

function maybeResponsiveFontSize(numericSize) {
  if (numericSize == null) return undefined;
  return USE_RESPONSIVE_FONT_SIZE ? responsiveFontSize(numericSize) : numericSize;
}

/* ------------------------------------------------------------------ */
/* Public API: sanitize + map styles per tag                           */
/* ------------------------------------------------------------------ */

/**
 * Removes layout props from inline text tags so they never behave like blocks.
 * Also normalizes fontSize (keywords → numbers, optional responsive scaling).
 */
export function sanitizeStyleForTag(tagName, styleIn = {}) {
  const tag = String(tagName || '').toLowerCase();
  const style = { ...(styleIn || {}) };

  // 1) Normalize fontSize first
  if ('fontSize' in style) {
    const normalized = normalizeFontSizeValue(style.fontSize);
    if (normalized != null) {
      style.fontSize = maybeResponsiveFontSize(normalized);
    } else {
      delete style.fontSize;
    }
  }

  // 2) Enforce inline vs block policy
  if (INLINE_TEXT_TAGS.has(tag)) {
    // Keep only text-safe props for inline nodes
    Object.keys(style).forEach((k) => {
      if (!TEXT_SAFE_PROPS.includes(k)) delete style[k];
    });
  } else if (!BLOCK_TAGS.has(tag)) {
    // Unknown tags: be conservative—treat like inline text
    Object.keys(style).forEach((k) => {
      if (!TEXT_SAFE_PROPS.includes(k)) delete style[k];
    });
  }
  // For BLOCK_TAGS: allow everything (library/parser may still filter further)

  return style;
}

/**
 * Helper to decide if a given property name may use % based on tag type.
 */
export function isPercentAllowed(tagName, prop) {
  const tag = String(tagName || '').toLowerCase();
  if (BLOCK_TAGS.has(tag)) {
    return PERC_SUPPORTED_STYLES_BLOCK.includes(prop);
  }
  return PERC_SUPPORTED_STYLES_INLINE.includes(prop);
}

/**
 * Example adapter: map an HTML style object to a final RN style for a tag.
 * Call this from your HTML→RN style mapper before passing to <Text>/<View>.
 */
export function mapHtmlStyleToRN(tagName, htmlStyleObj) {
  const s = sanitizeStyleForTag(tagName, htmlStyleObj);

  // Strip any percentage values that aren't allowed for this tag/prop
  Object.keys(s).forEach((k) => {
    const v = s[k];
    if (typeof v === 'string' && v.trim().endsWith('%') && !isPercentAllowed(tagName, k)) {
      delete s[k];
    }
  });

  return s;
}

/* ------------------------------------------------------------------ */
/* Optional: expose enums for external use                             */
/* ------------------------------------------------------------------ */
export const STYLESETS = Object.freeze({ TEXT: 'text' });
export const stylePropTypes = {
  [STYLESETS.TEXT]: TEXT_SAFE_PROPS, // for inline <Text> nodes
};