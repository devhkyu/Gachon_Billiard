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

var distance;
var alpha = 0;
var force = 0;
var angle = 0;

var paddleHeight = 10;
var paddleWidth = 75;

window.onload = function start(){
    initCannon();
    init();
    animate();
    window.onkeydown = function(e){
        if(e.which == 37){              // Left
            angle--;
        }else if(e.which == 39){       // Right
            angle++;
        }else if(e.which == 32){        // Space
            force++;
        }else{ }
    }
    window.onkeyup = function(e){
        if(e.which == 32){        // Space
            var impulse = new CANNON.Vec3(Math.cos(angle), 0, Math.sin(angle));
            alert(impulse)
            var worldPoint = new CANNON.Vec3(0, 0, 0);
            sphereBody_w.applyImpulse(impulse, worldPoint);
            angle = 0;
            force = 0;
        }
    }
}

function initCannon(){
    // World
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(0, -9.82, 0);
    
    // Materials
    var ballMaterial = new CANNON.Material("ballMaterial");
    var groundMaterial = new CANNON.Material("groundMaterial");
    var wallMaterial = new CANNON.Material("wallMaterial");
    var bnbContactMaterial = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
            friction: 0.01,
            restitution: 0.5
    });
    var bngContactMaterial = new CANNON.ContactMaterial(ballMaterial, groundMaterial,{
        friction: 0.7,
        restitution: 0.1
    })
    var bnwContactMaterial = new CANNON.ContactMaterial(ballMaterial, wallMaterial,{
        friction: 0.5,
        restitution: 0.9
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
    sphereBody_w.position.set(4, 1.4, 0);
    sphereBody_w.applyImpulse(new CANNON.Vec3(-5,0,0),new CANNON.Vec3(4,1.3,0))
    world.addBody(sphereBody_w);


    // Create sphere
    var sphereShape_y = new CANNON.Sphere(ballSize);
    sphereBody_y = new CANNON.Body(ball_param);
    sphereBody_y.addShape(sphereShape_y);
    sphereBody_y.position.set(0, 1.4, 0);
    world.addBody(sphereBody_y);

    // Create sphere
    var sphereShape_r1 = new CANNON.Sphere(ballSize);
    sphereBody_r1 = new CANNON.Body(ball_param);
    sphereBody_r1.addShape(sphereShape_r1);
    sphereBody_r1.position.set(0, 1.4, 4);
    world.addBody(sphereBody_r1);

    // Create sphere
    var sphereShape_r2 = new CANNON.Sphere(ballSize);
    sphereBody_r2 = new CANNON.Body(ball_param);
    sphereBody_r2.addShape(sphereShape_r2);
    sphereBody_r2.position.set(4, 1.4, 4);
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
    var d = 10;

    light.position.set( 5, 5, 15 );

    light.castShadow = true;
    // light.shadowCameraVisible = true;

    light.shadowMapWidth = 1024*2;
    light.shadowMapHeight = 1024*2;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 3*d;
    light.shadowCameraNear = d;
    light.shadowDarkness = 0.5;

    scene.add( light );

    // White ball
    var loader = new THREE.TextureLoader();
   loader.load('images/whiteball.png', function ( texture ) {
       var ballGeo_w = new THREE.SphereGeometry( ballSize, 20, 20 );
       var ballMaterial_w = new THREE.MeshPhongMaterial({map: texture, overdraw: 0.5});
       sphereMesh_w = new THREE.Mesh( ballGeo_w, ballMaterial_w );
       sphereMesh_w.castShadow = true;
       scene.add( sphereMesh_w );
   });
   


    // Yellow ball 1
   loader.load('images/yellowball.png', function ( texture ) {
       var ballGeo_y = new THREE.SphereGeometry( ballSize, 20, 20 );
       var ballMaterial_y = new THREE.MeshPhongMaterial({map: texture, overdraw: 0.5});
       sphereMesh_y = new THREE.Mesh( ballGeo_y, ballMaterial_y );
      sphereMesh_y.castShadow = true;
       scene.add( sphereMesh_y );
   });

  

    // Yellow ball 2
    var ballGeo_r1 = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_r1 = new THREE.MeshPhongMaterial( { color: 0xFF0000 } );
    sphereMesh_r1 = new THREE.Mesh( ballGeo_r1, ballMaterial_r1 );
    sphereMesh_r1.castShadow = true;
    //sphereMesh.receiveShadow = true;
    scene.add( sphereMesh_r1 );

    // Red ball 1
    var ballGeo_r2 = new THREE.SphereGeometry( ballSize, 20, 20 );
    var ballMaterial_r2 = new THREE.MeshPhongMaterial( { color: 0xFF0000 } );
    sphereMesh_r2 = new THREE.Mesh( ballGeo_r2, ballMaterial_r2 );
    sphereMesh_r2.castShadow = true;
    //sphereMesh.receiveShadow = true;
    scene.add( sphereMesh_r2 );

    ///////////////////////////////////////////////////////
    // Main Table Board(Geometry, Material)
    var board_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, TABLE_SIZE_DEPTH, TABLE_SIZE_HEIGHT);
    var board_material = new THREE.MeshPhongMaterial({color: 0x2385E0});
    // Main Table Board(Mesh)
    table = new THREE.Mesh(board_geometry, board_material);
    ///////////////////////////////////////////////////////
    // Side of Table(Geometry, Material)
    var width_side_geometry = new THREE.BoxGeometry(TABLE_SIDE_SIZE_WIDTH, TABLE_SIDE_SIZE_DEPTH, TABLE_SIZE_HEIGHT+TABLE_SIDE_SIZE_HEIGHT*2);
    var height_side_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, TABLE_SIDE_SIZE_DEPTH, TABLE_SIDE_SIZE_HEIGHT);
    var bottom_side_geometry = new THREE.BoxGeometry(TABLE_SIZE_WIDTH, (TABLE_SIDE_SIZE_DEPTH-TABLE_SIZE_DEPTH), TABLE_SIZE_HEIGHT);
    var side_material = new THREE.MeshPhongMaterial({color: 0x2385E0});
    var frame_mult = 2;
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
    ///////////////////////////////////////////////////////
    // Frame of Table(Geometry, Material)
   loader.load('images/table.jpg', function ( texture ) {
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
    var col_geometry = new THREE.BoxGeometry(TABLE_COL_SIZE_WIDTH, TABLE_COL_SIZE_DEPTH, TABLE_COL_SIZE_HEIGHT);
    var col_material = new THREE.MeshPhongMaterial({color: 0x810000});
    // Column of Table(Mesh, Position)
    column = new THREE.Mesh(col_geometry, col_material);
    column.position.y = bottomSide.position.y - TABLE_COL_SIZE_DEPTH/2;
    table.add(column);
    ///////////////////////////////////////////////////////
    // Add table
    scene.add(table);
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

//

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
    render();
}

function render() {
    sphereMesh_w.position.copy(sphereBody_w.position);
    sphereMesh_y.position.copy(sphereBody_y.position);
    sphereMesh_r1.position.copy(sphereBody_r1.position);
    sphereMesh_r2.position.copy(sphereBody_r2.position);
    table.position.copy(groundBody.position);
    renderer.render( scene, camera );
}