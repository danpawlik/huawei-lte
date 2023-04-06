javascript: addButtons();
// from https://www.youtube.com/watch?v=91rQVxHyZqQ

function currentBand() {
    $.ajax({
        type: "GET",
        async: true,
        url: '/api/device/signal',
        error: function(request, status, error) {
            alert("Signal Error:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
        },
        success: function(data) {
            vars = ['rssi', 'rsrp', 'rsrq', 'sinr', 'dlbandwidth', 'ulbandwidth', 'band', 'cell_id'];
            for (i = 0; i < vars.length; i++) {
                window[vars[i]] = extractXML(vars[i], data);
                $('#' + vars[i]).html(window[vars[i]]);
            }
            hex = Number(cell_id).toString(16);
            hex2 = hex.substring(0, hex.length - 2);
            enbid = parseInt(hex2, 16);
            $('#enbid').html(enbid);
        }
    });
    $.ajax({
        type: "GET",
        async: true,
        url: '/api/net/net-mode',
        error: function(request, status, error) {
            alert("Signal Error:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
        },
        success: function(data) {
            lteband = extractXML('LTEBand', data);
            $('#allowed').html(_4GType(lteband));
        }
    });
}

function extractXML(tag, data) {
    try {
        return data.split("</" + tag + ">")[0].split("<" + tag + ">")[1];
    } catch (err) {
        return err.message;
    }
}

function _4GType(data) {
    console.log(data);
    if ((data == '20880800C5') || (data == '20000800C5')) return "AUTO";
    data_out = "";
    if ((parseInt(data, 16) & 0x1) == 0x1) {
        data_out = "B1+";
    }
    if ((parseInt(data, 16) & 0x4) == 0x4) {
        data_out += "B3+";
    }
    if ((parseInt(data, 16) & 0x40) == 0x40) {
        data_out += "B7+";
    }
    if ((parseInt(data, 16) & 0x80000) == 0x80000) {
        data_out += "B20";
    }
    data_out = data_out.replace(/\++$/, "");
    return data_out;
}

function ltebandselection() {
    if (arguments.length == 0) {
        var band = prompt("Please input desirable LTE band number, separated by + char (example 1+3+20).If you want to use every supported bands, write 'AUTO'.", "AUTO");
        if (band == null || band === "") {
            return;
        }
    } else var band = arguments[0];
    var bs = band.split("+");
    var ltesum = 0;
    if (band.toUpperCase() === "AUTO") {
        ltesum = "7FFFFFFFFFFFFFFF";
    } else {
        for (var i = 0; i < bs.length; i++) {
            ltesum = ltesum + Math.pow(2, parseInt(bs[i]) - 1);
        }
        ltesum = ltesum.toString(16);
        console.log("LTEBand:" + ltesum);
    }
    $.ajax({
        type: "GET",
        async: true,
        url: '/html/home.html',
        error: function(request, status, error) {
            alert("Token Error:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
        },
        success: function(data) {
            var datas = data.split('name="csrf_token" content="');
            var token = datas[datas.length - 1].split('"')[0];
            setTimeout(function() {
                $.ajax({
                    type: "POST",
                    async: true,
                    url: '/api/net/net-mode',
                    headers: {
                        '__RequestVerificationToken': token
                    },
                    contentType: 'application/xml',
                    data: '<request><NetworkMode>03</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>' + ltesum + '</LTEBand></request>',
                    success: function(nd) {
                        $("#band").html("<span style=\"color:green;\">OK</span>");
                    },
                    error: function(request, status, error) {
                        alert("Net Mode Error:" + request.status + "\n" + "message:" + request.responseText + "\n" + "error:" + error);
                    }
                });
            }, 2000);
        }
    });
}
window.setInterval(currentBand, 2500);

function addButtons() {
    $("body").prepend("<style> .val{color:red;font-weight:strong;} </style> <div style=\"width:1000px;padding:20px;margin:0 auto;left:0;\"> <a style=\"font-size:1.4em;margin-right:30px;color:#04a;\" onclick=\"ltebandselection()\">BANDS</a> <div style=\"display:inline;\"> RSRP:<span class=\"val\" id=\"rsrp\">0</span>&nbsp;&nbsp; RSSI:<span class=\"val\" id=\"rssi\">0</span>&nbsp;&nbsp; SINR:<span class=\"val\" id=\"sinr\">0</span>&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ENB ID:<span class=\"val\" id=\"enbid\">0</span>&nbsp;&nbsp; CELL ID:<span class=\"val\" id=\"cell_id\">0</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BAND:<span class=\"val\" id=\"band\">0</span>(<span class=\"val\" id=\"dlbandwidth\">0</span>/<span class=\"val\" id=\"ulbandwidth\">0</span>) &nbsp;&nbsp; SET:<span class=\"val\" id=\"allowed\">0</span> </div> </div> ");
}
