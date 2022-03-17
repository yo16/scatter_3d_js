
var scene = null;
var camera = null;
var controls = null;
var light = null;
var renderer = null;

var width = 640;
var height = 480;

var pos_psi = 0.25 * Math.PI;
var pos_theta = 0.25 * Math.PI;
var pos_r = 15;

//var cube = null;
var elms = [];

function draw_three(){
    // 初期化
    initialize();

    // 基本要素を追加
    add_basic_elements();

    // 要素追加
    add_elements();

}

// 初期化
function initialize(){
    // シーン
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0xffffff );

    // カメラ
    let camera_width = 30;
    camera = new THREE.OrthographicCamera(-camera_width/2, camera_width/2, camera_width*height/(2*width), -camera_width*height/(2*width));   // left, right, top, bottom, near, far
    camera.position.set(
        pos_r*Math.cos(pos_psi)*Math.cos(pos_theta),
        pos_r*Math.cos(pos_psi)*Math.sin(pos_theta),
        pos_r*Math.sin(pos_psi)
    );
    //let angle = -0.75*Math.PI;
    //camera.up.set(Math.sin(angle), Math.cos(angle), 0); // 回転
    camera.up.set(
        -Math.cos(pos_psi+Math.PI)*Math.cos(pos_theta+Math.PI),
        -Math.cos(pos_psi+Math.PI)*Math.sin(pos_theta+Math.PI),
        -Math.sin(pos_psi+Math.PI)
    ); // 
    camera.lookAt(new THREE.Vector3(0, 0, 0));  // カメラの向き

    // ライト
    // 環境光源
    ambient_light = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambient_light);
    // 平行光源
    light = new THREE.DirectionalLight(0xFFFFFF, 0.5);    // 色, 強さ
    light.position.set(0, 1, 1);
    scene.add(light);

    // レンダラーを設定
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#cvs_scatter")
    });
    renderer.setSize( width, height );
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild( renderer.domElement );
}


// 基本要素を追加
function add_basic_elements(){
    // 底面
    plane_geo = new THREE.PlaneGeometry(10, 10, 1, 1);  // width, height, widthSegments, heightSegments
    plane_mat = new THREE.MeshLambertMaterial( { color: 0x666666 } );
    /* 透過
    plane_mat.opacity = 0.2;
    plane_mat.transparent = true;   // 透過
    plane_mat.depthTest = false;    // 陰面処理
    */
    plane = new THREE.Mesh( plane_geo, plane_mat );
    plane.position.set(5, 5, 0);
    //plane.rotation.x = -0.5 * Math.PI;
    scene.add(plane);

    // 軸    
    const axes = new THREE.AxesHelper(12);
    scene.add(axes);
}


// 要素を追加
function add_elements(){
    // box
    let geo1 = new THREE.BoxGeometry(1, 1, 1);  // x-width, y-width, z-width
    let material_basic = new THREE.MeshLambertMaterial( { color: 0x00aa00 } );
    box = new THREE.Mesh( geo1, material_basic );
    box.position.set(0.5, 0.5, 0.5);
    scene.add( box );
    elms.push( box );

    /*
    // ドーナッツ
    let geo2 = new THREE.TorusGeometry(2, 1, 30, 90);  // r, tube-r, radialSegments, tubalarSegments
    let material_lamber = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    donut = new THREE.Mesh( geo2, material_lamber );
    donut.position.set(5, 5, 5);
    scene.add( donut );
    elms.push( donut );
    */
}

// アニメーション定義
var rot = 0;
function animate() {
    let theta_speed = ((mouseX - width/2) / width) / 80 ;
    pos_theta += theta_speed*Math.PI;
    
    camera.position.set(
        pos_r*Math.cos(pos_psi)*Math.cos(pos_theta),
        pos_r*Math.cos(pos_psi)*Math.sin(pos_theta),
        pos_r*Math.sin(pos_psi)
    );
    camera.up.set(
        -Math.cos(pos_psi+Math.PI)*Math.cos(pos_theta+Math.PI),
        -Math.cos(pos_psi+Math.PI)*Math.sin(pos_theta+Math.PI),
        -Math.sin(pos_psi+Math.PI)
    );
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}

// マウス座標はマウスが動いた時のみ取得できる
var mouseX = 0;
document.addEventListener('mousemove', e => {
	mouseX = e.pageX;
});
