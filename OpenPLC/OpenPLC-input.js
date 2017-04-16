module.exports = function (RED) {
    function OpenPLCInput(config) {
        RED.nodes.createNode(this, config);

        this.register = config.register;
        this.byte = config.byte;
        this.bit = config.bit;

        const node = this;

        node.on('input', function (msg) {
            const payload = {};
            payload.value = msg.payload;
            payload.register = node.register;
            payload.byte = node.byte;
            payload.bit = node.bit;
            msg.payload = payload;

            node.send(msg);
        });
    }

    RED.nodes.registerType("OpenPLC-Input", OpenPLCInput);
};
