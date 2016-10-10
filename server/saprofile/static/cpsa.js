/*global $*/

function CPSAClient() {
    // Event system
    var events = {
        start: $.Callbacks(),
        stop: $.Callbacks(),
        clear: $.Callbacks(),
        newData: $.Callbacks()
    };
    var publish = function(event, data) {
        events[event].fire(data);
    }.bind(this);
    this.subscribe = function(event, callback) {
        events[event].add(callback);
    };
    this.unsubscribe = function(event, callback) {
        events[event].remove(callback);
    };


    // Private data system
    var client_id;

    var fetch_data = function() {
        if (this.is_running()) {
            $.getJSON(
                'data',
                {id: client_id},
                parse_data
            );
        }
    }.bind(this);

    var parse_data = function(data, textStatus, jqXHR) {
        publish('newData', data);
        setTimeout(fetch_data.bind(this), 1000);
    }.bind(this);


    // Data system
    this.is_running = function() {
        return client_id !== undefined;
    };

    this.start = function() {
        if (this.is_running()) {
            console.log('Start failed - already started!');
            return;
        }

        // Register a new client & start recording
        $.getJSON(
            'register',
            function(data, textStatus, jqXHR) {
                client_id = data;
                publish('start');
                fetch_data.call(this);
            }.bind(this)
        );
    }.bind(this);

    this.stop = function() {
        if (!this.is_running()) {
            console.log('Stop failed - not started!');
            return;
        }

        // Unregister myself & stop recording
        $.getJSON(
            'unregister',
            {id: client_id},
            function(data, textStatus, jqXHR) {
                client_id = undefined;
                publish('stop');
            }.bind(this)
        );
    }.bind(this);

    this.clear = function() {
        // TODO: Clear stored data
        publish('clear');
    }.bind(this);
}

var cpsa_client = new CPSAClient();

$(function() {
    $('#start').click(cpsa_client.start);
    $('#stop').click(cpsa_client.stop);
    $('#clear').click(cpsa_client.clear);

    cpsa_client.subscribe('start', function() {
        console.log('start');
        $('#start').prop("disabled", true);
        $('#stop').prop("disabled", false);
    });

    cpsa_client.subscribe('stop', function() {
        console.log('stop');
        $('#start').prop("disabled", false);
        $('#stop').prop("disabled", true);
    });

    cpsa_client.subscribe('clear', function() {
        console.log('clear');
        $('#clear').prop("disabled", true);
    });

    cpsa_client.subscribe('newData', function(data) {
        console.log('newData');
        console.log(data);
        $('#clear').prop("disabled", false);
    });
});

/*
Display modes:
* Requests
  * Expand to see SQL
* SQL
* Grouped SQL
*/