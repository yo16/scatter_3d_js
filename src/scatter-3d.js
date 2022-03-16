
var scene = null;
var camera = null;
var light = null;
var renderer = null;

var width = 500;
var height = 500;

//var cube = null;
var elms = [];

function draw_three(){
    // 初期化
    initialize();

    add_elements();

}

// 初期化
function initialize(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
    camera.position.z = 5;

    // ライト
    light = new THREE.DirectionalLight(0xFFFFFF, 1);
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
    let geometry = new THREE.BoxGeometry();
    let material_basic = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    box = new THREE.Mesh( geometry, material_basic );
    scene.add( box );
    elms.push( box );
    
    /*
    let material_lamber = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
    cube = new THREE.Mesh( geometry, material_lamber );
    scene.add( cube );
    */


}

function animate() {
    for(let i=0; i<elms.length; i++){
        elms[i].rotation.y += 0.01;
    }
    //e1.rotation.y += 0.01;
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
