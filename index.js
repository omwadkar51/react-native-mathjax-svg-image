// index.js
import React, { memo, Fragment } from 'react';
import { Text, View, ScrollView } from 'react-native';
import AutoHeightImage from 'react-native-auto-height-image';
import { SvgFromXml } from 'react-native-svg';
import { decode } from 'html-entities';
import { cssStringToRNStyle } from './HTMLStyles';
import {
  responsiveFontSize,
  responsiveWidth,
  mapHtmlStyleToRN, // sanitizer from your HTMLUtils.js
} from './HTMLUtils';
import { Table, Row, Rows } from 'react-native-table-component';

const mathjax = require('./mathjax/mathjax').mathjax;
const TeX = require('./mathjax/input/tex').TeX;
const SVG = require('./mathjax/output/svg').SVG;
const liteAdaptor = require('./mathjax/adaptors/liteAdaptor').liteAdaptor;
const RegisterHTMLHandler = require('./mathjax/handlers/html').RegisterHTMLHandler;
const AllPackages = require('./mathjax/input/tex/AllPackages').AllPackages;
require('./mathjax/util/entities/all.js');

const packageList = AllPackages.sort().join(', ').split(/\s*,\s*/);
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

/* -------------------- HTML preprocessor -------------------- */
function preprocessHtmlString(
  html,
  { forceSingleLineHtml = true, stripWhiteSpacePreWrap = true } = {}
) {
  if (html == null) return '';
  let s = String(html);

  if (stripWhiteSpacePreWrap) {
    s = s.replace(/white\s*-\s*space\s*:\s*pre-wrap\s*;?/gi, '');
  }

  if (forceSingleLineHtml) {
    s = s.replace(/\r?\n/g, ' ').replace(/[ \t\f\v]+/g, ' ');
  }

  return s;
}

/* ---------------- Tag-level default styles ---------------- */
const tagToStyle = {
  u: { textDecorationLine: 'underline' },
  ins: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through' },
  b: { fontWeight: 'bold' },
  strong: { fontWeight: 'bold' },
  i: { fontStyle: 'italic' },
  cite: { fontStyle: 'italic' },
  dfn: { fontStyle: 'italic' },
  em: { fontStyle: 'italic' },
  mark: { backgroundColor: 'yellow' },
  small: { fontSize: 10 },
};

const INLINE_TAGS = new Set([
  '#text',
  'span',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'ins',
  'small',
  'mark',
  'sub',
  'sup',
  'cite',
  'dfn',
  'code',
  'a',
  'br',
]);

/* --------------------- MathJax SVG helpers ---------------------------- */
const getScale = (_svgString) => {
  const svgString = _svgString.match(/<svg([^\>]+)>/gi)?.join('') || '';
  let [width, height] = svgString
    .replace(/.* width=\"([\d\.]*)[ep]x\".*height=\"([\d\.]*)[ep]x\".*/gi, '$1,$2')
    .split(',');
  [width, height] = [parseFloat(width), parseFloat(height)];
  return [width, height];
};

const applyScale = (svgString, [width, height]) => {
  let ret = svgString.replace(
    /(<svg[^\>]+height=\")([\d\.]+)([ep]x\"[^\>]+>)/gi,
    `$1${height}$3`
  );
  ret = ret.replace(
    /(<svg[^\>]+width=\")([\d\.]+)([ep]x\"[^\>]+>)/gi,
    `$1${width}$3`
  );
  ret = ret.replace(/(<svg[^\>]+width=\")([0]+[ep]?x?)(\"[^\>]+>)/ig, '$10$3');
  ret = ret.replace(/(<svg[^\>]+height=\")([0]+[ep]?x?)(\"[^\>]+>)/ig, '$10$3');
  return ret;
};

const applyColor = (svgString, fillColor) =>
  svgString.replace(/currentColor/gim, `${fillColor}`);

const GenerateSvgComponent = ({ item, fontSize, color }) => {
  let svgText = adaptor.innerHTML(item);
  const [width, height] = getScale(svgText);
  svgText = svgText.replace(/font-family=\"([^\"]*)\"/gmi, '');
  svgText = applyScale(svgText, [width * fontSize, height * fontSize]);
  svgText = applyColor(svgText, color);
  return <SvgFromXml xml={svgText} />;
};

/* --------------------- Table helpers ---------------------------------- */
const getDynamicColumnWidths = (head = [], rows = []) => {
  const allRows = [...(head.length ? [head] : []), ...rows].filter(r => r.length > 0);
  if (allRows.length === 0) return [];
  const colCount = Math.max(...allRows.map(row => row.length));
  const charWidth = 7;
  const padding = 20;
  const widths = Array(colCount).fill(0);
  for (const row of allRows) {
    for (let col = 0; col < colCount; col++) {
      const cell = row[col] || '';
      const estimatedWidth = cell.length * charWidth + padding;
      widths[col] = Math.max(widths[col], estimatedWidth);
    }
  }
  return widths;
};

const extractTextFromNode = (node) => {
  if (node.kind === '#text') return (adaptor.value(node) || '').trim();
  if (!node.children) return '';
  return node.children.map(extractTextFromNode).join(' ').trim();
};

/* --------------------- Sup/Sub helper --------------------------------- */
// --- FINAL FIX: Use 'transform' for the vertical shift. It will now pass the sanitizer. ---
const applySupSubAdjustment = (kind, baseStyle, fontSize) => {
  if (kind !== 'sup' && kind !== 'sub') return baseStyle;
  const tiny = responsiveFontSize(Math.max(8, Math.round(fontSize * 1.0)));
  const shift = kind === 'sup' ? -tiny * 0.7 : tiny * 0.4; // Increased shift
  return {
    ...(baseStyle || {}),
    fontSize: tiny,
    transform: [{ translateY: shift }],
  };
};

/* -------------------- Text normalization helpers ---------------------- */
const normalizeTextNode = ({
  raw,
  inPre = false,
  collapseTextNewlines = true,
  skipIsolatedNewline = true,
  collapseRuns = true,
}) => {
  if (!raw) return '';
  if (skipIsolatedNewline && !inPre && /^(?:\r?\n)+$/.test(raw)) return null;

  let decoded = decode(raw);

  if (collapseTextNewlines && !inPre) {
    decoded = decoded.replace(/\r?\n/g, ' ');
    if (collapseRuns) decoded = decoded.replace(/[ \t\f\v]+/g, ' ');
  }
  
  if (!inPre && decoded === '') return null;

  return decoded;
};

/* ----- Render an inline child as a string or nested <Text> inside <Text> ----- */
function renderInlineChildAsText({
  node,
  key,
  color,
  fontSize,
  parentStyle,
  collapseTextNewlines,
  skipIsolatedNewline,
  collapseRuns = true,
}) {
  if (node.kind === '#text') {
    const normalized = normalizeTextNode({
      raw: adaptor.value(node) || '',
      inPre: false,
      collapseTextNewlines,
      skipIsolatedNewline,
      collapseRuns,
    });
    if (normalized == null) return null;
    return normalized;
  }

  if (node.kind === 'br') return '\n';

  const htmlStyle = adaptor.allStyles(node) || null;
  let childStyle = htmlStyle ? cssStringToRNStyle(htmlStyle) : null;
  childStyle = mapHtmlStyleToRN(node.kind, {
    ...(tagToStyle[node.kind] || {}),
    ...(childStyle || {}),
  });

  childStyle = applySupSubAdjustment(node.kind, childStyle, fontSize);

  return (
    <Text key={key} style={{ color, ...childStyle }}>
      {(node.children || []).map((c, i) =>
        renderInlineChildAsText({
          node: c,
          key: `${key}-${i}`,
          color,
          fontSize,
          parentStyle: childStyle,
          collapseTextNewlines,
          skipIsolatedNewline,
          collapseRuns,
        })
      )}
    </Text>
  );
}

/* --------------------- Main renderer for nodes ------------------------ */
const GenerateTextComponent = ({
  fontSize,
  color,
  index,
  item,
  parentStyle = null,
  parentTag = null,
  collapseTextNewlines = true,
  skipIsolatedNewline = true,
  collapseRuns = true,
}) => {
  let rnStyle = null;
  let text = null;
  let isImage = false;
  let imageSource = null;

  if (item?.kind === 'p') {
    let pStyle = null;
    const htmlStyleStr = adaptor.allStyles(item) || '';
    if (htmlStyleStr) {
      pStyle = cssStringToRNStyle(htmlStyleStr);
      pStyle = mapHtmlStyleToRN('p', pStyle);
    }
    
    // The new renderer uses a View with flexbox for robust inline layout.
    return (
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline', // This aligns text fragments correctly
        ...pStyle, // Apply paragraph-level styles like textAlign
      }}>
        {(item.children || []).map((child, index) => (
          <GenerateTextComponent
            key={`p-child-${index}`}
            color={color}
            fontSize={fontSize}
            item={child}
            index={index}
            // Other props are inherited or not needed for children
          />
        ))}
      </View>
    );
  }

  if (item?.kind !== '#text' && item?.kind !== 'mjx-container' && item?.kind !== '#comment') {
    const htmlStyle = adaptor.allStyles(item) || null;
    if (htmlStyle) {
      rnStyle = cssStringToRNStyle(htmlStyle);
      rnStyle = mapHtmlStyleToRN(item?.kind, rnStyle);
    }
    rnStyle = mapHtmlStyleToRN(item?.kind, { ...(tagToStyle[item?.kind] || {}), ...(rnStyle || {}) });
  }

  if (item?.kind === '#text') {
    const normalized = normalizeTextNode({
      raw: adaptor.value(item) || '',
      inPre: (parentTag || '').toLowerCase() === 'pre',
      collapseTextNewlines,
      skipIsolatedNewline,
      collapseRuns,
    });
    if (normalized == null) return null;
    text = normalized;
    rnStyle = parentStyle || null;
  } else if (item?.kind === 'br') {
    text = '\n';
    rnStyle = { width: '100%', overflow: 'hidden', height: 0 };
  } else if (item?.kind === 'img') {
    isImage = true;
    imageSource = adaptor.getAttribute(item, 'src');
  } else if (item?.kind === 'table') {
    const tableHead = [];
    const tableRows = [];
    const allRows = [];

    item.children?.forEach((section) => {
      if (section.kind === 'thead' || section.kind === 'tbody') {
        allRows.push(...(section.children || []));
      } else if (section.kind === 'tr') {
        allRows.push(section);
      }
    });

    if (allRows.length > 0) {
      tableHead.push(...(allRows[0].children?.map(td => extractTextFromNode(td)) || []));
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i].children?.map(td => extractTextFromNode(td)) || [];
        tableRows.push(row);
      }
    }

    let effectiveHead = tableHead;
    let effectiveRows = tableRows;
    if (tableHead.length === 0 && tableRows.length > 0) {
      effectiveHead = tableRows[0];
      effectiveRows = tableRows.slice(1);
    }

    const widthArr = getDynamicColumnWidths(effectiveHead, effectiveRows);
    const totalWidth = widthArr.reduce((sum, w) => sum + w, 0);

    return (
      <View>
        <ScrollView horizontal>
          <View style={{ width: totalWidth }}>
            <Table borderStyle={{ borderWidth: 1, borderColor: '#ccc' }}>
              {effectiveHead?.length > 0 && (
                <Row
                  data={effectiveHead}
                  widthArr={widthArr}
                  style={{ backgroundColor: '#eee', borderColor: '#ccc', borderRightWidth: 2 }}
                  textStyle={{ fontWeight: 'bold', textAlign: 'center' }}
                />
              )}
              <Rows
                data={effectiveRows}
                widthArr={widthArr}
                style={{ borderColor: '#ccc', borderRightWidth: 2 }}
                textStyle={{ textAlign: 'center', flexWrap: 'wrap' }}
              />
            </Table>
          </View>
        </ScrollView>
      </View>
    );
  }

  rnStyle = applySupSubAdjustment(item?.kind, rnStyle, fontSize);

  return (
    <Fragment>
      {text ? (
        <Text style={{ fontSize: fontSize * 2, color, ...(rnStyle || {}) }} suppressHighlighting>
          {text}
        </Text>
      ) : isImage ? (
        (() => {
          const styleAttr = adaptor.getAttribute(item, 'style');
          let parsedWidth, parsedHeight;

          const convertToPx = (valueStr) => {
            if (!valueStr) return undefined;
            if (valueStr.endsWith('%')) {
              const percentage = parseFloat(valueStr);
              return (percentage / 100) * responsiveWidth(100);
            }
            if (valueStr.endsWith('in')) return parseFloat(valueStr) * 96;
            if (valueStr.endsWith('px')) return parseFloat(valueStr);
            return parseFloat(valueStr);
          };

          if (styleAttr) {
            const widthMatch = styleAttr.match(/width\s*:\s*([\d.]+(%|px|in)?)/);
            const heightMatch = styleAttr.match(/height\s*:\s*([\d.]+(%|px|in)?)/);
            if (widthMatch) parsedWidth = convertToPx(widthMatch[1]);
            if (heightMatch) parsedHeight = convertToPx(heightMatch[1]);
          }

          const maxWidth = responsiveWidth(80);
          const fallbackWidth = responsiveWidth(65);

          if (parsedWidth && parsedWidth > maxWidth) {
            const ratio = maxWidth / parsedWidth;
            parsedWidth = maxWidth;
            if (parsedHeight) parsedHeight *= ratio;
          }

          return (
            <AutoHeightImage
              source={{ uri: imageSource }}
              width={parsedWidth || fallbackWidth}
            />
          );
        })()
      ) : item?.kind === 'mjx-container' ? (
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <GenerateSvgComponent item={item} fontSize={fontSize} color={color} />
        </ScrollView>
      ) : item?.children?.length ? (
        item.children.map((subItem, subIndex) => (
          <GenerateTextComponent
            key={`sub-${index}-${subIndex}`}
            color={color}
            fontSize={fontSize}
            item={subItem}
            index={subIndex}
            parentStyle={rnStyle}
            parentTag={item?.kind}
            collapseTextNewlines={collapseTextNewlines}
            skipIsolatedNewline={skipIsolatedNewline}
            collapseRuns={collapseRuns}
          />
        ))
      ) : null}
    </Fragment>
  );
};

/* --------------------- Root converter --------------------------------- */
const ConvertToComponent = ({
  texString = '',
  fontSize = 12,
  fontCache = false,
  color,
  collapseTextNewlines = true,
  skipIsolatedNewline = true,
  collapseRuns = true,
  forceSingleLineHtml = true,
  stripWhiteSpacePreWrap = true,
}) => {
  if (!texString) return '';

  const cleaned = preprocessHtmlString(texString, {
    forceSingleLineHtml,
    stripWhiteSpacePreWrap,
  });

  const tex = new TeX({
    packages: packageList,
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  });

  const svg = new SVG({
    fontCache: fontCache ? 'local' : 'none',
    mtextInheritFont: true,
    merrorInheritFont: true,
  });

  const html = mathjax.document(cleaned, {
    InputJax: tex,
    OutputJax: svg,
    renderActions: { assistiveMml: [] },
  });

  html.render();

  if (Array.from(html.math).length === 0) {
    adaptor.remove(html.outputJax.svgStyles);
    const cache = adaptor.elementById(adaptor.body(html.document), 'MJX-SVG-global-cache');
    if (cache) adaptor.remove(cache);
  }

  const nodes = adaptor.childNodes(adaptor.body(html.document));

  return (
    <Fragment>
      {nodes?.map((item, index) => (
        <GenerateTextComponent
          key={index}
          item={item}
          index={index}
          fontSize={fontSize}
          color={color}
          parentTag={null}
          collapseTextNewlines={collapseTextNewlines}
          skipIsolatedNewline={skipIsolatedNewline}
          collapseRuns={collapseRuns}
        />
      ))}
    </Fragment>
  );
};

/* --------------------- Public component -------------------------------- */
export const MathJaxSvg = memo((props) => {
  const textext = props.children || '';
  const fontSize = props.fontSize ? props.fontSize / 2 : 14;
  const color = props.color ? props.color : 'black';
  const fontCache = props.fontCache;
  const style = props.style ? props.style : null;

  const collapseTextNewlines =
    typeof props.collapseTextNewlines === 'boolean' ? props.collapseTextNewlines : true;

  const skipIsolatedNewline =
    typeof props.skipIsolatedNewline === 'boolean' ? props.skipIsolatedNewline : true;

  const collapseRuns =
    typeof props.collapseRuns === 'boolean' ? props.collapseRuns : true;

  const forceSingleLineHtml =
    typeof props.forceSingleLineHtml === 'boolean' ? props.forceSingleLineHtml : true;

  const stripWhiteSpacePreWrap =
    typeof props.stripWhiteSpacePreWrap === 'boolean' ? props.stripWhiteSpacePreWrap : true;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        flexShrink: 1,
        ...style,
      }}
    >
      {textext ? (
        <ConvertToComponent
          fontSize={fontSize}
          color={color}
          texString={textext}
          fontCache={fontCache}
          collapseTextNewlines={collapseTextNewlines}
          skipIsolatedNewline={skipIsolatedNewline}
          collapseRuns={collapseRuns}
          forceSingleLineHtml={forceSingleLineHtml}
          stripWhiteSpacePreWrap={stripWhiteSpacePreWrap}
        />
      ) : null}
    </View>
  );
});