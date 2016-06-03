/**
 * Created by JZL on 2016/5/12.
 */

var clickState = 0;

function movePlayer() {
    if (clickState == 1) {
        clickState = 0;
    }
}

function addObs() {
    if (clickState == 0) {
        clickState = 1;
    }
}

function init() {
    var checkW = 8;
    var checkH = 7;
    var checkD = 8;
    var boardW = 120;
    var boardH = 5;
    var boardD = 120;
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var objects = [];
    var chessArr = [];
    var playerNowCheck, enemyNowCheck;
    var playerRole, enemyRole;
    var playerObsArr, enemyObsArr;
    var enemyTurn = false;

    var scene = new THREE.Scene();
    var sceneBG = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 100;
    camera.position.z = 100;
    var cameraBG = new THREE.OrthographicCamera(-window.innerWidth, window.innerWidth, window.innerHeight, -window.innerHeight, -10000, 10000);
    cameraBG.position.z = 50;

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var orbitControls = new THREE.OrbitControls(camera);
    var clock = new THREE.Clock();

    THREE.ImageUtils.crossOrigin = "anonymous";
    var materialColor = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture("Pic/galaxy.jpg"),
        depthTest: false
    });
    var bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialColor);
    bgPlane.position.z = -100;
    bgPlane.scale.set(window.innerWidth * 2, window.innerHeight * 2, 1);
    sceneBG.add(bgPlane);

    createLights();
    createChessBoard();
    createListener();

    window.document.getElementById("WebGL-output").appendChild(renderer.domElement);
    var bgPass = new THREE.RenderPass(sceneBG, cameraBG);
    var scenePass = new THREE.RenderPass(scene, camera);
    scenePass.clear = false;

    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;

    var composer = new THREE.EffectComposer(renderer);
    composer.renderTarget1.stencilBuffer = true;
    composer.renderTarget2.stencilBuffer = true;
    composer.addPass(bgPass);
    composer.addPass(scenePass);
    composer.addPass(effectCopy);

    render();

    //update
    function render() {
        renderer.autoClear = false;
        //控制摄像机
        var delta = clock.getDelta();
        orbitControls.update(delta);

        requestAnimationFrame(render);
        renderer.render(scene, camera);
        TWEEN.update();
        composer.render(delta);
    }

    //创建灯光
    function createLights() {
        var dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(30, 30, 30);
        dirLight.intensity = 0.8;
        scene.add(dirLight);
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.castShadow = true;
        spotLight.position.set(-30, 30, -100);
        spotLight.target.position.x = -10;
        spotLight.target.position.z = -10;
        spotLight.intensity = 0.6;
        spotLight.shadowMapWidth = 4096;
        spotLight.shadowMapHeight = 4096;
        spotLight.shadowCameraFov = 120;
        spotLight.shadowCameraNear = 1;
        spotLight.shadowCameraFar = 200;
        scene.add(spotLight);
    }

    //创建棋盘
    function createChessBoard() {
        playerObsArr = [];
        enemyObsArr = [];
        //棋盘group
        var chessBoard = new THREE.Group();
        //棋盘底
        var cubeGeo = new THREE.BoxGeometry(boardW, boardH, boardD, 1, 1, 1);
        //棋盘面修饰
        for (var i = 0; i < 9; i++) {
            var decorate = new getDecorate();
            decorate.position.set(-45 + checkW / 2 + checkW * i + 2 * i,
                0,
                52);
            var decorate2 = new getDecorate();
            decorate2.position.set(-45 + checkW / 2 + checkW * i + 2 * i,
                0,
                -54);
            scene.add(decorate);
            scene.add(decorate2);
        }
        //双方剩余障碍物数量
        for (var i = 0; i < 10; i++) {
            var remainObs = new getObstacle(1);
            remainObs.position.set(-46 + (checkW + 2) * i,
                (checkH + remainObs.geometry.parameters.height) / 2,
                53
            );
            playerObsArr.push(remainObs);
            scene.add(remainObs);
        }
        for (var i = 0; i < 10; i++) {
            var remainObs = new getObstacle(1);
            remainObs.position.set(-46 + (checkW + 2) * i,
                (checkH + remainObs.geometry.parameters.height) / 2,
                -55
            );
            enemyObsArr.push(remainObs);
            scene.add(remainObs);
        }
        // var cubeTexture = new THREE.ImageUtils.loadTexture("Pic/blue2.jpg");
        var cubeMesh = new THREE.Mesh(cubeGeo, new THREE.MeshPhongMaterial({
            // map: cubeTexture,
            color: 0x0000ff,
            transparent: true,
            opacity: 0.3
        }));
        //棋盘面
        for (var i = 0; i < 17; i++) {
            var LineH = [];
            if (i % 2 == 0) {
                for (var j = 0; j < 17; j++) {
                    if (j % 2 == 0) {
                        var check = getCheck();
                        check.position.set(-45 + checkW / 2 + checkW * j / 2 + j,
                            0,
                            -45 + checkD / 2 + checkD * i / 2 + i);
                        chessBoard.add(check);
                        LineH.push(check);
                        objects.push(check);
                    } else {
                        var gapH = getGap(1);
                        gapH.position.set(-45 + checkW * (j + 1) / 2 + j,
                            3,
                            -45 + checkD * (i + 1) / 2 + i);
                        chessBoard.add(gapH);
                        LineH.push(gapH);
                        objects.push(gapH);
                    }
                }
                chessArr.push(LineH);
            } else {
                var LineH = [];
                for (var j = 0; j < 17; j++) {
                    if (j % 2 == 0) {
                        var gapV = getGap(2);
                        gapV.position.set(-45 + checkW / 2 + checkW * j / 2 + j,
                            3,
                            -45 + checkD / 2 + checkD * i / 2 + i);
                        chessBoard.add(gapV);
                        LineH.push(gapV);
                        objects.push(gapV);
                    } else {
                        var obstacle = getMidGap();
                        obstacle.position.set(-45 + checkW * (j + 1) / 2 + j,
                            3,
                            -45 + checkD / 2 + checkD * i / 2 + i);
                        chessBoard.add(obstacle);
                        LineH.push(obstacle);
                        objects.push(obstacle);
                    }
                }
                chessArr.push(LineH);
            }
        }
        //创建玩家角色
        playerRole = getCharacter(0);
        playerRole.position.set(chessArr[16][8].position.x, 7, chessArr[16][8].position.z);
        playerNowCheck = new THREE.Vector2(8, 16);
        //创建敌人角色
        enemyRole = getCharacter(1);
        enemyRole.position.set(chessArr[0][8].position.x, 7, chessArr[0][8].position.z);
        enemyNowCheck = new THREE.Vector2(8, 0);

        chessBoard.add(cubeMesh);
        scene.add(chessBoard);
        scene.add(playerRole);
        scene.add(enemyRole);
    }

    //创建格子
    function getCheck() {
        var checkMat = new THREE.MeshLambertMaterial({color: 0x0033CC, transparent: true, opacity: 0.8});
        var check = new THREE.Mesh(new THREE.BoxGeometry(checkW, checkH, checkD, 1, 1, 1), checkMat);
        check.name = "check";
        return check;
    }

    //创建缝隙
    function getGap(type) {
        if (type == 1) {
            //竖向
            var gap = new THREE.Mesh(new THREE.BoxGeometry(2, 1, checkD),
                new THREE.MeshBasicMaterial({color: 0xBFE3FE, transparent: true, opacity: 0.5}));
            gap.name = "gap";
        } else {
            //横向
            var gap = new THREE.Mesh(new THREE.BoxGeometry(checkW, 1, 2),
                new THREE.MeshBasicMaterial({color: 0xBFE3FE, transparent: true, opacity: 0.5}));
            gap.name = "gap";
        }
        return gap;
    }

    //创建中间缝隙
    function getMidGap() {
        var obstacle = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2),
            new THREE.MeshBasicMaterial({color: 0xBFE3FE, transparent: true, opacity: 0.9}));
        obstacle.name = "midGap";
        return obstacle;
    }

    //创建角色
    function getCharacter(type) {
        var role = new THREE.Object3D();
        if (type == 0) {
            var body = new THREE.Mesh(new THREE.CylinderGeometry(0, 3, 7, 20), new THREE.MeshPhongMaterial({color: 0xff0000}));
            var head = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.MeshPhongMaterial({color: 0xff0000}));
        } else {
            var body = new THREE.Mesh(new THREE.CylinderGeometry(0, 3, 7, 20), new THREE.MeshPhongMaterial({color: 0xff00ff}));
            var head = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.MeshPhongMaterial({color: 0xff00ff}));
        }
        head.position.set(0, 3, 0);
        role.add(body);
        role.add(head);

        return role;
    }

    //创建阻碍 0为横着 1为竖着
    function getObstacle(type) {
        if (type == 0) {
            var obstacleMat = new THREE.MeshPhongMaterial({color: 0xffff00, shininess: 100});
            var obstacleGeo = new THREE.BoxGeometry(18, 5, 2);
            var obstacle = new THREE.Mesh(obstacleGeo, obstacleMat);
        } else {
            var obstacleMat = new THREE.MeshPhongMaterial({color: 0xffff00});
            var obstacleGeo = new THREE.BoxGeometry(2, 5, 18);
            var obstacle = new THREE.Mesh(obstacleGeo, obstacleMat);
        }
        obstacle.name = "obstacle";
        //scene.add(obstacle);
        return obstacle;
    }

    //创建棋盘修饰
    function getDecorate() {
        var checkMat = new THREE.MeshLambertMaterial({color: 0x0033CC, transparent: true, opacity: 0.8});
        var check = new THREE.Mesh(new THREE.BoxGeometry(checkW, checkH, 15, 1, 1, 1), checkMat);
        check.name = "decorate";
        return check;
    }

    //创建监听器
    function createListener() {
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    }

    //删除监听器
    function removeListener() {
        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
    }


    //响应鼠标移动事件
    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    }

    //响应鼠标点击事件
    function onDocumentMouseDown(event) {
        event.preventDefault();
        window.document.getElementById("WebGL-output").style.cursor = 'move';
        if (enemyTurn) return;
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            orbitControls.enabled = false;
            //如果点击状态为move（0）且点击目标为可移动方块
            if (clickState == 0 && intersects[0].object.name == "check") {
                chessArr.forEach(function (e) {
                    var clickX = e.indexOf(intersects[0].object);
                    var clickY = chessArr.indexOf(e);
                    var offX = clickX - playerNowCheck.x;
                    var offY = clickY - playerNowCheck.y;
                    //判断是否横竖向移动且判断是否有障碍物阻拦
                    if ((Math.abs(offX) == 2 && (clickY == playerNowCheck.y)) ||
                        (Math.abs(offY) == 2 && (clickX == playerNowCheck.x))) {
                        if (chessArr[(playerNowCheck.y + clickY) / 2][(playerNowCheck.x + clickX) / 2].isObs) return;

                        var tween = new TWEEN.Tween(playerRole.position)
                            .to({
                                x: intersects[0].object.position.x,
                                y: playerRole.position.y,
                                z: intersects[0].object.position.z
                            }, 500)
                            .delay(0)
                            .easing(TWEEN.Easing.Linear.None)
                            .onComplete(handleComplete);
                        tween.start();
                        playerNowCheck.x = clickX;
                        playerNowCheck.y = clickY;
                    }
                });
            }
            //如果点击状态为obstacle(1) 且点击目标为可添加阻碍方块
            else if (clickState == 1 && intersects[0].object.name == "gap") {
                if (playerObsArr.length == 0) return;
                //添加过障碍物的地方不允许再次添加
                if (intersects[0].object.isAllow == true) return;
                //添加阻碍并规定添加条件
                if (intersects.length > 0) {
                    orbitControls.enabled = false;
                    chessArr.forEach(function (e) {
                        var clickX = e.indexOf(intersects[0].object);
                        var clickY = chessArr.indexOf(e);
                        if (clickX == -1) return;
                        if (clickY % 2 == 0) {
                            scene.add(addObs(1, clickX, clickY));
                        } else {
                            scene.add(addObs(0, clickX, clickY));
                        }
                    });
                    scene.remove(playerObsArr.pop());
                }
                setTimeout(handleComplete, 500);
            }
        }
    }

    //鼠标抬起事件
    function onDocumentMouseUp(event) {
        event.preventDefault();
        orbitControls.enabled = true;
        window.document.getElementById("WebGL-output").style.cursor = 'default';
    }

    //玩家补间回调
    function handleComplete() {
        if (playerNowCheck.y == 0 && playerNowCheck.x == 8) {
            //游戏胜利
            window.document.getElementById("winUI").style.display = "block";
            removeListener();
            return;
        }

        //开始敌方回合
        enemyTurn = true;
        FindPath.updateArr(chessArr);
        var pathAI = FindPath.getPath(enemyNowCheck.x, enemyNowCheck.y, 8, 16);
        var pathPlayer = FindPath.getPath(playerNowCheck.x, playerNowCheck.y, 8, 0);

        if (pathAI == null || pathPlayer == null) {
            //游戏结束，违规
            window.document.getElementById("foulUI").style.display = "block";
            console.log("双方存在路径堵死，无法继续游戏");
            return;
        }

        //AI剩余路线长度大于玩家剩余路线长度,并且AI还有剩余障碍物，执行阻挡
        if (enemyObsArr.length > 0 && (pathAI.length >= pathPlayer.length)) {
            //获取玩家下一步要走方向的空隙gap
            for (var i = 0; i < pathPlayer.length - 1; i++) {
                var customObs = enemyAddObs(getIndexOf(pathPlayer[i], chessArr)[1], getIndexOf(pathPlayer[i], chessArr)[0],
                    getIndexOf(pathPlayer[i + 1], chessArr)[1], getIndexOf(pathPlayer[i + 1], chessArr)[0]);
                if (customObs != undefined) {
                    if (FindPath.getPath(playerNowCheck.x, playerNowCheck.y, 8, 0) == null) {
                        enemyRevocationObs(getIndexOf(pathPlayer[i], chessArr)[1], getIndexOf(pathPlayer[i], chessArr)[0],
                            getIndexOf(pathPlayer[i + 1], chessArr)[1], getIndexOf(pathPlayer[i + 1], chessArr)[0]);
                        console.log("路径堵死, 撤销敌方添加的障碍物");
                        FindPath.updateArr(chessArr);
                    }
                    else {
                        /* //如果还未计算到玩家路径最后一位，则继续寻找最优阻挡方案
                         if (i != pathPlayer.length - 2) {
                         FindPath.updateArr(chessArr);
                         var tempPathAI = FindPath.getPath(enemyNowCheck.x, enemyNowCheck.y, 8, 16);
                         var tempPathPlayer = FindPath.getPath(playerNowCheck.x, playerNowCheck.y, 8, 0);
                         //未找到
                         if(tempPathAI >= tempPathPlayer){
                         enemyRevocationObs(getIndexOf(pathPlayer[i], chessArr)[1], getIndexOf(pathPlayer[i], chessArr)[0],
                         getIndexOf(pathPlayer[i + 1], chessArr)[1], getIndexOf(pathPlayer[i + 1], chessArr)[0]);
                         console.log("不能取胜，撤销敌方添加的障碍物");
                         FindPath.updateArr(chessArr);
                         }
                         //找到
                         else{*/
                        scene.add(customObs);
                        scene.remove(enemyObsArr.pop());
                        FindPath.updateArr(chessArr);
                        break;
                        /* }
                         }
                         //如果计算到最后一位仍不能取胜，则放弃阻挡，选择移动
                         else{
                         var tween = new TWEEN.Tween(enemyRole.position)
                         .to({
                         x: pathAI[1].position.x,
                         y: enemyRole.position.y,
                         z: pathAI[1].position.z
                         }, 500)
                         .delay(0)
                         .easing(TWEEN.Easing.Linear.None)
                         .onComplete(enemyComplete);
                         tween.start();
                         enemyNowCheck.x = getIndexOf(pathAI[1], chessArr)[1];
                         enemyNowCheck.y = getIndexOf(pathAI[1], chessArr)[0];
                         }*/
                    }
                }
            }
            enemyComplete();
        }
        //如果AI剩余路线长度小于或等于玩家剩余路线长度，则选择继续移动
        else {
            var tween = new TWEEN.Tween(enemyRole.position)
                .to({
                    x: pathAI[1].position.x,
                    y: enemyRole.position.y,
                    z: pathAI[1].position.z
                }, 500)
                .delay(0)
                .easing(TWEEN.Easing.Linear.None)
                .onComplete(enemyComplete);
            tween.start();
            enemyNowCheck.x = getIndexOf(pathAI[1], chessArr)[1];
            enemyNowCheck.y = getIndexOf(pathAI[1], chessArr)[0];
        }
    }

    //敌人回合结束调用
    function enemyComplete() {
        if (enemyNowCheck.y == 16 && enemyNowCheck.x == 8) {
            //游戏失败
            window.document.getElementById("loseUI").style.display = "block";
            removeListener();
        } else {
            //敌方回合结束
            enemyTurn = false;
        }
    }

    //敌人添加障碍物
    var enemyObs;

    function enemyAddObs(firstX, firstY, secondX, secondY) {
        enemyObs = undefined;
        var offX = firstX - secondX;
        var offY = firstY - secondY;
        //添加竖向阻碍
        if (offX != 0 && offY == 0) {
            if (!chessArr[firstY][(firstX + secondX) / 2].isAllow) {
                enemyObs = addObs(1, (firstX + secondX) / 2, firstY);
            }
        }
        //添加横向阻碍
        else if (offX == 0 && offY != 0) {
            if (!chessArr[(firstY + secondY) / 2][firstX].isAllow) {
                enemyObs = addObs(0, firstX, (firstY + secondY) / 2);
            }
        }
        return enemyObs;
    }

    //敌人撤销添加障碍物
    function enemyRevocationObs(firstX, firstY, secondX, secondY) {
        var offX = firstX - secondX;
        var offY = firstY - secondY;
        var addX, addY;
        //竖向
        if (offX != 0 && offY == 0) {
            addX = (firstX + secondX) / 2;
            addY = firstY;
            if (addY != 16) {
                chessArr[addY][addX].isObs = false;
                chessArr[addY + 1][addX].isObs = false;
                chessArr[addY + 2][addX].isObs = false;
            }
            else {
                chessArr[addY - 2][addX].isObs = false;
                chessArr[addY - 1][addX].isObs = false;
                chessArr[addY][addX].isObs = false;
            }
        }
        //横向
        else if (offX == 0 && offY != 0) {
            addX = firstX;
            addY = (firstY + secondY) / 2;
            if (addX != 16) {
                chessArr[addY][addX + 2].isObs = false;
                chessArr[addY][addX + 1].isObs = false;
                chessArr[addY][addX].isObs = false;
            } else {
                chessArr[addY][addX - 2].isObs = false;
                chessArr[addY][addX - 1].isObs = false;
                chessArr[addY][addX].isObs = false;
            }
        }
        RevocationObs();
    }

    var obs;
    //记录上一步操作
    var lastStep;
    //添加障碍物方法，0横1竖
    function addObs(type, addX, addY) {
        obs = getObstacle(type);
        //重置上一步操作数组
        lastStep = [];
        //竖的
        if (type == 1) {
            if (addY != 16) {
                obs.position.copy(chessArr[addY + 1][addX].position);
                //属性设置为障碍物
                chessArr[addY][addX].isObs = true;
                chessArr[addY + 1][addX].isObs = true;
                chessArr[addY + 2][addX].isObs = true;
                //状态置为不可再次放置障碍物
                if (addY >= 2) {
                    pushLastOprt(chessArr[addY - 2][addX]);
                }
                if (addY == 12) {
                    pushLastOprt(chessArr[16][addX]);
                }
                pushLastOprt(chessArr[addY][addX]);
                pushLastOprt(chessArr[addY + 1][addX]);
                pushLastOprt(chessArr[addY + 2][addX]);
                if (addX >= 1) {
                    pushLastOprt(chessArr[addY + 1][addX - 1]);
                }
            }
            else {
                obs.position.copy(chessArr[addY - 1][addX].position);
                chessArr[addY - 2][addX].isObs = true;
                chessArr[addY - 1][addX].isObs = true;
                chessArr[addY][addX].isObs = true;

                if (addX >= 1) {
                    pushLastOprt(chessArr[addY - 1][addX - 1]);
                }
                pushLastOprt(chessArr[addY - 4][addX]);
                pushLastOprt(chessArr[addY - 3][addX]);
                pushLastOprt(chessArr[addY - 2][addX]);
                pushLastOprt(chessArr[addY - 1][addX]);
                pushLastOprt(chessArr[addY][addX]);
            }
        }
        //横的
        else {
            if (addX != 16) {
                obs.position.copy(chessArr[addY][addX + 1].position);
                chessArr[addY][addX + 2].isObs = true;
                chessArr[addY][addX + 1].isObs = true;
                chessArr[addY][addX].isObs = true;

                if (addX >= 2) {
                    pushLastOprt(chessArr[addY][addX - 2]);
                }
                if (addX == 12) {
                    pushLastOprt(chessArr[addY][16]);
                }
                pushLastOprt(chessArr[addY][addX + 2]);
                pushLastOprt(chessArr[addY][addX + 1]);
                pushLastOprt(chessArr[addY][addX]);
                if (addY >= 1) {
                    pushLastOprt(chessArr[addY - 1][addX + 1]);
                }
            }
            else {
                obs.position.copy(chessArr[addY][addX - 1].position);
                chessArr[addY][addX - 2].isObs = true;
                chessArr[addY][addX - 1].isObs = true;
                chessArr[addY][addX].isObs = true;

                if (addY >= 1) {
                    pushLastOprt(chessArr[addY - 1][addX - 1]);
                }
                pushLastOprt(chessArr[addY][addX - 4]);
                pushLastOprt(chessArr[addY][addX - 3]);
                pushLastOprt(chessArr[addY][addX - 2]);
                pushLastOprt(chessArr[addY][addX - 1]);
                pushLastOprt(chessArr[addY][addX]);
            }
        }
        obs.position.y = (checkH + obs.geometry.parameters.height) / 2;
        return obs;
    }

    //撤销上一步操作
    function RevocationObs() {
        if (lastStep.length != 0) {
            lastStep.forEach(function (e) {
                e.isAllow = false;
            })
        }
    }

    //检测isAllow属性是否为true，如果为true则置为本次不操作
    function pushLastOprt(tempCheck) {
        if (!tempCheck.isAllow) {
            lastStep.push(tempCheck);
            tempCheck.isAllow = true;
        }
    }

    //键盘按下事件
    /* window.onkeydown = function () {
     if (event.keyCode == '13') {
     FindPath.updateArr(chessArr);
     FindPath.getPath(playerNowCheck.x, playerNowCheck.y, enemyNowCheck.x, enemyNowCheck.y);
     }
     };*/
}

window.onload = init();