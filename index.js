import React, { memo, Fragment } from 'react';
import { Text, View, ScrollView } from 'react-native';
import AutoHeightImage from "react-native-auto-height-image";
import { SvgFromXml } from 'react-native-svg';
import { decode } from 'html-entities';
import { cssStringToRNStyle } from './HTMLStyles';
import {responsiveFontSize, responsiveWidth} from "./HTMLUtils";
import { Table, Row, Rows } from 'react-native-table-component';


const mathjax = require('./mathjax/mathjax').mathjax;
const TeX = require('./mathjax/input/tex').TeX;
const SVG = require('./mathjax/output/svg').SVG;
const liteAdaptor = require('./mathjax/adaptors/liteAdaptor').liteAdaptor;
const RegisterHTMLHandler = require('./mathjax/handlers/html').RegisterHTMLHandler;

const AllPackages = require('./mathjax/input/tex/AllPackages').AllPackages;

const packageList = AllPackages.sort().join(', ').split(/\s*,\s*/);

require('./mathjax/util/entities/all.js');

const adaptor = liteAdaptor();

RegisterHTMLHandler(adaptor);

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
    small: { fontSize: 8 },
    sup: { fontSize: responsiveFontSize(1.5), alignSelf: "flex-start", left: responsiveWidth(-0.5)},
    sub: { alignSelf: "flex-end" , fontSize: responsiveFontSize(1.5), left: responsiveWidth(-0.5)}
};

const getScale = _svgString => {
    const svgString = _svgString.match(/<svg([^\>]+)>/gi).join('');

    let [width, height] = (svgString || '')
        .replace(
            /.* width=\"([\d\.]*)[ep]x\".*height=\"([\d\.]*)[ep]x\".*/gi,
            '$1,$2'
        )
        .split(/\,/gi);
    [width, height] = [parseFloat(width), parseFloat(height)];

    return [width, height];
};

const applyScale = (svgString, [width, height]) => {
    if (width > 350) {
        width = responsiveWidth(85);
    }
    let retSvgString = svgString.replace(
        /(<svg[^\>]+height=\")([\d\.]+)([ep]x\"[^\>]+>)/gi,
        `$1${height}$3`
    );

    retSvgString = retSvgString.replace(
        /(<svg[^\>]+width=\")([\d\.]+)([ep]x\"[^\>]+>)/gi,
        `$1${width}$3`
    );

    retSvgString = retSvgString.replace(/(<svg[^\>]+width=\")([0]+[ep]?x?)(\"[^\>]+>)/ig, '$10$3');
    retSvgString = retSvgString.replace(/(<svg[^\>]+height=\")([0]+[ep]?x?)(\"[^\>]+>)/ig, '$10$3');

    return retSvgString;
};

const applyColor = (svgString, fillColor) => {
    return svgString.replace(/currentColor/gim, `${fillColor}`);
};

const GenerateSvgComponent = ({ item, fontSize, color }) => {
    let svgText = adaptor.innerHTML(item);

    const [width, height] = getScale(svgText);

    svgText = svgText.replace(/font-family=\"([^\"]*)\"/gmi, '');

    svgText = applyScale(svgText, [width * fontSize, height * fontSize]);

    svgText = applyColor(svgText, color);

    return (
        <SvgFromXml xml={svgText}/>
    );
};

const getDynamicColumnWidths = (head = [], rows = []) => {
    const allRows = [head, ...rows];
    const colCount = head.length;

    const widths = Array(colCount).fill(0);

    for (let col = 0; col < colCount; col++) {
        for (let row = 0; row < allRows.length; row++) {
            const cell = allRows[row][col] || '';
            const charWidth = 7; // 📏 adjust for font size
            const estimatedWidth = cell.length * charWidth + 20; // buffer padding
            if (estimatedWidth > widths[col]) {
                widths[col] = estimatedWidth;
            }
        }
    }

    return widths;
};


const GenerateTextComponent = ({ fontSize, color, index, item, parentStyle = null }) => {
    let rnStyle = null;
    let text = null;
    let isImage = false;
    let imageSource = null;

    if (item?.kind !== '#text' && item?.kind !== 'mjx-container' && item?.kind !== '#comment') {
        let htmlStyle = adaptor.allStyles(item) || null;

        if (htmlStyle) {
            rnStyle = cssStringToRNStyle(htmlStyle);
        }

        rnStyle = { ...(tagToStyle[item?.kind] || null), ...rnStyle };
    }
    if (item?.kind === '#text') {
        text = decode(adaptor.value(item) || '');
        rnStyle = (parentStyle ? parentStyle : null);
    } else if (item?.kind === 'br') {
        text = '\n';
        rnStyle = { width: '100%', overflow: 'hidden', height: 0 };
    } else if (item?.kind === 'img') {
        isImage = true;
        imageSource = adaptor.getAttribute(item, 'src');
    } else if (item?.kind === 'table') {

        const extractTextFromNode = (node) => {
            if (node.kind === '#text') return adaptor.value(node)?.trim() || '';
            if (!node.children) return '';
            return node.children.map(extractTextFromNode).join(' ').trim();
        };

        // Convert parsed table to 2D array
        const tableHead = [];
        const tableRows = [];

        item.children?.forEach((section) => {
            if (section.kind === 'tbody' || section.kind === 'thead') {
                section.children?.forEach((tr, rowIndex) => {
                    const row = tr.children?.map((td) => extractTextFromNode(td)) || [];
                    if (rowIndex === 0) {
                        tableHead.push(...row);
                    } else {
                        tableRows.push(row);
                    }
                });
            }
        });

        const widthArr = getDynamicColumnWidths(tableHead, tableRows);
        const totalWidth = widthArr.reduce((sum, w) => sum + w, 0);

        return (
            <View>
                <ScrollView horizontal>
                    <View style={{ width: totalWidth }}>
                        <Table borderStyle={{ borderWidth: 1, borderColor: '#ccc' }}>
                            {tableHead.length > 0 && (
                                <Row
                                    data={tableHead}
                                    widthArr={widthArr}
                                    style={{ backgroundColor: '#eee', borderColor: '#ccc',borderRightWidth: 2}}
                                    textStyle={{ fontWeight: 'bold', textAlign: 'center' }}
                                />
                            )}
                            <Rows
                                data={tableRows}
                                widthArr={widthArr}
                                style={{ borderColor: '#ccc', borderRightWidth: 2,}}
                                textStyle={{ textAlign: 'center', flexWrap: 'wrap' }}
                            />
                        </Table>
                    </View>
                </ScrollView>
            </View>

        );
    }



    return (
        <Fragment>
            {
                text ?
                    (
                        <Text style={{ fontSize: (fontSize * 2), color, ...rnStyle }}>{text}</Text>
                    )
                    :
                    isImage ? (
                        <AutoHeightImage source={{uri: imageSource}} width={responsiveWidth(65)}/>
                    ) : (
                        item?.kind === 'mjx-container' ?
                            <GenerateSvgComponent item={item} fontSize={fontSize} color={color}/>
                            :
                            (
                                item.children?.length ?
                                    (
                                        item.children.map((subItem, subIndex) => (
                                            <GenerateTextComponent key={`sub-${index}-${subIndex}`} color={color} fontSize={fontSize} item={subItem} index={subIndex} parentStyle={rnStyle}/>
                                        ))
                                    )
                                    : null
                            )
                    )
            }
        </Fragment>
    );
};

const ConvertToComponent = ({ texString = '', fontSize = 12, fontCache = false, color }) => {

    if (!texString) {
        return '';
    }

    const tex = new TeX({
        packages: packageList,
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
    });

    const svg = new SVG({
        fontCache: fontCache ? 'local' : 'none',
        mtextInheritFont: true,
        merrorInheritFont: true,
    });

    const html = mathjax.document(texString, { InputJax: tex, OutputJax: svg, renderActions: { assistiveMml: [] } });

    html.render();

    if (Array.from(html.math).length === 0) {
        adaptor.remove(html.outputJax.svgStyles);
        const cache = adaptor.elementById(adaptor.body(html.document), 'MJX-SVG-global-cache');
        if (cache) adaptor.remove(cache);
    }

    const nodes = adaptor.childNodes(adaptor.body(html.document));

    return (
        <Fragment>
            {
                nodes?.map((item, index) => (
                    <GenerateTextComponent key={index} item={item} index={index} fontSize={fontSize} color={color}/>
                ))
            }
        </Fragment>
    );
};

export const MathJaxSvg = memo((props) => {
    const textext = props.children || '';
    const fontSize = props.fontSize ? props.fontSize / 2 : 14;
    const color = props.color ? props.color : 'black';
    const fontCache = props.fontCache;
    const style = props.style ? props.style : null;

    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flexShrink: 1, ...style }}>
            {
                textext ? (
                    <ConvertToComponent fontSize={fontSize} color={color} texString={textext} fontCache={fontCache}/>
                ) : null
            }
        </View>
    );
});
