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
    const box_padding = 5;
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
        regist_drag_event();

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

        //console.log(data_summary);
    }


    // Three.js 初期化
    function initialize_threejs(elm_id){
        // シーン
        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xffffff );

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


    // グラフの座標値をthree.js内の座標値へ変換
    const val_to_pos = (v, graph_min, graph_max) => {
        return (box_size/(graph_max-graph_min))*(v-graph_min) - box_size/2;
    }
    
    // 基本要素を追加
    function add_basic_elements(){
        // padding込みのサイズ
        const box_size_p = box_size + box_padding*2;
        const box_size_p_h = box_size_p/2;  // half

        // 背景面
        {
            let plane_geo_xy = new THREE.PlaneGeometry(box_size_p, box_size_p, 1, 1);
            let plane_geo_yz = new THREE.PlaneGeometry(box_size_p, box_size_p, 1, 1);
            let plane_geo_zx = new THREE.PlaneGeometry(box_size_p, box_size_p, 1, 1);
            let plane_mat = new THREE.MeshLambertMaterial( {
                color: 0x999999,
                side: THREE.DoubleSide, // 裏も見える
                transparent: true,      // 透過
                opacity: 0.1,
                depthTest: false        // 陰面処理
            } );
            let plane_xy = new THREE.Mesh( plane_geo_xy, plane_mat );
            plane_xy.position.z -= box_size_p/2;
            let plane_yz = new THREE.Mesh( plane_geo_yz, plane_mat );
            plane_yz.rotation.x += Math.PI/2;
            plane_yz.position.y -= box_size_p/2;
            let plane_zx = new THREE.Mesh( plane_geo_zx, plane_mat );
            plane_zx.rotation.y += Math.PI/2;
            plane_zx.position.x -= box_size_p/2;
            scene.add(plane_xy);
            scene.add(plane_yz);
            scene.add(plane_zx);

            // 背景面上の線
            let plane_line_mat = new THREE.LineBasicMaterial( {
                color: 0x6666cc,
                transparent: true,  // 透過
                opacity: 0.2
            } );
            const line_over_len = 2;
            for(let i=data_summary['min']; i<=data_summary['max']; i+=data_summary['axis_notch']){
                const vtp_i = val_to_pos(i, data_summary['min'], data_summary['max']);
                // xy->yz
                const p1 = [
                    new THREE.Vector3( box_size_p_h+line_over_len, vtp_i, -box_size_p_h),
                    new THREE.Vector3(-box_size_p_h              , vtp_i, -box_size_p_h),
                    new THREE.Vector3(-box_size_p_h              , vtp_i,  box_size_p_h)
                ];
                const g1 = new THREE.BufferGeometry().setFromPoints(p1);
                const l1 = new THREE.Line(g1, plane_line_mat);
                scene.add(l1);
                // xy->zx
                const p2 = [
                    new THREE.Vector3(vtp_i,  box_size_p_h+line_over_len, -box_size_p_h),
                    new THREE.Vector3(vtp_i, -box_size_p_h              , -box_size_p_h),
                    new THREE.Vector3(vtp_i, -box_size_p_h              ,  box_size_p_h)
                ];
                const g2 = new THREE.BufferGeometry().setFromPoints(p2);
                const l2 = new THREE.Line(g2, plane_line_mat);
                scene.add(l2);
                // zx->yz
                const p3 = [
                    new THREE.Vector3( box_size_p_h+line_over_len, -box_size_p_h, vtp_i),
                    new THREE.Vector3(-box_size_p_h              , -box_size_p_h, vtp_i),
                    new THREE.Vector3(-box_size_p_h              ,  box_size_p_h, vtp_i)
                ];
                const g3 = new THREE.BufferGeometry().setFromPoints(p3);
                const l3 = new THREE.Line(g3, plane_line_mat);
                scene.add(l3);
            }
        }

        // 数値軸
        {
            const points = [
                new THREE.Vector3(box_size_p_h,-box_size_p_h,box_size_p_h),
                new THREE.Vector3(box_size_p_h,-box_size_p_h,-box_size_p_h),
                new THREE.Vector3(box_size_p_h, box_size_p_h, -box_size_p_h),
                new THREE.Vector3(-box_size_p_h, box_size_p_h, -box_size_p_h)
            ];
            let line_geo = new THREE.BufferGeometry()
                .setFromPoints(points);
            const axis_mat = new THREE.LineBasicMaterial({
                color: 0x666666
            });
            const line = new THREE.Line(line_geo, axis_mat);
            scene.add(line);
        }

        // 軸の数字
        {
            // 文字用のcanvasを作る
            // 参考
            // https://astatsuya.medium.com/three-js%E3%81%A7%E5%B8%B8%E3%81%AB%E6%AD%A3%E9%9D%A2%E3%82%92%E5%90%91%E3%81%8F%E9%95%B7%E6%96%B9%E5%BD%A2%E3%81%AE%E6%96%87%E5%AD%97%E3%83%A9%E3%83%99%E3%83%AB%E3%82%92%E6%8F%8F%E7%94%BB%E3%81%99%E3%82%8B-fa606ed6752
            // Canvasにtextsを描いて返す
            const create_canvas_for_texture = (
                texts, canvas_width, canvas_height, padding, align="right", reverse=false
            ) => {
                // textsのposをcanvas内の座標値に変換
                const three2canvas = (t_value, box_height, cvs_height) => {
                    // boxの中心(box=0)とcanvasの中心(canvas=cvs_h/2)は一致している前提
                    return (cvs_height/(box_height+padding*2))*t_value + cvs_height/2;
                };

                // canvas
                const canvas_for_text = document.createElement("canvas");
                const ctx = canvas_for_text.getContext("2d");
                ctx.canvas.width = canvas_width;
                ctx.canvas.height = canvas_height;
                //ctx.fillStyle = 'rgba(255,0,0, 0.5)';                     // for debug
                //ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);    // for debug

                // 文字を描く
                // 定義
                ctx.fillStyle = "rgb(51, 51, 51)";
                const font_size = Math.floor(canvas_height/20); // 1/10よりは小さく
                const text_padding = font_size/2;   // フォントサイズ(高さ)の半分くらい
                ctx.font = font_size+"px serif";
                ctx.textAlign = align;
                let text_pos = (align=="left") ? text_padding: canvas_width - text_padding;
                ctx.textBaseline = "middle";
                // 書く
                for(let i=0; i<texts.length; i++){
                    let cur_text = (reverse)?texts[texts.length-i-1].text:texts[i].text;
                    let cur_pos = texts[i].pos;
                    ctx.fillText(
                        cur_text,
                        text_pos,
                        three2canvas(cur_pos, box_size, canvas_height)
                    );
                }
                return canvas_for_text;
            };

            // TextureをMeshにして返す
            const create_label_plane = (texture, size) => {
                const mat = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide, // 裏も見える
                    transparent: true,      // 透過
                    opacity: 1,
                    depthTest: false        // 陰面処理
                });
                const plane_geo = new THREE.PlaneGeometry(size.width, size.height, 1, 1);
                let plane = new THREE.Mesh( plane_geo, mat );
                return plane
            }
            // 数値軸の文字
            let axis_texts = [];
            for(let i=data_summary['min']; i<=data_summary['max']; i+=data_summary['axis_notch']){
                axis_texts.push({text:i, pos:val_to_pos(i, data_summary['min'], data_summary['max'])});
            }
            // plateのサイズ
            const axis_plate_width = box_size_p/4, axis_plate_heiht = box_size_p;
            // canvasを作成
            const canvas_size_rate = 5;     // 大きめに作らないと字がぼやける
            const cvs_axis_left = create_canvas_for_texture(
                axis_texts,
                axis_plate_width*canvas_size_rate, axis_plate_heiht*canvas_size_rate,
                box_padding,
                "left"
            );
            const cvs_axis_right = create_canvas_for_texture(
                axis_texts,
                axis_plate_width*canvas_size_rate, axis_plate_heiht*canvas_size_rate,
                box_padding,
                "right"
            );
            const cvs_axis_right_reverse = create_canvas_for_texture(
                axis_texts,
                axis_plate_width*canvas_size_rate, axis_plate_heiht*canvas_size_rate,
                box_padding,
                "right",
                true
            );
            // textureを作成
            const canvas_texture_l = new THREE.CanvasTexture(cvs_axis_left);
            const canvas_texture_r = new THREE.CanvasTexture(cvs_axis_right);
            const canvas_texture_rr = new THREE.CanvasTexture(cvs_axis_right_reverse);
            // x軸のplaneを作成
            const pln_text_x = create_label_plane(
                canvas_texture_l,
                {width:axis_plate_width, height:axis_plate_heiht}
            );
            pln_text_x.position.set(0, box_size_p_h+axis_plate_width/2, -box_size_p_h);
            pln_text_x.rotation.z += Math.PI/2;
            scene.add(pln_text_x);
            // y軸のplaneを作成
            const pln_text_y = create_label_plane(
                canvas_texture_r,
                {width:axis_plate_width, height:axis_plate_heiht}
            );
            pln_text_y.rotation.z += Math.PI;
            pln_text_y.position.set(box_size_p_h+axis_plate_width/2,0,-box_size_p_h);
            scene.add(pln_text_y);
            // z軸のplaneを作成
            const pln_text_z = create_label_plane(
                canvas_texture_rr,
                {width:axis_plate_width, height:axis_plate_heiht}
            );
            pln_text_z.rotation.x += Math.PI/2;
            pln_text_z.rotation.y += Math.PI;
            pln_text_z.position.set(box_size_p_h+axis_plate_width/2,-box_size_p_h,0);
            scene.add(pln_text_z);
        }

        // 軸    
        const axis = new THREE.AxesHelper(box_size/2);
        scene.add(axis);
    }


    // 要素を追加
    function add_elements(data){
        // box for debug
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


    // cvsに対するドラッグイベント
    function regist_drag_event(){
        cvs.addEventListener("contextmenu", (e) => e.preventDefault());
        cvs.onmousedown = function(event){
            let start_x = event.offsetX;
            let start_y = event.offsetY;

            let start_pos_theta = pos_theta;
            let start_pos_psi = pos_psi;
            let start_log_zoom = Math.log(camera.zoom);

            // ボタン[0:左, 1:右]
            let event_button = event.button;
            if( (event_button!=0) && (event_button!=2) ) {
                return;
            }

            // 移動処理
            const moveTo = (pos_x, pos_y) => {
                let diff_x = start_x - pos_x;
                target_theta = start_pos_theta + diff_x*0.005;

                let diff_y = pos_y - start_y;
                target_psi = start_pos_psi + diff_y*0.005;
                return;
            };

            // 拡大縮小
            const resizeTo = (pos_x, pos_y) => {
                // xは右、yは上で拡大
                let target_log_zoom = start_log_zoom
                    + ( - start_x + start_y + pos_x - pos_y)*0.005;
                camera.zoom = Math.exp(target_log_zoom);
                camera.updateProjectionMatrix();
                return;
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
                if( event_button==0 ){
                    moveTo(event.offsetX, event.offsetY);
                }else if( event_button==2 ){
                    resizeTo(event.offsetX, event.offsetY);
                }
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
  