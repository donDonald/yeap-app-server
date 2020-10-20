'use strict';

const assert = require('assert');

module.exports = function(api) {
    assert(api);

    const Server = function() {
    }

    /// \brief List of possible server statuses
    Server.RUNNING = 'Running';
    Server.STOPPED = 'Stopped';

    /// \brief Get current server status.
    Server.prototype.status = function(cb) {
        assert(false);
    }

    /// \brief Start the server.
    Server.prototype.start = function(cb) {
        assert(false);
    }

    /// \brief Stop the server.
    Server.prototype.stop = function(cb) {
        assert(false);
    }

    return Server;
}

