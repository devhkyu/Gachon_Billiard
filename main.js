var dt = 1/60, R = 0.2;
var NORMALIZE = 10;

var ballSize = 0.655;
//ballSize /= NORMALIZE;

// Table Size variables (Real Size)
var TABLE_SIZE_WIDTH = 24.48;
var TABLE_SIZE_HEIGHT = 12.24;
var TABLE_SIZE_DEPTH = 2;
var TABLE_SIDE_SIZE_WIDTH = 0.5;
var TABLE_SIDE_SIZE_HEIGHT = 0.5;
var TABLE_SIDE_SIZE_DEPTH = 3.7;
var TABLE_COL_SIZE_WIDTH = 21.0;
var TABLE_COL_SIZE_HEIGHT = 9.0;
var TABLE_COL_SIZE_DEPTH = 5.0;
/*
// Table Size variables (Normalized)
TABLE_SIZE_WIDTH /= NORMALIZE;
TABLE_SIZE_HEIGHT /= NORMALIZE;
TABLE_SIZE_DEPTH /= NORMALIZE;
TABLE_SIDE_SIZE_WIDTH /= NORMALIZE;
TABLE_SIDE_SIZE_HEIGHT /= NORMALIZE;
TABLE_SIDE_SIZE_DEPTH /= NORMALIZE;
TABLE_COL_SIZE_WIDTH /= NORMALIZE;
TABLE_COL_SIZE_HEIGHT /= NORMALIZE;
TABLE_COL_SIZE_DEPTH /= NORMALIZE;
*/

// Table Size variables (Physics: Ground)
TABLE_GROUND_WIDTH = TABLE_SIZE_WIDTH / 2;
TABLE_GROUND_HEIGHT = TABLE_SIZE_HEIGHT / 2;
TABLE_GROUND_DEPTH = TABLE_SIZE_DEPTH / 2;
TABLE_SIDE_GROUND_WIDTH = TABLE_SIDE_SIZE_WIDTH/2;
TABLE_SIDE_GROUND_HEIGHT = TABLE_SIDE_SIZE_HEIGHT / 2;
TABLE_SIDE_GROUND_DEPTH = TABLE_SIDE_SIZE_DEPTH / 2;

function plane(width, height) {
    return function(u, v) {
        var x = (u-0.5) * width;
        var y = (v+0.5) * height;
        var z = 0;
        return new THREE.Vector3(x, y, z);
    };
}

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer;
var sphereMesh_w, sphereBody_w;
var sphereMesh_y, sphereBody_y;
var sphereMesh_r1, sphereBody_r1;
var sphereMesh_r2, sphereBody_r2;
var table, groundBody;
var object;
var world;

var camera, scene, renderer;
var sphereMesh_w, sphereBody_w;
var sphereMesh_y, sphereBody_y;
var sphereMesh_r1, sphereBody_r1;
var sphereMesh_r2, sphereBody_r2;
var guideLineGeometry, guideLine;
var table, groundBody;
var world;

var distance;
var alpha = 0;
var force = 0;
var force_threshold = 17;
var angle = 0;

var paddleHeight = 10;
var paddleWidth = 75;

var collisionInfo = [[0,0,0],[0,0,0]]//contect info w([0]),y([1]) ball [r1,r2,otherball]
var score = [0,0]//score[w,y]
var now_turn = 0
var gaming = 0
var init_gaming = 0

window.onload = function start(){
    initCannon();
    init();
    animate();
    random_impulse();
    window.onkeydown = function(e){
        if(gaming == 0){
            if(e.which == 37){              // Left
                angle-= 0.1/Math.PI;
            }else if(e.which == 39){       // Right
                angle+= 0.1/Math.PI;
            }else if(e.which == 32){        // Space
                if(force <= force_threshold){
                    force++;
                    console.log(force)
                }
            }else{ }
        }
    }
    window.onkeyup = function(e){
        if(gaming == 0){
            if(e.which == 32){        // Space
                if(now_turn == 0)
                    var worldPoint = sphereBody_w.position;
                else
                    var worldPoint = sphereBody_y.position;
                var forceVec = new CANNON.Vec3(Math.cos(angle), 0.0, Math.sin(angle));
                forceVec.normalize()
                forceVec.scale(force,forceVec)
                worldPoint.y = 1.154
                console.log(forceVec)
                if(now_turn == 0){
                    sphereBody_w.applyImpulse(forceVec, worldPoint);
                }else{
                    sphereBody_y.applyImpulse(forceVec, worldPoint);
                }
                angle = 0;
                force = 0;
            }
        }
    }
}

function initCannon(){
    // World
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(0, -9.87, 0);
    
    // Materials
    var ballMaterial = new CANNON.Material("ballMaterial");
    var groundMaterial = new CANNON.Material("groundMaterial");
    var wallMaterial = new CANNON.Material("wallMaterial");
    var bnbContactMaterial = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
            friction: 0.1,
            restitution: 0.5
    });
    var bngContactMaterial = new CANNON.ContactMaterial(ballMaterial, groundMaterial,{
        friction: 0.01,
        restitution: 0.3
    })
    var bnwContactMaterial = new CANNON.ContactMaterial(ballMaterial, wallMaterial,{
        friction: 0.1,
        restitution: 0.5
    })
    world.addContactMaterial(bnbContactMaterial);
    world.addContactMaterial(bngContactMaterial);
    world.addContactMaterial(bnwContactMaterial);

    var ball_param = {
        mass: 0.25,
        material: ballMaterial,
        linearDamping: 0.5,
        angularDamping: 0.5,
        allowSleep: true,
        sleepSpeedLimit: 0.5,
        sleepTimeLimit: 0.1
    }
    // Create sphere
    var sphereShape_w = new CANNON.Sphere(ballSize);
    sphereBody_w = new CANNON.Body(ball_param);
    sphereBody_w.addShape(sphereShape_w);
    sphereBody_w.position.set(4, 1.154, 0);
    world.addBody(sphereBody_w);

    sphereBody_w.addEventListener("collide",function(e){ 
        if(e.body == sphereBody_r1){
            console.log("collision white and red1")
            collisionInfo[0][0] = 1
        }
        if(e.body == sphereBody_r2){
            console.log("collision white and red2")
            collisionInfo[0][1] = 1
        }
        if(e.body == sphereBody_y){
            console.log("collision white and yellow")
            collisionInfo[0][2] = 1
        }
    });

    // Create sphere
    var sphereShape_y = new CANNON.Sphere(ballSize);
    sphereBody_y = new CANNON.Body(ball_param);
    sphereBody_y.addShape(sphereShape_y);
    sphereBody_y.position.set(0, 1.154, 0);
    world.addBody(sphereBody_y);


    sphereBody_y.addEventListener("collide",function(e){ 
        if(e.body == sphereBody_r1){
            console.log("collision yellow and red1")
            collisionInfo[1][0] = 1
        }
        if(e.body == sphereBody_r2){
            console.log("collision yellow and red2")
            collisionInfo[1][1] = 1
        }
        if(e.body == sphereBody_w){
            console.log("collision white and yellow")
            collisionInfo[1][2] = 1
        }
    });
    // Create sphere
    var sphereShape_r1 = new CANNON.Sphere(ballSize);
    sphereBody_r1 = new CANNON.Body(ball_param);
    sphereBody_r1.addShape(sphereShape_r1);
    sphereBody_r1.position.set(0, 1.154, 4);
    world.addBody(sphereBody_r1);

    // Create sphere
    var sphereShape_r2 = new CANNON.Sphere(ballSize);
    sphereBody_r2 = new CANNON.Body(ball_param);
    sphereBody_r2.addShape(sphereShape_r2);
    sphereBody_r2.position.set(4, 1.154, 4);
    world.addBody(sphereBody_r2);

    // Physics table
    var table_phys = new CANNON.Box(new CANNON.Vec3(TABLE_GROUND_WIDTH,TABLE_GROUND_DEPTH,TABLE_GROUND_HEIGHT));
    var table_side_width_phys = new CANNON.Box(new CANNON.Vec3(TABLE_SIDE_GROUND_WIDTH,TABLE_SIDE_GROUND_DEPTH,TABLE_GROUND_HEIGHT));
    var table_side_height_phys = new CANNON.Box(new CANNON.Vec3(TABLE_GROUND_WIDTH, TABLE_SIDE_GROUND_DEPTH,TABLE_SIDE_GROUND_HEIGHT));
    
    groundBody = new CANNON.Body({ mass: 0,
        material: groundMaterial });
    groundBody.addShape(table_phys);
    
    left_groundBody = new CANNON.Body({ mass: 0,
        material: wallMaterial  });
    left_groundBody.addShape(table_side_width_phys);
    right_groundBody = new CANNON.Body({ mass: 0,
        material: wallMaterial  });
    right_groundBody.addShape(table_side_width_phys);
    up_groundBody = new CANNON.Body({ mass: 0,
        material: wallMaterial  });
    up_groundBody.addShape(table_side_height_phys);
    down_groundBody = new CANNON.Body({ mass: 0,
        material: wallMaterial  });
    down_groundBody.addShape(table_side_height_phys);

    left_groundBody.position.set(-(TABLE_SIZE_WIDTH/2 + TABLE_SIDE_SIZE_WIDTH/2),-0.5,0);
    right_groundBody.position.set(+(TABLE_SIZE_WIDTH/2 + TABLE_SIDE_SIZE_WIDTH/2),-0.5,0);
    up_groundBody.position.set(0,-0.5,+(TABLE_SIZE_HEIGHT/2 + TABLE_SIDE_SIZE_HEIGHT/2));
    down_groundBody.position.set(0,-0.5,-(TABLE_SIZE_HEIGHT/2 + TABLE_SIDE_SIZE_HEIGHT/2));
    groundBody.position.set(0,-0.5,0);

    world.addBody(left_groundBody);
    world.addBody(right_groundBody);
    world.addBody(up_groundBody);
    world.addBody(down_groundBody);
    world.addBody(groundBody);

}

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.5, 10000 );
    camera.position.set(20, 30, 40);
    scene.add( camera );

    // Controls
    controls = new THREE.TrackballControls( camera );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];

    // lights
    var light, materials;
    scene.add( new THREE.AmbientLight( 0x000000 ) );
    light = new THREE.DirectionalLight( 0xffffff, 1.1 );
    light.position.set( 5, 5, 15 );
    scene.add( light );

    //SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
   var positionLight = new THREE.PointLight( 0xFFFFFF, 1, 100 );
   positionLight.position.set( 6,8,0 );
   scene.add( positionLight );
   var positionLight2 = new THREE.PointLight( 0xFFFFFF, 1, 100 );
   positionLight2.position.set( -6,8,0 );
   scene.add( positionLight2 );
   var spotLight3 = new THREE.SpotLight( 0xFFFFFF, 1 );
   spotLight3.position.set( 0, 30, 0 );
   spotLight3.target.position.set( 0, 0, 0 );
   spotLight3.castShadow = true;
   spotLight3.shadowMapWidth = 2048;
   spotLight3.shadowMapHeight = 2048;
   spotLight3.shadowCameraNear = 2;
   spotLight3.shadowCameraFar = 1000;
   scene.add( spotLight3.target);
   scene.add( spotLight3 );

   var loader = new THREE.TextureLoader();
    // White ball
    loader.load('images/whiteball.jpg', function ( texture ) { 
    var ballGeo_w = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_w = new THREE.MeshPhongMaterial( { color: 0xFFFFFF,map : texture,specular:0x777777, shininess: 50, reflectivity: 1.0} );
    sphereMesh_w = new THREE.Mesh( ballGeo_w, ballMaterial_w );
    sphereMesh_w.castShadow = true;
    //sphereMesh.receiveShadow = true;
     scene.add( sphereMesh_w );
    });

    // Yellow ball 1
   loader.load('images/yellowball.jpg', function ( texture ) { 
    var ballGeo_y = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_y = new THREE.MeshPhongMaterial( { color: 0xFFFF00,map : texture,specular:0x777777, shininess: 50, reflectivity: 1.0 } );
    sphereMesh_y = new THREE.Mesh( ballGeo_y, ballMaterial_y );
    sphereMesh_y.castShadow = true;
    //sphereMesh.receiveShadow = true;
    scene.add( sphereMesh_y );
   });

    // Yellow ball 2
    var ballGeo_r1 = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_r1 = new THREE.MeshPhongMaterial( { color: 0xFF0000,specular:0x777777, shininess: 50, reflectivity: 1.0 } );
    sphereMesh_r1 = new THREE.Mesh( ballGeo_r1, ballMaterial_r1 );
    sphereMesh_r1.castShadow = true;
    //sphereMesh.receiveShadow = true;
    scene.add( sphereMesh_r1 );

    // Red ball 1
    var ballGeo_r2 = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_r2 = new THREE.MeshPhongMaterial( { color: 0xFF0000,specular:0x777777, shininess: 50, reflectivity: 1.0 } );
    sphereMesh_r2 = new THREE.Mesh( ballGeo_r2, ballMaterial_r2 );
    sphereMesh_r2.castShadow = true;
    //sphereMesh.receiveShadow = true;
    scene.add( sphereMesh_r2 );

    var guideLineMeterial = new THREE.LineDashedMaterial( {
        color: 0xffffff,
        linewidth: 1,
        scale: 1,
        dashSize: 0.3,
        gapSize: 0.1
    } );
    guideLineGeometry = new THREE.Geometry({verticesNeedUpdate: true});
    guideLineGeometry.computeLineDistances();
    guideLineGeometry.vertices.push((0, 0, 0),new CANNON.Vec3(Math.cos(angle)*force, 0, Math.sin(angle)*force));
    guideLine = new THREE.Line(guideLineGeometry,guideLineMeterial)
    scene.add( guideLine );

    ///////////////////////////////////////////////////////
    // Main Table Board(Geometry, Material)
    loader.load('images/blue.jpg', function ( texture ) {
    var board_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, TABLE_SIZE_DEPTH, TABLE_SIZE_HEIGHT);
    var board_material = new THREE.MeshPhongMaterial({color: 0x2385E0, map: texture, overdraw: 0.5});
    // Main Table Board(Mesh)
    table = new THREE.Mesh(board_geometry, board_material);
    table.receiveShadow = true;
    ///////////////////////////////////////////////////////
    // Side of Table(Geometry, Material)
    var width_side_geometry = new THREE.BoxGeometry(TABLE_SIDE_SIZE_WIDTH, TABLE_SIDE_SIZE_DEPTH, TABLE_SIZE_HEIGHT+TABLE_SIDE_SIZE_HEIGHT*2);
    var height_side_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, TABLE_SIDE_SIZE_DEPTH, TABLE_SIDE_SIZE_HEIGHT);
    var bottom_side_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, (TABLE_SIDE_SIZE_DEPTH-TABLE_SIZE_DEPTH), TABLE_SIZE_HEIGHT);
    var side_material = new THREE.MeshPhongMaterial({color: 0x2385E0, map: texture, overdraw: 0.5});
    
    // Side of Table(Mesh, Position)
    leftSide = new THREE.Mesh(width_side_geometry, side_material);
    leftSide.position.x = - (TABLE_SIZE_WIDTH/2 + TABLE_SIDE_SIZE_WIDTH/2);
    table.add(leftSide);
    rightSide = new THREE.Mesh(width_side_geometry, side_material);
    rightSide.position.x = + (TABLE_SIZE_WIDTH/2 + TABLE_SIDE_SIZE_WIDTH/2);
    table.add(rightSide);
    upSide = new THREE.Mesh(height_side_geometry, side_material);
    upSide.position.z = + (TABLE_SIZE_HEIGHT/2 + TABLE_SIDE_SIZE_HEIGHT/2);
    table.add(upSide);
    downSide = new THREE.Mesh(height_side_geometry, side_material);
    downSide.position.z = - (TABLE_SIZE_HEIGHT/2 + TABLE_SIDE_SIZE_HEIGHT/2);
    table.add(downSide);
    bottomSide = new THREE.Mesh(bottom_side_geometry, side_material);
    bottomSide.position.y = -TABLE_SIZE_DEPTH/2;
    table.add(bottomSide);
    });

    ///////////////////////////////////////////////////////
    // Frame of Table(Geometry, Material)
    loader.load('images/table.jpg', function ( texture ) {
    var frame_mult = 2;
    var width_frame_geometry = new THREE.BoxGeometry(TABLE_SIDE_SIZE_WIDTH*frame_mult, TABLE_SIDE_SIZE_DEPTH, TABLE_SIZE_HEIGHT+TABLE_SIDE_SIZE_HEIGHT*2+TABLE_SIDE_SIZE_WIDTH*frame_mult*2);
    var height_frame_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH+TABLE_SIDE_SIZE_WIDTH*2, TABLE_SIDE_SIZE_DEPTH, TABLE_SIDE_SIZE_HEIGHT*frame_mult);
    var frame_material = new THREE.MeshPhongMaterial({map: texture, overdraw: 0.5});
    // Frame of Table(Mesh, Position)
    leftFrame = new THREE.Mesh(width_frame_geometry, frame_material);
    leftFrame.position.x = (leftSide.position.x-TABLE_SIDE_SIZE_WIDTH*frame_mult/2)-TABLE_SIDE_SIZE_WIDTH/2;
    table.add(leftFrame);
    rightFrame = new THREE.Mesh(width_frame_geometry, frame_material);
    rightFrame.position.x = (rightSide.position.x+TABLE_SIDE_SIZE_WIDTH*frame_mult/2)+TABLE_SIDE_SIZE_WIDTH/2;
    table.add(rightFrame);
    upFrame = new THREE.Mesh(height_frame_geometry, frame_material);
    upFrame.position.z = (upSide.position.z+TABLE_SIDE_SIZE_HEIGHT*frame_mult/2)+TABLE_SIDE_SIZE_HEIGHT/2;
    table.add(upFrame);
    downFrame = new THREE.Mesh(height_frame_geometry, frame_material);
    downFrame.position.z = (downSide.position.z-TABLE_SIDE_SIZE_HEIGHT*frame_mult/2)-TABLE_SIDE_SIZE_HEIGHT/2;
    table.add(downFrame);
    });
    ///////////////////////////////////////////////////////
    // Column of Table(Geometry, Material)
    loader.load('images/table.jpg', function ( texture ) {
    var col_geometry = new THREE.BoxGeometry(TABLE_COL_SIZE_WIDTH, TABLE_COL_SIZE_DEPTH, TABLE_COL_SIZE_HEIGHT);
    var col_material = new THREE.MeshPhongMaterial({map: texture, overdraw: 0.5});
    // Column of Table(Mesh, Position)
    column = new THREE.Mesh(col_geometry, col_material);
    column.position.y = bottomSide.position.y - TABLE_COL_SIZE_DEPTH/2;
    table.add(column);
    ///////////////////////////////////////////////////////
    // Add table
    scene.add(table);
    table.position.copy(groundBody.position)
    });
    ///////////////////////////////////////////////////////


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color );

    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

    renderer.shadowMapEnabled = true;

    window.addEventListener( 'resize', onWindowResize, false );

    camera.lookAt( 0, 0, 0 );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
    requestAnimationFrame( animate );
    controls.update();
    world.step(dt);
    var t = world.time;
    p1_score = document.getElementById('p1_score');
    p2_score = document.getElementById('p2_score');
    p1_score.innerHTML = score[1];
    p2_score.innerHTML = score[0];
    if(init_gaming == 1){
        if(now_turn == 1){
            p1_score.style.background = "#FFE400";
            p2_score.style.background = "#FFFFFF";
        }
        else{
            p1_score.style.background = "#FFFFFF";
            p2_score.style.background = "#FFE400";
        }
    }else{
        p1_score.style.background = "#FFFFFF";
        p2_score.style.background = "#FFFFFF";
    }
    progress_bar = document.getElementById('main');
    progress_bar.style.width = force/(force_threshold+1)*100 + "%";
    render();
}

function render() {
    try{
        var guideLinePosition
        sphereMesh_w.position.copy(sphereBody_w.position);
        sphereMesh_y.position.copy(sphereBody_y.position);
        sphereMesh_w.quaternion.copy(sphereBody_w.quaternion);
        sphereMesh_y.quaternion.copy(sphereBody_y.quaternion);
        sphereMesh_r1.position.copy(sphereBody_r1.position);
        sphereMesh_r2.position.copy(sphereBody_r2.position);
        var y = 1.3
        if(init_gaming==1){
            if(Math.abs(sphereBody_w.velocity.z) + Math.abs(sphereBody_w.velocity.x) > 0.05 || Math.abs(sphereBody_y.velocity.z) + Math.abs(sphereBody_y.velocity.x) > 0.05
                || Math.abs(sphereBody_r1.velocity.z) + Math.abs(sphereBody_r1.velocity.x) > 0.05 || Math.abs(sphereBody_r2.velocity.z) + Math.abs(sphereBody_r2.velocity.x) > 0.05){
                y = -1
                gaming = 1
            }else{
                y = 1.3
                if(gaming == 1){
                    //scoreing
                    if(collisionInfo[now_turn][2] == 1 || (collisionInfo[now_turn][0] == 0 && collisionInfo[now_turn][1] == 0 && collisionInfo[now_turn][2] == 0)){
                        if(score[now_turn]>0)
                            score[now_turn] -= 10
                        if(now_turn >= 1 ){
                            now_turn = 0
                        }else{
                            now_turn = 1
                        }
                    }else{
                        if(collisionInfo[now_turn][0] == 1 && collisionInfo[now_turn][1] == 1){
                            score[now_turn] += 10   
                        }else{
                            if(now_turn >= 1 ){
                                now_turn = 0
                            }else{
                                now_turn = 1
                            }
                        }
                    }
                    collisionInfo = [[0,0,0],[0,0,0]]
                    console.log(score)
                }
                gaming = 0
            }
            if(gaming == 0){
                if(now_turn == 0){
                    guideLinePosition = sphereBody_w.position
                }else{
                    guideLinePosition = sphereBody_y.position
                }
                guideLine.geometry.vertices[0] = new CANNON.Vec3(guideLinePosition.x,y,guideLinePosition.z)
                guideLine.geometry.vertices[1] = new CANNON.Vec3(guideLinePosition.x+Math.cos(angle)*3, y, guideLinePosition.z+Math.sin(angle)*3)
                guideLine.geometry.computeLineDistances();
                guideLine.geometry.verticesNeedUpdate = true;
            }else{
                guideLine.geometry.vertices[0] = new CANNON.Vec3(-1000, -1000, -1000)
                guideLine.geometry.vertices[1] = new CANNON.Vec3(-1000, -1000, -1000)
                guideLine.geometry.computeLineDistances();
                guideLine.geometry.verticesNeedUpdate = true;
            }
        }else{
            if(Math.abs(sphereBody_w.velocity.z) + Math.abs(sphereBody_w.velocity.x) > 0.05 || Math.abs(sphereBody_y.velocity.z) + Math.abs(sphereBody_y.velocity.x) > 0.05
                || Math.abs(sphereBody_r1.velocity.z) + Math.abs(sphereBody_r1.velocity.x) > 0.05 || Math.abs(sphereBody_r2.velocity.z) + Math.abs(sphereBody_r2.velocity.x) > 0.05){
                y = -1
                gaming = 1
            }else{
                init_gaming = 1;
            }
        }
        renderer.render( scene, camera );
    } catch(error){
        console.log(error)
    } 
}

function random_impulse(){
    var wp_w = sphereBody_w.position;
    var wp_y = sphereBody_y.position;
    var wp_r1 = sphereBody_r1.position;
    var wp_r2 = sphereBody_r1.position;
    wp_w.y = 1.154
    wp_y.y = 1.154
    wp_r1.y = 1.154
    wp_r2.y = 1.154
    angle1 = Math.floor(Math.random() * 10)/Math.PI;
    angle2 = Math.floor(Math.random() * 10)/Math.PI;
    angle3 = Math.floor(Math.random() * 10)/Math.PI;
    angle4 = Math.floor(Math.random() * 10)/Math.PI;
    force1 = Math.floor(Math.random() * 10) + 1;
    force2 = Math.floor(Math.random() * 10) + 1;
    force3 = Math.floor(Math.random() * 10) + 1;
    force4 = Math.floor(Math.random() * 10) + 1;

    var forceVec1 = new CANNON.Vec3(Math.cos(angle1), 0.0, Math.sin(angle1));
    forceVec1.normalize()
    forceVec1.scale(force1,forceVec1)
    var forceVec2 = new CANNON.Vec3(Math.cos(angle2), 0.0, Math.sin(angle2));
    forceVec2.normalize()
    forceVec2.scale(force2,forceVec2)
    var forceVec3 = new CANNON.Vec3(Math.cos(angle3), 0.0, Math.sin(angle3));
    forceVec3.normalize()
    forceVec3.scale(force3,forceVec3)
    var forceVec4 = new CANNON.Vec3(Math.cos(angle4), 0.0, Math.sin(angle4));
    forceVec4.normalize()
    forceVec4.scale(force4,forceVec4)

    sphereBody_w.applyImpulse(forceVec1, wp_w);
    sphereBody_y.applyImpulse(forceVec2, wp_y);
    sphereBody_r1.applyImpulse(forceVec3, wp_r1);
    sphereBody_r2.applyImpulse(forceVec4, wp_r2);
}