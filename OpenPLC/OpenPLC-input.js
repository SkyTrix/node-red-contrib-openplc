module.exports = function (RED) {
    function OpenPLCInput(config) {
        RED.nodes.createNode(this, config);

        this.register = config.register;
        this.byte = config.byte;
        this.bit = config.bit;

        var node = this;

        node.on('input', function (msg) {
            var payload = {};
            payload.value = msg.payload;
            payload.register = this.register;
            payload.byte = this.byte;
            payload.bit = this.bit;
            msg.payload = payload;

            node.send(msg);
        });
    }

    RED.nodes.registerType("OpenPLC-Input", OpenPLCInput);
};
