(function($w){

    let $defaultOptions = {
        // footer内容
        footer: '',
        showFooter: true,
        language: 'zh-cn',
        // 工作区比例 默认 1
        areaRatio: 1,
        // 流程图标题
        title: 'Smtflow 1.0',
        // 连线类型 line:直线；polyline:折线
        lineType: 'line',
        // 是否可编辑
        editable: true,
        // 显示节点标题
        showNodeTitle: true,
        // 缩略图
        thumbnail: false,
        tools: [],
        // 设置不显示右键菜单的节点
        noMenuNode: ['start', 'end'],
        // 节点盒子
        nodebox: true,
        // 点击新建按钮
        onClickNew() {},
        // 点击打开按钮
        onClickOpen() {},
        // 点击保存按钮
        onClickSave(data) {},
        // 删除节点事件
        onRemoveNode(id, type, title, value) {},
        // 菜单设置节点
        onSettingNode(id, type, title, value) {},
        // 双击节点
        onDblclick(id, type, title, value) {},
        // 新增节点触发
        onAddNode(type) {},
        // 新增连线触发
        onAddLine(fromDot, toDot){},
        // 加载完成
        onLoadSuccess() {}
    };
    // 内部变量
    const $var = {
        $flow: null,
        $title: null,
        $editable: true,
        $showNodeTitle: true,
        $thumbnail: null,
        $workarea: null,
        $msgTimer: null,
        $svg: null,
        $tempBox: null,
        $nodeBox: null,
        $lineBox: null,
        $focusNode: null,
        $focusLine: null,
        $lineType: null,
        $shadow: null,
        $nodeDot: null,
        $lineTool: null,
        $menu: null,
        $titleIpt: null,
        $headerIpt: null,
        $actCache: [],
        $cacheIdx: 0,
        $startId: 100,
        $cache:{}
    };
    // 常量
    const $const = {
        $version: '<a target="_blank" href="https://www.smtflow.com">Smtflow 1.0</a>',
        $domain: 'Smtflow.com',
        $nodeWidth: 46,
        $nodeHeight: 46,
        $lineToolWidth: 80,
        $lineToolHeight: 20,
        $lineTitleWidth: 100,
        // 起止点距离node的最小距离
        $minDotLen: 20,
        $nodeDotSize: 12,
        $lineRadius: 3.5,
        $elns: 'http://www.w3.org/2000/svg',
        $xlink: 'http://www.w3.org/1999/xlink'
    };
    $const.$nodeStyle={rx:12,width:$const.$nodeWidth+'px', height:$const.$nodeHeight+'px',fill:'#d9e8fb',stroke:'#397a9c','stroke-width':1.2,'shape-rendering':'geometricPrecision'};
    $const.$lineStyle={stroke:'#1296db','stroke-width':2,'stroke-linecap':'round','marker-end':'url(#arrow)',fill:'none'};
    $const.$shadowStyle={stroke:'transparent','stroke-width':10,fill:'none'};
    const $fun = {
        // $c
        $icon(options, fn) {
            let iconUrl = options.url;
            let icon = options.icon;
            if(fn) {
                $dom.a({
                    url: iconUrl || './themes/icons/' + icon + '.svg',
                    dataType: 'text',
                    success(data) {
                        let base64 = 'data:image/svg+xml;base64,' + window.btoa(data);
                        fn(base64);
                    }
                });
                return false;
            }
            return iconUrl || './themes/icons/' + icon + '.svg';
        },
        // $g
        $getId: type => (type || 'X') + Number(Math.floor(new Date().getTime() / 1000) + '' + ($var.$startId ++)).toString(36).toUpperCase(),
        // $s
        $nodeXyScope(x, y) {
            let w = $var.$workarea;
            let woft = w.offset();
            // svg 坐标加 0.5 更清晰
            let pixel = 0.5;
            x = x + pixel;
            y = y + pixel;
            x = (x < 0 ? pixel : x);
            y = (y < 0 ? pixel : y);
            let maxX = woft.width - $const.$nodeWidth - pixel;
            let maxY = woft.height - $const.$nodeHeight - pixel;
            x = (x > maxX) ? maxX: x;
            y = (y > maxY) ? maxY: y;
            return {x: x, y: y};
        },
        // $d
        $dotPos(dotType, pos, e) {
            e = e || event;
            let x = e.offsetX;
            let y = e.offsetY;
            if(dotType == 'top') {
                x = pos.x + $const.$nodeWidth / 2;
                y = pos.y;
            }
            else if(dotType == 'right') {
                x = pos.x + $const.$nodeWidth;
                y = pos.y + $const.$nodeHeight / 2;
            }
            else if(dotType == 'bottom') {
                x = pos.x + $const.$nodeWidth / 2;
                y = pos.y + $const.$nodeHeight;
            }
            else if(dotType == 'left') {
                x = pos.x;
                y = pos.y + $const.$nodeHeight / 2;
            }
            return {x: x, y: y};
        },        
        // 连线计算引擎
        // $l 左上右下（左上为from 右下为to）
        $lurbPoints(
            minDotLen,
            fromDot, toDot, fromPoints, toPoints,
            fromX, fromY, toX, toY,
            fromTopY, fromRightX, fromBottomY, fromLeftX,
            toTopY, toBottomY, toRightX, toLeftX,
            halfX, halfY,
            reverse
        ) {
            let points = [];
            if(fromDot == 'top') {
                points.push(fromX + ',' + fromTopY);
                if(toDot == 'top') {
                    points.push(toX + ',' + fromTopY);
                }
                else if(toDot == 'right') {
                    points.push(toRightX + ',' + fromTopY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    points.push(halfX + ',' + fromTopY);
                    points.push(halfX + ',' + toBottomY);
                    points.push(toX + ',' + toBottomY);
                }
                else if(toDot == 'left') {
                    if(toLeftX < halfX) {
                        points.push(toLeftX + ',' + fromTopY);
                        points.push(toLeftX + ',' + toY);
                    }
                    else {
                        points.push(halfX + ',' + fromTopY);
                        points.push(halfX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'right') {
                if(toDot == 'top') {
                    if(toTopY < fromY) {
                        if(halfX < fromRightX) {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + toTopY);
                            points.push(toX + ',' + toTopY);
                        }
                        else {
                            points.push(halfX + ',' + fromY);
                            points.push(halfX + ',' + toTopY);
                            points.push(toX + ',' + toTopY);
                        }
                    }
                    else if(toX < fromRightX) {
                        if(toTopY < halfY) {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + toTopY);
                            points.push(toX + ',' + toTopY);
                        }
                        else {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + halfY);
                            points.push(toX + ',' + halfY);
                        }
                    }
                    else {
                        points.push(toX + ',' + fromY);
                    }
                }
                else if(toDot == 'right') {
                    points.push(toRightX + ',' + fromY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    if(halfX < fromRightX) {
                        points.push(fromRightX + ',' + fromY);
                        points.push(fromRightX + ',' + toBottomY);
                        points.push(toX + ',' + toBottomY);
                    }
                    else {
                        points.push(halfX + ',' + fromY);
                        points.push(halfX + ',' + toBottomY);
                        points.push(toX + ',' + toBottomY);
                    }
                }
                else if(toDot == 'left') {
                    if(toLeftX < fromRightX) {
                        points.push(fromRightX + ',' + fromY);
                        points.push(fromRightX + ',' + halfY);
                        points.push(toLeftX + ',' + halfY);
                        points.push(toLeftX + ',' + toY);
                    }
                    else {    
                        points.push(halfX + ',' + fromY);
                        points.push(halfX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'bottom') {
                if(toDot == 'top') {
                    if(toTopY < fromBottomY) {
                        points.push(fromX + ',' + fromBottomY);
                        points.push(halfX + ',' + fromBottomY);
                        points.push(halfX + ',' + toTopY);
                        points.push(toX + ',' + toTopY);
                    }
                    else {
                        points.push(fromX  + ',' + halfY);
                        points.push(toX + ',' + halfY);
                    }
                }
                else if(toDot == 'right') {
                    if(halfY < fromBottomY) {
                        points.push(fromX + ',' + fromBottomY);
                        points.push(toRightX + ',' + fromBottomY);
                        points.push(toRightX + ',' + toY);
                    }
                    else {
                        points.push(fromX + ',' + halfY);
                        points.push(toRightX + ',' + halfY);
                        points.push(toRightX + ',' + toY);
                    }
                }
                else if(toDot == 'bottom') {
                    points.push(fromX + ',' + toBottomY);
                    points.push(toX + ',' + toBottomY);
                }
                else if(toDot == 'left') {
                    if(toLeftX < fromX) {
                        if(halfY < fromBottomY) {
                            points.push(fromX + ',' + fromBottomY);
                            points.push(toLeftX + ',' + fromBottomY);
                            points.push(toLeftX + ',' + toY);
                        }
                        else {
                            points.push(fromX + ',' + halfY);
                            points.push(toLeftX + ',' + halfY);
                            points.push(toLeftX + ',' + toY);
                        }
                    }
                    else if(toY < fromBottomY) {
                        if(toLeftX < halfX) {
                            points.push(fromX + ',' + fromBottomY);
                            points.push(toLeftX + ',' + fromBottomY);
                            points.push(toLeftX + ',' + toY);
                        }
                        else {
                            points.push(fromX + ',' + fromBottomY);
                            points.push(halfX + ',' + fromBottomY);
                            points.push(halfX + ',' + toY);
                        }
                    }
                    else {
                        points.push(fromX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'left') {
                if(toDot == 'top') {
                    if(toTopY < halfY) {
                        points.push(fromLeftX + ',' + fromY);
                        points.push(fromLeftX + ',' + toTopY);
                        points.push(toX + ',' + toTopY);
                    }
                    else {
                        points.push(fromLeftX + ',' + fromY);
                        points.push(fromLeftX + ',' + halfY);
                        points.push(toX + ',' + halfY);
                    }
                }
                else if(toDot == 'right') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + halfY);
                    points.push(toRightX + ',' + halfY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + toBottomY);
                    points.push(toX + ',' + toBottomY);
                }
                else if(toDot == 'left') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + toY);
                }
            }
            return points;
        },
        // $r 左下右上(左下为from 右上为to)
        $rulbPoints(
            minDotLen,
            fromDot, toDot, fromPoints, toPoints,
            fromX, fromY, toX, toY,
            fromTopY, fromRightX, fromBottomY, fromLeftX,
            toTopY, toBottomY, toRightX, toLeftX,
            halfX, halfY,
            reverse
        ) {
            let points = [];
            if(fromDot == 'top') {
                if(toDot == 'top') {
                    points.push(fromX + ',' + toTopY);
                    points.push(toX + ',' + toTopY);
                }
                else if(toDot == 'right') {
                    if(fromTopY < halfY) {
                        points.push(fromX + ',' + fromTopY);
                        points.push(toRightX + ',' + fromTopY);
                        points.push(toRightX + ',' + toY);
                    }
                    else {
                        points.push(fromX + ',' + halfY);
                        points.push(toRightX + ',' + halfY);
                        points.push(toRightX + ',' + toY);
                    }
                }
                else if(toDot == 'bottom') {
                    if(fromTopY < toBottomY) {
                        points.push(fromX + ',' + fromTopY);
                        points.push(halfX + ',' + fromTopY);
                        points.push(halfX + ',' + toBottomY);
                        points.push(toX + ',' + toBottomY);
                    }
                    else {
                        points.push(fromX + ',' + halfY);
                        points.push(toX + ',' + halfY);
                    }
                }
                else if(toDot == 'left') {
                    if(toLeftX < fromX) {
                        if(fromTopY < halfY) {
                            points.push(fromX + ',' + fromTopY);
                            points.push(toLeftX + ',' + fromTopY);
                            points.push(toLeftX + ',' + toY);
                        }
                        else {
                            points.push(fromX + ',' + halfY);
                            points.push(toLeftX + ',' + halfY);
                            points.push(toLeftX + ',' + toY);
                        }
                    }
                    else if(fromTopY < toY) {
                        if(toLeftX < halfX) {
                            points.push(fromX + ',' + fromTopY);
                            points.push(toLeftX + ',' + fromTopY);
                            points.push(toLeftX + ',' + toY);
                        }
                        else {
                            points.push(fromX + ',' + fromTopY);
                            points.push(halfX + ',' + fromTopY);
                            points.push(halfX + ',' + toY);
                        }
                    }
                    else {
                        points.push(fromX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'right') {
                if(toDot == 'top') {
                    if(halfX < fromRightX) {
                        points.push(fromRightX + ',' + fromY);
                        points.push(fromRightX + ',' + toTopY);
                        points.push(toX + ',' + toTopY);
                    }
                    else {
                        points.push(halfX + ',' + fromY);
                        points.push(halfX + ',' + toTopY);
                        points.push(toX + ',' + toTopY);
                    }
                }
                else if(toDot == 'right') {
                    points.push(toRightX + ',' + fromY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    if(fromY < toBottomY) {
                        if(halfX < fromRightX) {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + toBottomY);
                            points.push(toX + ',' + toBottomY);
                        }
                        else {
                            points.push(halfX + ',' + fromY);
                            points.push(halfX + ',' + toBottomY);
                            points.push(toX + ',' + toBottomY);
                        }
                    }
                    else if(toX < fromRightX) {
                        if(halfY < toBottomY) {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + toBottomY);
                            points.push(toX + ',' + toBottomY);
                            
                        }
                        else {
                            points.push(fromRightX + ',' + fromY);
                            points.push(fromRightX + ',' + halfY);
                            points.push(toX + ',' + halfY);
                        }
                    }
                    else {
                        points.push(toX + ',' + fromY);
                    }
                }
                else if(toDot == 'left') {
                    if(toLeftX < fromRightX) {
                        points.push(fromRightX + ',' + fromY);
                        points.push(fromRightX + ',' + halfY);
                        points.push(toLeftX + ',' + halfY);
                        points.push(toLeftX + ',' + toY);
                    }
                    else {
                        points.push(halfX + ',' + fromY);
                        points.push(halfX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'bottom') {
                if(toDot == 'top') {
                    points.push(fromX + ',' + fromBottomY);
                    points.push(halfX + ',' + fromBottomY);
                    points.push(halfX + ',' + toTopY);
                    points.push(toX + ',' + toTopY);
                }
                else if(toDot == 'right') {
                    points.push(fromX + ',' + fromBottomY);
                    points.push(toRightX + ',' + fromBottomY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    points.push(fromX + ',' + fromBottomY);
                    points.push(toX + ',' + fromBottomY);
                }
                else if(toDot == 'left') {
                    if(toLeftX < halfX) {
                        points.push(fromX + ',' + fromBottomY);
                        points.push(toLeftX + ',' + fromBottomY);
                        points.push(toLeftX + ',' + toY);
                    }
                    else {
                        points.push(fromX + ',' + fromBottomY);
                        points.push(halfX + ',' + fromBottomY);
                        points.push(halfX + ',' + toY);
                    }
                }
            }
            else if(fromDot == 'left') {
                if(toDot == 'top') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + halfY);
                    points.push(fromLeftX + ',' + toTopY);
                    points.push(toX + ',' + toTopY);
                }
                else if(toDot == 'right') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + halfY);
                    points.push(toRightX + ',' + halfY);
                    points.push(toRightX + ',' + toY);
                }
                else if(toDot == 'bottom') {
                    if(halfY < toBottomY) {
                        points.push(fromLeftX + ',' + fromY);
                        points.push(fromLeftX + ',' + toBottomY);
                        points.push(toX + ',' + toBottomY);
                    }
                    else {
                        points.push(fromLeftX + ',' + fromY);
                        points.push(fromLeftX + ',' + halfY);
                        points.push(toX + ',' + halfY);
                    }
                }
                else if(toDot == 'left') {
                    points.push(fromLeftX + ',' + fromY);
                    points.push(fromLeftX + ',' + toY);
                }
            }
            return points;
        },
        // $p
        $linePoints(line, points) {
            points = points || {};
            let lineType = line.data('type');
            // 移动时一个点为固定点 传的值即为移动计算的值
            let fromPoints = points.fromPoints || line.data('fromPoints');
            let toPoints = points.toPoints || line.data('toPoints');
            let getPositionType = (line) => {
                let fromNodePos = line.data('from').data('pos');
                let toNodePos = line.data('to').data('pos');
                // 根据两节点坐标 计算各自方位
                let type = 'x';
                // 左上
                if(fromNodePos.x <= toNodePos.x && fromNodePos.y <= toNodePos.y) {
                    type = 'a';
                }
                // 右下
                else if(fromNodePos.x >= toNodePos.x && fromNodePos.y >= toNodePos.y) {
                    type = 'b';
                }
                // 左下
                else if(fromNodePos.x <= toNodePos.x && fromNodePos.y >= toNodePos.y) {
                    type = 'c';
                }
                // 右上
                else if(fromNodePos.x >= toNodePos.x && fromNodePos.y <= toNodePos.y) {
                    type = 'd';
                }
                return type;
            };
            let linePath = (t, positionType) => {
                if(t == 'polyline') {
                    let fromDot = line.data('fromDot');
                    let toDot = line.data('toDot');
                    let tempFromPoints = fromPoints;
                    let tempToPoints = toPoints;
                    let reverse = false;
                    // 右下或右上 开始结束节点反转 计算连线路径
                    // 得出连线路径结果后再反转 得出真实路径
                    // 逻辑：开始和结束节点的连线路径相同只是方向不同
                    if(['b', 'd'].indexOf(positionType) != -1) {
                        let tempDotType = fromDot;
                        fromDot = toDot;
                        toDot = tempDotType;
                        tempFromPoints = toPoints;
                        tempToPoints = fromPoints;
                        reverse = true;
                    }
                    let fromX = parseFloat(tempFromPoints[0]);
                    let fromY = parseFloat(tempFromPoints[1]);
                    let toX = parseFloat(tempToPoints[0]);
                    let toY = parseFloat(tempToPoints[1]);
                    // 避免连线贴在节点上 四个方位点各加一定距离
                    let minDotLen = $const.$minDotLen;
                    let fromTopY = fromY - minDotLen;
                    let fromRightX = fromX + minDotLen;
                    let fromBottomY = fromY + minDotLen;
                    let fromLeftX = fromX - minDotLen;
                    let toTopY = toY - minDotLen;
                    let toBottomY = toY + minDotLen;
                    let toRightX = toX + minDotLen;
                    let toLeftX = toX - minDotLen;
                    // 两节点间的x y的中间值
                    let halfX = (fromX + toX) /2;
                    let halfY = (fromY + toY) /2;
                    // 根据方位调用不同方法
                    let pointsArr = $fun[(['a', 'b'].indexOf(positionType) != -1)?'$lurbPoints':'$rulbPoints'](
                                minDotLen,
                                fromDot, toDot, tempFromPoints, tempToPoints,
                                fromX, fromY, toX, toY,
                                fromTopY, fromRightX, fromBottomY, fromLeftX,
                                toTopY, toBottomY, toRightX, toLeftX,
                                halfX, halfY,
                                reverse
                            );
                    // 是否反转连线
                    pointsArr = reverse ? pointsArr.reverse(): pointsArr;
                    return pointsArr;
                }
                else return [];
            };
            let positionType = getPositionType(line);
            // 直线和折线开始和结束点位置不变
            return $fun.$returnLine(lineType, fromPoints, toPoints, linePath(lineType, positionType), positionType);
        },
        // 
        $returnLine: (lineType, fromPoints, toPoints, linePath, positionType) => {
            if(lineType === 'polyline') {
                return 'M ' + fromPoints.join(',').concat(' ').concat(linePath.join(' ').concat(' ')).concat(toPoints.join(','));
            }
            else {
                return 'M ' + fromPoints.join(',').concat(' ').concat(toPoints.join(','));
            }
        },
        // order 线的方向或顺序 上到下为正，下到上为反 1: 正 0: 反
        // type 按照四边形的四个角为方位 顺时针从左上开始 分别为 1: 左上 2: 右上 3: 右下 4: 左下
        $getNewLine: (x , y, order, type, newLine, reverse) => {
            let lr = $const.$lineRadius;
            // 弧形开始结束的两个点的坐标
            let x1 = x, y1 = y,x2 = x,y2 = y;
            if(type == 1) {
                if(order == 1) {
                    x1 = x1 + lr;
                    y2 = y2 + lr;
                }
                else {
                    y1 = y1 + lr;
                    x2 = x2 + lr;
                }
            }
            else if(type == 2) {
                if(order == 1) {
                    x1 = x1 - lr;
                    y2 = y2 + lr;
                }
                else {
                    y1 = y1 + lr;
                    x2 = x2 - lr;
                }
            }
            else if(type == 3) {
                if(order == 1) {
                    y1 = y1 - lr;
                    x2 = x2 - lr;
                }
                else {
                    x1 = x1 - lr;
                    y2 = y2 - lr;
                }
            }
            else if(type == 4) {
                if(order == 1) {
                    y1 = y1 - lr;
                    x2 = x2 + lr;
                }
                else {
                    x1 = x1 + lr;
                    y2 = y2 - lr;
                }
            }
            if(reverse) newLine.push('L');
            newLine.push(`${x1},${y1}`);
            newLine.push(`Q ${x},${y}`);
            newLine.push(`${x2},${y2}`);
            if(!reverse) newLine.push('L');
        },
        // 下载
        $downLoad(url, name) {
            let l = $dom('<a>', {download: name, style: 'display:none', href: url})
                .appendTo($dom(document.body));
            l.$el.click();
            l.remove();
        },
        // 图片资源路径
        $getDataURL(tilte, image, options) {
            let canvas= $dom('<canvas>', options);
            let ctx = canvas.$el.getContext("2d");
            ctx.drawImage(image, 0, 0, options.width, options.height);
            ctx.rect(0, 0, options.width, options.height);
            ctx.strokeStyle="#CCCCCC";
            ctx.stroke();
            ctx.fillStyle="rgba(69, 69, 69, 0.9)";
            ctx.font="20px 微软雅黑";
            ctx.fillText(tilte, 50, 50);
            ctx.fillStyle="rgba(136, 136, 136, 0.7)";
            ctx.font="italic 16px Georgia";
            ctx.fillText($const.$domain, options.width - 150, options.height -40);
            return canvas.$el.toDataURL('image/png');
        },
        // 图片资源编码
        $reEncode(data) {
            return decodeURIComponent(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (a, b) => {
                        const c = String.fromCharCode(`0x${b}`);
                        return c === '%' ? '%25' : c;
                    }));
        },
        // 缩略图
        $thumbnail() {
            if(!$var.$thumbnail) return;
            let offset = $var.$workarea.offset();
            let svgHtml = $var.$svg.html();
            let source = ['<svg xmlns="', $const.$elns, '" xmlns:xlink="', $const.$xlink,'" viewBox="0 0 ', offset.width, ' ', offset.height + '">', svgHtml, '</svg>'].join('');
            let base64 = 'data:image/svg+xml;base64,' + $w.btoa($fun.$reEncode(source));
            $var.$thumbnail.find('img').attr({'src':base64});
        },
        // 过滤数组排除重复元素
        $uniqueArray: (arr1, arr2) => arr1[0] == arr2[0] ? [arr1[1], arr2[1]]: [arr1[0], arr2[0]],
        // 计算数组差值
        $calcDiff: (array) => Math.abs(array[0] - array[1]),
        // 总体思路 把折线的每一小段长度累加 计算出中心点线的长度
        // 后每段比较最终找到落在的线 再计算出落在线上的坐标
        $polylineMiddleXy(linePoints) {
            const regex = /[-]?\d+(\.\d+)?,[-]?\d+(\.\d+)?/g;
            const pointsArr = linePoints.match(regex);
            if (pointsArr) {
                const pointsList = pointsArr.map(pair => {
                    let dotPoints = pair.split(',');
                    return [parseFloat(dotPoints[0], 10), parseFloat(dotPoints[1], 10)];
                });
                // 折线总长度
                let lineLength = 0;
                let diffArr = [];
                // 遍历点 计算连线长度
                for(let i = 0; i < pointsList.length - 1; i ++) {
                    // 点坐标
                    let current = pointsList[i];
                    // 下一点坐标
                    let next = pointsList[i + 1];
                    let uniqueArray = $fun.$uniqueArray(current, next);
                    // 两点之间长度
                    let diff = uniqueArray.length === 2 ? $fun.$calcDiff(uniqueArray): 0;
                    // 长度累加
                    lineLength = lineLength + diff;
                    diffArr.push(diff);
                }
                // 中间长度
                let middle = lineLength / 2;
                // 累计线长度
                lineLength = 0;
                let idx = 0;
                // 最终的中心点在线上的长度
                let lineMiddleLength = 0;
                // 计算中间位置
                for(let i = 0; i < diffArr.length; i ++) {
                    let diff = diffArr[i];
                    lineLength = lineLength + diff;
                    // 当累计线长度 大于中心线长度时
                    if(lineLength > middle) {
                        idx = i;
                        // 当前线长度 - (累计线长度 - 中心线长度)[差值] = 当前线剩余长度[当前线起始点 -> 中心点落在线上的位置点]
                        // 后续根据当前线坐标起始点 + 当前线剩余长度点位置 就等于 最终中心点坐标位置
                        lineMiddleLength = diff - (lineLength - middle);
                        break;
                    }
                }
                // 中心点应该落在的线
                let calcPoints = pointsList[idx];
                let nextPoints = pointsList[idx + 1];
                // 合并重复 计算出xy轴
                let xyArr = $fun.$uniqueArray(calcPoints, nextPoints);
                // 
                let middleX, middleY;
                // calcPoints[0] 为 x 剩余的如果是 X轴 那被合并的就是y轴
                if(xyArr[0] === calcPoints[0]) {
                    middleX = xyArr[0] + (xyArr[1] > xyArr[0] ? lineMiddleLength : -lineMiddleLength);
                    middleY = calcPoints[1]
                }
                else {
                    middleX = calcPoints[0];
                    middleY = xyArr[0] + (xyArr[1] > xyArr[0] ? lineMiddleLength : -lineMiddleLength);
                }                
                return {tx: middleX, ty: middleY + 4};
            }
        },
        // 计算连线标题坐标
        $calcLineTitleXy(from, to, linePoints, lineType) {
            if(lineType === 'line') {
                let tx = (parseFloat(from[0]) + parseFloat(to[0])) / 2;
                let ty = (parseFloat(from[1]) + parseFloat(to[1])) / 2 + 4;
                return {tx, ty};
            }
            else {                
                return $fun.$polylineMiddleXy(linePoints);
            }
        },
    };
    const $S = (e, o, ans) => {
        o = o || {};
        o.elns = $const.$elns;
        return $dom(e, o, ans);
    };
    const $smt = function(el, options, language) {
        this.language = language;
        this._(el, options);
    };
    $smt.prototype = {
        // u
        $btnArr() {
            let Ths = this;
            let btn = Ths.language.btn;
            return [
                {title: btn.nev, icon: 'ico_new', fn: 'onClickNew', impl: true},
                {title: btn.open, icon: 'ico_open', fn: 'onClickOpen', impl: true},
                {title: btn.save, icon: 'ico_save', fn: 'onClickSave', impl: true},
                {title: btn.undo, icon: 'ico_undo', fn: 'onClickUndo'},
                {title: btn.redo, icon: 'ico_redo', fn: 'onClickRedo'},
                {title: btn.download, icon: 'ico_download', fn: 'onClickDownloadImage'}
            ];
        },
        // v
        $toolsArr() {
            let Ths = this;
            let tool = Ths.language.tool;
            return [
                {title: tool.start, icon: 'start'},
                {title: tool.end, icon: 'end'},
                {type: 'separate'}
            ];
        },
        // w
        $menuArr() {
            let Ths = this;
            let menu = Ths.language.menu;
            return [
                {title: menu.remove, icon: 'remove', fn: (node) => {
                    Ths.delNode(node)
                }},
                {title: menu.setting, icon: 'setting', fn: (node) => {
                    const {type, title, value = null} = node.data();
                    Ths.$options.onSettingNode(node.attr('id'), type, title, value);
                }},
                {title: menu.cancel, icon: 'cancel'}
            ];
        },
        // O: 参数缓存
        $options: {},
        // $
        $fn: {
            // 初始化工作区
            onClickNew(fn) {
                let r = fn ? fn() : true;
                r = typeof(r) == 'boolean'? r : true;
                if(r) {
                    let Ths = this;
                    Ths.resetData(true);
                    let msg = Ths.language.msg;
                    Ths.$setMessage(msg.workspaceReset);
                    $fun.$thumbnail();
                }
            },
            // 导入工作区结构数据 传入JSON
            onClickOpen(fn) {
                let r = fn ? fn() : true;
            },
            // 保存工作区结构数据 返回JSON
            onClickSave(fn) {
                let Ths = this;
                let data = Ths.$getData();
                let r = fn ? fn(JSON.stringify(data)) : true;
            },
            // 返回
            onClickUndo() {
                let Ths = this;
                $var.$cacheIdx --;
                if($var.$cacheIdx < 0) {
                    let msg = Ths.language.msg;
                    Ths.$setMessage(msg.isFirstStep);
                }
                $var.$cacheIdx = $var.$cacheIdx < 0 ? 0 : $var.$cacheIdx;
                // 新增缓存时 $cacheIdx 已经加1 所有此处要减1
                let idx = $var.$cacheIdx - 1;
                let cacheData = $var.$actCache[idx];
                Ths.loaddata(cacheData);
                $fun.$thumbnail();
            },
            // 重置
            onClickRedo() {
                let Ths = this;
                let arrLen = $var.$actCache.length;
                $var.$cacheIdx ++;
                if($var.$cacheIdx > arrLen) {
                    let msg = Ths.language.msg;
                    Ths.$setMessage(msg.isLastStep);
                }
                $var.$cacheIdx = $var.$cacheIdx > arrLen ? arrLen : $var.$cacheIdx;
                // 新增缓存时 $cacheIdx 已经加1 所有此处要减1
                let idx = $var.$cacheIdx - 1;
                let cacheData = $var.$actCache[idx];
                Ths.loaddata(cacheData);
                $fun.$thumbnail();
            },
            // 将工作区保存为图片
            onClickDownloadImage() {
                let offset = $var.$workarea.offset();
                let options = {width: offset.width, height: offset.height};
                let svg = $var.$svg.cloneNode(true).attr(options);
                let source = new XMLSerializer().serializeToString(svg.$el);
                let base64 = 'data:image/svg+xml;base64,' + $w.btoa($fun.$reEncode(source));
                let image = new Image();
                image.src = base64;
                image.onload = () =>  {
                    let dataUrl = $fun.$getDataURL($var.$title, image, options);
                    $fun.$downLoad(dataUrl, $var.$title + '.png');
                }
            }
        },
        // _
        _($el, options) {
            let Ths = this;
            Ths.$options = options;
            Ths.init($dom($el), options);
            
            Ths.$setTitle(options.title);
            Ths.$setLineType(options.lineType);
            Ths.$setEditable(options.editable);
            Ths.$setShowNodeTitle(options.showNodeTitle);
            $w.ondragstart=() => {return false;};
            $w.oncontextmenu = () => {return false;};
            $var.$flow.bind('mousedown', () =>  {
                Ths.resetTool(false);
            }).bind('mousedown', () =>  {
                Ths.resetTool(true);
            }, false, true);
        
            let disable = (e) => {
                !$var.$editable ? (e||event).stopPropagation(): null;
            };
            $var.$flow.bind('click', disable, true, true)
                .bind('dblclick', disable, true, true)
                .bind('mousedown', disable, true, true)
                .bind('mouseup', disable, true, true)
                .bind('mousemove', disable, true, true)
                .bind('mouseover', disable, true, true)
                .bind('mouseout', disable, true, true);
            Ths.loadIcons(options);
            
            if(options.thumbnail) {
                let resetView = (view, s, height, width, offsetHeight, offsetWidth) => {
                    let top = s.get('scrollTop');
                    let left = s.get('scrollLeft');
                    view.css({
                        top: (height * top / offsetHeight) + 'px',
                        left: (width * left / offsetWidth) + 'px'
                    });
                };
                let resetThumbnail = () =>  {
                    let w = $var.$workarea;
                    let s = w.parent();
                    let t = $var.$thumbnail;
                    let wOffset = w.offset();
                    let width = t.offset().width;
                    let height = width / (wOffset.width / wOffset.height);
                    let imgWidth = width / options.areaRatio;
                    let imgHeight = height / options.areaRatio;
                    t.css({
                        height: height + 'px'
                    });
                    let view = t.find('div');
                    view.css({
                        width: imgWidth + 'px',
                        height: imgHeight + 'px'
                    }).bind('mousedown', (de) => {
                        let startX = de.pageX;
                        let startY = de.pageY;
                        let sTop = view.get('offsetTop');
                        let sLeft = view.get('offsetLeft');
                        let thumbnailMove = (me) => {
                            let top = sTop + me.pageY - startY;
                            top = top < 0 ? 0: top;
                            top = top + imgHeight > height ? height - imgHeight: top;
                            let left = sLeft + me.pageX - startX;
                            left = left < 0 ? 0: left;
                            left = left + imgWidth > width ? width - imgWidth: left;
                            view.css({
                                top: top + 'px',
                                left: left + 'px'
                            });
                            s.set('scrollTop', top * (wOffset.height / height));
                            s.set('scrollLeft', left * (wOffset.width / width));
                        };
                        $dom($w).bind('mousemove', thumbnailMove).bind('mouseup', () => {
                            $dom($w).unbind('mousemove', thumbnailMove);
                        })
                    });
                    s.bind('scroll', () => {
                        resetView(view, s, height, width, wOffset.height, wOffset.width);
                    }, true);
                    resetView(view, s, height, width, wOffset.height, wOffset.width);
                };
                let debounceTimer = null;
                $dom($w).bind('resize', () => {
                    $fun.$thumbnail();
                    resetThumbnail();
                });
                resetThumbnail();
                $fun.$thumbnail();
            }
            options.onLoadSuccess ? options.onLoadSuccess() :null;
        },
        // a
        init(el, options) {
            let Ths = this;
            let h = Ths.crHeader();
            let s = Ths.crSection(options);
            let a = Ths.crAside();
            let showFooter = options.showFooter;
            let footer = options.footer;
            let f = showFooter ? $dom('<footer>', {class: 'footer'}).append($dom('<span>').html(footer))
                .append($dom('<span>', {class:'ver'}).html($const.$version)): null;
            showFooter ? s.css({'margin-bottom':'30px'}): null;
            let m = $dom('<div>', {class: 'msg'}).append($dom('<span>'));
            let t = $var.$thumbnail = (options.thumbnail ?$dom('<div>', {class: 'thumbnail'}).append('img').append('div'):null);
            $var.$flow = $dom('<div>', {id: $fun.$getId('F'), class: 'smtflow'})
                .append(h)
                .append(a)
                .append(s)
                .append(f)
                .append(m)
                .append(t)
                .appendTo(el);
        },
        // b
        resetTool(capture, o) {
            if(capture) {
                $var.$menu.hide();
                $var.$lineTool.hide();
            }
            else {
                let Ths = this;
                $var.$focusLine ? $var.$focusLine.removeCls('focus'): null;
                $var.$focusLine = null;
                $var.$headerIpt ? $var.$headerIpt.remove() : null;
                $var.$headerIpt = null;
                $var.$titleIpt.hide();
                if(($var.$focusNode && !o) || ($var.$focusNode && o && $var.$focusNode !== o.node)) {
                    $var.$focusNode.removeCls('focus');
                    $var.$focusNode = null;
                }
                if(typeof(o) == 'undefined') Ths.setNodeDot(false);
            }
        },
        // c: 清空数据
        resetData(clearCache) {
            // 是否清理缓存 返回或重置时调用初始化不清除缓存
            if(typeof(clearCache) == 'undefined' || clearCache) {
                $var.$actCache = [];
                $var.$cacheIdx = 0;
            }
            let Ths = this;
            let options = Ths.$options;
            // 可通过方法动态调整
            Ths.$setTitle(options.title);
            Ths.$setEditable(options.editable);
            Ths.$setLineType(options.lineType);
            Ths.$setShowNodeTitle(options.showNodeTitle);
            // 内部赋值
            $var.$startId = 100;
            $var.$focusNode = null;
            $var.$focusLine = null;
            $var.$flow.attr('id', $fun.$getId('F'));
            let lines = $var.$lineBox.find('g.line');                
            lines = !!lines.$el ? [lines.$el]: lines;
            for(let i =0; i < lines.length; i ++) {
                lines[i].remove();
            }
            let nodes = $var.$nodeBox.find('g.node');
            nodes = !!nodes.$el ? [nodes.$el]: nodes;
            for(let i =0; i < nodes.length; i ++) {
                nodes[i].remove();
            }
        },
        // d
        recordCache(eventName) {
            let Ths = this;
            let data = Ths.$getData();
            let idx = $var.$cacheIdx;
            $var.$actCache[idx] = data;
            // 返回后再记录缓存 大于$var.$cacheIdx的缓存清除
            let len = $var.$actCache.length;
            if(len > idx + 1) {
                $var.$actCache.splice(idx + 1, len);
            }
            $var.$cacheIdx ++;
            $fun.$thumbnail();
        },
        // e
        loaddata: function(data) {
            let Ths = this;
            Ths.resetData(false);
            let options = Ths.$options;
            data = data || {};
            $var.$flow.attr('id', data.id || $fun.$getId('F'));
            Ths.$setTitle(data.title || options.title);
            Ths.$setEditable(typeof(data.editable) == 'boolean' ? data.editable : options.editable);
            Ths.$setLineType(data.lineType || options.lineType);
            Ths.$setShowNodeTitle(typeof(data.showNodeTitle) == 'boolean' ? data.showNodeTitle : options.showNodeTitle);			
            let msg = Ths.language.msg;
            let nodeBox = $var.$nodeBox;
            let nodes = data.nodes || [];
            for(let i =0; i < nodes.length; i ++) {
                if(!nodes[i]) {
                    Ths.resetData(false);
                    Ths.$setMessage(msg.abnormalDataFormat);
                    return false;
                }
                const {id, x, y, type, title, value} = nodes[i];
                if(!id || !x || !y || !type || !title) {
                    Ths.resetData(false);
                    Ths.$setMessage(msg.abnormalDataFormat);
                    return false;
                }
                let node = Ths.addNode(id, x, y, type, title, value);
                nodeBox.append(node);
            }
            
            let dotMap = {'t':'top', 'r':'right','b':'bottom','l':'left'};
            let lineBox = $var.$lineBox;
            let lines = data.lines || [];
            for(let i =0; i < lines.length; i ++) {
                let lineData = lines[i];
                if(!lineData || !lineData.id || !lineData.type 
                    || !lineData.from || !lineData.from.id || !lineData.from.dot 
                    || !lineData.to || !lineData.to.id || !lineData.to.dot) {
                    Ths.resetData(false);
                    Ths.$setMessage(msg.abnormalDataFormat);
                    return false;
                }
                let id = lineData.id;
                let type = lineData.type;
                
                let from = lineData.from;
                let fromNodeId = from.id;
                let fromDot = dotMap[from.dot];
                
                let to = lineData.to;
                let toNodeId = to.id;
                let toDot = dotMap[to.dot];
            
                let lineStyle = $dom.e({}, $const.$lineStyle);
                lineStyle['class'] = 'line';
                let l = $S('<path>', lineStyle);
                let shadowStyle =$dom.e({}, $const.$shadowStyle);
                shadowStyle['class'] = 'shadow';
                let s = $S('<path>', shadowStyle);
                let line = $S('<g>', {
                    id: id,
                    class: 'line'
                }).append(l).append(s);
                let fromPoints = [from.x, from.y];
                let toPoints = [to.x, to.y];
                let fromNode = $dom('#' + fromNodeId);
                let toNode = $dom('#' + toNodeId);
                let tilte = lineData.title;
                Ths.addLine(line, l, s, fromNode, fromDot, fromPoints, toNode, toDot, toPoints, type, tilte);
                lineBox.append(line);
            }
            return true;
        },
        // f
        crHeader() {
            let Ths = this;
            let options = Ths.$options;
            let tool = $dom('<div>', {class: 'tool'}).append($dom('<div>', {class: options.lineType}).append($dom('<b>', {class: 'ico_' + options.lineType})));
            let tit = $dom('<label>', {class: 'title'}).text(options.title);
            let box = $dom('<div>', {class: 'box'})
                .append($dom('<b>', {class: 'icon'}))
                .append(tit);
            let ipt = $var.$headerIpt = $dom('<div>', {class: 'ipt'}).bind('mousedown', () => {}, true).append($dom('<input>', {type: 'text', maxlength:'20'}))
                    .append($dom('<b>', {class: 'ok'}).bind('mousedown', () => {
                        let val = ipt.find('input').val();
                        Ths.$setTitle(val);
                        ipt.remove();
                    }));
            tit.bind('dblclick', () =>  {
                box.append(ipt);
                $var.$headerIpt = ipt;
                ipt.find('input').val(tit.text());
            }, true);
            let h = $dom('<header>', {class: 'header'})
                .append($dom('<div>', {class: 'logo'}).append(box)).append($dom('<div>', {class: 'linetool', title: '设置连线'})
                        .append(tool)
                        .bind('mousedown', () => {
                            Ths.$setLineType();
                        })
                ).append($dom('<span>', {class: 'separate'}));
            let b = $dom('<div>', {class: 'btn'}).appendTo(h);
            let btnArr = Ths.$btnArr();
            for(var i in btnArr) {
                let btn = btnArr[i];
                b.append($dom('<div>', {title: btn.title}).append($dom('<b>', {class: btn.icon})).click(() => {
                    Ths.setNodeDot(false, 'none');
                    btn.impl ? Ths.$fn[btn.fn].call(Ths, options[btn.fn]) : Ths.$fn[btn.fn].call(Ths);
                }));
            }
            $dom('<span>', {class: 'separate'}).appendTo(h);
            return h;
        },
        // g
        crAside() {
            let Ths = this;
            let options = Ths.$options;
            let a = $dom('<aside>', {class: 'aside'});
            let t = $dom('<div>', {class: 'tools'}).appendTo(a);
            let addTools = (tools) => {
                for(var i in tools) {
                    let tol = tools[i];
                    // 分隔符
                    if(tol.type && tol.type == 'separate') {
                        $dom('<span>').addCls(tol.type).appendTo(t);
                    }
                    else {
                        let tool = $dom('<div>', {class: 'tool',title: tol.title})
                                .append($dom('<b>', {class: 'ico_' + tol.icon})).appendTo(t);
                        Ths.bindDraggable(tool, tol.icon);
                    }
                }
            };
            let toolArr = Ths.$toolsArr();
            let tools = options.tools;
            addTools(toolArr);
            addTools(tools);
            return a;
        },
        // h
        crSection(options) {
            let Ths = this;
            let s = $var.$shadow = $dom('<div>', {class: 'shadow'});            
            // 增加连线工具
            let t = $var.$lineTool = $dom('<div>', {class: 'linetool'}).append($dom('<div>')
                            .append($dom('<b>', {class: 'line'}).bind('mousedown',()=>Ths.changeLine('line')))
                            .append($dom('<b>', {class: 'polyline'}).bind('mousedown',()=>Ths.changeLine('polyline')))
                            .append($dom('<b>', {class: 'title'}).bind('mousedown',()=>Ths.lineTitle(), true))
                            .append($dom('<b>', {class: 'remove'}).bind('mousedown',()=>Ths.delLine()))
                            );

            let txt = $dom('<input>', {type: 'text', class: 'text', maxlength: '10'}).bind('mousedown', () => {}, true);
            let titleIpt = $var.$titleIpt = $dom('<div>', {class: 'ipt'}).append(txt)
                .append($dom('<b>', {class: 'ok'}).bind('mousedown', () => {
                    // 根据绑定节点id找到 点击节点
                    let focusId = titleIpt.attr('focus-id');
                    let val = txt.val();
                    if(!!val) {
                        let dom = $dom('#'+focusId).data('title', val);
                        let txt = dom.find('text');
                        if(txt.$el) {
                            txt.html(val);
                        }
                    }
                    txt.val('');
                    titleIpt.removeAttr('focus-id');
                }));
                
            let w = $var.$workarea = $dom('<div>', {class: 'workarea'})
                            .css({width: (options.areaRatio * 100) + '%', height: (options.areaRatio * 100) + '%'});
            w.append(Ths.crSvg()).append(s).append(t).append(Ths.crMenu()).append(titleIpt);
            // 工作区拖动事件
            w.bind('mousedown', (de) => {
                let startX = de.pageX;
                let startY = de.pageY;
                let p = w.parent();
                let top = p.get('scrollTop');
                let left = p.get('scrollLeft');
                let workareaMove = (me) => {
                    p.set('scrollTop', top + startY - me.pageY);
                    p.set('scrollLeft', left + startX - me.pageX);
                };
                w.addCls('focus');
                $dom($w).bind('mousemove', workareaMove).bind('mouseup', () => {
                    w.removeCls('focus');
                    $dom($w).unbind('mousemove', workareaMove);
                })
            });
            return $dom('<section>', {class: 'section'}).append(w);
        },
        // i
        crSvg() {
            let Ths = this;
            // 连线箭头
            let arrow = $S('<marker>', {
                id: 'arrow',
                viewBox: '0 0 10 10',
                refX: '7',
                refY: '5',
                markerWidth: '5',
                markerHeight: '5',
                orient: 'auto'
            }).append($S('<path>',{
                d: 'M0 0 L10 5 L0 10 L2 5 z',
                fill: '#1296db'
            }));
            // 连线选中箭头
            let focusArrow = arrow.cloneNode(true).attr('id', 'focusArrow');
            focusArrow.find('path').attr('fill', '#d39b26');
            let shadow = $S('<filter>', {
                id: 'shadow',
                x: 0,
                y: 0
            }).append($S('<feGaussianBlur>', {
                stdDeviation: 2
            })).append($S('<feOffset>', {
                dx: 2,
                dy: 2
            }));

            let textBgFilter = $S('<filter>', {id: 'textBg', x: -0.05, y: -0.02, width: 1.1, height: 1.15});
            let textBgFeFlood = $S('<feFlood>', {'flood-color':'#999', 'flood-opacity': 1});
            let textBgFeComposite = $S('<feComposite>', {in: 'SourceGraphic', operator: 'over'});
            textBgFilter.append(textBgFeFlood).append(textBgFeComposite);
            
            let defs = $S('<defs>').append(arrow).append(focusArrow).append(shadow)
                    .append(textBgFilter);
            let options = Ths.$options;
            // 临时容器 因为线的顺序如果在节点后 节点的over事件无法触发 所以必须放在node容器前
            let temp = $var.$tempBox = $S('<g>', {class: 'temp'});
            let nodes = $var.$nodeBox = $S('<g>', {class: 'nodes'});
            let lines = $var.$lineBox = $S('<g>', {class: 'lines'});
            
            let dot = $S('<rect>', {class: 'dot', rx: 2});
            let top = dot.cloneNode().addCls('top').data('type', 'top').attr({x:18, y:-6});
            let bottom = dot.cloneNode().addCls('bottom').data('type', 'bottom').attr({x:18,y:42});
            let left = dot.cloneNode().addCls('left').data('type', 'left').attr({x:-6, y:18});
            let right = dot.addCls('right').data('type', 'right').attr({x:42, y:18});
            let dotArr = [top, bottom, left, right];
            let nodeDot = $var.$nodeDot = $S('<g>', {class: 'nodeDot', transform: 'translate(-1000,-1000)'})
                        .append(top).append(right).append(bottom).append(left);

            Ths.bindLineEvent(nodeDot, dotArr);
            let s = $var.$svg = $S('<svg>', {
                width: '100%',
                height: '100%',
                'xmlns': $const.$elns,
                'xmlns:xlink': $const.$xlink
            }).append(defs).append(temp).append(nodes).append(lines).append(nodeDot);
            $fun.$icon({url:'./themes/img/cell.svg'}, (img) => {
                s.attr('style', 'background-image:url('+ img +')');
            });
            return s;
        },
        // j
        crMenu() {
            let Ths = this;
            let m = $var.$menu = $dom('<ul>', {class: 'menu'});
            let mArr = Ths.$menuArr();
            for(var i in mArr) {
                let men = mArr[i];
                let mli = $dom('<li>', {class: men.icon})
                    .text(men.title)
                    .appendTo(m);
                men.fn ? mli.bind('mousedown', () =>  {$var.$menu.hide();let node = $var.$focusNode;$w.setTimeout(()=>{men.fn.call(Ths, node)},0)}, true) : null;
            }
            return m;
        },
        // k:从工具栏拖拽至工作区
        bindDraggable(tool, type) {
            let Ths = this;
            let options = Ths.$options;
            let workarea = $var.$workarea;
            let shadow = $var.$shadow;            
            let nodes = $var.$nodeBox;
            tool.bind('mousedown', (de) => {
                $w.onmousemove = null;
                $w.onmouseup = null;
                let newMove = tool.cloneNode(true);
                shadow.append(newMove);
                shadow.show();
                if(options.nodebox) {
                    shadow.css({
                        background: '#d9e8fb',
                        border: '#8ea4c1 1px dashed'
                    })
                }
                let bw = shadow.offset().width / 2;
                let bh = shadow.offset().height / 2;
                de = de || event;
                let dx = de.pageX;
                let dy = de.pageY;
                shadow.css({left: (dx - bw) + 'px', top: (dy - bh) + 'px'});
        
                $w.onmousemove = (me) => {
                    me = me || event;
                    let mx = me.pageX;
                    let my = me.pageY;
                    shadow.css({left: (mx - bw) + 'px', top: (my - bh) + 'px'});
                };
                
                let woft = workarea.offset();                
                $w.onmouseup = (ue) => {
                    ue = ue || event;
                    let ux = ue.clientX + document.body.scrollLeft;
                    let uy = ue.clientY + document.body.scrollTop;
                    let child = shadow.firstChild();
                    if(child) {
                        // 鼠标超出画布范围不创建节点
                        if(ux > woft.left 
                            && uy > woft.top 
                            && ux < (woft.width + woft.left) 
                            && uy < (woft.height + woft.top)) {
                            
                            let top = workarea.parent().get('scrollTop');
                            let left = workarea.parent().get('scrollLeft');
                            
                            let x = ux + left - woft.left - $const.$nodeWidth / 2 - 2;
                            let y = uy + top - woft.top - $const.$nodeHeight / 2 - 2;
                
                            let scope = $fun.$nodeXyScope(x, y);
                            let title = tool.attr('title');
                            let id = $fun.$getId('N');
                            let node = Ths.addNode(id, scope.x, scope.y, type, title);
                            $var.$focusNode = node.addCls('focus').appendTo(nodes);
                            options.onAddNode(type);
                            
                            // 缓存当前数据
                            Ths.recordCache('addNode');
                        }
                        child.remove();
                    }
                    shadow.hide();
                    $w.onmousemove = null;
                    $w.onmouseup = null;
                };
                return false;
            });
        },
        // l
        addNode(id, x, y, type, title, value) {
            let Ths = this;
            let svg = $var.$svg;
            let nodes = $var.$nodeBox;
            let nodeTimer = null;
            let nodeDotTimer = null;
            let options = Ths.$options;
            let text = $S('<text>', {
                x: $const.$nodeWidth / 2,
                y: $const.$nodeHeight + 19,
                'font-size': '12px',
                'font-weight': 'bold',
                fill: '#0974ac',
                'text-anchor': 'middle'
            }).html(title);
            
            let shadowStyle, nodeStyle, seizeStyle = {
                fill: 'transparent',
                width: $const.$nodeWidth + $const.$nodeDotSize, 
                height: $const.$nodeHeight + $const.$nodeDotSize,
                x: -($const.$nodeDotSize/2),
                y: -($const.$nodeDotSize/2),
            };
            if(options.nodebox) {
                shadowStyle = $dom.e({}, $const.$nodeStyle);
                shadowStyle['filter'] = 'url(#shadow)';
                shadowStyle['fill'] = '#999';
                shadowStyle['class'] = 'shadow';
                nodeStyle = $dom.e({}, $const.$nodeStyle);
                nodeStyle['class'] = 'rect';                
            }            
            
            let icon = $S('<image>', {
                class: 'icon',
                x: 4.5,
                y: 4.5,
                width: 36,
                height: 36
            },[
                [$const.$xlink, 'xlink:href', $var.$cache[type]]
            ]);
            let node = $S('<g>', {
                    id: id,
                    class: 'node',
                    transform: 'translate(' + x +',' + y +')'
                })
                .append($S('<rect>', seizeStyle))
                .append(shadowStyle ? $S('<rect>', shadowStyle) : null)
                .append(nodeStyle ? $S('<rect>', nodeStyle) : null)
                .append(icon.bind('mousedown', (de) => {
                    de = de || event;
                    Ths.resetTool(false, {node: node});
                    node.addCls('focus');
                    if(de.button != 2) {
                        clearTimeout(nodeTimer);
                        nodeTimer = setTimeout(() => {
                            nodes.append(node);// 点击节点后 把节点的位置放到最后
                        }, 200);
                        let move = false;
                        let nodeMove = (me) => {
                            Ths.setNodeDot(false, 'none');
                            node.addCls('move');
                            Ths.moveNode(me, node);
                            move = true;
                            node.addCls('over').find('image.remove').attr({width: '0px', height: '0px'});
                        };
                        svg.bind('mousemove', nodeMove);
                        $w.onmouseup = () =>  {
                            Ths.setNodeDot(true, node, nodeDotTimer);
                            $w.onmouseup = null;
                            svg.unbind('mousemove', nodeMove);
                            $var.$focusNode = node.removeCls('move');    
                            move?Ths.recordCache('moveNode'):null;
                            node.addCls('over').find('image.remove').attr({width: '10px', height: '10px'});
                        };
                    }
                }, true).bind('mouseover', () => {
                    Ths.setNodeDot(true, node, nodeDotTimer);
                }))
                .append($var.$showNodeTitle?text:null)
                .append($S('<image>', {
                    class: 'remove',
                    x: 40,
                    y: -4,
                    width: '0px',
                    height: '0px'
                },[
                    [$const.$xlink, 'xlink:href', $fun.$icon({icon:'node-remove'})]
                ]).bind('mousedown', ()=>Ths.delNode(node), true))
                .bind('mouseover', () => {
                    node.addCls('over').find('image.remove').attr({width: '10px', height: '10px'});
                    Ths.setNodeDot(true, node, nodeDotTimer);
                }).bind('mouseout', () => {
                    node.removeCls('over').find('image.remove').attr({width: '0px', height: '0px'});
                    nodeDotTimer = setTimeout(() => {
                        let overDot = $var.$nodeDot.find('rect.dot.over');
                        if(!(overDot && overDot.$el))Ths.setNodeDot(false);
                    }, 100)
                }).bind('mouseup', (ue) => {
                    ue = ue || event;
                    if(ue.button == 2) {
                        if(options.noMenuNode.indexOf(type) < 0) {
                            $var.$menu.css({left: ue.pageX + 'px', top: ue.pageY + 'px'}).show();                            
                        }
                    }
                    $var.$focusNode = node.addCls('focus');
                }).bind('dblclick', () => {
                    clearTimeout(nodeTimer);
                    const {type, title, value = null} = node.data();
                    options.onDblclick(node.attr('id'), type, title, value);
                    nodes.append(node);
                }).dataAll({'type': type, 'title': title, 'value': value || null, 'pos': {x: x, y: y}});
                
            Ths.bindNodeTextEvent(node, text);
            return node;
        },
        // y
        setNodeDot(show, node, timer) {
            let nodeDot = $var.$nodeDot;
            if(show) {                
                if(timer) clearTimeout(timer);
                let lastNode = nodeDot.addCls('over').attr('transform', node.attr('transform')).data('node');
                if(lastNode && lastNode.$el == node.$el) return;
                nodeDot.data({'node': node});
            }
            else {
                nodeDot.removeCls('over');
                if(node) {
                    nodeDot.attr('transform','translate(-1000,-1000)').data('node', node);
                }
            }
        },
        // m
        bindNodeTextEvent(node, text) {
            text.bind('dblclick', () => {
                let pos = node.data('pos');
                let ipt = $var.$titleIpt;
                let iptOff = ipt.show().offset();
                let top = pos.y + $const.$nodeHeight + 2;
                let left = pos.x - iptOff.width / 2 + $const.$nodeWidth / 2 + 10;
                // 输入框记录点击节点id
                ipt.attr('focus-id', node.attr('id')).find('input.text').val(text.html());
                ipt.show().css({top: `${top}px`, left: `${left}px`});
            }, true);
        },
        bindLineTextEvent(line, text) {
            text.bind('mousedown', () => {}, true).bind('dblclick', () => {
                let ipt = $var.$titleIpt;
                let iptOff = ipt.show().offset();
                let {x, y} = text.data();
                let left = x - iptOff.width / 2 + 10;
                let top = y - 18;
                // 输入框记录点击连线id
                ipt.attr('focus-id', line.attr('id')).find('input.text').val(text.html());
                ipt.show().css({left: `${left}px`, top: `${top}px`});
            }, true)
        },
        // n:节点上的方位点绑定画线事件
        bindLineEvent(nodeDot, dotArr) {
            let Ths = this;
            let workarea = $var.$workarea;
            let temp = $var.$tempBox;
            let lines = $var.$lineBox;
            for(var i=0; i<dotArr.length; i ++ ) {
                let startDot, dot;
                startDot = dot = $dom(dotArr[i]);
                dot.bind('mouseover', () =>  {
                    dot.addCls('over');
                    nodeDot.addCls('over');
                }).bind('mouseout', () =>  {
                    dot.removeCls('over');
                    Ths.setNodeDot(false);
                });
                // 鼠标按下节点上方位点
                startDot.bind('mousedown', (de) => {
                    de = de || event;
                    Ths.resetTool(false,'nd');
                    let node = nodeDot.data('node');
                    let pos = node.data('pos');
                    let fromDot = startDot.data('type');
                    let startPos = $fun.$dotPos(fromDot, pos, de);
                    // 在节点的四个方位点上画线
                    let fromPoints = [startPos.x, startPos.y];                    
                    let lineStyle = $dom.e({}, $const.$lineStyle);
                    lineStyle['class'] = 'line';
                    lineStyle['stroke-dasharray'] = '5,5';
                    let l = $S('<path>', lineStyle);
                    let line = $S('<g>', {
                        id: $fun.$getId('L'),
                        class: 'line'
                    }).append(l).appendTo(temp);
                    
                    let svgMousemove = (me) => {
                        me = me || event;
                        let offset = workarea.offset();
                        let top = workarea.parent().get('scrollTop');
                        let left = workarea.parent().get('scrollLeft');
                        let wTop = $dom(document.body).get('scrollTop');
                        let wLeft = $dom(document.body).get('scrollLeft');
                        let x = me.pageX - offset.left + left + wLeft;
                        let y = me.pageY - offset.top + top + wTop;
                        l.attr('d', 'M ' +fromPoints.join(',') + ' ' + x + ',' + y);
                    };
                    // 在画布上移动时 实时计算连线路径
                    $dom($w).bind('mousemove', svgMousemove, true);
                    // 当鼠标释放时 如果正好在节点方位点上 添加连线 否则删除虚线
                    $w.onmouseup = (ue) => {
                        ue = ue || event;
                        $w.onmouseup = null;
                        $dom($w).unbind('mousemove', svgMousemove);
                        let endDot = nodeDot.find('rect.dot.over');
                        if(!endDot || endDot.length == 0) line.remove();
                        else {
                            //如果是同一节点 不添加连线
                            let toNode = nodeDot.data('node');
                            if(toNode.$el == node.$el) {
                                line.remove();
                            }
                            else {
                                let c = false;
                                let sLines = node.data('sLines') || [];
                                for(let j = 0; j < sLines.length; j ++) {
                                    let sLine = sLines[j];
                                    let tNode = sLine.data('to');
                                    if(tNode.$el == toNode.$el) {
                                        c = true;
                                        let msg = Ths.language.msg;
                                        Ths.$setMessage(msg.nodesAreConnected);
                                        break;
                                    }
                                }
                                // 两节点已经有连线 不再创建新连线
                                if(c) {
                                    line.remove();
                                }
                                else {
                                    $var.$focusNode = toNode.addCls('focus');
                                    let options = Ths.$options;
                                    options.onAddLine({id:node.attr('id'),type:node.data('type')}, {id:toNode.attr('id'),type:toNode.data('type')});                                    
                                    let shadowStyle =$dom.e({}, $const.$shadowStyle);
                                    shadowStyle['class'] = 'shadow';
                                    let s = $S('<path>', shadowStyle);
                                    l.removeAttr('stroke-dasharray');
                                    // 创建连线
                                    let toPos = toNode.data('pos');
                                    let toDot = endDot.data('type');
                                    let endPos = $fun.$dotPos(toDot, toPos, ue);
                                    let toPoints = [endPos.x, endPos.y];
                                    
                                    line.append(s).appendTo(lines);
                                    Ths.addLine(line, l, s, node, fromDot, fromPoints, toNode, toDot, toPoints, $var.$lineType);
                                    Ths.recordCache('addLine');
                                }
                            }
                        }
                    }
                }, true);
            }
        },
        // o
        delNode(node) {
            let Ths = this;
            let options = Ths.$options;
            const {type, title, value = null} = node.data();
            let d = options.onRemoveNode ? options.onRemoveNode(node.attr('id'), type, title, value) : true;
            d = typeof(d) == 'boolean'? d : true;
            if(d) {
                // 删除node、关联的线、线关联node的线data记录
                // 删除起点为node的线及结束点node的data线的数据
                let sLines = node.data('sLines');
                if(sLines && sLines.length > 0) {
                    for(let i = 0; i< sLines.length; i ++) {
                        let line = sLines[i];
                        let toNode = line.data('to');
                        let teLines = toNode.data('eLines');
                        let idx = teLines.indexOf(line);
                        teLines.splice(idx, 1);
                        line.remove();
                    }
                    // 清空node记录的sLines
                    node.data('sLines', []);
                }
                // 删除结束点为node的线及起点node的data线的数据
                let eLines = node.data('eLines');
                if(eLines && eLines.length > 0) {
                    for(let i = 0; i< eLines.length; i ++) {
                        let line = eLines[i];
                        let fromNode = line.data('from');
                        let fsLines = fromNode.data('sLines');
                        let idx = fsLines.indexOf(line);
                        fsLines.splice(idx, 1);
                        line.remove();
                    }
                    // 清空node记录的eLines
                    node.data('eLines', []);
                }
                node.remove();
                Ths.recordCache('delNode');
            }
            Ths.resetTool(false);
            Ths.resetTool(true);
            Ths.setNodeDot(false, 'none');
        },
        // p
        changeLine(type) {
            let Ths = this;
            let line = $var.$focusLine;
            let lintType = line.data('type');
            if(!!line && type != lintType) {
                // 记录连线类型 放在获取连线路径方法前面
                line.data('type', type);
                let linePoints = $fun.$linePoints(line);
                let ls = line.find('path');
                for(let i = 0; i < ls.length; i ++) {
                    $dom(ls[i]).attr('d', linePoints);
                }
                Ths.recordCache('changeLine');
            }
        },        
        // q
        delLine() {
            let Ths = this;
            let line = $var.$focusLine;
            if(!!line) {
                let fromNode = line.data('from');
                // 线所连开始节点所有线data 剔除此条线
                let fsLines = fromNode.data('sLines');
                let sidx = fsLines.indexOf(line);
                fsLines.splice(sidx, 1);
                
                // 线所连结束节点所有线data 剔除此条线
                let toNode = line.data('to');
                let teLines = toNode.data('eLines');
                let eidx = teLines.indexOf(line);
                teLines.splice(eidx, 1);
                
                line.remove();
                Ths.recordCache('delLine');
            }
        },
        lineTitle() {
            let line = $var.$focusLine;
            if(!!line) {
                line.find('.line-text').dblclick();
            }
        },
        // r
        addLine(line, l, s, fromNode, fromDot, fromPoints, toNode, toDot, toPoints, type, title) {
            let Ths = this;
            line.bind('mousedown', (ue) => {
                Ths.resetTool(false);
                let left = ue.offsetX - ($const.$lineToolWidth / 2);
                let top = ue.offsetY - ($const.$lineToolHeight / 2);
                $var.$lineTool.css({left: `${left}px`, top: `${top}px`}).show();
                $var.$focusLine = line.addCls('focus');
            }, true).dataAll({// 记录节点连线关系
                from: fromNode,
                fromDot,
                fromPoints,
                to: toNode,
                toDot,
                toPoints,
                type,
                title
            });
            // 根据起止点计算线路径
            let linePoints = $fun.$linePoints(line);
            
            // 连线标题坐标
            let {tx, ty} = $fun.$calcLineTitleXy(fromPoints, toPoints, linePoints, type);
            let text = $S('<text>', {
                class: 'line-text',
                x: tx,
                y: ty,
                fill: '#fff',
                filter: "url(#textBg)",
                'font-size': '12px',
                'text-anchor': 'middle',
                'style': 'display:black;padding:20px;opacity:1;line-height:2em'
            }).data({x: tx, y: ty});
            if(title) {
                text.html(title);
            }

            line.append(text);
            // 绑定连线标题事件
            Ths.bindLineTextEvent(line, text);
            
            l.attr('d', linePoints);
            s.attr('d', linePoints);
            let sLines = fromNode.data('sLines') || [];
            let eLines = toNode.data('eLines') || [];
            sLines.push(line);
            eLines.push(line);
            fromNode.data('sLines', sLines);
            toNode.data('eLines', eLines);
            return line;
        },
        // s:工作区内节点移动
        moveNode(me, node) {
            let Ths = this;
            let x = (me.offsetX - $const.$nodeWidth / 2);
            let y = (me.offsetY - $const.$nodeHeight / 2);
            let scope = $fun.$nodeXyScope(x, y);
            let pos = {x: scope.x, y: scope.y};
            node.attr('transform', 'translate(' + scope.x +',' + scope.y +')')
                .data('pos', pos);
                
            // 移动节点时 节点上所连的线 重新绘制开始结束点
            let sLines = node.data('sLines');
            if(sLines && sLines.length > 0) {
                for(let i = 0; i< sLines.length; i ++) {
                    let line = sLines[i];
                    let dotType = line.data('fromDot');
                    let xy = $fun.$dotPos(dotType, pos, me);
                    let l = line.find('.line');
                    let s = line.find('.shadow');
                    let fromPoints = [xy.x, xy.y];
                    let toPoints = line.data('toPoints');
                    
                    let linePoints = $fun.$linePoints(line, {fromPoints: fromPoints});
                    l.attr('d', linePoints);
                    s.attr('d', linePoints);
                    
                    let lineType = line.data('type');
                    let {tx, ty} = $fun.$calcLineTitleXy(fromPoints, toPoints, linePoints, lineType);
                    let lineText = line.find('text.line-text');
                    lineText.attr({x: tx, y: ty}).data({x: tx, y: ty});
                    
                    line.data('fromPoints', fromPoints);
                }
            }
            let eLines = node.data('eLines');
            if(eLines && eLines.length > 0) {
                for(let i = 0; i< eLines.length; i ++) {
                    let line = eLines[i];
                    let dotType = line.data('toDot');
                    let xy = $fun.$dotPos(dotType, pos, me);
                    let l = line.find('.line');
                    let s = line.find('.shadow');
                    let fromPoints = line.data('fromPoints'); 
                    let toPoints = [xy.x, xy.y];
                    
                    let linePoints = $fun.$linePoints(line, {toPoints: toPoints});
                    l.attr('d', linePoints);
                    s.attr('d', linePoints);
                    
                    let lineType = line.data('type');
                    let {tx, ty} = $fun.$calcLineTitleXy(fromPoints, toPoints, linePoints, lineType);
                    let lineText = line.find('text.line-text');
                    lineText.attr({x: tx, y: ty}).data({x: tx, y: ty});
                    
                    line.data('toPoints', toPoints);
                }
            }
        },
        // x
        loadIcons(options) {
            let load = (a) => {
                for(let i=0;i<a.length;i++) {
                    if(a[i].icon) {
                        $fun.$icon({icon: 'tool-' + a[i].icon}, (base64) => {
                            $var.$cache[a[i].icon] = base64;
                        })
                    }
                }
            };
            let Ths = this;
            let tArr = Ths.$toolsArr();
            let tools = options.tools;
            load(tArr);
            load(tools);
        },
        // ###################### 提供外部调用方法 ########################
        // $m:设置内部消息
        $setMessage(content, time) {
            let msg = $var.$flow.find('div.msg').show();
            msg.find('span').html(content);
            if($var.$msgTimer) {
                clearTimeout($var.$msgTimer);
                $var.$msgTimer = null;
            }
            $var.$msgTimer = $w.setTimeout(() => {
                msg.hide().find('span').html('');                
                $var.$msgTimer = null;
            }, time || 2000);
        },
        // $a:加载数据
        $loadData(data) {
            let Ths = this;
            let load = Ths.loaddata(data);
            load?Ths.recordCache('loadData'):null;
        },
        // $d:获取数据
        $getData() {
            let nodeArr = [];
            let nodes = $var.$nodeBox.find('g.node');
            nodes = !!nodes.$el ? [nodes.$el]: nodes;
            for(let i =0; i < nodes.length; i ++) {
                const node = $dom(nodes[i]);
                const {pos, type, title, value = null} = node.data();
                nodeArr.push({
                    id: node.attr('id'),
                    type,
                    title,
                    value,
                    x: pos.x,
                    y: pos.y
                })
            }

            let lineArr = [];
            let lines = $var.$lineBox.find('g.line');
            lines = !!lines.$el ? [lines.$el]: lines;
            for(let i =0; i < lines.length; i ++) {
                let line = $dom(lines[i]);
                let fromNode = line.data('from');
                let fromDot = line.data('fromDot').substr(0,1);
                let fromPoints = line.data('fromPoints');
                let toNode = line.data('to');
                let toDot = line.data('toDot').substr(0,1);
                let toPoints = line.data('toPoints');
                let type = line.data('type');
                let title = line.data('title');
                lineArr.push({
                    id: line.attr('id'),
                    type,
                    title,
                    from: {id:fromNode.attr('id'),dot:fromDot,x:fromPoints[0],y:fromPoints[1]},
                    to: {id:toNode.attr('id'),dot:toDot,x:toPoints[0],y:toPoints[1]}
                });
            }
            let data = {
                id: $var.$flow.attr('id'),
                title: $var.$title,
                lineType: $var.$lineType,
                editable: $var.$editable,
                showNodeTitle: $var.$showNodeTitle,
                nodes: nodeArr,
                lines: lineArr
            };
            return data;
        },
        // $n:是否显示Node标题
        $setShowNodeTitle(show) {
            let Ths = this;
            let nodes = $var.$nodeBox.find('g.node');
            nodes = !!nodes.$el ? [nodes.$el]: nodes;
            for(let i =0; i < nodes.length; i ++) {
                let node = $dom(nodes[i]);
                let title = node.data('title');
                let text = node.find('text');
                if(show) {
                    if(!text || !text.$el || text.length == 0) {
                        let newText = $S('<text>', {
                            x: $const.$nodeWidth / 2,
                            y: $const.$nodeHeight + 19,
                            'font-size': '12px',
                            'font-weight': 'bold',
                            fill: '#0974ac',
                            'text-anchor': 'middle'
                        }).html(title);
                        node.append(newText);
                        Ths.bindNodeTextEvent(node, newText);
                    }
                }
                else {
                    if(text && (text.$el || text.length > 0)) {
                        text.remove();
                    }
                }
            }
            $var.$showNodeTitle = show;
        },
        // $t:设置标题
        $setTitle(title) {
            $var.$flow.find('header.header label.title').text(title);
            $var.$title = title;
        },
        // $l:设置连线类型
        $setLineType(type) {
            if($var.$lineType == type) return;
            type = (type || ($var.$lineType == 'line' ? 'polyline': 'line'));
            let lineTool = $var.$flow.find('header.header > div.linetool > div.tool > div');
            lineTool.attr('class', type);
            lineTool.find('b').attr('class', 'ico_' + type);
            $var.$lineType = type;
        },
        // $e:是否可编辑
        $setEditable(able) {
            let Ths = this;
            if(!able) {
                $var.$flow.removeCls('enable');
                Ths.resetTool(true);
                Ths.resetTool(false);
            }
            else {
                $var.$flow.addCls('enable');
            }
            $var.$editable = able;
        },
        // $b:获取节点信息
        $getNode(id) {
            let data = $dom('#'+id).data();
            let fromLines = [];
            let toLines = [];
            for(let i = 0;!!data.sLines && i<data.sLines.length; i ++) {
                fromLines.push(data.sLines[i].attr('id'));
            }
            for(let i = 0;!!data.eLines && i<data.eLines.length; i ++) {
                toLines.push(data.eLines[i].attr('id'));
            }
            const {title, type, value = null} = data;
            return {
                id: id,
                title,
                type,
                value,
                fromLines: fromLines,
                toLines: toLines
            };
        },
        $setNodeValue(id, value) {
            $dom('#'+id).data('value', value);
        },
        // $c:获取连线信息
        $getLine(id) {
            let data = $dom('#'+id).data();
            return {
                id: id,
                type: data.type,
                fromNode: data.from.attr('id'),
                toNode: data.to.attr('id')
            };
        }
    };    
    let $o = null;
    const flow = function(el) {
        let Ths = this;
        this.flow = function() {
            if(!$o){
                let options = $dom.e({}, $defaultOptions, arguments[0]||{});
                let lang = $w.language || null;
                if(!lang) {
                    let i = options.language;
                    $dom.l('./js/language/smtflow.i18n.' + i + '.js', () => {
                        $o = new $smt(el, options, language);
                    })
                }
                else {
                    $o = new $smt(el, options, lang);
                }
            }
            return (typeof(arguments[0]) == 'string')?$flowMethods[arguments[0]].call($o, arguments[1], arguments[2]):Ths;
        };
    };    
    const $flow = function() {
        return new flow(arguments[0]);
    };
    ({
        a(b) {
            var c = [];
            for(var d = 0;d < b.length; d ++) {
                c.push(b[d]);
            }
            return c.join('');
        },
        b (a) {
            if($w.$$) {
                $$.fn.flow = function() {
                    return $flow(this.selector).flow(arguments[0]);
                };
            }
            else
                return eval('(window' + this.a(a) + '=' + $flow.name + ')');
        },
        $(o) {
            let arr = ['["', $w.atob(o) ,'"]'];
            this.b(arr);
        }
    }).$('JCQ=');
    
    const $d = {
        crtDom(el, elns){
            if(el.startsWith('<') && el.endsWith('>')) {
                el = el.replace('<', '').replace('>', '');
            }
            if(elns) return document.createElementNS(elns, el);
            return document.createElement(el)
        },
        getEle(el){
            return document.querySelector(el);
        }
    };
    const dom = function(arg) {
        let getEle = (el, opt, ans) => {
            if(el.startsWith('<') && el.endsWith('>')) {
                let n = $d.crtDom(el, (opt || {})['elns']);
                if(opt) {
                    delete opt['elns'];
                    for(let k in opt) {
                        n.setAttribute(k, opt[k]);
                    }
                }
                if(ans) {
                    for(let i=0;i<ans.length;i++) {
                        n.setAttributeNS(ans[i][0],ans[i][1],ans[i][2]);
                    }
                }
                return n;
            }
            else {
                return $d.getEle(el);
            }
        };
        if(typeof(arg[0]) == 'string') {
            this.selector = arg[0];
            if(this.selector)this.$el = getEle(this.selector, arg[1], arg[2]);
        }
        else {
            if(arg[0].$el) {
                this.selector = arg[0].selector;
                this.$el = arg[0].$el;
            }
            else {
                this.selector = '';
                this.$el = arg[0];
            }
        }
    };
    dom.prototype = {
        // a
        attr(n, v) {
            var el = this.$el;
            if(typeof(n) == 'string') {
                if(typeof(v) == 'undefined') return el.getAttribute(n);
                else el.setAttribute(n, v);
            }
            else {
                for(var k in n) {
                    el.setAttribute(k, n[k]);
                }
            }
            return this;
        },
        // b
        removeAttr(n) {
            var el = this.$el;
            el.removeAttribute(n);
            return this;
        },
        // c
        data(k, v) {
            var el = this.$el;
            el.$data = el.$data || {};
            if(!k) return el.$data;
            if(typeof(k) == 'string') {
                if(v) {
                    el.$data[k] = v;
                }
                else {
                    return el.$data[k];
                }
            }
            else {
                for(var p in k) {
                    el.$data[p] = k[p];
                }
            }
            return this;
        },
        // d
        dataAll(o) {
            var el = this.$el;
            el.$data = el.$data || {};
            for(var k in o) {
                el.$data[k] = o[k];
            }
            return this;
        },
        // e
        offset() {
            var el = this.$el;
            var w = el.offsetWidth;
            var h = el.offsetHeight;
            var t = el.offsetTop;
            var l = el.offsetLeft;
            var r = el.offsetRight;
            var b = el.offsetBottom;
            el = el.offsetParent;
            while (el) {
                t += el.offsetTop;
                l += el.offsetLeft;
                r += el.offsetRight;
                b += el.offsetBottom;
                el = el.offsetParent;
            };
            return {
                top: t,
                left: l,
                right: r,
                bottom: b,
                width: w,
                height: h
            }
        },
        // f
        getCls() {
            var el = this.$el;
            var clsName = el.getAttribute('class');
            if(!clsName)return [];
            var clsArr = clsName.split(' ');
            return clsArr;
        },
        // g
        hasCls(cls){
            var el = this.$el;
            var clsName = el.getAttribute('class');
            if(!clsName)return false;
            var clsArr = clsName.split(' ');
            return clsArr.indexOf(cls) >= 0;
        },
        // h
        addCls(cls){
            var el = this.$el;
            var clsName = el.getAttribute('class');
            var clsArr = clsName ? clsName.split(' ') :[];
            var idx = clsArr.indexOf(cls);
            if(idx < 0) {
                clsArr.push(cls);
                clsName = clsArr.join(' ');
                el.setAttribute('class', clsName);
            }
            return this;
        },
        // i
        removeCls(cls){
            var el = this.$el;
            var clsName = el.getAttribute('class');
            if(!clsName)return this;
            var clsArr = clsName.split(' ');
            var idx = clsArr.indexOf(cls);
            if(idx >= 0) {
                var nArr = [];
                for(var i=0; i <clsArr.length; i ++) {
                    (clsArr[i] != cls) ? nArr.push(clsArr[i]) : null;
                }
                clsName = nArr.join(' ');
                el.setAttribute('class', clsName);
            }
            return this;
        },
        // j
        firstChild() {
            var el = this.$el;
            var fc = el.children[0];
            return new dom([fc]);
        },
        // k
        cloneNode(p) {
            var el = this.$el;
            var cn = el.cloneNode(p);
            return new dom([cn]);
        },
        // l
        remove() {
            var el = this.$el;
            el.remove();
        },
        // m
        append(c) {
            if(!c) return this;
            var el = this.$el;
            if(typeof(c) == 'string') {
                el.appendChild($d.crtDom(c));
            }
            else {
                el.appendChild(c.$el || c);
            }
            return this;
        },
        // n
        prepend(c) {
            return this;
        },
        // o
        appendTo(p) {
            var el = this.$el;
            p.$el.appendChild(el);
            return this;
        },
        // p
        text(t) {
            if(t) {                
                this.$el.innerText = t;
                return this;
            }
            return this.$el.innerText;
        },
        // q
        html(h) {
            if(typeof(h) != 'undefined') {                
                this.$el.innerHTML = h;
                return this;
            }
            return this.$el.innerHTML;
        },
        // r
        val(v) {
            if(typeof(v) != 'undefined') {
                this.$el.value = v;
                return this;
            }
            return this.$el.value;
        },
        // s
        click(fn, stop, options) {
            let Ths = this;
            var el = Ths.$el;
            if(fn) {
                el.addEventListener('click', fn.name ? fn: (e) => {stop ? e.stopPropagation(): null;fn.call(Ths, e);}, options);
            }
            else {
                let clickEvent = new Event('click');
                el.dispatchEvent(clickEvent);
            }
            return this;
        },
        dblclick(fn, stop, options) {
            let Ths = this;
            var el = Ths.$el;
            if(fn) {
                el.addEventListener('dblclick', fn.name ? fn: (e) => {stop ? e.stopPropagation(): null;fn.call(Ths, e);}, options);
            }
            else {
                let clickEvent = new Event('dblclick');
                el.dispatchEvent(clickEvent);
            }
            return this;
        },
        // t
        bind(ev, fn, stop, options) {
            let Ths = this;
            var el = Ths.$el;
            el.addEventListener(ev, fn.name ? fn: (e) => {stop ? e.stopPropagation(): null;fn.call(Ths, e);}, options);
            return this;
        },
        // u
        unbind(ev, fn, options) {
            var el = this.$el;
            el.removeEventListener(ev, fn, options);
            return this;
        },
        // v
        show() {
            this.css('display', 'block');
            return this;
        },
        // w
        hide() {
            this.css('display', 'none');
            return this;
        },
        // x
        css(n, c) {
            var el = this.$el;
            if(typeof(n) == 'string') {
                if(typeof(c) == 'undefined') {
                    return el.style[n];
                }
                else {
                    el.style[n] = c;
                }
            }
            else {
                for(var k in n) {
                    el.style[k] = n[k];
                }
            }
            return this;
        },
        // y
        parent() {
            var el = this.$el;
            if(el.parentElement)
                return new dom([el.parentElement]);
            else return null;
        },
        // z
        find(s) {
            var el = this.$el;
            var f = el.querySelectorAll(s);
            if(f && f.length == 1) {
                return new dom([f[0]])
            }
            return f;
        },
        // aa
        get(a) {
            var el = this.$el;
            return el[a];
        },
        // ab
        set(a, b) {
            var el = this.$el;
            el[a] = b;
            return this;
        },
        // ac
        attrNs(n, k, v) {
            var el = this.$el;
            if(typeof(k) == 'string') {
                if(typeof(v) == 'undefined') return el.getAttributeNS(n, k);
                else el.setAttributeNs(n, k, v);
            }
            else {
                for(var p in k) {
                    el.setAttributeNs(n, p, k[p]);
                }
            }
            return this;
        }
    };
    const $dom = function() {
        return new dom(arguments);
    };
    let o, k;
    for(k in (o = {
        a (a) {
            let request = new XMLHttpRequest();
            request.open(typeof(a.type) == "undefined" ? 'get' : a.type, a.url);
            request.send(null);
            request.onload = () => {
                if(request.status == 200) {
                    let responseText = request.responseText;
                    let data = typeof(a.dataType) == 'undefined' || a.dataType == 'json' ? JSON.parse(responseText) : responseText;
                    if(!!a.success)a.success(data);
                }
            }
        },
        l (a, b) {
            if (!a || a.length === 0) {
                throw new Error("Missing 'path' parameter !")
            }
            var script = $d.crtDom("<script>");
            script.src = a;
            script.type = "text/javascript";
            $w.document.getElementsByTagName("head")[0].appendChild(script);
            if (b) {
                script.onload = script.onreadystatechange = () => {
                    if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") {
                        b()
                    }
                    script.onload = script.onreadystatechange = null
                }
            }
        },
        c(){},
        e() {
            let len_ = arguments.length;
            if (len_ < 1 || !arguments[0]) {
                return {}
            }
            let ed_ = (destination_, source_) => {
                if (Array == source_.constructor) {
                    for (let i_ = 0; i_ < source_.length; i_++) {
                        destination_.push(source_[i_])
                    }
                } else {
                    for (let p_ in source_) {
                        destination_[p_] = source_[p_]
                    }
                }
            };
            for (let i_ = 1; i_ < len_; i_++) {
                arguments[i_] ? ed_(arguments[0], arguments[i_]) : null
            }
            return arguments[0];
        }
    })) {$dom[k] = o[k];};
    
    let $flowMethods = {
        loadData(data) {
            this.$loadData(data);
        },
        getData() {
            return this.$getData();
        },
        setTitle(title) {
            this.$setTitle(title);
        },
        disable() {
            this.$setEditable(false);
        },
        enable() {
            this.$setEditable(true);
        },
        setLineType(type) {
            this.$setLineType(type);
        },
        setShowNodeTitle(show) {
            this.$setShowNodeTitle(show);
        },
        setMessage(options) {
            let content = typeof(options) == 'string' ? options : options.content;
            this.$setMessage(content, options.time);
        },
        setNodeValue(id, value) {
            this.$setNodeValue(id, value);
        },
        getNode(id) {
            return this.$getNode(id);
        },
        getLine(id) {
            return this.$getLine(id);
        }
    };
})(window);