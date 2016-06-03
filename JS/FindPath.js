/**
 * Created by JZL on 2016/5/20.
 */
var FindPath = {AUTHOR: "mySelf"};

var sceneArr = [];
//更新数组
FindPath.updateArr = function (arr) {
    sceneArr = arr;
};


var closeList;
var openList;
var pathList;
var result;
FindPath.getPath = function (startX, startY, endX, endY) {
    //init
    result = true;
    closeList = [];
    openList = [];
    pathList = [];
    var nowX, nowY;
    nowX = startX;
    nowY = startY;

    //如果当前数组长度为0，返回
    if (sceneArr.length == 0) {
        console.log("sceneArr length is 0!");
        return;
    }
    //检测开始和结束点是否符合规则
    if (startX < 0 || startY < 0 || startX > sceneArr[startY].length || startY > sceneArr.length) return;
    if (endX < 0 || endY < 0 || endX > sceneArr[endY].length || endY > sceneArr.length) return;

    //初始化数组
    for (var i = 0; i < sceneArr.length; i++) {
        for (var j = 0; j < sceneArr[i].length; j++) {
            //sceneArr[i][j].H = Math.abs(endY - i + endX - j);
            sceneArr[i][j].Open = false;
            sceneArr[i][j].Close = false;
        }
    }
    //设置开始点的父节点为null,将其 G 值设置为0
    sceneArr[nowY][nowX].fatherCheck = null;
    sceneArr[nowY][nowX].G = 0;
    //将开始点放入关闭列表中
    closeList.push(sceneArr[nowY][nowX]);
    sceneArr[nowY][nowX].Close = true;

    //如果开放列表中未出现目标方格，则循环
    while (openList.indexOf(sceneArr[endY][endX]) == -1) {
        var roundArr = getRoundCheck(nowX, nowY);
        //如果周围格子里出现终点格子且和终点之间没有障碍物，跳出循环
        var midX = (nowX + endX) / 2;
        var midY = (nowY + endY) / 2;
        if (roundArr.indexOf(sceneArr[endY][endX]) != -1 && !sceneArr[midY][midX].isObs) break;

        for (var i = 0; i < roundArr.length; i++) {
            //如果在closeList中找到，则移除
            if (roundArr[i].Close) /*roundArr.splice(i, 1)*/ continue;
            //如果与目标间存在障碍物，则移除
            var tempY = getIndexOf(roundArr[i], sceneArr)[0];
            var tempX = getIndexOf(roundArr[i], sceneArr)[1];
            if (sceneArr[(tempY + nowY) / 2][(tempX + nowX) / 2].isObs) /*roundArr.splice(i, 1)*/ continue;
            //如果 open 列表中不存在，则加入 open 列表中并计算 F、G、H 值
            if (!roundArr[i].Open) {
                roundArr[i].G = sceneArr[nowY][nowX].G + 2;
                roundArr[i].H = (Math.abs(endY - getIndexOf(roundArr[i], sceneArr)[0]) + Math.abs(endX - getIndexOf(roundArr[i], sceneArr)[1])) * 2;
                roundArr[i].F = roundArr[i].G + roundArr[i].H;
                roundArr[i].fatherCheck = sceneArr[nowY][nowX];
                roundArr[i].Open = true;
                openList.push(roundArr[i]);
            } else {
                //如果Open列表中存在，则判断从当前位置到此位置的G值是否更小，如果更小则重新计算G值，否则什么也不做
                if (roundArr[i].G > sceneArr[nowY][nowX].G + 2) {
                    roundArr[i].fatherCheck = sceneArr[nowY][nowX];
                    roundArr[i].G = sceneArr[nowY][nowX].G + 2;
                    roundArr[i].F = roundArr[i].G + roundArr[i].H;
                }
            }
        }
        //如果收集完周围点后open列表为空，则没有路径
        if (openList.length == 0) {
            console.log("退出循环，没有道路可以走通！");
            result = false;
            break;
        }
        //获取open列表中F值最小的元素
        var minFCheck = getMinF();
        nowX += getIndexOf(minFCheck, sceneArr)[1] - nowX;
        nowY += getIndexOf(minFCheck, sceneArr)[0] - nowY;
        sceneArr[nowY][nowX].Close = true;
        sceneArr[nowY][nowX].Open = false;
        openList.splice(openList.indexOf(minFCheck), 1);
        closeList.push(minFCheck);
    }
    //循环完成，判断最重点权值确定是否有更优路径
    if (sceneArr[endY][endX].F) {
        //如果当前更优，则将终点父节点指向当前节点
        if (sceneArr[nowY][nowX].F + 2 <= sceneArr[endY][endX].F) {
            sceneArr[endY][endX].fatherCheck = sceneArr[nowY][nowX];
        }
        //否则什么也不做
    }
    else {
        //如果当前F没有权值，说明没有其他节点能到达终点，将当前路径设置为最优路径
        sceneArr[endY][endX].fatherCheck = sceneArr[nowY][nowX];
    }
    //完成路径
    var tempCheck = sceneArr[endY][endX];
    while (tempCheck.fatherCheck != null) {
        pathList.unshift(tempCheck);
        tempCheck = tempCheck.fatherCheck;
    }
    //将起始点放入路径列表，结束
    pathList.unshift(pathList[0].fatherCheck);

    //for debug
   /* for (var k = 0; k < pathList.length; k++) {
        console.log(getIndexOf(pathList[k], sceneArr)[0], getIndexOf(pathList[k], sceneArr)[1]);
    }*/

    if (!result) {
        pathList = null;
    }
    //返回路径
    return pathList;
};

//获取元素在sceneArr中的定位
function getIndexOf(tempCheck, tempArr) {
    if (tempArr.length == 0) console.log("获取index数组长度为0，无法获取index信息");
    var vec = [];
    var x, y;
    tempArr.forEach(function (e) {
        if (e.indexOf(tempCheck) != -1) {
            x = e.indexOf(tempCheck);
            y = tempArr.indexOf(e);
            vec.push(y, x);
        }
    });
    return vec;
}

//获取某格子周围四个格子
function getRoundCheck(nowX, nowY) {
    var roundArr = [];
    if (nowX < sceneArr[nowY].length - 2) roundArr.push(sceneArr[nowY][nowX + 2]);
    if (nowY > 1) roundArr.push(sceneArr[nowY - 2][nowX]);
    if (nowX > 1) roundArr.push(sceneArr[nowY][nowX - 2]);
    if (nowY < sceneArr.length - 2) roundArr.push(sceneArr[nowY + 2][nowX]);
    return roundArr;
}

//获取 open 列表中F值最小的元素，如果有最小 F 元素数量不唯一，则返回最后一个
function getMinF() {
    var minFCheck = openList[0];
    for (var i = 0; i < openList.length; i++) {
        if (openList[i].F <= minFCheck.F) {
            minFCheck = openList[i];
        }
    }
    return minFCheck;
}