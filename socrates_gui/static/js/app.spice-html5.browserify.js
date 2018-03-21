'use strict';

var spice = require("./spice-html5.js");

var sc;

function spice_error(e)
{
    disconnect();
}

function connect(token, screen_id)
{
    var uri = (window.location.protocol == "https:" ? "wss://" : "ws://") +
        window.location.hostname + (window.location.port == 8000 ? ":8081" : "") +
        "/websockify/?token=" + token;

    try
    {
        sc = new spice.SpiceMainConn({
            uri: uri,
            screen_id: screen_id,
            onerror: spice_error,
            onagent: agent_connected
        });
    }
    catch (e)
    {
        alert(e.toString());
        disconnect();
    }

}

function disconnect()
{
    console.log(">> disconnect");
    if (sc) {
        sc.stop();
    }
    if (window.File && window.FileReader && window.FileList && window.Blob)
    {
        var spice_xfer_area = document.getElementById('spice-xfer-area');
        document.getElementById('spice-area').removeChild(spice_xfer_area);
        document.getElementById('spice-area').removeEventListener('dragover', handle_file_dragover, false);
        document.getElementById('spice-area').removeEventListener('drop', handle_file_drop, false);
    }
    console.log("<< disconnect");
}

function agent_connected(sc)
{
    window.addEventListener('resize', handle_resize);
    window.spice_connection = this;

    resize_helper(this);

    if (window.File && window.FileReader && window.FileList && window.Blob)
    {
        var spice_xfer_area = document.createElement("div");
        spice_xfer_area.setAttribute('id', 'spice-xfer-area');
        document.getElementById('spice-area').appendChild(spice_xfer_area);
        document.getElementById('spice-area').addEventListener('dragover', handle_file_dragover, false);
        document.getElementById('spice-area').addEventListener('drop', handle_file_drop, false);
    }
    else
    {
        console.log("File API is not supported");
    }
}

/* SPICE port event listeners
window.addEventListener('spice-port-data', function(event) {
    // Here we convert data to text, but really we can obtain binary data also
    var msg_text = arraybuffer_to_str(new Uint8Array(event.detail.data));
    DEBUG > 0 && console.log('SPICE port', event.detail.channel.portName, 'message text:', msg_text);
});

window.addEventListener('spice-port-event', function(event) {
    DEBUG > 0 && console.log('SPICE port', event.detail.channel.portName, 'event data:', event.detail.spiceEvent);
});
*/

window.spice_connect = connect;
window.spice_disconnect = disconnect;
