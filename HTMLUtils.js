import { Dimensions, Platform, StatusBar } from 'react-native';

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;

const TextStylePropTypes = [
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
    'backfaceVisibility',
    'backgroundColor',
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
    'opacity',
    'elevation',
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
];

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

// As of react-native 0.48, this might change in the future
export const PERC_SUPPORTED_STYLES = [
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

export const STYLESETS = Object.freeze({
    TEXT: 'text',
});
export const stylePropTypes = {
    [STYLESETS.TEXT]: TextStylePropTypes,
};

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
  if (Platform.OS === 'web') {
    return percentageCalculation(MOBILE_HEIGHT, h);
  }
  const { height } = Dimensions.get('window');
  return percentageCalculation(height, h);
};

export const responsiveWidth = (w) => {
  if (Platform.OS === 'web') {
    return percentageCalculation(MOBILE_WIDTH, w);
  }
  const { width } = Dimensions.get('window');
  return percentageCalculation(width, w);
};
