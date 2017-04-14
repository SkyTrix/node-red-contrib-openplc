module.exports = function (RED) {
    function OpenPLC (config) {
        RED.nodes.createNode(this, config);

        this.host = config.host;
        this.port = config.port;
        this.program = config.program;
        this.programport = config.programport;
        this.rate = config.rate;
        this.rateUnit = config.rateUnit;
        this.outputs = config.outputs;
        this.outputoffset = config.outputoffset;

        var node = this;

        const node_modbus = require('node-modbus');
        const client = node_modbus.client.tcp.complete({
            'host': this.host,
            'port': this.port,
            'unitId': 1,
            'timeout': 2000,
            'autoReconnect': true,
            'reconnectTimeout': 2000,
            'logLabel': 'OpenPLC',
            'logLevel': 'debug',
            'logEnabled': false
        });

        client.connect();
        client.on('connect', function () {
            setInterval(function () {
                client.readCoils(node.outputoffset, node.outputs).then(function (response) {
                    var arr = response.coils.map(function (x) {
                        return { payload: x };
                    });
                    node.send(arr.slice(0, node.outputs));
                });
            }, calcrate(node.rate, node.rateUnit));
        });

        node.on('input', function (msg) {
            if (!(msg && msg.hasOwnProperty('payload'))) return;
            if (!(msg.payload.register && msg.payload.register === "X" || msg.payload.register === "W")) return;

            msg.payload.byte = parseInt(msg.payload.byte);
            msg.payload.bit = parseInt(msg.payload.bit);

            if (msg.payload.byte < 0 || msg.payload.byte > 99) return;
            if (msg.payload.bit < 0 || msg.payload.bit > 7) return;

            if (msg.payload.register === "X") {
                client.writeSingleCoil(msg.payload.byte * 8 + msg.payload.bit, msg.payload.value);
            } else {
                client.writeSingleRegister(msg.payload.byte, msg.payload.value);
            }
        });

        node.on('close', function (done) {
            if (client) {
                client.close(function () {
                    done()
                }).catch(function (err) {
                    done()
                })
            } else {
                done()
            }
        });

        function calcrate (rate, rateUnit) {
            switch (rateUnit) {
                case 'ms':
                    break;
                case 's':
                    rate = parseInt(rate) * 1000;
                    break;
                case 'm':
                    rate = parseInt(rate) * 60000;
                    break;
                case 'h':
                    rate = parseInt(rate) * 3600000;
                    break;
                default:
                    rate = 100;
                    break
            }

            return rate;
        }

        // Upload program to the PLC using a multipart form request
        var request = require('request');
        var body = '------MNuE24x1ePo7oAAK\r\nContent-Disposition: form-data; name="file"; filename="duration"\r\nContent-Type: application/octet-stream\r\n\r\n';
        body += this.program;
        body += '\n\r\n------MNuE24x1ePo7oAAK\r\nContent-Disposition: form-data; name="submit"\r\n\r\nUpload Program\r\n------MNuE24x1ePo7oAAK--';

        request({
            url: "http://" + this.host + ":" + this.programport + "/api/upload",
            method: "POST",
            headers: {
                "content-type": "multipart/form-data; boundary=----MNuE24x1ePo7oAAK"
            },
            body: body
        }, function (error, response, body) {
            if (error) {
                node.status({fill: "red", shape: "ring", text: "program upload failed"});
            }
        });
    }

    RED.nodes.registerType("OpenPLC", OpenPLC);
};
