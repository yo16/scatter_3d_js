function draw_number_line(id, notch, min, max, base_notch, width, pos_x, pos_y, prioritize_notch=true){
    /*数直線を描画する

    Parameters
        id: div要素ID。#を含めて渡すこと。
        notch: 目盛幅
        min: 最小値
        max: 最大値
        base_notch: 必ず目盛りを打つ点。ここを中心に最小、最大へ広げる
        width: 数直線の幅。画面のピクセル数。
        pos_x: 数直線を描画し始めるx時点。
        pos_y: 数直線を描画し始めるy時点。
        prioritize_notch:
            min/maxで終わりにせず、notchの区切りのいいところまで描く
    */
    // min/maxの外側に伸ばす幅(固定)
    const outer_size = 5;
    // 目盛の高さ(上/下)
    const notch_top = 5;
    const notch_bottom = 2;
    // 目盛のフォントサイズ
    const notch_font_size = 10;

    // svgのID
    const svg_id = "line_number_maker";
    // この１回の呼び出しで作成するグループのID
    let g_id = "g_"+svg_id+"_"+pos_x+"_"+pos_y;

    // prioritize_notchのとき、
    // min/maxをnotchの切りのいいところまで延長する
    if( prioritize_notch ){
        if( (min%notch)!=0 ){
            min = min - min%notch;
            if( min<0 ){
                min -= notch;
            }
        }
        if( (max%notch)!=0 ){
            max = max - max%notch;
            if( max>0 ){
                max += notch;
            }
        }
    }

    // 描画する点
    let notches = [];
    // 基準点
    notches.push(base_notch);
    // 基準点からマイナス方向
    for( let i=base_notch-notch; i>=min; i-=notch ){
        notches.push(i);
    }
    // 基準点からプラス方向
    for( let i=base_notch+notch; i<=max; i+=notch ){
        notches.push(i);
    }
    
    // 座標変換(数直線の値 -> svgのx)
    function get_pos_x(v){
        let v_width = max - min;
        let v_rate = (v-min)/v_width;
        let s_min = pos_x + outer_size;
        //let s_max = pos_x + width - outer_size;
        let s_width = width - 2*outer_size;     // == s_max - s_min

        return s_min + s_width * v_rate;
    }
    // svg要素を取得
    const parent_elm = d3.select(id);
    let svg = d3.select(id + ">svg#"+svg_id);
    if (svg.empty()){
        // なければ追加（２回目の呼び出しの場合はある）
        svg = parent_elm.append("svg")
            .attr("id", svg_id)
            .attr("width", parent_elm.attr("width"))
            .attr("height", parent_elm.attr("height"))
        ;
    }

    // グループを作成
    let g = svg.append("g")
        .attr("id", g_id)
    ;
    
    // 主線
    g.append("line")
        .attr("class", "main")
        .attr("x1", pos_x)
        .attr("y1", pos_y)
        .attr("x2", pos_x + width)
        .attr("y2", pos_y)
        .attr("stroke", "#333")
        .attr("stroke-width", "1")
    ;

    // 目盛線
    g.selectAll("line.notch")
        .data(notches)
        .enter()
        .append("line")
        .attr("class", "notch")
        .attr("x1", function(d){ return get_pos_x(d); })
        .attr("y1", pos_y - notch_top)
        .attr("x2", function(d){ return get_pos_x(d); })
        .attr("y2", pos_y + notch_bottom)
        .attr("stroke", "#333")
        .attr("stroke-width", "1")
    ;

    // 数値
    g.selectAll("text.notch_value")
        .data(notches)
        .enter()
        .append("text")
        .attr("class", "notch_value")
        .text(function(d){ return d; })
        .attr("x", function(d){ return get_pos_x(d); })
        .attr("y", pos_y + notch_bottom + notch_font_size)
        .attr("text-anchor", "middle")
        .attr("font-size", notch_font_size)
    ;

}