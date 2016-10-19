/*global $*/
/*global add_events*/

function CPSAClient() {
    this._client_id = undefined;

    this._fetch_data = function() {
        if (this.is_running()) {
            $.getJSON(
                'data',
                {id: this._client_id},
                this._parse_data
            );
        }
    }.bind(this);

    this._parse_data = function(data, textStatus, jqXHR) {
        if (data) {
            data.forEach(function(record) {
                this.publish('new_record', record);
            }.bind(this));
        }
        setTimeout(this._fetch_data, 1000);
    }.bind(this);

    this.is_running = function() {
        return this._client_id !== undefined;
    }.bind(this);

    this.start = function() {
        if (this.is_running()) {
            console.log('Start failed - already started!');
            return;
        }

        // Register a new client & start recording
        $.getJSON(
            'register',
            {
                'include_existing_data': true
            },
            function(data, textStatus, jqXHR) {
                this._client_id = data;
                this.publish('start');
                this._fetch_data();
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
            {id: this._client_id},
            function(data, textStatus, jqXHR) {
                this._client_id = undefined;
                this.publish('stop');
            }.bind(this)
        );
    }.bind(this);
}
add_events(CPSAClient, ['start', 'stop', 'new_record']);
