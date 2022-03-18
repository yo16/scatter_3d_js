/*
scatter_3d
Copyright (c) 2022 yo16
Released under the MIT license
*/

function scatter_3d(canvas_id, data){
    // 描画するCanvas
    const cvs = document.querySelector("#"+canvas_id);
    const cvs_rect = cvs.getBoundingClientRect();

    // three.jsのオブジェクト
    var scene = null;
    var camera = null;
    var light = null;
    var renderer = null;
    var elms = [];

    // 位置計算用の変数
    const box_size = 100;
    var pos_psi = (1/6) * Math.PI;
    var pos_theta = 0.25 * Math.PI;
    var target_psi = pos_psi;
    var target_theta = pos_theta;
    var pos_r = box_size*1.5;


    // メイン処理
    function main(elm_id, data){
        // 初期化
        initialize_threejs(elm_id);

        // 基本要素を追加
        add_basic_elements();

        // 要素追加
        add_elements(data);

        // ドラッグイベントリスナー登録
        regist_drag_event(elm_id);

        // アニメーション開始
        animate();
    }


    // Three.js 初期化
    function initialize_threejs(elm_id){
        // シーン
        scene = new THREE.Scene();
        //scene.background = new THREE.Color( 0xffffff );

        // カメラ
        let camera_width = box_size*3;
        camera = new THREE.OrthographicCamera(
            -camera_width/2,
            camera_width/2,
            camera_width*cvs_rect.height/(2*cvs_rect.width),
            -camera_width*cvs_rect.height/(2*cvs_rect.width)
        );   // left, right, top, bottom, near, far
        // 位置を設定
        set_camera_pos();

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
            canvas: cvs
        });
        renderer.setSize( cvs_rect.width, cvs_rect.height );
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild( renderer.domElement );
    }


    // 基本要素を追加
    function add_basic_elements(){
        // 底面
        plane_geo = new THREE.PlaneGeometry(box_size, box_size, 1, 1);  // width, height, widthSegments, heightSegments
        plane_mat = new THREE.MeshLambertMaterial( { color: 0x666666 } );
        plane_mat.side = THREE.DoubleSide;  // 裏も見える
        /* 透過
        plane_mat.opacity = 0.2;
        plane_mat.transparent = true;   // 透過
        plane_mat.depthTest = false;    // 陰面処理
        */
        plane = new THREE.Mesh( plane_geo, plane_mat );
        scene.add(plane);

        // 軸    
        const axes = new THREE.AxesHelper(box_size/2);
        scene.add(axes);
    }


    // 要素を追加
    function add_elements(data){
        // box
        let geo1 = new THREE.BoxGeometry(box_size/10, box_size/10, box_size/10);  // x-width, y-width, z-width
        let material_basic = new THREE.MeshLambertMaterial( { color: 0x00aa00 } );
        box = new THREE.Mesh( geo1, material_basic );
        box.position.set(box_size/20, box_size/20, box_size/20);
        scene.add( box );
        elms.push( box );
    }


    // アニメーション定義
    function animate() {
        pos_psi += (target_psi - pos_psi)*0.3;
        pos_theta += (target_theta - pos_theta)*0.3;

        // カメラ位置を再計算
        set_camera_pos();
        
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
    }


    // カメラの位置を計算
    function set_camera_pos(){
        let cos_psi = Math.cos(pos_psi);
        let sin_psi = Math.sin(pos_psi);
        camera.position.set(
            pos_r*cos_psi*Math.cos(pos_theta),
            pos_r*cos_psi*Math.sin(pos_theta),
            pos_r*sin_psi
        );
        camera.up.set(
            sin_psi*Math.cos(pos_theta+Math.PI),
            sin_psi*Math.sin(pos_theta+Math.PI),
            cos_psi
        );
        camera.lookAt(new THREE.Vector3(0, 0, 0));

    }


    // ドラッグイベント
    function regist_drag_event(){
        cvs.onmousedown = function(event){
            let start_x = event.offsetX;
            let start_y = event.offsetY;

            let start_pos_theta = pos_theta;
            let start_pos_psi = pos_psi;

            // 移動処理
            function moveTo(pos_x, pos_y){
                let diff_x = start_x - pos_x;
                target_theta = start_pos_theta + diff_x*0.005;

                let diff_y = pos_y - start_y;
                target_psi = start_pos_psi + diff_y*0.005;
            }

            // ドラッグ中の移動
            function onMouseMove(event){
                if(
                    (event.clientX<cvs_rect.left) || (cvs_rect.right<event.clientX) ||
                    (event.clientY<cvs_rect.top) || (cvs_rect.bottom<event.clientY)
                ){
                    endDragging();
                    return;
                }
                moveTo(event.offsetX, event.offsetY);
            }

            // ドラッグ終了
            function endDragging(){
                document.removeEventListener('mousemove', onMouseMove);
                cvs.onmouseup = null;
            }

            // イベントリスナー
            document.addEventListener('mousemove', onMouseMove);
            cvs.onmouseup = function(){
                endDragging();
            }
        };
    }

    // 処理開始
    main(canvas_id, data);
}