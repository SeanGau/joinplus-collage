const move = new Moveable(document.body, {
    draggable: true,
    resizable: true,
    rotatable: true,
    pinchable: true,
    keepRatio: false,
    origin: false,
    edge: true,
    throttleDrag: 0,
    throttleResize: 0,
    throttleRotate: 5,
});

let layer_array = [];

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    r = Number(r);
    g = Number(g);
    b = Number(b);
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function arrayRemove(arr, value) {
    layer_array = arr.filter(function (ele) {
        return ele != value;
    });
}

function loadData(data) {
    let orig_w = data['data']['width'];
    let now_w = $("#collage-area").width();
    let bg_color = data['data']['background-color'];
    let bg_img = data['data']['background-image'];
    $("#collage-background").css({ "background-color": bg_color });
    $("#image-background").css({ "background-image": bg_img });
    bg_color = bg_color.replace("rgb(", "").replace(")", "");
    bg_color = bg_color.split(",");
    console.log(rgbToHex(...bg_color));
    $("#bgcolor").val(rgbToHex(...bg_color));

    Object.keys(data['collage']).forEach(element => {
        $("#collage-area").append(data['collage'][element]['outerHTML']);
        layer_array.push(element);
    });
}

function saveData() {
    let export_data = {
        "data": {
            "width": $("#collage-area").width(),
            "height": $("#collage-area").height(),
            "background-image": $("#image-background").css("background-image"),
            "name": $("#InputName").val(),
            "title": $("#InputTitle").val()
        },
        "collage": {}
    };
    layer_array.forEach(element => {
        let targetDom = $(`#collage-area #${element}`);
        targetDom.css("transform", targetDom.css("transform"));
        export_data["collage"][element] = {
            "outerHTML": $(`#collage-area #${element}`).prop("outerHTML")
        };
    });
    localStorage.setItem('export_data', JSON.stringify(export_data));
    console.log("saved");
    return export_data;
}

const frame = {
    rotate: 0,
    translate: [0, 0],
    scale: [1, 1],
};

move.on("drag", e => {
    //console.log(e);
    $(e.target).css({ left: `${e.left}px`, top: `${e.top}px` });
    //e.target.style.transform = e.transform;
});

move.on("resizeStart", ({ target, set, setOrigin, dragStart }) => {
    // Set origin if transform-orgin use %.
    setOrigin(["%", "%"]);

    const style = window.getComputedStyle(target);
    const cssWidth = parseFloat(style.width);
    const cssHeight = parseFloat(style.height);
    set([cssWidth, cssHeight]);

    dragStart && dragStart.set(frame.translate);
}).on("resize", ({ target, width, height, drag }) => {
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;

    frame.translate = drag.beforeTranslate;
    target.style.transform = drag.transform;
});

move.on("scaleStart", ({ target, clientX, clientY }) => { }).on("scale", ({ target, drag }) => {
    //console.log(e);
    target.style.transform = drag.transform;
}).on("scaleEnd", ({ target, isDrag, clientX, clientY }) => { });

move.on("rotateStart", ({ set }) => {
    set(frame.rotate);
}).on("rotate", ({ target, beforeRotate, drag }) => {
    frame.rotate = beforeRotate;
    target.style.transform = drag.transform;
});

move.on("renderEnd", ({ target }) => {
    $(target).css("transform", $(target).css("transform"));
});

$("#collage-area").on("click", function (e) {
    move.target = null;
    $(".target.selected").removeClass("selected");
    $("#collage-tools .moveable-buttons").addClass("d-none");
});

$("#collage-area").on("click", ".target", function (e) {
    e.stopPropagation();
    $("#collage-source").removeClass("show");
    let target = this;
    if (move.target !== target) {
        move.target = target;
        $(".target.selected").removeClass("selected");
        $(target).addClass("selected");
        $("#collage-tools .moveable-buttons").removeClass("d-none");
    } else {
        //move.resizable = !move.resizable;
    }
});

$(window).on("keydown", function (e) {
    if (move.target != null) {
        //console.log(e.keyCode)
        if (e.keyCode == 46) { //delete
            $(".moveable-buttons button[name='collage-remove']").trigger("click");
        } else if (e.keyCode == 88) { //x
            $(".moveable-buttons button[name='collage-flip']").trigger("click");
        } else if (e.keyCode == 33) { //pgup
            $(".moveable-buttons button[name='collage-up']").trigger("click");
        } else if (e.keyCode == 34) { //pgdn
            $(".moveable-buttons button[name='collage-down']").trigger("click");
        } else if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
            move.keepRatio = true;
        }
    }
});

$(window).on("keyup", function (e) {
    if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
        move.keepRatio = false;
    }
});


$("#collage-tools .source-controls").on("click", "button", function () {
    move.target = null;
    $(".target.selected").removeClass("selected");
    $("#collage-tools .moveable-buttons").addClass("d-none");
});

$("#collage-tools .source-controls button[name='collage-add']").on("click", function () {
    $("#collage-source").toggleClass("show");
});

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let currentRegion = null;
let currentControlPoints = [];

$("#bg-canvas").on("click", function (e) {
    if (currentRegion) {
        console.log(e.offsetX, e.offsetY);
        if (currentControlPoints.length > 0) {
            currentRegion.lineTo(e.offsetX, e.offsetY);
        } else {
            currentRegion.moveTo(e.offsetX, e.offsetY);
        }
        currentControlPoints.push({
            x: e.offsetX,
            y: e.offsetY
        })
        let tempRegion = new Path2D();
        tempRegion.arc(e.offsetX, e.offsetY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#44AAFF";
        ctx.fill(tempRegion);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#44AAFF";
        ctx.stroke(currentRegion);
    }
})

$("#collage-tools .source-controls #fill-texture").on("click", function () {
    if (currentRegion) {
        console.log("fill");
        currentRegion.closePath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentRegion = null;
        $("#bg-canvas").removeClass("drawing");

        let points = "";
        currentControlPoints.forEach(el => {
            points += `${el.x},${el.y} `
        });
        let ms = Date.now();
        let templateDom = $(`
        <div class="target" id="target-${ms}" style="left:0;top:0;width:100%;">
            <svg width=${canvas.width} height=${canvas.height}>
            <polyline points="${points}"
            fill="black" />
            </svg>
        </div>
        `);
        layer_array.unshift("target-" + ms);
        $("#collage-area").prepend(templateDom);

    } else {
        console.log("start drawing");
        $("#bg-canvas").addClass("drawing");
        currentRegion = new Path2D();
        currentControlPoints = [];
    }
});

$("#download-form").on("submit", function (e) {
    e.preventDefault();
    $("#loading").removeClass("d-none");

    $("#image-background").css({ "opacity": 0.4 });
    let export_data = saveData();
    html2canvas(document.body.querySelector("#collage-box")).then(function (canvas) {
        var img = canvas.toDataURL("image/png");
        var link = document.createElement('a');
        var date = new Date();
        var time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDay() + 1}`;

        link.download = `seedingfuture_${time}.png`;
        link.href = img;
        link.click();
        $("#loading").addClass("d-none");
        $.ajax({
            type: "POST",
            url: "/function/submit",
            data: JSON.stringify(export_data),
            success: function (cb) {
                console.log(cb);
            },
            contentType: "application/json"
        });
    });
    $("#image-background").css("opacity", "");
    $(window).resize();
});

$("#collage-tools .source-controls button[name='collage-clear']").on("click", function () {
    let r = confirm("確認要清除畫布 Are you sure to reset the canvas?");
    if (r == true) {
        $("#collage-area").html("");
        layer_array = [];
    } else { }
});

$("#source-box .source-img").on("click", function () {
    let ms = Date.now();
    let templateDom = $(`
    <div class="target" id="target-${ms}">
        <img src="">
    </div>
    `);
    $("img", templateDom).attr("src", $(this).data("src"));
    $("#collage-area").append(templateDom);
    layer_array.push("target-" + ms);
});

$("#bgModal .bg-img").on("click", function () {
    $("#image-background").css("background-image", `url(${$(this).data("src")})`);
});

$('#bgcolor').on('input', function () {
    let bgcolor = $(this).val();
    $("#collage-background").css({ "background-color": bgcolor });
});

$(window).resize(function () {
    $("#collage-box").css({ "width": "100%", "height": "100%" });
    let c_w = $("#collage-box").width();
    let c_h = $("#collage-box").height();
    if (c_w >= c_h) {
        if (c_w > c_h * 16 / 9) {
            $("#collage-box").width(c_h * 16 / 9);
        } else {
            $("#collage-box").height(c_w * 9 / 16);
        }
    } else {
        if (c_w > c_h * 9 / 16) {
            $("#collage-box").width(c_h * 9 / 16);
        } else {
            $("#collage-box").height(c_w * 16 / 9);
        }
    }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
});

$(document).on("click", ".moveable-buttons button[name='collage-remove']", function () {
    arrayRemove(layer_array, $(move.target).attr("id"));
    $(move.target).remove();
    move.target = null;
    $(".target.selected").removeClass("selected");
    $("#collage-tools .moveable-buttons").addClass("d-none");
});

$(document).on("click", ".moveable-buttons button[name='collage-to-top']", function () {
    let targetDom = $(move.target);
    let target_id = targetDom.attr("id");
    arrayRemove(layer_array, target_id);
    layer_array.push(target_id);
    targetDom.remove();
    $("#collage-area").append(targetDom);
});
$(document).on("click", ".moveable-buttons button[name='collage-up']", function () {
    let targetDom = $(move.target);
    let target_id = targetDom.attr("id");
    let cur_z = layer_array.indexOf(target_id);
    if (cur_z < layer_array.length - 1) {
        let next_id = layer_array[cur_z + 1];
        targetDom.insertAfter($(`#${next_id}`));

        layer_array[cur_z + 1] = target_id;
        layer_array[cur_z] = next_id;
    }
});

$(document).on("click", ".moveable-buttons button[name='collage-down']", function () {
    let targetDom = $(move.target);
    let target_id = targetDom.attr("id");
    let cur_z = layer_array.indexOf(target_id);
    if (cur_z > 0) {
        let next_id = layer_array[cur_z - 1];
        targetDom.insertBefore($(`#${next_id}`));

        layer_array[cur_z - 1] = target_id;
        layer_array[cur_z] = next_id;
    }
});
$(document).on("click", ".moveable-buttons button[name='collage-to-bottom']", function () {
    let targetDom = $(move.target);
    let target_id = targetDom.attr("id");
    arrayRemove(layer_array, target_id);
    layer_array.unshift(target_id);
    targetDom.remove();
    $("#collage-area").prepend(targetDom);
});

$(document).on("click", ".moveable-buttons button[name='collage-flip']", function () {
    let targetDom = $(move.target);
    let target_id = targetDom.attr("id");
    let now_trans = targetDom.css("transform") == "none" ? "" : targetDom.css("transform");
    targetDom.css("transform", now_trans + " scaleX(-1)");
    move.target = null;
    move.target = targetDom.get(0);
});

$(document).ready(function () {
    $("#aboutModal").modal('show');
    $(window).resize();

    let last_data = localStorage.getItem('export_data');
    if (last_data != undefined) {
        loadData(JSON.parse(last_data));
    }
    setInterval(saveData, 1000);
});
