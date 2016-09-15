import { isString, sanitise, isValue } from './util';
import { CLASS } from './class';
import { c3_chart_internal_fn } from './index';

const initTooltip = function () {
    let $$ = this, config = $$.config, i;
    $$.tooltip = $$.selectChart
        .style('position', 'relative')
      .append('div')
        .attr('class', CLASS.tooltipContainer)
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('display', 'none');
    // Show tooltip if needed
    if (config.tooltip_init_show) {
        if ($$.isTimeSeries() && isString(config.tooltip_init_x)) {
            config.tooltip_init_x = $$.parseDate(config.tooltip_init_x);
            for (i = 0; i < $$.data.targets[0].values.length; i++) {
                if (($$.data.targets[0].values[i].x - config.tooltip_init_x) === 0) { break; }
            }
            config.tooltip_init_x = i;
        }
        $$.tooltip.html(config.tooltip_contents.call($$, $$.data.targets.map((d) => {
            return $$.addName(d.values[config.tooltip_init_x]);
        }), $$.axis.getXAxisTickFormat(), $$.getYFormat($$.hasArcType()), $$.color));
        $$.tooltip.style('top', config.tooltip_init_position.top)
            .style('left', config.tooltip_init_position.left)
            .style('display', 'block');
    }
};
const getTooltipContent = function (d, defaultTitleFormat, defaultValueFormat, color) {
    let $$ = this, config = $$.config,
        titleFormat = config.tooltip_format_title || defaultTitleFormat,
        nameFormat = config.tooltip_format_name || function (name) { return name; },
        valueFormat = config.tooltip_format_value || defaultValueFormat,
        text, i, title, value, name, bgcolor,
        orderAsc = $$.isOrderAsc();

    if (config.data_groups.length === 0) {
        d.sort((a, b) => {
            let v1 = a ? a.value : null, v2 = b ? b.value : null;
            return orderAsc ? v1 - v2 : v2 - v1;
        });
    } else {
        const ids = $$.orderTargets($$.data.targets).map((i) => {
            return i.id;
        });
        d.sort((a, b) => {
            let v1 = a ? a.value : null, v2 = b ? b.value : null;
            if (v1 > 0 && v2 > 0) {
                v1 = a ? ids.indexOf(a.id) : null;
                v2 = b ? ids.indexOf(b.id) : null;
            }
            return orderAsc ? v1 - v2 : v2 - v1;
        });
    }

    for (i = 0; i < d.length; i++) {
        if (!(d[i] && (d[i].value || d[i].value === 0))) { continue; }

        if (!text) {
            title = sanitise(titleFormat ? titleFormat(d[i].x) : d[i].x);
            text = "<table class='" + $$.CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + '</th></tr>' : '');
        }

        value = sanitise(valueFormat(d[i].value, d[i].ratio, d[i].id, d[i].index, d));
        if (value !== undefined) {
            // Skip elements when their name is set to null
            if (d[i].name === null) { continue; }
            name = sanitise(nameFormat(d[i].name, d[i].ratio, d[i].id, d[i].index));
            bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

            text += "<tr class='" + $$.CLASS.tooltipName + '-' + $$.getTargetSelectorSuffix(d[i].id) + "'>";
            text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + '</td>';
            text += "<td class='value'>" + value + '</td>';
            text += '</tr>';
        }
    }
    return text + '</table>';
};
const tooltipPosition = function (dataToShow, tWidth, tHeight, element) {
    let $$ = this, config = $$.config, d3 = $$.d3;
    let svgLeft, tooltipLeft, tooltipRight, tooltipTop, chartRight;
    let forArc = $$.hasArcType(),
        mouse = d3.mouse(element);
  // Determin tooltip position
    if (forArc) {
        tooltipLeft = (($$.width - ($$.isLegendRight ? $$.getLegendWidth() : 0)) / 2) + mouse[0];
        tooltipTop = ($$.height / 2) + mouse[1] + 20;
    } else {
        svgLeft = $$.getSvgLeft(true);
        if (config.axis_rotated) {
            tooltipLeft = svgLeft + mouse[0] + 100;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = $$.x(dataToShow[0].x) + 20;
        } else {
            tooltipLeft = svgLeft + $$.getCurrentPaddingLeft(true) + $$.x(dataToShow[0].x) + 20;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = svgLeft + $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = mouse[1] + 15;
        }

        if (tooltipRight > chartRight) {
            // 20 is needed for Firefox to keep tooltip width
            tooltipLeft -= tooltipRight - chartRight + 20;
        }
        if (tooltipTop + tHeight > $$.currentHeight) {
            tooltipTop -= tHeight + 30;
        }
    }
    if (tooltipTop < 0) {
        tooltipTop = 0;
    }
    return { top: tooltipTop, left: tooltipLeft };
};
const showTooltip = function (selectedData, element) {
    let $$ = this, config = $$.config;
    let tWidth, tHeight, position;
    let forArc = $$.hasArcType(),
        dataToShow = selectedData.filter((d) => { return d && isValue(d.value); }),
        positionFunction = config.tooltip_position || c3_chart_internal_fn.tooltipPosition;
    if (dataToShow.length === 0 || !config.tooltip_show) {
        return;
    }
    $$.tooltip.html(config.tooltip_contents.call($$, selectedData, $$.axis.getXAxisTickFormat(), $$.getYFormat(forArc), $$.color)).style('display', 'block');

    // Get tooltip dimensions
    tWidth = $$.tooltip.property('offsetWidth');
    tHeight = $$.tooltip.property('offsetHeight');

    position = positionFunction.call(this, dataToShow, tWidth, tHeight, element);
    // Set tooltip
    $$.tooltip
        .style('top', position.top + 'px')
        .style('left', position.left + 'px');
};
const hideTooltip = function () {
    this.tooltip.style('display', 'none');
};

export {
    initTooltip,
    getTooltipContent,
    tooltipPosition,
    showTooltip,
    hideTooltip,
};