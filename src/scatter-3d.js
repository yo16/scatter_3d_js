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

    // データの情報
    var data_summary = {};


    // メイン処理
    function main(elm_id, data){
        // データを初期分析
        initialize_data(data);

        // three.jsを初期化
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


    // データを初期分析
    function initialize_data(data){
        // 全座標のmin/maxを取得
        data_summary['x_min'] = Math.min(...data.map(d => d[0]));
        data_summary['y_min'] = Math.min(...data.map(d => d[1]));
        data_summary['z_min'] = Math.min(...data.map(d => d[2]));
        data_summary['x_max'] = Math.max(...data.map(d => d[0]));
        data_summary['y_max'] = Math.max(...data.map(d => d[1]));
        data_summary['z_max'] = Math.max(...data.map(d => d[2]));
        data_summary['min'] = Math.min(data_summary['x_min'], data_summary['y_min'], data_summary['z_min']);
        data_summary['max'] = Math.max(data_summary['x_max'], data_summary['y_max'], data_summary['z_max']);

        let notch = get_div_notch(data_summary['min'], data_summary['max']);
        data_summary['axis_notch'] = notch;

        console.log(data_summary);
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



// min～maxを適切な具合に分ける目盛りを得る
// https://www.eng.niigata-u.ac.jp/~nomoto/21.html
function get_div_notch(min, max){
    // sep_num分割したときの幅を返す
    function get_notch_width(range, sep_num){
        //console.log('get_notch_width('+range+','+sep_num+')');
        // 厳密な分割幅
        let notch_width_explict = range / sep_num;
        //console.log('notch_width_explict:'+notch_width_explict);
        let log_nwe = Math.log10(notch_width_explict);
        //console.log('log_nwe:'+log_nwe);
        let order = Math.floor(log_nwe);
        //console.log('order:'+order);
        // 最終的な分割幅になる候補のlog値
        const candidates = [
            Math.log10(5) + order - 1,
                            order,      // log10(1)
            Math.log10(2) + order,
            Math.log10(5) + order,
                            order + 1   // log10(1)
        ];
        // 差
        const diffs = candidates.map(num => {
            return Math.abs(num - log_nwe);
        });
        //console.log(diffs);
        // 差の最小値
        const min_diff = Math.min(...diffs);
        // 分割幅（logとかやるから誤差が生じる）
        const notch_width = Math.round(10**candidates[diffs.indexOf(min_diff)]);
        // 結果
        //console.log('return(notch_width): '+notch_width);
        return notch_width;
    }

    // 軸の分割幅を決める
    let range = max - min;
    // 5～10分割してみて、(1 or 2 or 5)*(10**n)に丸めて、改めてそれで分割して、8分割に近い幅を採用する
    let best_sep_num = 0;
    let best_notch_width = 0;
    let best_sep_i = -1;
    //console.log('range:'+range);
    for(let i=5; i<=10; i++){
        //console.log('-------- looooooooooop -------' + i);
        // i分割してみる
        const cur_notch_width = get_notch_width(range, i);
        //console.log('cur_notch_width:'+cur_notch_width);
        const axis_min = min - min % cur_notch_width;
        const axis_max = max - max % cur_notch_width
            + (((max % cur_notch_width)==0)?0:cur_notch_width);
        //console.log('axis_min/max: '+axis_min+'/'+axis_max);
        const axis_width = axis_max - axis_min;
        const cur_sep_num = axis_width / cur_notch_width;

        if ((best_sep_i<0) || (Math.abs(8-cur_sep_num)<Math.abs(8-best_sep_num))){
            //console.log('-----------------');
            //console.log(axis_min);
            //console.log(axis_max);
            //console.log(cur_sep_num);
            //console.log(cur_notch_width);
            best_sep_i = i;
            best_sep_num = cur_sep_num;
            best_notch_width = cur_notch_width;
        }
    }
    //console.log('===========');
    //console.log('i: '+best_sep_i);
    //console.log('notch_width:' + best_notch_width);

    return best_notch_width;
}


// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
 function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }
  
  // Decimal round
  const round10 = (value, exp) => decimalAdjust('round', value, exp);
  // Decimal floor
  const floor10 = (value, exp) => decimalAdjust('floor', value, exp);
  // Decimal ceil
  const ceil10 = (value, exp) => decimalAdjust('ceil', value, exp);
  