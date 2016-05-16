/**
 * Created by Administrator on 2016/5/12.
 */
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
    var clickState = 1;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 100;
    camera.position.z = 100;

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var orbitControls = new THREE.OrbitControls(camera);
    var clock = new THREE.Clock();

    var controls = new function () {
        this.move = function () {
            if (clickState == 1) {
                clickState = 0;
            }
        };
        this.addObs = function () {
            if (clickState == 0) {
                clickState = 1;
            }
        };
    };

    var gui = new dat.GUI();
    gui.add(controls,"move");
    gui.add(controls, "addObs");

    createLights();
    createChessBoard();
    createListener();


    window.document.getElementById("WebGL-output").appendChild(renderer.domElement);

    render();

    //update
    function render() {
        //控制摄像机
        var delta = clock.getDelta();
        orbitControls.update(delta);

        requestAnimationFrame(render);
        renderer.render(scene, camera);
        TWEEN.update();
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
        //棋盘group
        var chessBoard = new THREE.Group();
        //棋盘底
        var cubeGeo = new THREE.BoxGeometry(boardW, boardH, boardD, 1, 1, 1);
        var cubeTexture = new THREE.ImageUtils.loadTexture("Pic/wood-2.jpg");
        var cubeMesh = new THREE.Mesh(cubeGeo, new THREE.MeshPhongMaterial({map: cubeTexture}));
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
                            0,
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
        var checkMat = new THREE.MeshLambertMaterial({color: 0x000000, transparent: true, opacity: 0.8});
        var check = new THREE.Mesh(new THREE.BoxGeometry(checkW, checkH, checkD, 1, 1, 1), checkMat);
        check.name = "check";
        return check;
    }

    //创建缝隙
    function getGap(type) {
        if (type == 1) {
            //竖向
            var gap = new THREE.Mesh(new THREE.BoxGeometry(2, 2, checkD),
                new THREE.MeshPhongMaterial({color: 0x00ffff, transparent: true, opacity: 0.3}));
            gap.name = "gap";
        } else {
            //横向
            var gap = new THREE.Mesh(new THREE.BoxGeometry(checkW, 2, 2),
                new THREE.MeshPhongMaterial({color: 0x00ffff, transparent: true, opacity: 0.3}));
            gap.name = "gap";
        }
        return gap;
    }

    //创建中间缝隙
    function getMidGap() {
        var obstacle = new THREE.Mesh(new THREE.BoxGeometry(2, checkH, 2),
            new THREE.MeshPhongMaterial({color: 0xffff00, transparent: true, opacity: 0.3}));
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
        scene.add(obstacle);
        return obstacle;
    }

    //创建监听器
    function createListener() {
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    }

    var obs;
    //响应鼠标移动事件
    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    }

    //响应鼠标点击事件
    function onDocumentMouseDown(event) {
        event.preventDefault();
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            orbitControls.enabled = false;
            //如果点击状态为move（0）且点击目标为可移动方块
            if (clickState == 0 && intersects[0].object.name == "check") {
                chessArr.forEach(function (e) {
                    var clickX = e.indexOf(intersects[0].object);
                    var clickY = chessArr.indexOf(e);
                    if ((Math.abs(clickX - playerNowCheck.x) == 2 && (clickY == playerNowCheck.y)) ||
                        (Math.abs(clickY - playerNowCheck.y) == 2 && (clickX == playerNowCheck.x))) {
                        var tween = new TWEEN.Tween(playerRole.position)
                            .to({
                                x: intersects[0].object.position.x,
                                y: playerRole.position.y,
                                z: intersects[0].object.position.z
                            })
                            .delay(0)
                            .easing(TWEEN.Easing.Linear.None);
                        tween.start();
                        playerNowCheck.x = clickX;
                        playerNowCheck.y = clickY;
                    }
                });
            }
            //如果点击状态为obstacle(1) 且点击目标为可添加阻碍方块
            else if (clickState == 1 && intersects[0].object.name == "gap") {
                //添加阻碍
                if (intersects.length > 0) {
                    orbitControls.enabled = false;
                    chessArr.forEach(function (e) {
                        var clickX = e.indexOf(intersects[0].object);
                        var clickY = chessArr.indexOf(e);

                        if (clickX == -1) return;
                        if (clickY % 2 == 0) {
                            //竖的
                            obs = getObstacle(1);
                            if (clickY != 16) {
                                obs.position.copy(chessArr[clickY + 1][clickX].position);
                            } else {
                                obs.position.copy(chessArr[clickY - 1][clickX].position);
                            }
                        } else {
                            //横的
                            obs = getObstacle(0);
                            if (clickX != 16) {
                                obs.position.copy(chessArr[clickY][clickX + 1].position);
                            } else {
                                obs.position.copy(chessArr[clickY][clickX - 1].position);
                            }
                        }
                    })
                }
                obs.position.y += checkH - 1;
            }
        }
    }

    //鼠标抬起事件
    function onDocumentMouseUp(event) {
        event.preventDefault();
        orbitControls.enabled = true;
        window.document.getElementById("WebGL-output").style.cursor = 'pointer';
    }
}

window.onload = init();