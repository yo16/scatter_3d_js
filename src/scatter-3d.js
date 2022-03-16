
var scene = null;
var camera = null;
var light = null;
var renderer = null;

var width = 640;
var height = 480;

//var cube = null;
var elms = [];

function draw_three(){
    // 初期化
    initialize();

    // 要素追加
    add_elements();

}

// 初期化
function initialize(){
    scene = new THREE.Scene();

    // カメラ
    camera = new THREE.PerspectiveCamera( 60, width / height );     // 視野角, アスペクト比, near, far
    camera.position.set(15, 15, 15);    // 位置
    camera.lookAt(new THREE.Vector3(0, 0, 0));  // カメラの向き

    // ライト
    light = new THREE.DirectionalLight(0xFFFFFF, 1);    // 色, 強さ
    scene.add(light);

    // レンダラーを設定
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#cvs_scatter")
    });
    renderer.setSize( width, height );
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild( renderer.domElement );
}

function add_elements(){
    // box
    let geo1 = new THREE.BoxGeometry(1, 1, 1);  // x-width, y-width, z-width
    let material_basic = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    box = new THREE.Mesh( geo1, material_basic );
    box.position.set(0.5, 0.5, 0.5);
    scene.add( box );
    elms.push( box );

    // ドーナッツ
    let geo2 = new THREE.TorusGeometry(2, 1, 30, 90);  // r, tube-r, radialSegments, tubalarSegments
    let material_lamber = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    donut = new THREE.Mesh( geo2, material_lamber );
    donut.position.set(5, 5, 5);
    scene.add( donut );
    elms.push( donut );


}

// アニメーション定義
function animate() {
    for(let i=0; i<elms.length; i++){
        elms[i].rotation.y += 0.01;
    }
    //e1.rotation.y += 0.01;
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
